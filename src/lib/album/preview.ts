import sharp from "sharp";
import { albumPreviewTitle, buildAlbumPreviewPrompt, buildAlbumPreviewRetryPrompt } from "@/lib/album/previewPrompt";
import { albumWorldLabel } from "@/lib/album/schema";
import type { AlbumConfiguration, AlbumOrderOutput, AlbumQualityResult } from "@/lib/album/types";
import { saveOrderCover, readOrderCover } from "@/lib/orders";
import { logTelemetry } from "@/lib/telemetry";
import { generateVertexAlbumIllustration } from "@/lib/vertexImage";
import { createAlbumBudget, reserveAlbumBudgetCall } from "@/lib/album/budget";
import { evaluateAlbumImage, isAlbumAiQualityEnabled } from "@/lib/album/quality";
import { AlbumQualityUnavailableError } from "./qualityPolicy";
import { AlbumPreviewError, previewFailureCode, previewRetryDelay, type PreviewFailureCode } from "./previewFailure";
import { isTerminalModelError } from "../modelFallback";

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

export async function generateAlbumPreview(orderId: string, configuration: AlbumConfiguration, options: { referenceImageDataUrl?: string; sourceReference?: string; characterReference?: string; preferredModel?: string; existing?: AlbumOrderOutput; checkpoint?: (output: AlbumOrderOutput) => Promise<void> } = {}) {
  // Leave time for storage and the HTTP response before the browser's 180s limit.
  const deadlineAt = Date.now() + 150_000;
  const prompt = buildAlbumPreviewPrompt(
    configuration.generation,
    albumWorldLabel(configuration.generation.world, configuration.generation.customWorld),
  );
  const previewTitle = albumPreviewTitle(configuration.generation);
  let progress: AlbumOrderOutput = options.existing || { kind: "illustrated-album", assets: { scenes: Array.from({ length: 13 }, () => "") }, quality: [], imageModels: [], budget: createAlbumBudget(), progress: { stage: "cover", current: 0, total: 13 } };
  let budget = createAlbumBudget(progress.budget);
  const checkpoint = async () => { progress = { ...progress, budget }; await options.checkpoint?.(progress); };
  const maxAttempts = readBoundedInteger(process.env.ALBUM_PREVIEW_MAX_ATTEMPTS, 2, 1, 3);
  const retryDelayMs = readBoundedInteger(process.env.ALBUM_PREVIEW_RETRY_DELAY_MS, 1_200, 0, 5_000);
  const qualityResults: AlbumQualityResult[] = [];
  let acceptedCandidate: { imageDataUrl: string; model: string; resolution: "1K" | "2K"; quality: AlbumQualityResult } | null = null;
  let attemptPrompt = prompt;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (deadlineAt - Date.now() < 15_000) break;
    try {
      const pending = progress.pendingImages?.["album-cover-preview"];
      const generated = pending ? { imageDataUrl: await readOrderCover(pending.objectName), model: pending.model, resolution: progress.assetResolutions?.["album-cover"] || "1K" as const } : await generateVertexAlbumIllustration(attemptPrompt, options.referenceImageDataUrl, "3:2", {
        beforeAttempt: async (model) => { budget = reserveAlbumBudgetCall(budget, "image", model); await checkpoint(); },
        referencePurpose: "character",
        preferredModel: options.preferredModel,
        deadlineAt: deadlineAt - 12_000,
      });
      if ("error" in generated) {
        if (generated.rejection) throw new AlbumPreviewError("provider_rejected", generated.rejection);
        throw new Error(generated.error);
      }

      const metadata = await sharp(decodePreview(generated.imageDataUrl)).metadata();
      if (!pending) {
        const objectName = await saveOrderCover(orderId, generated.imageDataUrl, "album-cover-preview-pending");
        progress = { ...progress, pendingImages: { ...progress.pendingImages, "album-cover-preview": { objectName, model: generated.model } }, assetResolutions: { ...progress.assetResolutions, "album-cover": generated.resolution } };
        await checkpoint();
      }
      if (!metadata.width || !metadata.height || metadata.width < 768 || metadata.height < 512) {
        throw new Error("Preview-ul primit nu are rezoluția necesară pentru album.");
      }

      const quality = await evaluateAlbumImage({
        beforeAiCheck: async (model) => { if (isAlbumAiQualityEnabled()) { budget = reserveAlbumBudgetCall(budget, "quality", model); await checkpoint(); } },
        asset: `cover-preview-attempt-${attempt}`,
        candidateDataUrl: generated.imageDataUrl,
        referenceDataUrl: options.referenceImageDataUrl,
        prompt,
        expectedAspectRatio: "3:2",
        identityRequired: Boolean(options.referenceImageDataUrl),
        referencePurpose: "character",
        thresholds: { identity: options.characterReference ? 88 : 82 },
        deadlineAt,
      });
      qualityResults.push(quality);
      if (quality.accepted) {
        acceptedCandidate = { imageDataUrl: generated.imageDataUrl, model: generated.model, resolution: generated.resolution, quality };
        break;
      }

      console.warn("Album preview candidate rejected", JSON.stringify({
        attempt,
        hardFailure: quality.hardFailure === true,
        identityScore: quality.identityScore,
        storyScore: quality.storyScore,
        technicalScore: quality.technicalScore,
      }));
      const pendingImages = { ...progress.pendingImages }; delete pendingImages["album-cover-preview"];
      progress = { ...progress, pendingImages }; await checkpoint();
      lastError = new AlbumPreviewError("quality_rejected");
      attemptPrompt = buildAlbumPreviewRetryPrompt(prompt, quality);
    } catch (error) {
      if (isTerminalModelError(error)) throw error;
      if (error instanceof AlbumQualityUnavailableError) throw error;
      if (previewFailureCode(error) === "provider_rejected") {
        console.warn("Album preview provider rejected", JSON.stringify({
          attempt,
          ...(error instanceof AlbumPreviewError ? error.rejection : {}),
        }));
        throw error instanceof AlbumPreviewError ? error : new AlbumPreviewError("provider_rejected");
      }
      lastError = error;
      console.warn("Album preview generation attempt failed", JSON.stringify({
        attempt,
        reason: previewFailureCode(error),
      }));
    }

    if (attempt < maxAttempts) {
      const delay = previewRetryDelay(lastError, attempt, retryDelayMs);
      if (Date.now() + delay + 15_000 >= deadlineAt) break;
      await wait(delay);
    }
  }

  if (!acceptedCandidate) {
    throw lastError instanceof Error ? lastError : new Error("Preview-ul nu a putut fi generat.");
  }

  const objectName = await saveOrderCover(orderId, acceptedCandidate.imageDataUrl, "album-cover");
  const output: AlbumOrderOutput = {
    ...progress,
    kind: "illustrated-album",
    previewTitle,
    assets: {
      ...(options.sourceReference ? { sourceReference: options.sourceReference } : {}),
      ...(options.characterReference ? { characterReference: options.characterReference } : {}),
      cover: objectName,
      scenes: Array.from({ length: 13 }, () => ""),
    },
    progress: { stage: "planning", current: 0, total: 13 },
    imageModels: [acceptedCandidate.model],
    preferredImageModel: acceptedCandidate.model,
    assetResolutions: { "album-cover": acceptedCandidate.resolution },
    quality: qualityResults,
    budget,
    pendingImages: {},
  };

  return { objectName, output, model: acceptedCandidate.model, title: previewTitle };
}

export function logAlbumPreviewFailure(startedAt: number, errorCode: PreviewFailureCode | "ai_error" | "configuration" | "rate_limited" | "unknown" = "unknown") {
  logTelemetry("pmm_album_preview_failed", {
    product: "album",
    result: "error",
    durationMs: Date.now() - startedAt,
    albumStage: "cover",
    errorCode,
  });
}
