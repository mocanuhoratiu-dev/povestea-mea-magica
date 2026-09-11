import assert from 'node:assert/strict';
import test from 'node:test';
import { AlbumPreviewError, previewFailureCode, previewFailureResponse, previewRetryDelay } from '../src/lib/album/previewFailure.ts';
import { ALBUM_QUALITY_MINIMUM } from '../src/lib/album/qualityPolicy.ts';

test('capacity and empty responses receive bounded exponential backoff', () => {
  for (const message of ['429 RESOURCE_EXHAUSTED', 'nu a returnat o imagine.', '503 UNAVAILABLE']) {
    const error = new Error(message);
    assert.equal(previewRetryDelay(error, 1, 1500, 0), 8000);
    assert.equal(previewRetryDelay(error, 2, 1500, 0), 16000);
    assert.ok(previewRetryDelay(error, 10, 1500, 1) <= 26000);
  }
  assert.equal(previewRetryDelay(new AlbumPreviewError('quality_rejected'), 1, 1500), 1500);
});

test('public errors distinguish capacity, quality and verification outages without exposing provider details', () => {
  assert.equal(previewFailureCode(new Error('429 RESOURCE_EXHAUSTED')), 'provider_busy');
  assert.equal(previewFailureResponse(new Error('album_quality_unavailable')).status, 503);
  assert.equal(previewFailureResponse(new AlbumPreviewError('quality_rejected')).status, 422);
  const response = previewFailureResponse(new Error('429 private-project-id'));
  assert.equal(response.retryAfterSeconds, 60);
  assert.ok(!response.error.includes('private-project-id'));
  assert.equal(previewFailureResponse(new Error('unexpected')).code, 'generation_failed');
  assert.equal(previewFailureCode(new Error('nu a returnat o imagine. (IMAGE_PROHIBITED_CONTENT)')), 'provider_rejected');
  assert.equal(previewFailureResponse(new Error('IMAGE_PROHIBITED_CONTENT')).status, 422);
});

test('photo-to-illustration calibration does not lower acceptance thresholds', () => {
  assert.deepEqual(ALBUM_QUALITY_MINIMUM, { identity: 85, story: 75, technical: 75 });
});
