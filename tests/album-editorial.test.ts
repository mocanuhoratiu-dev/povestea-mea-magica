import assert from 'node:assert/strict';
import test from 'node:test';
import { AlbumQualityUnavailableError, meetsAlbumQuality, retryAlbumQuality } from '../src/lib/album/qualityPolicy.ts';
import { chooseEditorialLayout, albumDifferenceSvg, ALBUM_DIFFERENCE_ANSWERS } from '../src/lib/album/editorial.ts';

test('QC retries the evaluator three times, and never fabricates acceptance', async () => {
  let calls = 0;
  await assert.rejects(retryAlbumQuality(async () => { calls++; throw new AlbumQualityUnavailableError(); }, async () => {}), AlbumQualityUnavailableError);
  assert.equal(calls, 3);
  calls = 0;
  assert.equal(await retryAlbumQuality(async () => { if (++calls < 3) throw new AlbumQualityUnavailableError(); return 'accepted'; }, async () => {}), 'accepted');
});
test('budget failures are not retried', async () => {
  let calls = 0;
  await assert.rejects(retryAlbumQuality(async () => { calls++; throw new Error('album_budget_quality'); }, async () => {}));
  assert.equal(calls, 1);
});
test('deterministic checks alone cannot authorize delivery', () => {
  const result = { asset:'cover', mode:'ai' as const, accepted:true, hardFailure:false, identityScore:85, storyScore:75, technicalScore:75, notes:[], checkedAt:'' };
  assert.equal(meetsAlbumQuality(result, true), true);
  assert.equal(meetsAlbumQuality({...result, identityScore:84}, true), false);
  assert.equal(meetsAlbumQuality({...result, mode:'deterministic'}, true), false);
});
test('wide illustrations and longer text select the wide composition', () => {
  assert.equal(chooseEditorialLayout(1.78, 25, 'image-left'), 'cinematic');
  assert.equal(chooseEditorialLayout(1.2, 50, 'image-right'), 'cinematic');
  assert.equal(chooseEditorialLayout(1.2, 25, 'image-right'), 'image-right');
});
test('five differences use geometry, not color substitutions', () => {
  assert.equal(ALBUM_DIFFERENCE_ANSWERS.length, 5);
  assert.notEqual(albumDifferenceSvg(), albumDifferenceSvg(true));
  assert.deepEqual(albumDifferenceSvg().match(/#[a-f0-9]{6}/g), albumDifferenceSvg(true).match(/#[a-f0-9]{6}/g));
});
