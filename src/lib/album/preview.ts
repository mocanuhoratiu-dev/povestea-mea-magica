import sharp from "sharp";
import { albumPreviewTitle, buildAlbumPreviewPrompt } from "@/lib/album/previewPrompt";
import { albumWorldLabel } from "@/lib/album/schema";
import type { AlbumConfiguration, AlbumOrderOutput } from "@/lib/album/types";
import { saveOrderCover } from "@/lib/orders";
import { logTelemetry } from "@/lib/telemetry";
import { generateVertexAlbumIllustration } from "@/lib/vertexImage";
import { createAlbumBudget, reserveAlbumBudgetCall } from "@/lib/album/budget";
import { evaluateAlbumImage, isAlbumAiQualityEnabled } from "@/lib/album/quality";

function decodePreview(imageDataUrl: string) {
  const match = /^data:image\/(?:png|jpeg|webp);base64,([a-zA-Z0-9+/=]+)$/.exec(imageDataUrl);
  if (!match) throw new Error("Preview-ul nu are un format de imagine valid.");
  return Buffer.from(match[1], "base64");
}

export async function generateAlbumPreview(orderId: string, configuration: AlbumConfiguration, options: { referenceImageDataUrl?: string; sourceReference?: string } = {}) {
  const prompt = buildAlbumPreviewPrompt(
    configuration.generation,
    albumWorldLabel(configuration.generation.world),
  );
  const previewTitle = albumPreviewTitle(configuration.generation);
  let budget = createAlbumBudget();
  const generated = await generateVertexAlbumIllustration(prompt, options.referenceImageDataUrl, "3:2", {
    beforeAttempt: async () => { budget = reserveAlbumBudgetCall(budget, "image"); },
  });
  if ("error" in generated) throw new Error(generated.error);

  const metadata = await sharp(decodePreview(generated.imageDataUrl)).metadata();
  if (!metadata.width || !metadata.height || metadata.width < 768 || metadata.height < 512) {
    throw new Error("Preview-ul primit nu are rezoluția necesară pentru album.");
  }

  if (isAlbumAiQualityEnabled()) budget = reserveAlbumBudgetCall(budget, "quality");
  const quality = await evaluateAlbumImage({
    asset: "cover-preview",
    candidateDataUrl: generated.imageDataUrl,
    referenceDataUrl: options.referenceImageDataUrl,
    prompt,
    expectedAspectRatio: "3:2",
    identityRequired: Boolean(options.referenceImageDataUrl),
  });
  if (!quality.accepted) throw new Error("Preview-ul nu a trecut controlul de calitate vizuală.");

  const objectName = await saveOrderCover(orderId, generated.imageDataUrl, "album-cover");
  const output: AlbumOrderOutput = {
    kind: "illustrated-album",
    previewTitle,
    assets: {
      ...(options.sourceReference ? { sourceReference: options.sourceReference } : {}),
      cover: objectName,
      scenes: Array.from({ length: 13 }, () => ""),
    },
    progress: { stage: "planning", current: 0, total: 13 },
    imageModels: [generated.model],
    quality: [quality],
    budget,
  };

  return { objectName, output, model: generated.model, title: previewTitle };
}

export function logAlbumPreviewFailure(startedAt: number, errorCode: "ai_error" | "configuration" | "rate_limited" | "unknown" = "unknown") {
  logTelemetry("pmm_album_preview_failed", {
    product: "album",
    result: "error",
    durationMs: Date.now() - startedAt,
    albumStage: "cover",
    errorCode,
  });
}
