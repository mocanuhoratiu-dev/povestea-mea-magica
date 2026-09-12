import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
const project = 'project-e0c2efff-d456-48f9-9fe';
const out = process.env.ALERT_AUDIT_DIR || '/private/tmp/pmm-alert-audit-20260912';
const token = execFileSync('/private/tmp/party-puf-sdk-20260912/google-cloud-sdk/bin/gcloud', ['auth', 'print-access-token'], { encoding: 'utf8' }).trim();
mkdirSync(out, { recursive: true });
async function get(host, path, key) {
  const response = await fetch(`https://${host}/${path}`, { headers: { Authorization: `Bearer ${token}`, 'x-goog-user-project': project }, signal: AbortSignal.timeout(45000) });
  const result = await response.json();
  if (!response.ok) throw Error(`${key}: HTTP ${response.status}: ${result.error?.message}`);
  writeFileSync(`${out}/${key}.json`, JSON.stringify(result, null, 2), { mode: 0o600 });
  if (result.nextPageToken) throw Error(`${key}: more results exist; paginate before any update`);
  return result;
}
const policies = await get('monitoring.googleapis.com', `v3/projects/${project}/alertPolicies?pageSize=100`, 'policies');
console.log(JSON.stringify({ policies: policies.alertPolicies?.map(p => ({ name: p.name, displayName: p.displayName, enabled: p.enabled })) }));
const channels = await get('monitoring.googleapis.com', `v3/projects/${project}/notificationChannels?pageSize=100`, 'channels');
console.log(JSON.stringify({ channels: channels.notificationChannels?.map(c => ({ name: c.name, displayName: c.displayName, type: c.type, enabled: c.enabled, verificationStatus: c.verificationStatus, email: c.labels?.email_address })) }));
const metrics = await get('logging.googleapis.com', `v2/projects/${project}/metrics?pageSize=1000`, 'metrics');
console.log(JSON.stringify({ metrics: metrics.metrics?.map(m => m.name) }));
const uptime = await get('monitoring.googleapis.com', `v3/projects/${project}/uptimeCheckConfigs?pageSize=100`, 'uptime');
console.log(JSON.stringify({ uptime: uptime.uptimeCheckConfigs }));
const billing = await get('cloudbilling.googleapis.com', `v1/projects/${project}/billingInfo`, 'billing');
const budgets = await get('billingbudgets.googleapis.com', `v1/${billing.billingAccountName}/budgets?pageSize=100`, 'budgets');
console.log(JSON.stringify({ budgets: budgets.budgets?.map(b => ({ name: b.name, displayName: b.displayName, amount: b.amount, budgetFilter: b.budgetFilter, thresholdRules: b.thresholdRules, allUpdatesRule: b.allUpdatesRule })) }));
