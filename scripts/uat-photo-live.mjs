import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import sharp from "sharp";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:3022";
const out = "/private/tmp/pmm-photo-live-20260912";
await mkdir(out, { recursive: true });
const fixture = await readFile("/private/tmp/pmm-model-alternatives-20260912/gemini-3-pro-image-character.png");
const referenceImageDataUrl = `data:image/jpeg;base64,${(await sharp(fixture).resize(1536, 1536, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer()).toString("base64")}`;
let requests = 0;
async function call(body) {
 if (++requests > 4) throw Error("UAT request ceiling");
 const start = Date.now();
 const response = await fetch(base + "/api/character-reference", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, referenceImageDataUrl, photoConsent: true, style: "Ilustrație 3D de poveste" }), signal: AbortSignal.timeout(180000) });
 const result = await response.json();
 console.log(JSON.stringify({ stage: body.action, http: response.status, seconds: Math.round((Date.now() - start) / 1000), traits: result.traits, error: result.error, verificationPending: Boolean(result.pendingToken) }));
 return { response, result };
}
const analysis = await call({ action: "analyze" }); assert.equal(analysis.response.status, 200);
let generated = await call({ action: "character", analysisToken: analysis.result.analysisToken });
while (generated.result.pendingToken && requests < 4) generated = await call({ action: "character", analysisToken: analysis.result.analysisToken, pendingToken: generated.result.pendingToken, pendingImage: generated.result.pendingImage });
assert.equal(generated.response.status, 200);
await writeFile(`${out}/character.png`, Buffer.from(generated.result.characterImageDataUrl.split(",")[1], "base64"));
await writeFile(`${out}/result.json`, JSON.stringify({ testReference: "synthetic illustrated child; not a real photograph", requests, traits: generated.result.traits, approvedTokenIssued: Boolean(generated.result.characterToken) }, null, 2));
console.log("PASS: real Vertex vision, image generation, identity QC, signed character proof. Synthetic reference only.");
if (process.env.UAT_PREVIEW === "true") {
 const configuration = JSON.parse(await readFile("/private/tmp/pmm-photo-uat/configuration.json", "utf8"));
 const started = Date.now();
 const response = await fetch(base + "/api/album-preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ configuration, referenceImageDataUrl, characterImageDataUrl: generated.result.characterImageDataUrl, characterToken: generated.result.characterToken, photoConsent: true }), signal: AbortSignal.timeout(45000) });
 const preview = await response.json();
 console.log(JSON.stringify({ stage: "preview_queued", http: response.status, seconds: (Date.now() - started) / 1000, orderId: preview.orderId, error: preview.error }));
 assert.equal(response.status, 200);
 await writeFile(`${out}/preview-access.json`, JSON.stringify(preview), { mode: 0o600 });
 for (let i = 0; i < 65; i++) {
   await new Promise(resolve => setTimeout(resolve, 8000));
   const checked = await fetch(new URL(preview.statusUrl, base), { signal: AbortSignal.timeout(20000) });
   const state = await checked.json();
   console.log(JSON.stringify({ stage: "preview_status", status: state.status, coverReady: state.coverReady, progress: state.progress, canResume: state.canResume, seconds: Math.round((Date.now() - started) / 1000), error: state.error }));
   if (state.status === "failed" && !state.canResume) throw Error(state.error);
   if (state.status === "ready") {
     assert.equal(state.pages.length, 3); assert.equal(state.qualityChecked, true);
     await writeFile(`${out}/preview-ready.json`, JSON.stringify(state), { mode: 0o600 });
     console.log("PASS: live Cloud Tasks preview, cover + two interiors, quality checked, no payment.");
     break;
   }
   if (i === 64) throw Error("UAT preview is still processing; no new generation was created");
 }
}
