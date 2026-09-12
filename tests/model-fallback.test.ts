import test from 'node:test';
import assert from 'node:assert/strict';
import { assertModelResponse, fallbackModels, imageResolution, modelAttemptTimeout, withModelFallback } from '../src/lib/modelFallback.ts';
import { createAlbumBudget, reserveAlbumBudgetCall } from '../src/lib/album/budget.ts';

test('every model role has primary and two distinct backups, including pipe-separated deployment values', () => {
  for (const role of ['text', 'lumi', 'image', 'quality'] as const) assert.equal(fallbackModels(role).length, 3);
  assert.deepEqual(fallbackModels('image', 'gemini-3.1-flash-image', 'gemini-3-pro-image|gemini-3.1-flash-lite-image'), fallbackModels('image'));
  assert.equal(fallbackModels('text', 'gemini-3.5-flash', 'gemini-3.5-flash,gemini-3.1-flash-lite').length, 3);
});

test('only Flash-Lite Image switches from 2K to its native 1K', () => {
  assert.equal(imageResolution('gemini-3.1-flash-lite-image', '2K'), '1K');
  assert.equal(imageResolution('gemini-3-pro-image', '2K'), '2K');
});

test('provider refusal is terminal while token truncation can use the next model', () => {
  assert.throws(() => assertModelResponse({ candidates: [{ finishReason: 'SAFETY' }] }), /model_safety_rejected/);
  assert.throws(() => assertModelResponse({ promptFeedback: { blockReason: 'OTHER' } }), /model_safety_rejected/);
  assert.throws(() => assertModelResponse({ candidates: [{ finishReason: 'MAX_TOKENS' }] }), /model_output_truncated/);
  assert.doesNotThrow(() => assertModelResponse({ candidates: [{ finishReason: 'STOP' }] }));
});

test('primary unavailable and malformed first backup reach second backup once', async () => {
  const calls: string[] = [];
  const result = await withModelFallback({ role: 'text', models: ['primary', 'backup1', 'backup2'], deadlineAt: Date.now() + 9000, perModelMs: 3000,
    run: async model => { calls.push(model); if (model === 'primary') throw Error('429 RESOURCE_EXHAUSTED'); if (model === 'backup1') JSON.parse('broken'); return 'valid'; },
  });
  assert.equal(result, 'valid'); assert.deepEqual(calls, ['primary', 'backup1', 'backup2']);
});

for (const message of ['album_budget_cost_limit', 'kit_budget_images_exhausted', 'PERMISSION_DENIED', 'BILLING_DISABLED', 'SAFETY']) {
  test(`terminal ${message} never invokes a backup`, async () => {
    let calls = 0;
    await assert.rejects(withModelFallback({ role: 'image', models: ['a', 'b', 'c'], deadlineAt: Date.now() + 9000, perModelMs: 3000,
      run: async () => { calls++; throw Error(message); },
    }), new RegExp(message)); assert.equal(calls, 1);
  });
}

test('QC rejection is returned, not overridden by a more permissive model', async () => {
  let calls = 0;
  const result = await withModelFallback({ role: 'quality', models: ['a', 'b', 'c'], deadlineAt: Date.now() + 9000, perModelMs: 3000,
    run: async () => { calls++; return { accepted: false, hardFailure: true }; },
  });
  assert.equal(result.accepted, false); assert.equal(calls, 1);
});

test('timeout aborts local request and leaves time for backup', async () => {
  let firstSignal: AbortSignal | undefined;
  const result = await withModelFallback({ role: 'text', models: ['a', 'b'], deadlineAt: Date.now() + 3500, perModelMs: 1000,
    run: async (model, _timeout, signal) => { if (model === 'b') return 'recovered'; firstSignal = signal; return new Promise<string>(() => {}); },
  });
  assert.equal(result, 'recovered'); assert.equal(firstSignal?.aborted, true);
});

test('expired total deadline causes no calls', async () => {
  let calls = 0;
  await assert.rejects(withModelFallback({ role: 'lumi', models: ['a', 'b'], deadlineAt: Date.now() - 1, perModelMs: 1000,
    run: async () => { calls++; return 'bad'; },
  }), /deadline/); assert.equal(calls, 0);
  assert.equal(modelAttemptTimeout(9000, 3, 65000, 0), 3000);
});

test('budget tracks all three text attempts and enforces image costs per model', () => {
  let budget = createAlbumBudget();
  for (const model of fallbackModels('text')) budget = reserveAlbumBudgetCall(budget, 'text', model);
  assert.equal(budget.textCalls, 3);
  assert.throws(() => reserveAlbumBudgetCall(budget, 'text'), /text_limit/);
  const pro = reserveAlbumBudgetCall(createAlbumBudget(), 'image', 'gemini-3-pro-image');
  const lite = reserveAlbumBudgetCall(createAlbumBudget(), 'image', 'gemini-3.1-flash-lite-image');
  assert.ok(pro.estimatedCostMicros > lite.estimatedCostMicros);
  assert.throws(() => reserveAlbumBudgetCall({ ...pro, maxEstimatedCostMicros: pro.estimatedCostMicros }, 'image'), /cost_limit/);
});
