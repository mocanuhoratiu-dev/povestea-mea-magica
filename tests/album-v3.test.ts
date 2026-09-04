import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { createAlbumBudget, reserveAlbumBudgetCall } from "../src/lib/album/budget.ts";
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
