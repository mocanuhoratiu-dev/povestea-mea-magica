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
import { AlbumQualityUnavailableError } from "./qualityPolicy";
import { buildAlbumImageRetryPrompt, type AlbumImageCandidate } from "@/lib/album/imageQualityPolicy";
import { ALBUM_AUDIO_ENABLED } from "./features";

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
  pending,
  preferredModel,
  additionalReference,
  require2K = true,
  referencePurpose = "character",
}: {
  orderId: string;
  basename: string;
  prompt: string;
  reference?: string;
  stage: "cover" | "scene" | "coloring";
  attempt?: number;
  aspectRatio?: "4:3" | "3:2" | "16:9";
  avoidFingerprints?: VisualFingerprint[];
  beforeCall: (model?: string) => Promise<void>;
  beforeQualityCall: (model?: string) => Promise<void>;
  preferredModel?: string;
  additionalReference?: string;
  require2K?: boolean;
  referencePurpose?: "character" | "photo";
  pending?: { read: (key: string) => { objectName: string; model: string } | undefined; write: (key: string, value?: { objectName: string; model: string }) => Promise<void> };
}) {
  const startedAt = Date.now();
  const maxAttempts = readBoundedInteger(process.env.ALBUM_IMAGE_MAX_ATTEMPTS, 4, 1, 6);
  const retryDelayMs = readBoundedInteger(process.env.ALBUM_IMAGE_RETRY_DELAY_MS, 15_000, 2_000, 60_000);
  let lastError: unknown;
  type Candidate = AlbumImageCandidate<{
    imageDataUrl: string;
    model: string;
    fingerprint: VisualFingerprint;
  }>;
  let activePrompt = prompt;

  const saveCandidate = async (
    candidate: Candidate,
    generationAttempt: number,
  ) => {
    const quality = candidate.quality;
    if (!quality.accepted || quality.mode !== "ai") throw new Error("image_quality_rejected");
    const objectName = await saveOrderCover(orderId, candidate.value.imageDataUrl, basename);
    logTelemetry("pmm_album_stage_completed", {
      product: "album",
      result: "success",
      durationMs: Date.now() - startedAt,
      continuationCount: generationAttempt - 1,
      aiProvider: "vertex",
      model: candidate.value.model,
      albumStage: stage,
      attempt,
      identityScore: quality.identityScore,
      storyScore: quality.storyScore,
      technicalScore: quality.technicalScore,
      qualityFallback: false,
    });
    const metadata = await sharp(decodeImageDataUrl(candidate.value.imageDataUrl)).metadata();
    const resolution: "1K" | "2K" = Math.max(metadata.width || 0, metadata.height || 0) >= 1536 && Math.min(metadata.width || 0, metadata.height || 0) >= 1024 ? "2K" : "1K";
    return { objectName, model: candidate.value.model, fingerprint: candidate.value.fingerprint, quality, resolution };
  };

  for (let generationAttempt = 1; generationAttempt <= maxAttempts; generationAttempt += 1) {
    try {
      const savedCandidate = pending?.read(basename);
      const generated = savedCandidate
        ? { imageDataUrl: await readOrderCover(savedCandidate.objectName), model: savedCandidate.model }
        : await generateVertexAlbumIllustration(activePrompt, reference, aspectRatio, { beforeAttempt: beforeCall, preferredModel, require2K, referencePurpose, additionalReferenceDataUrl: additionalReference });
      if ("error" in generated) throw new Error(generated.rejection ? `provider_rejected ${generated.error}` : generated.error);
      if (require2K) {
        const metadata = await sharp(decodeImageDataUrl(generated.imageDataUrl)).metadata();
        if (Math.max(metadata.width || 0, metadata.height || 0) < 1536 || Math.min(metadata.width || 0, metadata.height || 0) < 1024) {
          await pending?.write(basename);
          throw new AlbumImageQualityError("image_low_resolution", "Ilustrația finală trebuie să aibă rezoluție nativă 2K.");
        }
      }
      const fingerprint = await inspectGeneratedImage(generated.imageDataUrl, avoidFingerprints);
      if (!savedCandidate && pending) {
        const objectName = await saveOrderCover(orderId, generated.imageDataUrl, `${basename}-pending`);
        await pending.write(basename, { objectName, model: generated.model });
      }
      const quality = await evaluateAlbumImage({
        asset: basename,
        candidateDataUrl: generated.imageDataUrl,
        referenceDataUrl: reference,
        prompt,
        expectedAspectRatio: aspectRatio,
        identityRequired: Boolean(reference),
        beforeAiCheck: beforeQualityCall,
        referencePurpose,
        thresholds: { identity: referencePurpose === "photo" ? 85 : 88 },
      });
      const candidate = { value: { imageDataUrl: generated.imageDataUrl, model: generated.model, fingerprint }, quality };
      if (quality.accepted) return saveCandidate(candidate, generationAttempt);
      await pending?.write(basename);

      activePrompt = buildAlbumImageRetryPrompt(prompt, quality, Boolean(reference));
      throw new AlbumImageQualityError("image_quality_rejected", "Ilustrația nu a trecut controlul editorial.");
    } catch (error) {
      lastError = error;
      if (error instanceof AlbumQualityUnavailableError) throw error;
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
  beforeAttempt: (model?: string) => Promise<void>,
) {
  const startedAt = Date.now();
  try {
    const plan = await generateAlbumPlan(configuration.generation, { beforeAttempt });
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
  output = { ...output, budget: createAlbumBudget(output.budget) };

  const reserve = async (kind: AlbumBudgetCall, model?: string) => {
    output = { ...output as AlbumOrderOutput, budget: reserveAlbumBudgetCall((output as AlbumOrderOutput).budget, kind, model) };
    await checkpoint(output);
  };
  const beforeImageCall = (model?: string) => reserve("image", model);
  const pending = {
    read: (key: string) => output?.pendingImages?.[key],
    write: async (key: string, value?: { objectName: string; model: string }) => {
      const pendingImages = { ...output!.pendingImages };
      if (value) pendingImages[key] = value; else delete pendingImages[key];
      output = { ...output!, pendingImages }; await checkpoint(output);
    },
  };
  const beforeQualityCall = async (model?: string) => {
    if (isAlbumAiQualityEnabled()) await reserve("quality", model);
  };
  const addQuality = (result: AlbumQualityResult) => [
    ...(output as AlbumOrderOutput).quality.filter((item) => item.asset !== result.asset),
    result,
  ];

  if (!output.plan) {
    const plan = await generatePlanWithTelemetry(configuration, (model) => reserve("text", model));
    output = { ...output, plan, previewTitle: plan.title, progress: { stage: "scenes", current: 0, total: ALBUM_SCENE_COUNT } };
    await checkpoint(output);
  }

  const coverObjectName = output.assets.cover;
  const plan = output.plan;
  if (!coverObjectName || !plan) throw new Error("Preview-ul nu are coperta și planul necesare.");
  if (!output.assets.characterReference) {
    const character = await generateAndStoreImage({ orderId, basename: "album-character-reference", prompt: plan.characterPrompt,
      reference: await readOrderCover(output.assets.sourceReference || coverObjectName), referencePurpose: output.assets.sourceReference ? "photo" : "character",
      stage: "cover", require2K: false, preferredModel: output.preferredImageModel, beforeCall: beforeImageCall, beforeQualityCall, pending });
    output = { ...output, assets: { ...output.assets, characterReference: character.objectName }, imageModels: withModel(output, character.model), quality: addQuality(character.quality) };
    await checkpoint(output);
  }
  const reference = await readOrderCover(output.assets.characterReference!);
  const compositionReference = await readOrderCover(coverObjectName);
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
      additionalReference: compositionReference,
      preferredModel: output.preferredImageModel,
      require2K: false,
      stage: "scene",
      attempt: index + 1,
      aspectRatio: "3:2",
      avoidFingerprints: fingerprints,
      pending,
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
      assetResolutions: { ...output.assetResolutions, [`album-scene-${String(index + 1).padStart(2, "0")}`]: generated.resolution },
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
  output = { ...output, budget: createAlbumBudget(output.budget) };
  const reserve = async (kind: AlbumBudgetCall, model?: string) => {
    output = { ...output, budget: reserveAlbumBudgetCall(output.budget, kind, model) };
    await checkpoint(output);
  };
  const beforeImageCall = (model?: string) => reserve("image", model);
  const pending = {
    read: (key: string) => output.pendingImages?.[key],
    write: async (key: string, value?: { objectName: string; model: string }) => {
      const pendingImages = { ...output.pendingImages };
      if (value) pendingImages[key] = value; else delete pendingImages[key];
      output = { ...output, pendingImages }; await checkpoint(output);
    },
  };
  const beforeQualityCall = async (model?: string) => {
    if (isAlbumAiQualityEnabled()) await reserve("quality", model);
  };
  const addQuality = (result: AlbumQualityResult) => [
    ...output.quality.filter((item) => item.asset !== result.asset),
    result,
  ];

  if (!output.plan) {
    const plan = await generatePlanWithTelemetry(configuration, (model) => reserve("text", model));
    output = { ...output, plan, previewTitle: plan.title, progress: { stage: "cover", current: 0, total: ALBUM_SCENE_COUNT } };
    await checkpoint(output);
  }

  const plan = output.plan;
  if (!plan) throw new Error("Planul albumului lipsește după etapa de generare.");

  if (!output.assets.characterReference) {
    const characterReference = await generateAndStoreImage({
      orderId,
      basename: "album-character-reference",
      pending,
      prompt: plan.characterPrompt,
      reference: output.assets.sourceReference || output.assets.cover ? await readOrderCover((output.assets.sourceReference || output.assets.cover)!) : undefined,
      referencePurpose: output.assets.sourceReference ? "photo" : "character",
      preferredModel: output.preferredImageModel,
      require2K: false,
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

  const referenceObjectName = output.assets.characterReference;
  if (!referenceObjectName) throw new Error("Referința vizuală a personajului lipsește.");
  const reference = await readOrderCover(referenceObjectName);

  if (!output.assets.cover || output.assetResolutions?.["album-cover"] === "1K") {
    const cover = await generateAndStoreImage({ orderId, basename: "album-cover", prompt: plan.coverPrompt, reference, preferredModel: output.preferredImageModel, stage: "cover", beforeCall: beforeImageCall, beforeQualityCall, pending });
    output = {
      ...output,
      assets: { ...output.assets, cover: cover.objectName },
      imageModels: withModel(output, cover.model),
      quality: addQuality(cover.quality),
      assetResolutions: { ...output.assetResolutions, "album-cover": cover.resolution },
      progress: { stage: "scenes", current: output.assets.scenes.filter(Boolean).length, total: ALBUM_SCENE_COUNT },
    };
    await checkpoint(output);
  }

  const coverObjectName = output.assets.cover;
  if (!coverObjectName) throw new Error("Coperta albumului lipsește după etapa de generare.");
  const pacingMs = readBoundedInteger(process.env.ALBUM_IMAGE_PACING_MS, 4_000, 0, 30_000);
  const sceneFingerprints: VisualFingerprint[] = await Promise.all(
    output.assets.scenes.filter((objectName, index) => Boolean(objectName) && output.assetResolutions?.[`album-scene-${String(index + 1).padStart(2, "0")}`] !== "1K").map(async (objectName) => createVisualFingerprint((await readOrderFile(objectName)).buffer)),
  );
  for (let index = 0; index < ALBUM_SCENE_COUNT; index += 1) {
    if (output.assets.scenes[index] && output.assetResolutions?.[`album-scene-${String(index + 1).padStart(2, "0")}`] !== "1K") continue;
    const generated = await generateAndStoreImage({
      orderId,
      basename: `album-scene-${String(index + 1).padStart(2, "0")}`,
      prompt: plan.scenes[index].imagePrompt,
      reference,
      preferredModel: output.preferredImageModel,
      additionalReference: await readOrderCover(coverObjectName),
      stage: "scene",
      attempt: index + 1,
      aspectRatio: "3:2",
      avoidFingerprints: sceneFingerprints,
      pending,
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
      assetResolutions: { ...output.assetResolutions, [`album-scene-${String(index + 1).padStart(2, "0")}`]: generated.resolution },
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
      pending,
      prompt: plan.coloringPrompt,
      reference,
      preferredModel: output.preferredImageModel,
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
    // The five-differences puzzle is geometrically validated by the renderer.
    // Keep the legacy asset pointer for existing order readers, without another AI call.
    output = {
      ...output,
      assets: { ...output.assets, differences: output.assets.cover },
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

  if (ALBUM_AUDIO_ENABLED && output.documents && !output.documents.narration) {
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
