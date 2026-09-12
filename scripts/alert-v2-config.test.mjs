import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPolicies, interactivePath, logMetrics, modelOutageFilter, watchdogSuccessFilter } from './alert-v2-config.mjs';

const policies = buildPolicies('projects/test/notificationChannels/test', 'test-uptime', 'pmm-order-watchdog');
const byName = text => policies.find(p => p.policy.displayName.includes(text)).policy;
test('interactive paths exclude AI generation, downloads, polling and assets', () => {
  const regex = new RegExp(interactivePath);
  for (const path of ['/', '/?utm_source=test', '/povestea-magica', '/povestea-magica/', '/scutul-de-noapte', '/trusa-de-rabdare', '/api/checkout', '/api/health']) assert.ok(regex.test(`https://www.povestea-mea-magica.ro${path}`), path);
  for (const path of ['/api/generate', '/api/generate-cover', '/api/orders/process', '/api/album-preview', '/api/album-preview?token=x', '/api/orders/x', '/api/character-reference', '/_next/static/main.js', '/examples/cover.webp']) assert.equal(regex.test(`https://www.povestea-mea-magica.ro${path}`), false, path);
});
test('5xx requires both count and ratio on the same service, with a retest window', () => {
  const policy = byName('Erori repetate');
  assert.equal(policy.combiner, 'AND_WITH_MATCHING_RESOURCE');
  const [count, ratio] = policy.conditions.map(c => c.conditionThreshold);
  const eligible = (errors, requests) => errors > count.thresholdValue && errors / requests > ratio.thresholdValue;
  assert.equal(eligible(1, 1), false);
  assert.equal(eligible(5, 100), false);
  assert.equal(eligible(5, 30), true);
  for (const c of [count, ratio]) {
    assert.equal(c.duration, '300s');
    assert.equal(c.aggregations[0].alignmentPeriod, '600s');
    assert.deepEqual(c.aggregations[0].groupByFields, ['resource.labels.service_name']);
    assert.match(c.filter, /povestea-mea-magica-domain/);
    assert.equal(c.evaluationMissingData, 'EVALUATION_MISSING_DATA_INACTIVE');
  }
  assert.deepEqual(count.aggregations, ratio.denominatorAggregations);
});
test('latency has a volume floor and excludes missing data', () => {
  const policy = byName('Site sau checkout lent');
  const [latency, volume] = policy.conditions.map(c => c.conditionThreshold);
  assert.equal(policy.combiner, 'AND_WITH_MATCHING_RESOURCE');
  assert.equal(latency.thresholdValue, 8);
  assert.equal(volume.thresholdValue, 19);
  assert.equal(latency.duration, '600s');
  assert.equal(volume.evaluationMissingData, 'EVALUATION_MISSING_DATA_INACTIVE');
  const metric = logMetrics.find(m => m.name.includes('latency'));
  assert.equal(metric.metricDescriptor.unit, 's');
  assert.match(metric.valueExtractor, /\(\[0-9\.\]\+\)s/);
});
test('AI outages count only exhausted availability failures, not fallback attempts', () => {
  assert.match(modelOutageFilter, /pmm_generation_incident/);
  for (const unwanted of ['pmm_ai_model_attempt_failed', 'pmm_ai_fallback_success', 'provider_rejected', 'quality_rejected']) assert.ok(!modelOutageFilter.includes(unwanted));
  const c = byName('Generari indisponibile').conditions[0].conditionThreshold;
  assert.equal(c.thresholdValue, 2);
  assert.equal(c.duration, '300s');
  assert.equal(c.aggregations[0].alignmentPeriod, '900s');
  assert.deepEqual(c.aggregations[0].groupByFields, []);
});
test('uptime needs two failing regions over ten minutes', () => {
  const c = byName('Site indisponibil').conditions[0].conditionThreshold;
  assert.equal(c.thresholdValue, 1);
  assert.equal(c.duration, '600s');
  assert.equal(c.aggregations[0].crossSeriesReducer, 'REDUCE_COUNT_FALSE');
  assert.match(c.filter, /test-uptime/);
});
test('watchdog heartbeat is a successful scheduler run, not a revision or client visit', () => {
  assert.match(watchdogSuccessFilter, /AttemptFinished/);
  assert.match(watchdogSuccessFilter, /2\[0-9\]\[0-9\]/);
  assert.ok(!watchdogSuccessFilter.includes('cloud_run_revision'));
  const c = byName('Watchdog').conditions[0].conditionAbsent;
  assert.equal(c.duration, '3600s');
  assert.match(c.filter, /pmm-order-watchdog/);
});
test('notifications are opening-only and no repeated reminders are configured', () => {
  assert.equal(policies.length, 6);
  for (const { policy } of policies) {
    assert.equal(policy.enabled, true);
    assert.deepEqual(policy.alertStrategy.notificationPrompts, ['OPENED']);
    assert.equal(policy.alertStrategy.notificationChannelStrategy, undefined);
    assert.equal(policy.notificationChannels.length, 1);
  }
  assert.equal(byName('Facturare').alertStrategy.notificationRateLimit.period, '21600s');
});
