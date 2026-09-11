import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { imageRejection } from '../src/lib/vertexImageFailure.ts';
import { AlbumPreviewError, previewFailureResponse } from '../src/lib/album/previewFailure.ts';
import { hasGroundedTextAssessment } from '../src/lib/album/qualityText.ts';

test('input and output filter refusals remain distinguishable without user data', () => {
  assert.deepEqual(imageRejection({ promptFeedback: { blockReason: 'SAFETY' } }, 'model'), { model: 'model', stage: 'input', reason: 'SAFETY' });
  const rejected = imageRejection({ candidates: [{ finishReason: 'IMAGE_PROHIBITED_CONTENT' }] }, 'model');
  assert.deepEqual(rejected, { model: 'model', stage: 'output', reason: 'IMAGE_PROHIBITED_CONTENT' });
  const error = new AlbumPreviewError('provider_rejected', rejected);
  assert.equal(error.rejection?.stage, 'output');
  assert.equal(previewFailureResponse(error).status, 422);
  assert.ok(!previewFailureResponse(error).error.includes('IMAGE_PROHIBITED_CONTENT'));
  assert.equal(imageRejection({ candidates: [{ finishReason: 'STOP' }] }, 'model'), undefined);
  assert.equal(imageRejection({ candidates: [{ finishReason: 'OTHER' }] }, 'model'), undefined);
  assert.equal(imageRejection({ promptFeedback: { blockReason: 'arbitrary sensitive detail' } }, 'model')?.reason, 'BLOCKED');
});

test('text judgments must be grounded and contradictory responses fail closed', () => {
  assert.equal(hasGroundedTextAssessment({ hasText: true }), false);
  assert.equal(hasGroundedTextAssessment({ hasText: true, textEvidence: '' }), false);
  assert.equal(hasGroundedTextAssessment({ hasText: true, textEvidence: 'Bottom right: ABC glyphs on shell' }), true);
  assert.equal(hasGroundedTextAssessment({ hasText: false, textEvidence: '' }), true);
  assert.equal(hasGroundedTextAssessment({ hasText: false, textEvidence: 'Visible watermark' }), false);
});

test('preview QC evaluates the original brief, not previous reviewers criticism', () => {
  const source = readFileSync(new URL('../src/lib/album/preview.ts', import.meta.url), 'utf8');
  const qc = source.slice(source.indexOf('const quality = await evaluateAlbumImage'), source.indexOf('qualityResults.push'));
  assert.match(qc, /\n\s+prompt,/);
  assert.doesNotMatch(qc, /prompt: attemptPrompt/);
});
