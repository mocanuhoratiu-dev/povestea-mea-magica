import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = resolve(dirname(new URL(import.meta.url).pathname), '..');

// Transpile real server modules, replacing only the SDK transport. No network or paid calls.
type SdkRequest = { model: string; config: { imageConfig: { imageSize: string }; abortSignal?: AbortSignal }; contents: Array<{ parts: Array<{ inlineData: { data: string } }> }> };
type ServerExports = typeof import('../src/lib/vertexImage') & typeof import('../src/lib/album/quality') & typeof import('../src/lib/photoAnalysis');
function serverModule(entry: string, generate: (request: SdkRequest) => Promise<unknown>): ServerExports {
  const cache = new Map<string, { exports: Record<string, unknown> }>();
  function load(file: string): unknown {
    file = file.endsWith('.ts') ? file : `${file}.ts`;
    if (cache.has(file)) return cache.get(file)!.exports;
    const loadedModule = { exports: {} }; cache.set(file, loadedModule);
    const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
    const localRequire = (id: string) => {
      if (id === '@google/genai') return { GoogleGenAI: class { models = { generateContent: generate }; }, Modality: { IMAGE: 'IMAGE' } };
      if (id.startsWith('@/')) return load(resolve(root, 'src', id.slice(2)));
      if (id.startsWith('.')) return load(resolve(dirname(file), id));
      return require(id);
    };
    vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(localRequire, loadedModule, loadedModule.exports);
    return loadedModule.exports;
  }
  return load(resolve(root, entry)) as ServerExports;
}

const imageResponse = { candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'aGVsbG8=' } }] } }] };
const envKeys = ['VERTEX_AI_PROJECT_ID', 'VERTEX_AI_IMAGE_MODEL', 'VERTEX_AI_IMAGE_FALLBACK_MODELS', 'VERTEX_AI_IMAGE_MAX_MODELS', 'ALBUM_QC_MODEL', 'ALBUM_QC_FALLBACK_MODELS'];
async function isolated(run: () => Promise<void>) {
  const values = envKeys.map(k => process.env[k]);
  envKeys.forEach(k => delete process.env[k]); process.env.VERTEX_AI_PROJECT_ID = 'test-project';
  try { await run(); } finally { envKeys.forEach((k, i) => { if (values[i] === undefined) delete process.env[k]; else process.env[k] = values[i]; }); }
}

test('real illustration adapter reaches third model, keeps reference, uses native 1K and reserves all attempts', () => isolated(async () => {
  const calls: SdkRequest[] = []; const reserved: string[] = [];
  const mod = serverModule('src/lib/vertexImage.ts', async request => {
    calls.push(request); if (calls.length < 3) throw Error('429 RESOURCE_EXHAUSTED'); return imageResponse;
  });
  const reference = 'data:image/png;base64,aGVsbG8=';
  const result = await mod.generateVertexAlbumIllustration('A child in a garden', reference, '3:2', { beforeAttempt: async (model?: string) => { reserved.push(model || ''); } });
  assert.ok(result.imageDataUrl);
  assert.equal(result.model, 'gemini-3.1-flash-lite-image'); assert.equal(result.resolution, '1K');
  assert.equal(calls.length, 3); assert.equal(reserved.length, 3);
  assert.deepEqual(calls.map(c => c.config.imageConfig.imageSize), ['2K', '2K', '1K']);
  assert.ok(calls.every(c => c.contents[0].parts[0].inlineData.data === 'aGVsbG8='));
  assert.ok(calls.every(c => c.config.abortSignal));
}));

test('real illustration adapter never routes around provider safety rejection', () => isolated(async () => {
  let calls = 0;
  const mod = serverModule('src/lib/vertexImage.ts', async () => { calls++; return { candidates: [{ finishReason: 'SAFETY' }] }; });
  const result = await mod.generateVertexAlbumIllustration('test');
  assert.equal(result.rejection?.reason, 'SAFETY'); assert.equal(calls, 1);
}));

test('premium final excludes 1K fallback, prioritizes the approved model and keeps both references', () => isolated(async () => {
  const calls: SdkRequest[] = [];
  const mod = serverModule('src/lib/vertexImage.ts', async request => { calls.push(request); throw Error('503 unavailable'); });
  const result = await mod.generateVertexAlbumIllustration('test', 'data:image/png;base64,aGVsbG8=', '3:2', { require2K: true, preferredModel: 'gemini-3-pro-image', additionalReferenceDataUrl: 'data:image/png;base64,d29ybGQ=' });
  assert.ok('error' in result);
  assert.deepEqual(calls.map(c => c.model), ['gemini-3-pro-image', 'gemini-3.1-flash-image']);
  assert.ok(calls.every(c => c.config.imageConfig.imageSize === '2K'));
  assert.ok(calls.every(c => c.contents[0].parts.filter(p => p.inlineData).length === 2));
}));

test('photo vision fails over invalid output and never chooses between multiple children', () => isolated(async () => {
  const calls: string[] = [];
  const mod = serverModule('src/lib/photoAnalysis.ts', async request => {
    calls.push(request.model);
    if (calls.length === 1) throw Error('429 RESOURCE_EXHAUSTED');
    return { candidates: [{ content: { parts: [{ text: calls.length === 2 ? 'not json' : JSON.stringify({ usable: true, children: 2 }) }] } }] };
  });
  const result = await mod.analyzeCharacterPhoto('data:image/jpeg;base64,aGVsbG8=');
  assert.equal(result.usable, false);
  assert.equal(calls.length, 3);
}));

test('budget rejection prevents any real-adapter transport call', () => isolated(async () => {
  let calls = 0;
  const mod = serverModule('src/lib/vertexImage.ts', async () => { calls++; return imageResponse; });
  await assert.rejects(mod.generateVertexAlbumIllustration('test', undefined, '3:2', { beforeAttempt: async () => { throw Error('album_budget_cost_limit'); } }), /album_budget/);
  assert.equal(calls, 0);
}));

const qcOutput = (accepted: boolean) => ({ identityScore: accepted ? 95 : 20, storyScore: 90, technicalScore: 90, hasText: false, textEvidence: '', unsafe: false, notes: [] });
function qcInput() {
  const data = readFileSync(resolve(root, 'public/examples/album/aventura.webp')).toString('base64');
  return { asset: 'test-scene', candidateDataUrl: `data:image/webp;base64,${data}`, prompt: 'A child in a garden', expectedAspectRatio: '3:2' as const, identityRequired: true };
}
test('real QC switches evaluators after unavailable and malformed results', () => isolated(async () => {
  const calls: string[] = [];
  const mod = serverModule('src/lib/album/quality.ts', async request => {
    calls.push(request.model); if (calls.length === 1) throw Error('503 unavailable');
    return { candidates: [{ content: { parts: [{ text: calls.length === 2 ? 'broken-json' : JSON.stringify(qcOutput(true)) }] } }] };
  });
  const result = await mod.evaluateAlbumImage(qcInput());
  assert.equal(result.accepted, true); assert.deepEqual(calls, ['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.1-pro-preview']);
}));
test('real QC does not switch models to overturn a failed identity check', () => isolated(async () => {
  let calls = 0;
  const mod = serverModule('src/lib/album/quality.ts', async () => { calls++; return { candidates: [{ content: { parts: [{ text: JSON.stringify(qcOutput(false)) }] } }] }; });
  const result = await mod.evaluateAlbumImage(qcInput());
  assert.equal(result.accepted, false); assert.equal(calls, 1);
}));
