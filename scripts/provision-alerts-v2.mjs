import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { project, logMetrics, buildPolicies } from './alert-v2-config.mjs';

const apply = process.argv.includes('--apply');
const email = 'office@povestea-mea-magica.ro';
const gcloud = process.env.GCLOUD_BIN || '/private/tmp/party-puf-sdk-20260912/google-cloud-sdk/bin/gcloud';
const token = execFileSync(gcloud, ['auth', 'print-access-token'], { encoding: 'utf8' }).trim();
const headers = { Authorization: `Bearer ${token}`, 'x-goog-user-project': project, 'Content-Type': 'application/json' };
const out = `/private/tmp/pmm-alert-rollout-${new Date().toISOString().replaceAll(':', '-')}`;
mkdirSync(out, { recursive: true });
const save = (name, data) => writeFileSync(`${out}/${name}.json`, JSON.stringify(data, null, 2), { mode: 0o600 });
async function api(host, path, method = 'GET', body) {
  const response = await fetch(`https://${host}/${path}`, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(45000) });
  const result = await response.json();
  if (!response.ok) throw Error(`${method} ${path}: ${response.status}: ${result.error?.message}`);
  if (result.nextPageToken) throw Error(`Pagination needed before applying: ${path}`);
  return result;
}
const mon = (path, method, body) => api('monitoring.googleapis.com', `v3/${path}`, method, body);
const logging = (path, method, body) => api('logging.googleapis.com', `v2/${path}`, method, body);
const parent = `projects/${project}`;
const oldPolicies = await mon(`${parent}/alertPolicies?pageSize=100`);
const oldChannels = await mon(`${parent}/notificationChannels?pageSize=100`);
const oldMetrics = await logging(`${parent}/metrics?pageSize=1000`);
const oldUptime = await mon(`${parent}/uptimeCheckConfigs?pageSize=100`);
const budgetPath = 'v1/billingAccounts/01E573-6A78A8-2B7181/budgets?pageSize=100';
const budgets = await api('billingbudgets.googleapis.com', budgetPath);
const scheduler = await api('cloudscheduler.googleapis.com', `v1/${parent}/locations/europe-west3/jobs`);
for (const [name, data] of Object.entries({ oldPolicies, oldChannels, oldMetrics, oldUptime, budgets })) save(name, data);
// Snapshot only non-secret scheduler fields; OIDC and request bodies are not needed.
save('scheduler', scheduler.jobs?.map(j => ({ name: j.name, state: j.state, schedule: j.schedule, lastAttemptTime: j.lastAttemptTime })));
const watchdog = scheduler.jobs?.find(j => j.name.endsWith('/pmm-order-watchdog'));
if (!watchdog || watchdog.state !== 'ENABLED' || watchdog.schedule !== '*/10 * * * *') throw Error('Watchdog schedule/state changed; review before applying.');
const channel = oldChannels.notificationChannels?.find(c => c.name.endsWith('/7090156523439719459'));
if (!channel || channel.type !== 'email' || !channel.enabled) throw Error('Expected working email channel not found.');
for (const { existingId } of buildPolicies(channel.name, 'pending', 'pmm-order-watchdog')) {
  if (existingId && !oldPolicies.alertPolicies?.some(p => p.name.endsWith(`/${existingId}`))) throw Error(`Missing original policy ${existingId}; do not create a duplicate blindly.`);
}
const uptimeConfig = {
  displayName: 'PMM | Disponibilitate site V2',
  monitoredResource: { type: 'uptime_url', labels: { project_id: project, host: 'www.povestea-mea-magica.ro' } },
  httpCheck: { path: '/api/health', port: 443, useSsl: true, validateSsl: true, requestMethod: 'GET' },
  period: '300s', timeout: '10s', selectedRegions: ['EUROPE', 'USA_VIRGINIA', 'ASIA_PACIFIC'],
  contentMatchers: [{ content: '"ready":true', matcher: 'CONTAINS_STRING' }],
  logCheckFailures: true, userLabels: { app: 'pmm', managed_by: 'pmm-alerts-v2' },
};
save('plan', { email, logMetrics, uptimeConfig, policies: buildPolicies(channel.name, 'pending', 'pmm-order-watchdog'), budgetUnchanged: true });
console.log(JSON.stringify({ apply, backup: out, metrics: logMetrics.length, policies: 6, email, budgetUnchanged: true }));
if (!apply) process.exit(0);

