import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { readKitInput, readKitText, readPremiumKit, KIT_PAGE_COUNTS, buildKitPrompt } from "../src/lib/kits/content.ts";
import { kitSample } from "../src/lib/kits/sample.ts";
import { buildKitPages } from "../src/lib/kits/template.ts";
import { kitDeliveryOutput } from "../src/lib/kits/delivery.ts";
import { resumeKitArtwork } from "../src/lib/kits/resume.ts";
import { wantsLumiMaterialRecommendation } from "../src/lib/lumiIntent.ts";
import { kitPageGeometry } from "../src/lib/kits/pageGeometry.ts";

for (const kind of ["monster", "emergency"] as const) {
  test(`${kind}: approved sample passes production schema, all ten new pages render`, () => {
    const { input, kit } = kitSample(kind);
    assert.ok(readKitInput(input)); assert.ok(readKitText(kit)); assert.ok(readPremiumKit(kit));
    const pages = buildKitPages(input, kit);
    assert.equal(pages.length, KIT_PAGE_COUNTS[kind]);
    assert.equal(KIT_PAGE_COUNTS[kind], kind === "monster" ? 13 : 10);
    assert.match(pages[0].html, /cover-art/);
    assert.match(pages[9].html, new RegExp(input.name));
    assert.match(buildKitPrompt(input), /NU instrucțiuni/);
    assert.equal(readKitText({ ...kit, title: 'a'.repeat(65) }), null);
    assert.equal(readKitText({ ...kit, story: ['un singur paragraf'] }), null);
    assert.equal(readKitText({ ...kit, discovery: '<script>alert(1)</script>' }), null);
  });
}
test('input validation covers age, names, legacy duration, bounded fields and difficulty', () => {
  const { input } = kitSample('emergency');
  assert.equal(readKitInput({ ...input, age: '0' }), null);
  assert.equal(readKitInput({ ...input, age: '11' }), null);
  assert.equal(readKitInput({ ...input, name: '123' }), null);
  assert.equal(readKitInput({ ...input, duration: '20+ minute' })?.duration, '20-30 minute');
  assert.equal(readKitInput({ ...input, name: 'Ștefan-Andrei', age: '9', difficulty: undefined })?.difficulty, 'advanced');
  assert.equal(readKitInput({ ...input, appearance: 'a'.repeat(500) })?.appearance.length, 240);
});
test('untrusted text is escaped and external image URLs are never rendered', () => {
  const { input, kit } = kitSample('monster');
  const html = buildKitPages({ ...input, name: '<img onerror=alert(1)>' }, { ...kit, assets: { cover: 'https://untrusted.invalid/image.png' } }).map(p => p.html).join('');
  assert.doesNotMatch(html, /<img onerror|https:\/\/untrusted/);
  assert.match(html, /&lt;img/);
});
test('private delivery references are scoped to order, item and token; missing assets stay missing', () => {
  const { kit } = kitSample('monster');
  const output = kitDeliveryOutput({ premium: { ...kit, assets: { cover: 'orders/abc/kit-monster-cover.webp' } } }, 'abc', 'secret+value', 'monster');
  const premium = readPremiumKit(output.premium)!;
  assert.equal(premium.assets.scene, undefined);
  assert.match(premium.assets.cover!, /token=secret%2Bvalue/);
  assert.match(premium.assets.cover!, /item=monster/);
  assert.doesNotMatch(premium.assets.cover!, /\.webp/);
  const legacy = { title: 'Existing order' };
  assert.equal(kitDeliveryOutput(legacy, 'abc', 'token'), legacy);
});
test('artwork resumes after failure, preserves cover and sends it as character reference', async () => {
  let saved = { ...kitSample('monster').kit, assets: {}, imageAttempts: 0 };
  const calls: string[] = [];
  const store = { checkpoint: async (next: typeof saved) => { saved = structuredClone(next); }, save: async (_: string, role: string) => `saved-${role}`, read: async (path: string) => `data-${path}` };
  await assert.rejects(resumeKitArtwork(saved, store, async (role, _ref, before) => { await before(); calls.push(role); if (role === 'scene') throw Error('timeout'); return 'image'; }), /timeout/);
  assert.equal(saved.imageAttempts, 2);
  const complete = await resumeKitArtwork(saved, store, async (role, ref, before) => { assert.equal(role,'scene'); assert.equal(ref,'data-saved-cover'); await before(); calls.push(role); return 'image'; });
  assert.deepEqual(calls, ['cover','scene','scene']);
  assert.equal(complete.imageAttempts,3);
  assert.deepEqual(complete.assets,{cover:'saved-cover',scene:'saved-scene'});
});
test('provider fallback attempts and subsequent task retries share the same cap', async () => {
  let saved = { ...kitSample('emergency').kit, assets: {}, imageAttempts: 3 };
  let billableCalls = 0;
  const store = { checkpoint: async (next: typeof saved) => { saved = structuredClone(next); }, save: async () => 'asset', read: async () => 'image' };
  await assert.rejects(resumeKitArtwork(saved, store, async (_role, _ref, before) => {
    await before(); billableCalls++; await before(); billableCalls++; return 'image';
  }), /kit_budget_images_exhausted/);
  await assert.rejects(resumeKitArtwork(saved, store, async () => { billableCalls++; return 'image'; }), /kit_budget_images_exhausted/);
  assert.equal(billableCalls, 1); assert.equal(saved.imageAttempts, 4);
});
test('checkpoint failure prevents a billable call', async () => {
  let calls = 0;
  await assert.rejects(resumeKitArtwork({ ...kitSample('monster').kit, assets: {}, imageAttempts: 0 }, {
    checkpoint: async () => { throw Error('storage unavailable'); }, save: async () => 'asset', read: async () => '',
  }, async (_role,_reference,before) => { await before(); calls++; return 'image'; }), /storage unavailable/);
  assert.equal(calls,0);
});
test('personalized keepsakes occupy the final three slots, with a landscape diploma only', () => {
  const source = readFileSync(new URL('../src/components/PremiumKitPrint.tsx', import.meta.url),'utf8');
  const { input, kit } = kitSample('monster');
  const pages = buildKitPages(input, kit);
  assert.deepEqual(pages.slice(-3).map(p=>p.title), ['Certificatul Scutului Magic','Rețeta de lumină','Etichetele Scutului Magic']);
  assert.doesNotMatch(source, /ClassicShieldPages/);
  assert.match(pages[11].html, /Nu amestecăm și nu pulverizăm/);
  assert.match(pages[10].html, new RegExp(input.trustedAdult));
  assert.equal(pages[10].orientation, 'landscape');
  assert.equal(pages.filter(p=>p.orientation === 'landscape').length, 1);
  assert.equal(kitPageGeometry(pages[10]).widthMm, 297);
  assert.equal(kitPageGeometry(pages[11]).widthMm, 210);
  assert.equal(kitPageGeometry(pages[12]).heightMm, 297);
  for (const name of ['Raul', 'Ștefan-Andrei', 'Alexandra Ștefania Maria Constantinescu']) {
    const keepsakes = buildKitPages({...input, name}, kit).slice(-3);
    keepsakes.forEach(p=>assert.ok(p.html.includes(name)));
    assert.ok(keepsakes[0].html.includes(`>${Array.from(name)[0]}</div>`));
    assert.doesNotMatch(keepsakes.map(p=>p.html).join(''), /\bEva\b/);
  }
  assert.match(pages[12].html, /<span>13<\/span>/);
  assert.match(source,/elements.length !== expectedPages/);
});
test('Lumi recognizes new names without unsolicited recommendations', () => {
  assert.equal(wantsLumiMaterialRecommendation('Vreau dosarul exploratorului'), true);
  assert.equal(wantsLumiMaterialRecommendation('Deschide atelierul'), true);
  assert.equal(wantsLumiMaterialRecommendation('Mulțumesc, ne-a plăcut dosarul'), false);
});
