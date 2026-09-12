import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { project, logMetrics } from './alert-v2-config.mjs';
const token = execFileSync(process.env.GCLOUD_BIN || '/private/tmp/party-puf-sdk-20260912/google-cloud-sdk/bin/gcloud', ['auth', 'print-access-token'], { encoding: 'utf8' }).trim();
const headers = { Authorization: `Bearer ${token}`, 'x-goog-user-project': project };
async function mon(path) {
  const r = await fetch(`https://monitoring.googleapis.com/v3/projects/${project}/${path}`, { headers, signal: AbortSignal.timeout(45000) });
  const data = await r.json(); if (!r.ok) throw Error(`${r.status}: ${data.error?.message}`); return data;
}
const policies = await mon('alertPolicies?pageSize=100');
const active = policies.alertPolicies?.filter(p => p.userLabels?.managed_by === 'pmm-alerts-v2') || [];
if (active.length !== 6 || active.some(p => !p.enabled || p.validity?.code)) throw Error('Expected six valid, enabled V2 policies.');
const uptime = await mon('uptimeCheckConfigs?pageSize=100');
const check = uptime.uptimeCheckConfigs?.find(c => c.displayName === 'PMM | Disponibilitate site V2');
if (!check || check.disabled) throw Error('Uptime missing/disabled');
const end = new Date().toISOString(); const start = new Date(Date.now() - 2 * 3600_000).toISOString();
const metrics = [];
for (const type of [...logMetrics.map(m => `logging.googleapis.com/user/${m.name}`), 'monitoring.googleapis.com/uptime_check/check_passed']) {
  const filter = `metric.type="${type}"` + (type.includes('uptime_check') ? ` AND metric.labels.check_id="${check.name.split('/').at(-1)}"` : '');
  const params = new URLSearchParams({ filter, 'interval.startTime': start, 'interval.endTime': end, view: 'FULL', pageSize: '100' });
  const data = await mon(`timeSeries?${params}`);
  metrics.push({ type, series: data.timeSeries?.map(s => ({ resource: s.resource.labels, metricLabels: s.metric.labels, points: s.points || [] })) || [], truncated: Boolean(data.nextPageToken) });
}
const health = await fetch('https://www.povestea-mea-magica.ro/api/health', { signal: AbortSignal.timeout(15000) });
const healthBody = await health.json();
if (!health.ok || healthBody.ready !== true) throw Error('Public health failed');
const result = { checkedAt: end, activePolicies: active.map(p => ({ name: p.name, displayName: p.displayName, enabled: p.enabled, conditions: p.conditions.length })), health: healthBody, metrics };
const out = process.env.ALERT_VERIFICATION_FILE || '/private/tmp/pmm-alert-audit-20260912/live-verification.json';
writeFileSync(out, JSON.stringify(result, null, 2), { mode: 0o600 });
const checks = metrics.find(m => m.type.includes('uptime_check')).series;
const live = {
  requests: metrics[0].series.some(s => s.points.some(p => Number(p.value.int64Value) > 0)),
  latency: metrics[1].series.some(s => s.points.some(p => Number(p.value.distributionValue?.count) > 0)),
  watchdog: metrics[3].series.some(s => s.points.some(p => Number(p.value.int64Value) > 0 && Date.parse(p.interval.endTime) > Date.parse(end) - 20 * 60000)),
  uptimeRegions: checks.length,
  uptimeHealthy: checks.length >= 3 && checks.every(s => s.points[0]?.value.boolValue === true),
};
console.log(JSON.stringify({ checkedAt: end, activePolicies: active.length, health: healthBody.ready, live, checkResults: checks.map(s => ({ labels: s.metricLabels, latest: s.points[0] })), evidence: out }));
if (process.argv.includes('--require-live') && (!live.requests || !live.latency || !live.watchdog || !live.uptimeHealthy)) throw Error('Live measurements are not all ready/healthy; see evidence before declaring the rollout verified.');
