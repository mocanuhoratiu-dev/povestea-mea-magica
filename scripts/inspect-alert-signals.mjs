import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { project, quickRequests, scope, watchdogSuccessFilter } from './alert-v2-config.mjs';
const token = execFileSync('/private/tmp/party-puf-sdk-20260912/google-cloud-sdk/bin/gcloud', ['auth', 'print-access-token'], { encoding: 'utf8' }).trim();
const headers = { Authorization: `Bearer ${token}`, 'x-goog-user-project': project, 'Content-Type': 'application/json' };
const out = '/private/tmp/pmm-alert-audit-20260912'; mkdirSync(out, { recursive: true });
async function request(host, path, body) {
  const r = await fetch(`https://${host}/${path}`, { method: body ? 'POST' : 'GET', headers, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(45000) });
  const data = await r.json(); if (!r.ok) throw Error(`${r.status}: ${JSON.stringify(data.error)}`); return data;
}
const start = new Date(Date.now() - 48 * 3600_000).toISOString();
let pageToken, count = 0; const durations = [], statuses = {}; let truncated = false;
for (let page = 0; page < 20; page++) {
  const data = await request('logging.googleapis.com', 'v2/entries:list', { resourceNames: [`projects/${project}`], filter: `${quickRequests} AND timestamp>="${start}"`, pageSize: 1000, orderBy: 'timestamp desc', ...(pageToken ? { pageToken } : {}) });
  for (const e of data.entries || []) { count++; const q = e.httpRequest; statuses[q.status] = (statuses[q.status] || 0) + 1; durations.push(parseFloat(q.latency || '0')); }
  pageToken = data.nextPageToken; if (!pageToken) break; if (page === 19) truncated = true;
}
durations.sort((a,b) => a-b);
const stats = { start, count, statuses, p95Seconds: durations[Math.floor(durations.length * .95)], maximumSeconds: durations.at(-1), truncated };
console.log(JSON.stringify({ interactive: stats })); writeFileSync(`${out}/interactive-stats.json`, JSON.stringify(stats, null, 2));
const events = await request('logging.googleapis.com', 'v2/entries:list', { resourceNames: [`projects/${project}`], filter: `${scope} AND timestamp>="${start}" AND (jsonPayload.event="pmm_generation_incident" OR jsonPayload.event="pmm_order_watchdog_checked" OR jsonPayload.event="pmm_order_recovery_failed" OR jsonPayload.event="pmm_incident_email_failed")`, pageSize: 1000, orderBy: 'timestamp desc' });
const counts = {}; for (const e of events.entries || []) { const p=e.jsonPayload; const key=[p.event,p.result||p.error_code||''].join(':'); counts[key]=(counts[key]||0)+1; }
console.log(JSON.stringify({ events: counts, truncated: Boolean(events.nextPageToken) }));
const scheduler = await request('cloudscheduler.googleapis.com', `v1/projects/${project}/locations/europe-west3/jobs`);
const jobs = scheduler.jobs?.map(j => ({ name: j.name, state: j.state, schedule: j.schedule, lastAttemptTime: j.lastAttemptTime, status: j.status, target: j.httpTarget?.uri }));
writeFileSync(`${out}/scheduler.json`, JSON.stringify(jobs, null, 2)); console.log(JSON.stringify({ jobs }));
const heartbeats = await request('logging.googleapis.com', 'v2/entries:list', { resourceNames: [`projects/${project}`], filter: `${watchdogSuccessFilter} AND timestamp>="${start}"`, pageSize: 10, orderBy: 'timestamp desc' });
const timestamps = heartbeats.entries?.map(e => e.timestamp) || [];
writeFileSync(`${out}/watchdog-heartbeats.json`, JSON.stringify(timestamps, null, 2));
console.log(JSON.stringify({ recentSuccessfulWatchdogExecutions: timestamps }));
