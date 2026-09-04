import { generateAlbumPlan } from "@/lib/album/generation";
import { renderAlbumDocuments } from "@/lib/album/renderer";
import { readAlbumOutput } from "@/lib/album/schema";
import type { AlbumConfiguration, AlbumOrderOutput, AlbumQualityResult } from "@/lib/album/types";
import { readOrderCover, readOrderFile, saveOrderCover, saveOrderFile } from "@/lib/orders";
import { logTelemetry } from "@/lib/telemetry";
import { generateVertexAlbumIllustration } from "@/lib/vertexImage";
import sharp from "sharp";
import { createAlbumBudget, reserveAlbumBudgetCall, type AlbumBudgetCall } from "@/lib/album/budget";
import { evaluateAlbumImage, isAlbumAiQualityEnabled } from "@/lib/album/quality";
import { synthesizeRomanianSpeech } from "@/lib/googleTextToSpeech";

type Checkpoint = (output: AlbumOrderOutput) => Promise<void>;
type VisualFingerprint = Uint8Array;
const ALBUM_SCENE_COUNT = 13;
const ALBUM_PREVIEW_SCENE_COUNT = 2;

class AlbumImageQualityError extends Error {
  constructor(public readonly code: "image_duplicate" | "image_low_resolution" | "image_quality_rejected", message: string) {
    super(message);
    this.name = "AlbumImageQualityError";
  }
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isRetryableImageError(error: unknown) {
  if (error instanceof AlbumImageQualityError) return true;
  const message = error instanceof Error ? error.message : String(error);
  return /429|RESOURCE_EXHAUSTED|503|UNAVAILABLE|timeout|timpul de răspuns|image_(?:low_resolution|bad_aspect_ratio|flat_or_blank)/i.test(message);
}

function isBudgetLimitError(error: unknown) {
  return error instanceof Error && error.message.startsWith("album_budget_");
}

function decodeImageDataUrl(imageDataUrl: string) {
  const match = /^data:image\/(?:png|jpeg|webp);base64,([a-zA-Z0-9+/=]+)$/.exec(imageDataUrl);
  if (!match) throw new AlbumImageQualityError("image_low_resolution", "Ilustrația nu are un format valid.");
  return Buffer.from(match[1], "base64");
}

async function createVisualFingerprint(buffer: Buffer) {
  return new Uint8Array(await sharp(buffer).grayscale().resize(32, 32, { fit: "fill" }).raw().toBuffer());
}

function fingerprintDistance(first: VisualFingerprint, second: VisualFingerprint) {
  if (first.length !== second.length || first.length === 0) return 1;
  let difference = 0;
  for (let index = 0; index < first.length; index += 1) difference += Math.abs(first[index] - second[index]);
  return difference / (first.length * 255);
}

async function inspectGeneratedImage(imageDataUrl: string, avoidFingerprints: VisualFingerprint[]) {
  try {
    const buffer = decodeImageDataUrl(imageDataUrl);
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height || metadata.width < 768 || metadata.height < 512) {
      throw new AlbumImageQualityError("image_low_resolution", "Ilustrația este prea mică pentru album.");
    }
    const fingerprint = await createVisualFingerprint(buffer);
    if (avoidFingerprints.some((known) => fingerprintDistance(fingerprint, known) < 0.035)) {
      throw new AlbumImageQualityError("image_duplicate", "Ilustrația seamănă prea mult cu o scenă deja folosită.");
    }
    return fingerprint;
  } catch (error) {
    if (error instanceof AlbumImageQualityError) throw error;
    throw new AlbumImageQualityError("image_low_resolution", "Ilustrația primită nu poate fi folosită în album.");
  }
}

function initialOutput(): AlbumOrderOutput {
  return {
    kind: "illustrated-album",
    assets: { scenes: Array.from({ length: ALBUM_SCENE_COUNT }, () => "") },
    progress: { stage: "planning", current: 0, total: ALBUM_SCENE_COUNT },
    imageModels: [],
    quality: [],
    budget: createAlbumBudget(),
  };
}

