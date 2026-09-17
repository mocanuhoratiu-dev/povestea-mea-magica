import test from 'node:test';
import assert from 'node:assert/strict';
import { PHOTO_ACCEPT, PHOTO_REQUIREMENTS, PHOTO_TECHNICAL_DETAILS, checkPhotoDimensions } from '../src/lib/characterPhotoPolicy.ts';

test('Photo copy keeps technical details separate, including local HEIC conversion', () => {
  assert.match(PHOTO_REQUIREMENTS, /singur copil/);
  assert.match(PHOTO_REQUIREMENTS, /HEIC/);
  assert.doesNotMatch(PHOTO_REQUIREMENTS, /megapixeli|512/);
  assert.match(PHOTO_TECHNICAL_DETAILS, /pe dispozitivul tău/);
  assert.match(PHOTO_ACCEPT, /image\/heic/);
  assert.match(PHOTO_ACCEPT, /\.heif/);
});

test('Photo dimensions reject unsafe and undersized raster output', () => {
  for (const [w, h] of [[0, 1000], [511, 800], [NaN, 800], [Infinity, 800], [10000, 10000]]) assert.throws(() => checkPhotoDimensions(w, h));
  assert.doesNotThrow(() => checkPhotoDimensions(512, 512));
  assert.doesNotThrow(() => checkPhotoDimensions(8000, 5000));
});
