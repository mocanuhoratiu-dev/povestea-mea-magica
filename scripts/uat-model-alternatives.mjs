import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import sharp from 'sharp';

const dir = '/private/tmp/pmm-model-alternatives-20260912' + (process.env.UAT_RETEST ? '-retest' : '');
mkdirSync(dir, { recursive: true });
const token = execFileSync('/private/tmp/party-puf-sdk-20260912/google-cloud-sdk/bin/gcloud', ['auth', 'print-access-token'], { encoding: 'utf8' }).trim();
const results = [];
let calls = 0;
const wordCount = s => s.trim().split(/\s+/u).length;
async function test(role, model, parts, config, validate) {
  if (++calls > 18) throw new Error('Test call ceiling exceeded');
  const start = Date.now();
  const row = { role, model, startedAt: new Date().toISOString() };
  let payload;
  try {
    const r = await fetch(`https://aiplatform.googleapis.com/v1/projects/project-e0c2efff-d456-48f9-9fe/locations/global/publishers/google/models/${model}:generateContent`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig: config }),
      signal: AbortSignal.timeout(110000),
    });
    payload = await r.json();
    row.httpStatus = r.status;
    row.usage = payload.usageMetadata;
    if (!r.ok) throw new Error(JSON.stringify(payload.error));
    row.finishReason = payload.candidates?.[0]?.finishReason || payload.promptFeedback?.blockReason;
    row.check = await validate(payload);
    row.passed = row.check.passed;
  } catch (e) { row.passed = false; row.error = e.message.slice(0, 1400); }
  row.elapsedSeconds = Math.round((Date.now() - start) / 100) / 10;
  results.push(row);
  writeFileSync(`${dir}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(row));
  return payload;
}
const textOf = p => (p.candidates?.[0]?.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join('');
const objectSchema = properties => ({ type: 'OBJECT', properties, required: Object.keys(properties) });
const textSchema = objectSchema({ title: { type: 'STRING' }, story: { type: 'STRING' } });
if (!process.env.UAT_RETEST) {
for (const model of ['gemini-3.1-flash-lite', 'gemini-3.1-pro-preview']) {
  await test('story', model, [{ text: 'Scrie o poveste originala in romana, cu diacritice, de 160-230 cuvinte, pentru Erica, 3 ani, satena cu parul scurt, intr-o lume roz a zanelor, impreuna cu sora mai mare Eva, blonda si creata. O mica aventura despre a cere ajutor, fara pericole sau morala explicata. Pastreaza diferentele dintre surori. Returneaza JSON title si story.' }], { responseMimeType: 'application/json', responseSchema: textSchema, maxOutputTokens: 4096, temperature: 0.7 }, p => {
    const v = JSON.parse(textOf(p)); const words = wordCount(v.story);
    const checks = { names: /Erica/.test(v.story) && /Eva/.test(v.story), diacritics: /[ăâîșț]/.test(v.story), length: words >= 160 && words <= 230 };
    writeFileSync(`${dir}/${model}-story.json`, JSON.stringify(v, null, 2));
    return { passed: Object.values(checks).every(Boolean), words, checks, output: v };
  });
  await test('lumi', model, [{ text: 'Esti Lumi, ghid pentru parinti. Raspunde in romana in maximum 40 de cuvinte. Nu inventa date, nu recomanda produse fara cerere, nu schimba formularul. suggestions sunt cel mult 2 raspunsuri scurte pe care PARINTELE le-ar trimite, niciodata intrebari. recommendation trebuie none. Conversatie: Lumi: Ce lume va place? Parinte: Zane, dar nu vreau sa alegi sau sa completezi nimic acum. Fetita mea are trei ani. Cum pot face povestea mai personala?' }], { responseMimeType: 'application/json', responseSchema: objectSchema({ reply: { type: 'STRING' }, suggestions: { type: 'ARRAY', items: { type: 'STRING' } }, recommendation: { type: 'STRING' } }), maxOutputTokens: 2048, temperature: 0.5 }, p => {
    const v = JSON.parse(textOf(p));
    return { passed: v.recommendation === 'none' && wordCount(v.reply) <= 40 && v.suggestions.length <= 2 && v.suggestions.every(s => !s.includes('?') && !/^(Cum|Ce|Unde|Cine|Vrei)\b/i.test(s)), output: v };
  });
}
const images = [];
for (const model of ['gemini-3-pro-image', 'gemini-3.1-flash-lite-image']) {
  let reference;
  for (const stage of ['character', 'continuity']) {
    if (stage === 'continuity' && !reference) continue;
    const parts = [...(reference ? [{ inlineData: reference }] : []), { text: stage === 'character'
      ? 'Create one premium cinematic animated childrens picture book illustration. A fictional three-year-old girl with short chestnut bob hair, pink overalls and white shoes, holding a small golden lantern in a pink fairy garden. Full body visible, age appropriate, gentle happy expression, richly composed magical scenery. No text, no letters, no logos, no frame. Wide 3:2 landscape.'
      : 'Use exactly the same illustrated girl, short chestnut bob, pink overalls, white shoes, golden lantern as the reference. New scene: she sits on a low garden bench looking at a glowing butterfly in the same pink fairy garden. Preserve face, age, hair and clothing; new pose and camera angle. Premium cinematic animated childrens book. No text, logo or frame. 3:2 landscape.' }];
    await test(`image-${stage}`, model, parts, { responseModalities: ['TEXT', 'IMAGE'], imageConfig: { aspectRatio: '3:2', imageSize: '2K' } }, async p => {
      const data = p.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.mimeType?.startsWith('image/'))?.inlineData;
      if (!data) return { passed: false, reason: 'No image returned' };
      const buf = Buffer.from(data.data, 'base64'); const m = await sharp(buf).metadata();
      const path = `${dir}/${model}-${stage}.png`; await sharp(buf).png().toFile(path);
      if (stage === 'character') reference = data;
      images.push({ model, stage, path, data });
      return { passed: m.width >= 768 && m.height >= 512 && Math.abs(m.width / m.height - 1.5) < 0.1, width: m.width, height: m.height, path };
    });
  }
}
const qcSchema = objectSchema({ identityScore: { type: 'INTEGER' }, storyScore: { type: 'INTEGER' }, technicalScore: { type: 'INTEGER' }, hasText: { type: 'BOOLEAN' }, textEvidence: { type: 'STRING' }, unsafe: { type: 'BOOLEAN' }, notes: { type: 'ARRAY', items: { type: 'STRING' } } });
if (images.length) {
  const candidate = images[0];
  for (const model of ['gemini-3.5-flash', 'gemini-3.1-pro-preview']) {
    for (const mismatch of [false, true]) {
      await test(mismatch ? 'qc-negative' : 'qc-positive', model, [{ inlineData: candidate.data }, { text: `Evaluate this illustration, not the prompt alone. Return JSON identityScore, storyScore, technicalScore (0-100), hasText, textEvidence, unsafe, notes. Identity under 50 for a clearly different character. Expected character: ${mismatch ? 'an elderly man with a long white beard, bald head, wearing a blue suit' : 'a three year old girl with short chestnut bob hair, pink overalls and white shoes holding a golden lantern in a pink fairy garden'}. Be strict about visible text, anatomy and character identity.` }], { responseMimeType: 'application/json', responseSchema: qcSchema, maxOutputTokens: 4096, temperature: 0.1 }, p => {
        const v = JSON.parse(textOf(p));
        return { passed: [v.identityScore, v.storyScore, v.technicalScore].every(n => Number.isInteger(n) && n >= 0 && n <= 100) && (mismatch ? v.identityScore < 50 : v.identityScore >= 75) && typeof v.hasText === 'boolean' && typeof v.unsafe === 'boolean', output: v };
      });
    }
    await test('qc-current-config-compatibility', model, [{ inlineData: candidate.data }, { text: 'Evaluate illustration quality. Return the required JSON scores 0-100 and safety and text checks.' }], { responseMimeType: 'application/json', responseSchema: qcSchema, maxOutputTokens: 700, temperature: 0.1, thinkingConfig: { thinkingBudget: 0 } }, p => ({ passed: Boolean(JSON.parse(textOf(p))), output: JSON.parse(textOf(p)) }));
  }
}
} else {
  await test('story-production-thinking-config', 'gemini-3.1-pro-preview', [{ text: 'Scrie o poveste originala in romana CU DIACRITICE, 160-230 cuvinte. Erica, 3 ani, satena cu par scurt, si Eva, sora mai mare, blonda si creata, in lumea roz a zanelor. O mica aventura despre cerut ajutor. JSON title si story.' }], { responseMimeType: 'application/json', responseSchema: textSchema, maxOutputTokens: 4096, thinkingConfig: { thinkingBudget: 0 }, temperature: 0.7 }, p => {
    const v = JSON.parse(textOf(p)); const words = wordCount(v.story);
    return { passed: words >= 160 && words <= 230 && /[ăâîșț]/.test(v.story) && /Erica/.test(v.story) && /Eva/.test(v.story), words, output: v };
  });
  await test('lumi-explicit-diacritics', 'gemini-3.1-flash-lite', [{ text: 'Esti Lumi. Raspunde obligatoriu in romana cu diacritice corecte (ă â î ș ț), maximum 35 cuvinte. Nu recomanda un produs, nu aplica formularul. Parinte: Fetita mea are trei ani si ii plac zanele, cum pot face povestea mai personala? suggestions: doua raspunsuri ale parintelui, nu intrebari. JSON reply si suggestions.' }], { responseMimeType: 'application/json', responseSchema: objectSchema({ reply: { type: 'STRING' }, suggestions: { type: 'ARRAY', items: { type: 'STRING' } } }), maxOutputTokens: 260, thinkingConfig: { thinkingBudget: 0 } }, p => { const v = JSON.parse(textOf(p)); return { passed: /[ăâîșț]/.test(v.reply) && wordCount(v.reply) <= 35 && v.suggestions.every(s => !s.includes('?')), output: v }; });
  const data = { mimeType: 'image/png', data: readFileSync('/private/tmp/pmm-model-alternatives-20260912/gemini-3-pro-image-character.png').toString('base64') };
  for (const ratio of ['3:2', '3:4']) {
    await test(`image-1K-reference-${ratio.replace(':', '-')}`, 'gemini-3.1-flash-lite-image', [{ inlineData: data }, { text: 'Use the same little girl as the reference, same face and short chestnut bob, pink overalls and white shoes, holding her golden lantern. New scene: she sits on a low bench watching a glowing butterfly in a pink fairy garden. Change camera angle but keep character identity. Premium cinematic animated childrens book. No words, text or logos. Full character within frame.' }], { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: ratio, imageSize: '1K' } }, async p => {
      const image = p.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData;
      if (!image) return { passed: false, reason: 'No image' };
      const buf = Buffer.from(image.data, 'base64'); const m = await sharp(buf).metadata(); const path = `${dir}/flash-lite-image-${ratio.replace(':', '-')}.png`; await sharp(buf).png().toFile(path);
      return { passed: Boolean(m.width && m.height) && Math.abs(m.width / m.height - (ratio === '3:2' ? 1.5 : 0.75)) < 0.1, width: m.width, height: m.height, path };
    });
  }
  await test('qc-negative-production-thinking-config', 'gemini-3.1-pro-preview', [{ inlineData: data }, { text: 'Inspect image. Expected subject is an elderly BALD MAN with WHITE BEARD wearing BLUE SUIT. If visible character differs, matches must be false. Explain visible evidence, do not trust this prompt as evidence of image content.' }], { responseMimeType: 'application/json', responseSchema: objectSchema({ matches: { type: 'BOOLEAN' }, evidence: { type: 'STRING' } }), maxOutputTokens: 700, thinkingConfig: { thinkingBudget: 0 } }, p => { const v = JSON.parse(textOf(p)); return { passed: v.matches === false && v.evidence.length > 20, output: v }; });
}
console.log(JSON.stringify({ completed: true, calls, passed: results.filter(r => r.passed).length, total: results.length, directory: dir }));