function withModel(output: AlbumOrderOutput, model: string) {
  return Array.from(new Set([...output.imageModels, model]));
}

async function generateAndStoreImage({
  orderId,
  basename,
  prompt,
  reference,
  stage,
  attempt,
  aspectRatio = "3:2",
  avoidFingerprints = [],
  beforeCall,
  beforeQualityCall,
}: {
  orderId: string;
  basename: string;
  prompt: string;
  reference?: string;
  stage: "cover" | "scene" | "coloring";
  attempt?: number;
  aspectRatio?: "4:3" | "3:2" | "16:9";
  avoidFingerprints?: VisualFingerprint[];
  beforeCall: () => Promise<void>;
  beforeQualityCall: () => Promise<void>;
}) {
  const startedAt = Date.now();
  const maxAttempts = readBoundedInteger(process.env.ALBUM_IMAGE_MAX_ATTEMPTS, 4, 1, 6);
  const retryDelayMs = readBoundedInteger(process.env.ALBUM_IMAGE_RETRY_DELAY_MS, 15_000, 2_000, 60_000);
  let lastError: unknown;

  for (let generationAttempt = 1; generationAttempt <= maxAttempts; generationAttempt += 1) {
    try {
      const generated = await generateVertexAlbumIllustration(prompt, reference, aspectRatio, { beforeAttempt: beforeCall });
      if ("error" in generated) throw new Error(generated.error);
      const fingerprint = await inspectGeneratedImage(generated.imageDataUrl, avoidFingerprints);
      const quality = await evaluateAlbumImage({
        asset: basename,
        candidateDataUrl: generated.imageDataUrl,
        referenceDataUrl: reference,
        prompt,
        expectedAspectRatio: aspectRatio,
        identityRequired: Boolean(reference),
        beforeAiCheck: beforeQualityCall,
      });
      if (!quality.accepted) throw new AlbumImageQualityError("image_quality_rejected", "Ilustrația nu a trecut controlul editorial.");
      const objectName = await saveOrderCover(orderId, generated.imageDataUrl, basename);
      logTelemetry("pmm_album_stage_completed", {
        product: "album",
        result: "success",
        durationMs: Date.now() - startedAt,
        continuationCount: generationAttempt - 1,
        aiProvider: "vertex",
        model: generated.model,
        albumStage: stage,
        attempt,
        identityScore: quality.identityScore,
        storyScore: quality.storyScore,
        technicalScore: quality.technicalScore,
      });
      return { objectName, model: generated.model, fingerprint, quality };
    } catch (error) {
      lastError = error;
      const retryable = !isBudgetLimitError(error) && isRetryableImageError(error);
      const isLastAttempt = generationAttempt === maxAttempts;
      const errorCode = isBudgetLimitError(error) ? "budget_limit" : error instanceof AlbumImageQualityError ? error.code : retryable ? "rate_limited" : "ai_error";
      logTelemetry("pmm_album_stage_failed", {
        product: "album",
        result: retryable && !isLastAttempt ? "pending" : "error",
        durationMs: Date.now() - startedAt,
        continuationCount: generationAttempt - 1,
        albumStage: stage,
        attempt,
        errorCode,
      });
      if (!retryable || isLastAttempt) break;
      await wait(Math.min(retryDelayMs * (2 ** (generationAttempt - 1)), 60_000));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Ilustrația nu a putut fi generată.");
}

function readBoundedInteger(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback;
}

async function generatePlanWithTelemetry(
  configuration: AlbumConfiguration,
  previewTitle: string | undefined,
  beforeAttempt: () => Promise<void>,
) {
  const startedAt = Date.now();
  try {
    const generatedPlan = await generateAlbumPlan(configuration.generation, { beforeAttempt });
    const plan = previewTitle ? { ...generatedPlan, title: previewTitle } : generatedPlan;
    logTelemetry("pmm_album_stage_completed", {
      product: "album",
      result: "success",
      durationMs: Date.now() - startedAt,
      albumStage: "plan",
      aiProvider: "vertex",
      model: plan.textModel,
    });
    logTelemetry("pmm_story_text_completed", {
      product: "album",
      result: "success",
      generationMode: "ai",
      pageCount: ALBUM_SCENE_COUNT,
      wordCount: plan.scenes.reduce((total, scene) => total + scene.text.split(/\s+/).filter(Boolean).length, 0),
      aiProvider: "vertex",
      model: plan.textModel,
    });
    return plan;
  } catch (error) {
    logTelemetry("pmm_album_stage_failed", {
      product: "album",
      result: "error",
      durationMs: Date.now() - startedAt,
      albumStage: "plan",
      errorCode: "ai_error",
    });
    throw error;
  }
}

/**
 * Builds two real interior pages before checkout. The same plan and images are
 * reused by the paid worker, so preview cost becomes part of the final book.
 */
export async function createAlbumPreviewScenes({
  orderId,
  configuration,
  existing,
  checkpoint,
}: {
  orderId: string;
  configuration: AlbumConfiguration;
  existing?: Record<string, unknown>;
  checkpoint: Checkpoint;
}) {
  let output = readAlbumOutput(existing);
  if (!output?.assets.cover) throw new Error("Coperta aprobată lipsește din preview.");

  const reserve = async (kind: AlbumBudgetCall) => {
    output = { ...output as AlbumOrderOutput, budget: reserveAlbumBudgetCall((output as AlbumOrderOutput).budget, kind) };
    await checkpoint(output);
  };
  const beforeImageCall = () => reserve("image");
  const beforeQualityCall = async () => {
    if (isAlbumAiQualityEnabled()) await reserve("quality");
  };
  const addQuality = (result: AlbumQualityResult) => [
    ...(output as AlbumOrderOutput).quality.filter((item) => item.asset !== result.asset),
    result,
  ];

  if (!output.plan) {
    const plan = await generatePlanWithTelemetry(configuration, output.previewTitle, () => reserve("text"));
    output = { ...output, plan, progress: { stage: "scenes", current: 0, total: ALBUM_SCENE_COUNT } };
    await checkpoint(output);
  }

  const coverObjectName = output.assets.cover;
  const plan = output.plan;
  if (!coverObjectName || !plan) throw new Error("Preview-ul nu are coperta și planul necesare.");
  const reference = await readOrderCover(coverObjectName);
  const fingerprints: VisualFingerprint[] = [];
  for (let index = 0; index < ALBUM_PREVIEW_SCENE_COUNT; index += 1) {
    if (output.assets.scenes[index]) {
      fingerprints.push(await createVisualFingerprint((await readOrderFile(output.assets.scenes[index])).buffer));
      continue;
    }
    const generated = await generateAndStoreImage({
      orderId,
      basename: `album-scene-${String(index + 1).padStart(2, "0")}`,
      prompt: plan.scenes[index].imagePrompt,
      reference,
      stage: "scene",
      attempt: index + 1,
      aspectRatio: "3:2",
      avoidFingerprints: fingerprints,
      beforeCall: beforeImageCall,
      beforeQualityCall,
    });
    const scenes: string[] = [...output.assets.scenes];
    scenes[index] = generated.objectName;
    output = {
      ...output,
      assets: { ...output.assets, scenes },
      imageModels: withModel(output, generated.model),
      quality: addQuality(generated.quality),
      progress: { stage: "scenes", current: scenes.filter(Boolean).length, total: ALBUM_SCENE_COUNT },
    };
    fingerprints.push(generated.fingerprint);
    await checkpoint(output);
  }

  return output;
}

export async function createAlbumOrderOutput({
  orderId,
  configuration,
  existing,
  checkpoint,
}: {
  orderId: string;
  configuration: AlbumConfiguration;
  existing?: Record<string, unknown>;
  checkpoint: Checkpoint;
}) {
  let output = readAlbumOutput(existing) || initialOutput();
  const reserve = async (kind: AlbumBudgetCall) => {
    output = { ...output, budget: reserveAlbumBudgetCall(output.budget, kind) };
    await checkpoint(output);
  };
  const beforeImageCall = () => reserve("image");
  const beforeQualityCall = async () => {
    if (isAlbumAiQualityEnabled()) await reserve("quality");
  };
  const addQuality = (result: AlbumQualityResult) => [
    ...output.quality.filter((item) => item.asset !== result.asset),
    result,
  ];

  if (!output.plan) {
    const plan = await generatePlanWithTelemetry(configuration, output.previewTitle, () => reserve("text"));
    output = { ...output, plan, progress: { stage: "cover", current: 0, total: ALBUM_SCENE_COUNT } };
    await checkpoint(output);
  }

  const plan = output.plan;
  if (!plan) throw new Error("Planul albumului lipsește după etapa de generare.");

  if (!output.assets.characterReference && !output.assets.cover) {
    const characterReference = await generateAndStoreImage({
      orderId,
      basename: "album-character-reference",
      prompt: plan.characterPrompt,
      stage: "cover",
      beforeCall: beforeImageCall,
      beforeQualityCall,
    });
    output = {
      ...output,
      assets: { ...output.assets, characterReference: characterReference.objectName },
      imageModels: withModel(output, characterReference.model),
      quality: addQuality(characterReference.quality),
    };
    await checkpoint(output);
  }

  const referenceObjectName = output.assets.cover || output.assets.characterReference;
  if (!referenceObjectName) throw new Error("Referința vizuală a personajului lipsește.");
  const reference = await readOrderCover(referenceObjectName);

  if (!output.assets.cover) {
    const cover = await generateAndStoreImage({ orderId, basename: "album-cover", prompt: plan.coverPrompt, reference, stage: "cover", beforeCall: beforeImageCall, beforeQualityCall });
    output = {
      ...output,
      assets: { ...output.assets, cover: cover.objectName },
      imageModels: withModel(output, cover.model),
      quality: addQuality(cover.quality),
      progress: { stage: "scenes", current: output.assets.scenes.filter(Boolean).length, total: ALBUM_SCENE_COUNT },
    };
    await checkpoint(output);
  }

  const coverObjectName = output.assets.cover;
  if (!coverObjectName) throw new Error("Coperta albumului lipsește după etapa de generare.");
  const pacingMs = readBoundedInteger(process.env.ALBUM_IMAGE_PACING_MS, 4_000, 0, 30_000);
  const sceneFingerprints = await Promise.all(
    output.assets.scenes.filter(Boolean).map(async (objectName) => createVisualFingerprint((await readOrderFile(objectName)).buffer)),
  );
  for (let index = 0; index < ALBUM_SCENE_COUNT; index += 1) {
    if (output.assets.scenes[index]) continue;
    const generated = await generateAndStoreImage({
      orderId,
      basename: `album-scene-${String(index + 1).padStart(2, "0")}`,
      prompt: plan.scenes[index].imagePrompt,
      reference,
      stage: "scene",
      attempt: index + 1,
      aspectRatio: "3:2",
      avoidFingerprints: sceneFingerprints,
      beforeCall: beforeImageCall,
      beforeQualityCall,
    });
    const scenes = [...output.assets.scenes];
    scenes[index] = generated.objectName;
    output = {
      ...output,
      assets: { ...output.assets, scenes },
      imageModels: withModel(output, generated.model),
      quality: addQuality(generated.quality),
      progress: { stage: "scenes", current: scenes.filter(Boolean).length, total: ALBUM_SCENE_COUNT },
    };
    sceneFingerprints.push(generated.fingerprint);
    await checkpoint(output);
    if (pacingMs > 0 && index < ALBUM_SCENE_COUNT - 1) await wait(pacingMs);
  }

  if (!output.assets.coloring) {
    output = {
      ...output,
      progress: { stage: "activity", current: ALBUM_SCENE_COUNT, total: ALBUM_SCENE_COUNT },
    };
    await checkpoint(output);
    if (pacingMs > 0) await wait(pacingMs);
    const coloring = await generateAndStoreImage({
      orderId,
      basename: "album-coloring",
      prompt: plan.coloringPrompt,
      reference,
      stage: "coloring",
      aspectRatio: "4:3",
      beforeCall: beforeImageCall,
      beforeQualityCall,
    });
    output = {
      ...output,
      assets: { ...output.assets, coloring: coloring.objectName },
      imageModels: withModel(output, coloring.model),
      quality: addQuality(coloring.quality),
      progress: { stage: "activity", current: ALBUM_SCENE_COUNT, total: ALBUM_SCENE_COUNT },
    };
    await checkpoint(output);
  }

  if (!output.assets.differences) {
    if (pacingMs > 0) await wait(pacingMs);
    const differences = await generateAndStoreImage({
      orderId,
      basename: "album-differences",
      prompt: plan.differencesPrompt,
      reference,
      stage: "coloring",
      attempt: 2,
      aspectRatio: "4:3",
      avoidFingerprints: sceneFingerprints,
      beforeCall: beforeImageCall,
      beforeQualityCall,
    });
    output = {
      ...output,
      assets: { ...output.assets, differences: differences.objectName },
      imageModels: withModel(output, differences.model),
      quality: addQuality(differences.quality),
      progress: { stage: "rendering", current: ALBUM_SCENE_COUNT, total: ALBUM_SCENE_COUNT },
    };
    await checkpoint(output);
  }

  if (!output.documents) {
    const coloringObjectName = output.assets.coloring;
    const differencesObjectName = output.assets.differences;
    if (!coloringObjectName || !differencesObjectName || output.assets.scenes.some((objectName) => !objectName)) {
      throw new Error("Ilustrațiile albumului nu sunt complete înainte de randare.");
    }
    const startedAt = Date.now();
    try {
      const [coverFile, coloringFile, differencesFile, ...sceneFiles] = await Promise.all([
        readOrderFile(coverObjectName),
        readOrderFile(coloringObjectName),
        readOrderFile(differencesObjectName),
        ...output.assets.scenes.map((objectName) => readOrderFile(objectName)),
      ]);
      const documents = await renderAlbumDocuments(configuration, plan, {
        cover: coverFile.buffer,
        coloring: coloringFile.buffer,
        differences: differencesFile.buffer,
        scenes: sceneFiles.map((file) => file.buffer),
      });
      const [storybook, activityBooklet] = await Promise.all([
        saveOrderFile(orderId, documents.storybook, "album-storybook", "application/pdf"),
        saveOrderFile(orderId, documents.activityBooklet, "album-activity-booklet", "application/pdf"),
      ]);
      output = {
        ...output,
        documents: { storybook, activityBooklet },
        progress: { stage: "delivery", current: ALBUM_SCENE_COUNT, total: ALBUM_SCENE_COUNT },
      };
      await checkpoint(output);
      logTelemetry("pmm_pdf_render_completed", { product: "album", result: "success", durationMs: Date.now() - startedAt, pageCount: 21 });
      logTelemetry("pmm_album_stage_completed", { product: "album", result: "success", durationMs: Date.now() - startedAt, albumStage: "render", pageCount: 21 });
    } catch (error) {
      logTelemetry("pmm_album_stage_failed", { product: "album", result: "error", durationMs: Date.now() - startedAt, albumStage: "render", errorCode: "render_error" });
      throw error;
    }
  }

  if (output.documents && !output.documents.narration) {
    const startedAt = Date.now();
    try {
      const narrationText = [plan.title, ...plan.scenes.flatMap((scene) => [scene.heading, scene.text])].join(". ");
      const narration = await synthesizeRomanianSpeech(narrationText.slice(0, 4_000), "story");
      const narrationObjectName = await saveOrderFile(orderId, narration, "album-narration", "audio/mpeg");
      output = { ...output, documents: { ...output.documents, narration: narrationObjectName } };
      await checkpoint(output);
      logTelemetry("pmm_album_stage_completed", { product: "album", result: "success", durationMs: Date.now() - startedAt, albumStage: "audio" });
    } catch (error) {
      console.error("Album narration generation failed", error);
      logTelemetry("pmm_album_stage_failed", { product: "album", result: "error", durationMs: Date.now() - startedAt, albumStage: "audio", errorCode: "ai_error" });
    }
  }

  return output;
}
