import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { buildKitPrompt, kitIllustrationPrompt, KIT_TEXT_SCHEMA, readKitText } from '../src/lib/kits/content.ts';
import { kitSample } from '../src/lib/kits/sample.ts';

// Explicit, bounded provider smoke test; no customer order, charge or email is created.
const token = execFileSync('/private/tmp/google-cloud-sdk/bin/gcloud', ['auth', 'print-access-token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const root = '/private/tmp/pmm-premium-kit-live';
await mkdir(root, { recursive: true });
const endpoint = 'https://aiplatform.googleapis.com/v1/projects/project-e0c2efff-d456-48f9-9fe/locations/global/publishers/google/models/';
const request = async (model, payload) => {
  console.log(`Vertex request: ${model}`);
  const response = await fetch(`${endpoint}${model}:generateContent`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(90000) });
  const data = await response.json();
  if (!response.ok) throw new Error(`${model}: ${response.status}: ${data.error?.message || 'Provider failure'}`);
  return data;
};
for (const kind of ['monster', 'emergency']) {
  const { input } = kitSample(kind), started = Date.now();
  let text;
  if (process.env.QA_RESUME) text = readKitText(JSON.parse(await readFile(`${root}/${kind}-text.json`, 'utf8')));
  for (const model of text ? [] : process.env.QA_BACKUP_ONLY ? ['gemini-3.1-flash-lite'] : ['gemini-3.5-flash','gemini-3.1-flash-lite']) {
    let generated;
    try { generated = await request(model, { contents: [{ role: 'user', parts: [{ text: buildKitPrompt(input) }] }], generationConfig: { responseMimeType: 'application/json', responseJsonSchema: KIT_TEXT_SCHEMA, maxOutputTokens: 3200, thinkingConfig: { thinkingBudget: 0 }, temperature: .78 } }); }
    catch (error) { console.log(`${kind}/${model}: ${error.message}`); continue; }
    const raw = generated.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('');
    await writeFile(`${root}/${kind}-text.json`, raw || '{}');
    text = readKitText(JSON.parse(raw));
    if (text) break;
    console.log(`${kind}: primary schema rejected, trying configured backup`);
  }
  if (!text) throw new Error(`${kind}: schema validation failed`);
  const kit = { ...text, version: 2, kind, assets: {}, imageAttempts: 0 };
  if (process.env.QA_RESUME) {
    for (const role of ['cover','scene']) {
      try { kit.assets[role] = `data:image/png;base64,${(await readFile(`${root}/${kind}-${role}.png`)).toString('base64')}`; kit.imageAttempts++; } catch {}
    }
  }
  let reference = { mimeType: 'image/webp', data: (await readFile('public/lumi-guardian.webp')).toString('base64') };
  for (const role of ['cover','scene']) {
    if (kit.assets[role]) {
      if (role === 'cover') reference = { mimeType: 'image/png', data: kit.assets.cover.split(',')[1] };
      continue;
    }
    const prompt = kitIllustrationPrompt(kit, role);
    const referenceGuide = role === 'cover' ? 'This reference shows ONLY our mascot Lumi. Preserve her appearance. Invent the human child separately from the requested description. ' : 'Use this image as authoritative character reference, keeping the exact face, hair, clothing and accessories of BOTH characters. Create a different composition. ';
    const parts = [{ inlineData: reference }, { text: referenceGuide + prompt }];
    const image = await request('gemini-3.1-flash-image', { contents: [{ role: 'user', parts }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: role === 'cover' ? '3:4' : '3:2', imageSize: '1K' } } });
    const part = image.candidates?.flatMap(c => c.content?.parts || []).find(p => p.inlineData?.data)?.inlineData;
    if (!part) throw new Error(`${kind}/${role}: no image`);
    kit.assets[role] = `data:${part.mimeType};base64,${part.data}`;
    kit.imageAttempts++;
    await writeFile(`${root}/${kind}-${role}.png`, Buffer.from(part.data, 'base64'));
    if (role === 'cover') reference = part;
  }
  await writeFile(`${root}/${kind}.json`, JSON.stringify({ input, kit }));
  console.log(JSON.stringify({ kind, schema: 'passed', images: kit.imageAttempts, durationMs: Date.now() - started }));
}