for (const metric of logMetrics) {
  const existing = oldMetrics.metrics?.find(m => m.name === metric.name);
  if (existing && existing.metricDescriptor.valueType !== metric.metricDescriptor.valueType) throw Error(`Metric type mismatch: ${metric.name}`);
  const result = await logging(`${parent}/metrics${existing ? `/${metric.name}` : ''}`, existing ? 'PUT' : 'POST', metric);
  save(metric.name, result);
  console.log(`Metric ready: ${metric.name}`);
}
let uptime = oldUptime.uptimeCheckConfigs?.find(u => u.displayName === uptimeConfig.displayName);
if (!uptime) uptime = await mon(`${parent}/uptimeCheckConfigs`, 'POST', uptimeConfig);
else if (uptime.disabled || uptime.httpCheck?.path !== uptimeConfig.httpCheck.path) throw Error('Existing V2 uptime configuration differs; review before reuse.');
save('uptime', uptime);
console.log(`Uptime ready: ${uptime.name}`);

if (channel.labels.email_address !== email) {
  const updated = await mon(`${channel.name}?updateMask=labels,displayName`, 'PATCH', { name: channel.name, labels: { ...channel.labels, email_address: email }, displayName: 'Povestea Mea Magica | Office operational' });
  save('channel', updated);
  if (updated.verificationStatus === 'UNVERIFIED') {
    await mon(`${channel.name}?updateMask=labels,displayName`, 'PATCH', { name: channel.name, labels: channel.labels, displayName: channel.displayName });
    throw Error('Office channel needs verification. Original recipient restored; policies left untouched.');
  }
}

for (const { existingId, policy } of buildPolicies(channel.name, uptime.name.split('/').at(-1), 'pmm-order-watchdog')) {
  const existing = existingId
    ? oldPolicies.alertPolicies.find(p => p.name.endsWith(`/${existingId}`))
    : oldPolicies.alertPolicies?.find(p => p.displayName === policy.displayName && p.userLabels?.managed_by === 'pmm-alerts-v2');
  const result = existing
    ? await mon(`${existing.name}?updateMask=${Object.keys(policy).join(',')}`, 'PATCH', { ...policy, name: existing.name })
    : await mon(`${parent}/alertPolicies`, 'POST', policy);
  save(`policy-${result.name.split('/').at(-1)}`, result);
  if (!result.enabled || result.validity?.code) throw Error(`Policy not valid/enabled: ${result.displayName}`);
  console.log(`Policy active: ${result.displayName} [${result.name.split('/').at(-1)}]`);
}
const after = await mon(`${parent}/alertPolicies?pageSize=100`);
const afterChannel = await mon(channel.name);
const afterBudget = await api('billingbudgets.googleapis.com', budgetPath);
save('verified-policies', after); save('verified-channel', afterChannel); save('verified-budgets', afterBudget);
if (!isDeepStrictEqual(budgets, afterBudget)) throw Error('Budget changed during rollout; inspect immediately. This script never writes billing budgets.');
if (afterChannel.labels.email_address !== email || afterChannel.verificationStatus === 'UNVERIFIED' || !afterChannel.enabled) throw Error('Channel verification failed.');
console.log(JSON.stringify({ complete: true, backup: out, activeV2: after.alertPolicies?.filter(p => p.enabled && p.userLabels?.managed_by === 'pmm-alerts-v2').length, email, budgetUnchanged: true }));
