import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { createAlbumBudget, reserveAlbumBudgetCall } from "../src/lib/album/budget.ts";
import { acceptBestSafeCandidate, buildAlbumImageRetryPrompt, chooseBetterAlbumCandidate, isSafeSoftQualityCandidate } from "../src/lib/album/imageQualityPolicy.ts";
import { isUsableLineArtStatistics } from "../src/lib/album/qualityMetrics.ts";
import { sanitizeAlbumReferencePhoto } from "../src/lib/album/referencePhoto.ts";

test("album budget stops generation before the configured hard limit is exceeded", () => {
  const budget = { ...createAlbumBudget(), maxImageCalls: 1, maxEstimatedCostMicros: 5_000_000 };
  const reserved = reserveAlbumBudgetCall(budget, "image");
  assert.equal(reserved.imageCalls, 1);
  assert.throws(() => reserveAlbumBudgetCall(reserved, "image"), /album_budget_image_limit/);
});

test("reference photos are normalized and stripped into a bounded JPEG", async () => {
  const source = await sharp({ create: { width: 900, height: 600, channels: 3, background: "#8066aa" } })
    .withMetadata({ orientation: 6 })
    .png()
    .toBuffer();
  const sanitized = await sanitizeAlbumReferencePhoto(`data:image/png;base64,${source.toString("base64")}`);
  const metadata = await sharp(sanitized.buffer).metadata();
  assert.equal(metadata.format, "jpeg");
  assert.ok((metadata.width || 0) <= 1024);
  assert.ok((metadata.height || 0) <= 1024);
  assert.match(sanitized.dataUrl, /^data:image\/jpeg;base64,/);
});

test("reference photos below the identity threshold are rejected", async () => {
  const source = await sharp({ create: { width: 120, height: 120, channels: 3, background: "white" } }).png().toBuffer();
  await assert.rejects(() => sanitizeAlbumReferencePhoto(`data:image/png;base64,${source.toString("base64")}`), /prea mică/);
});

test("album coloring pages accept useful black-and-white line art", () => {
  assert.equal(isUsableLineArtStatistics({ average: 242, contrast: 38, inkCoverage: 0.08 }), true);
});

test("album coloring pages still reject a blank white image", () => {
  assert.equal(isUsableLineArtStatistics({ average: 255, contrast: 0, inkCoverage: 0 }), false);
});

test("a paid album can reuse the best safe candidate after a soft editorial rejection", () => {
  const first = {
    asset: "album-scene-05",
    mode: "ai" as const,
    accepted: false,
    hardFailure: false,
    identityScore: 54,
    storyScore: 57,
    technicalScore: 59,
    checkedAt: "2026-09-10T00:00:00.000Z",
    notes: ["Identitatea este apropiată, dar nu perfectă."],
  };
  const second = { ...first, identityScore: 57, storyScore: 56, technicalScore: 62 };

  assert.equal(isSafeSoftQualityCandidate(first, true), true);
  const selected = chooseBetterAlbumCandidate({ value: "first", quality: first }, { value: "second", quality: second }, true);
  assert.equal(selected.value, "second");
  const accepted = acceptBestSafeCandidate(selected.quality);
  assert.equal(accepted.accepted, true);
  assert.match(accepted.notes.at(-1) || "", /cea mai bună variantă sigură/);
});

test("hard quality failures are never promoted to delivery", () => {
  const unsafe = {
    asset: "album-cover",
    mode: "ai" as const,
    accepted: false,
    hardFailure: true,
    identityScore: 90,
    storyScore: 90,
    technicalScore: 90,
    checkedAt: "2026-09-10T00:00:00.000Z",
    notes: ["Conține text accidental."],
  };
  assert.equal(isSafeSoftQualityCandidate(unsafe, true), false);
});

test("image retries receive targeted editorial corrections", () => {
  const quality = {
    asset: "album-scene-08",
    mode: "ai" as const,
    accepted: false,
    identityScore: 45,
    storyScore: 52,
    technicalScore: 54,
    checkedAt: "2026-09-10T00:00:00.000Z",
    notes: [],
  };
  const prompt = buildAlbumImageRetryPrompt("Original scene", quality, true);
  assert.match(prompt, /Preserve the exact face/);
  assert.match(prompt, /Show the requested action/);
  assert.match(prompt, /Improve anatomy/);
  assert.match(prompt, /Do not add letters/);
});

test("persisted paid orders inherit a larger recovery budget without losing usage", () => {
  const previousImages = process.env.ALBUM_MAX_IMAGE_CALLS;
  const previousQuality = process.env.ALBUM_MAX_QC_CALLS;
  const previousCost = process.env.ALBUM_MAX_ESTIMATED_COST_MICROS;
  process.env.ALBUM_MAX_IMAGE_CALLS = "52";
  process.env.ALBUM_MAX_QC_CALLS = "52";
  process.env.ALBUM_MAX_ESTIMATED_COST_MICROS = "3200000";
  try {
    const existing = {
      ...createAlbumBudget(),
      imageCalls: 40,
      qualityCalls: 39,
      estimatedCostMicros: 2_300_000,
      maxImageCalls: 40,
      maxQualityCalls: 40,
      maxEstimatedCostMicros: 2_500_000,
    };
    const recovered = createAlbumBudget(existing);
    assert.equal(recovered.imageCalls, 40);
    assert.equal(recovered.qualityCalls, 39);
    assert.equal(recovered.estimatedCostMicros, 2_300_000);
    assert.equal(recovered.maxImageCalls, 52);
    assert.equal(recovered.maxQualityCalls, 52);
    assert.equal(recovered.maxEstimatedCostMicros, 3_200_000);
  } finally {
    if (previousImages === undefined) delete process.env.ALBUM_MAX_IMAGE_CALLS;
    else process.env.ALBUM_MAX_IMAGE_CALLS = previousImages;
    if (previousQuality === undefined) delete process.env.ALBUM_MAX_QC_CALLS;
    else process.env.ALBUM_MAX_QC_CALLS = previousQuality;
    if (previousCost === undefined) delete process.env.ALBUM_MAX_ESTIMATED_COST_MICROS;
    else process.env.ALBUM_MAX_ESTIMATED_COST_MICROS = previousCost;
  }
});
