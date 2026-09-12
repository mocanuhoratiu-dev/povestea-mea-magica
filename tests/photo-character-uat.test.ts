import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { signCharacterProof, verifyCharacterProof } from "../src/lib/characterToken.ts";
import { readPhotoTraits, PHOTO_MAX_BYTES, PHOTO_MAX_SIDE, PHOTO_MAX_PIXELS } from "../src/lib/characterPhotoPolicy.ts";
import { sanitizeAlbumReferencePhoto } from "../src/lib/album/referencePhoto.ts";
import { readLimitedJson } from "../src/lib/limitedJson.ts";
import { storyColors, simpleStoryColor, illustrationPalette } from "../src/lib/storyColors.ts";
import { summarizeReport, reportMessage } from "../src/lib/dailyReportData.ts";
import { generationFailureReason } from "../src/lib/generationFailureReason.ts";
import { resumeKitArtwork } from "../src/lib/kits/resume.ts";
import { kitSample } from "../src/lib/kits/sample.ts";
import type { PremiumKit } from "../src/lib/kits/content.ts";

const traits = { hairStyle: "scurt și drept", hairColor: "șaten", eyeColor: "nu se distinge", skinTone: "deschisă", outfit: "pulover roz", appearanceDetail: "ochelari rotunzi" };
test("photo proof binds analysis, photograph, approved image and expiry", () => {
  const previous = process.env.ORDER_ACCESS_SECRET; process.env.ORDER_ACCESS_SECRET = "unit-test-secret-32-characters-long";
  try {
    const base = { kind: "analysis" as const, traits, model: "gemini-3.1-flash-lite", style: "3D" };
    const analysis = signCharacterProof(base, "photo");
    assert.deepEqual(verifyCharacterProof(analysis, "photo").traits, traits);
    assert.throws(() => verifyCharacterProof(analysis, "other-photo"));
    assert.throws(() => verifyCharacterProof(analysis, "photo", "forged-image"));
    const character = signCharacterProof({ ...base, kind: "character" }, "photo", "approved-image");
    assert.equal(verifyCharacterProof(character, "photo", "approved-image").kind, "character");
    assert.throws(() => verifyCharacterProof(character, "photo"));
    assert.throws(() => verifyCharacterProof(character, "photo", "different-image"));
    assert.throws(() => verifyCharacterProof(character + "x", "photo", "approved-image"));
    const now = Date.now; Date.now = () => now() + 86_400_001;
    try { assert.throws(() => verifyCharacterProof(character, "photo", "approved-image")); } finally { Date.now = now; }
  } finally { if (previous === undefined) delete process.env.ORDER_ACCESS_SECRET; else process.env.ORDER_ACCESS_SECRET = previous; }
});
test("photo traits are bounded and never need invented eye color", () => {
  assert.deepEqual(readPhotoTraits(traits), traits);
  assert.equal(readPhotoTraits({ ...traits, hairStyle: "x".repeat(101) }), null);
});
test("photo normalization strips metadata and rejects small, oversized or unsupported inputs", async () => {
  const data = await sharp({ create: { width: 2400, height: 1600, channels: 3, background: "#798e90" } }).withMetadata({ orientation: 6 }).jpeg().toBuffer();
  const normalized = await sanitizeAlbumReferencePhoto(`data:image/jpeg;base64,${data.toString("base64")}`);
  const metadata = await sharp(normalized.buffer).metadata();
  assert.ok(Math.max(metadata.width!, metadata.height!) <= PHOTO_MAX_SIDE);
  assert.equal(metadata.exif, undefined); assert.equal(metadata.orientation, undefined);
  const small = await sharp({ create: { width: 511, height: 700, channels: 3, background: "#aaa" } }).png().toBuffer();
  await assert.rejects(sanitizeAlbumReferencePhoto(`data:image/png;base64,${small.toString("base64")}`), /prea mică/);
  await assert.rejects(sanitizeAlbumReferencePhoto("data:image/heic;base64,abcd"));
  await assert.rejects(sanitizeAlbumReferencePhoto(`data:image/jpeg;base64,${Buffer.alloc(PHOTO_MAX_BYTES + 1).toString("base64")}`));
  assert.equal(PHOTO_MAX_PIXELS, 40_000_000);
});
test("request cap also applies to chunked requests without Content-Length", async () => {
  const request = new Request("https://example.test", { method: "POST", body: '{"test":"' + "x".repeat(200) + '"}' });
  await assert.rejects(readLimitedJson(request, 100), /request_too_large/);
  assert.deepEqual(await readLimitedJson(new Request("https://example.test", { method: "POST", body: '{"ok":true}' }), 100), { ok: true });
});
test("14 story colors separate simple child-facing names from art direction", () => {
  assert.equal(storyColors.length, 14);
  assert.equal(simpleStoryColor("roz zmeură"), "roz"); assert.equal(simpleStoryColor("mov ametist"), "mov");
  assert.equal(storyColors.every(c => !c.value.includes(" ")), true);
  assert.notEqual(illustrationPalette("roz"), "roz");
});
test("daily email includes actual model counts, native resolution and failure categories without prompts", () => {
  const entries = [
    { jsonPayload: { event: "pmm_ai_model_completed", model: "gemini-3-pro-image", duration_ms: 3000, prompt: "PRIVATE" } },
    { jsonPayload: { event: "pmm_image_model_output", model: "gemini-3-pro-image", resolution: "2K" } },
    { jsonPayload: { event: "pmm_ai_model_attempt_failed", model: "gemini-3.1-flash-image", error_code: "provider_busy", duration_ms: 1000 } },
    { jsonPayload: { event: "pmm_generation_incident", error_code: "quality_rejected", childName: "PRIVATE" } },
  ];
  const summary = summarizeReport(entries), message = reportMessage("2026-09-12", summary);
  assert.equal(summary.models["gemini-3-pro-image"].images2K, 1);
  assert.equal(summary.models["gemini-3.1-flash-image"].failures, 1);
  assert.equal(summary.incidents.quality_rejected, 1);
  assert.match(message.html, /gemini-3-pro-image/); assert.match(message.text, /quality_rejected/);
  assert.doesNotMatch(message.html + message.text, /PRIVATE/);
});
test("failure taxonomy never guesses trademark as the reason for a refusal", () => {
  for (const [message, expected] of [["SAFETY", "provider_rejected"], ["quality_rejected", "quality_rejected"], ["429 RESOURCE_EXHAUSTED", "provider_busy"], ["BILLING_DISABLED", "billing_disabled"], ["UNAUTHENTICATED", "configuration"], ["album_budget_cost_limit", "budget_limit"]]) assert.equal(generationFailureReason(new Error(message)), expected);
});
test("both kit images use the approved character rather than replacing it with their cover", async () => {
  const kit = { ...kitSample("monster").kit, assets: {}, imageAttempts: 0 };
  const references: Array<string | undefined> = [];
  const output = await resumeKitArtwork(kit, { characterReference: "approved-reference", checkpoint: async () => {}, read: async asset => asset, save: async image => image }, async (_role, reference, reserve) => { references.push(reference); await reserve(); return { image: "new-image", model: "gemini-3-pro-image" }; });
  assert.deepEqual(references, ["approved-reference", "approved-reference"]);
  assert.deepEqual(output.imageModels, ["gemini-3-pro-image"]);
  assert.equal(output.imageAttempts, 2);
});
test("preview creation is queued, resumes the same order, and stores candidates before QC", () => {
  const route = readFileSync(new URL("../src/app/api/album-preview/route.ts", import.meta.url), "utf8");
  const worker = readFileSync(new URL("../src/app/api/orders/preview/route.ts", import.meta.url), "utf8");
  assert.doesNotMatch(route, /await generateAlbumPreview/);
  assert.match(route, /enqueueOrderPreview/); assert.match(route, /export async function PATCH/);
  assert.match(worker, /claimOrderPreview/); assert.match(worker, /checkpointOrderPreview/);
  assert.doesNotMatch(worker, /setOrderStatus\(order, "failed"/);
  const preview = readFileSync(new URL("../src/lib/album/preview.ts", import.meta.url), "utf8");
  assert.ok(preview.indexOf('"album-cover-preview-pending"') < preview.indexOf("const quality = await evaluateAlbumImage"));
});

test("kit retries QC on a saved candidate without another image request", async () => {
  let latest: PremiumKit = { ...kitSample("monster").kit, assets: {}, imageAttempts: 0 };
  let billable = 0;
  const store = { checkpoint: async (kit: PremiumKit) => { latest = kit; }, read: async (asset: string) => asset, save: async (image: string) => image };
  await assert.rejects(resumeKitArtwork(latest, store, async (_role, _reference, reserve, verification) => {
    await reserve(); billable++;
    await verification.savePending("candidate", "gemini-3-pro-image");
    await verification.beforeQuality(); throw Error("quality_unavailable");
  }), /quality_unavailable/);
  assert.equal(latest.pendingArtwork?.cover?.asset, "candidate"); assert.equal(latest.assets.cover, undefined);
  const output = await resumeKitArtwork(latest, store, async (role, _reference, reserve, verification) => {
    if (!verification.pending) { await reserve(); billable++; }
    await verification.beforeQuality();
    return { image: verification.pending?.image || role, model: "gemini-3-pro-image" };
  });
  assert.equal(billable, 2); assert.equal(output.assets.cover, "candidate");
  assert.equal(Object.keys(output.pendingArtwork || {}).length, 0);
  assert.equal(output.qualityAttempts, 3);
});
