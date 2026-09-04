import sharp from "sharp";
import { albumPreviewTitle, buildAlbumPreviewPrompt, buildAlbumPreviewRetryPrompt } from "@/lib/album/previewPrompt";
import { albumWorldLabel } from "@/lib/album/schema";
import type { AlbumConfiguration, AlbumOrderOutput, AlbumQualityResult } from "@/lib/album/types";
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

function readBoundedInteger(value: string | undefined, fallback: number, minimum: number, maximum: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function generateAlbumPreview(orderId: string, configuration: AlbumConfiguration, options: { referenceImageDataUrl?: string; sourceReference?: string } = {}) {
  const prompt = buildAlbumPreviewPrompt(
    configuration.generation,
    albumWorldLabel(configuration.generation.world, configuration.generation.customWorld),
  );
  const previewTitle = albumPreviewTitle(configuration.generation);
  let budget = createAlbumBudget();
  const maxAttempts = readBoundedInteger(process.env.ALBUM_PREVIEW_MAX_ATTEMPTS, 2, 1, 3);
  const retryDelayMs = readBoundedInteger(process.env.ALBUM_PREVIEW_RETRY_DELAY_MS, 1_200, 0, 5_000);
  const qualityResults: AlbumQualityResult[] = [];
  let acceptedCandidate: { imageDataUrl: string; model: string; quality: AlbumQualityResult } | null = null;
  let attemptPrompt = prompt;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const generated = await generateVertexAlbumIllustration(attemptPrompt, options.referenceImageDataUrl, "3:2", {
        beforeAttempt: async () => { budget = reserveAlbumBudgetCall(budget, "image"); },
      });
      if ("error" in generated) throw new Error(generated.error);

      const metadata = await sharp(decodePreview(generated.imageDataUrl)).metadata();
      if (!metadata.width || !metadata.height || metadata.width < 768 || metadata.height < 512) {
        throw new Error("Preview-ul primit nu are rezoluția necesară pentru album.");
      }

      if (isAlbumAiQualityEnabled()) budget = reserveAlbumBudgetCall(budget, "quality");
      const quality = await evaluateAlbumImage({
        asset: `cover-preview-attempt-${attempt}`,
        candidateDataUrl: generated.imageDataUrl,
        referenceDataUrl: options.referenceImageDataUrl,
        prompt: attemptPrompt,
        expectedAspectRatio: "3:2",
        identityRequired: Boolean(options.referenceImageDataUrl),
        thresholds: { technical: 60, story: 52, identity: 55 },
      });
      qualityResults.push(quality);
      if (quality.accepted) {
        acceptedCandidate = { imageDataUrl: generated.imageDataUrl, model: generated.model, quality };
        break;
      }

      console.warn("Album preview candidate rejected", JSON.stringify({
        attempt,
        hardFailure: quality.hardFailure === true,
        identityScore: quality.identityScore,
        storyScore: quality.storyScore,
        technicalScore: quality.technicalScore,
        notes: quality.notes,
      }));
      lastError = new Error("Preview-ul nu a trecut controlul de calitate vizuală.");
      attemptPrompt = buildAlbumPreviewRetryPrompt(prompt, quality);
    } catch (error) {
      lastError = error;
      console.warn("Album preview generation attempt failed", JSON.stringify({
        attempt,
        reason: error instanceof Error ? error.message.slice(0, 180) : "unknown",
      }));
    }

    if (attempt < maxAttempts && retryDelayMs > 0) await wait(retryDelayMs);
  }

  if (!acceptedCandidate) {
    throw lastError instanceof Error ? lastError : new Error("Preview-ul nu a putut fi generat.");
  }

  const objectName = await saveOrderCover(orderId, acceptedCandidate.imageDataUrl, "album-cover");
  const output: AlbumOrderOutput = {
    kind: "illustrated-album",
    previewTitle,
    assets: {
      ...(options.sourceReference ? { sourceReference: options.sourceReference } : {}),
      cover: objectName,
      scenes: Array.from({ length: 13 }, () => ""),
    },
    progress: { stage: "planning", current: 0, total: 13 },
    imageModels: [acceptedCandidate.model],
    quality: qualityResults,
    budget,
  };

  return { objectName, output, model: acceptedCandidate.model, title: previewTitle };
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
