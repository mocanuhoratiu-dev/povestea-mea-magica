import { generateAlbumPlan } from "@/lib/album/generation";
import { renderAlbumDocuments } from "@/lib/album/renderer";
import { readAlbumOutput } from "@/lib/album/schema";
import type { AlbumConfiguration, AlbumOrderOutput, AlbumPlan } from "@/lib/album/types";
import { readOrderCover, readOrderFile, saveOrderCover, saveOrderFile } from "@/lib/orders";
import { logTelemetry } from "@/lib/telemetry";
import { generateVertexAlbumIllustration } from "@/lib/vertexImage";

type Checkpoint = (output: AlbumOrderOutput) => Promise<void>;

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isRetryableImageError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /429|RESOURCE_EXHAUSTED|503|UNAVAILABLE|timeout|timpul de răspuns/i.test(message);
}

function initialOutput(): AlbumOrderOutput {
  return {
    kind: "illustrated-album",
    assets: { scenes: Array.from({ length: 13 }, () => "") },
    progress: { stage: "planning", current: 0, total: 13 },
    imageModels: [],
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
}: {
  orderId: string;
  basename: string;
  prompt: string;
  reference?: string;
  stage: "cover" | "scene" | "coloring";
  attempt?: number;
}) {
  const startedAt = Date.now();
  const maxAttempts = readBoundedInteger(process.env.ALBUM_IMAGE_MAX_ATTEMPTS, 4, 1, 6);
  const retryDelayMs = readBoundedInteger(process.env.ALBUM_IMAGE_RETRY_DELAY_MS, 15_000, 2_000, 60_000);
  let lastError: unknown;

  for (let generationAttempt = 1; generationAttempt <= maxAttempts; generationAttempt += 1) {
    try {
      const generated = await generateVertexAlbumIllustration(prompt, reference);
      if ("error" in generated) throw new Error(generated.error);
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
      });
      return { objectName, model: generated.model };
    } catch (error) {
      lastError = error;
      const retryable = isRetryableImageError(error);
      const isLastAttempt = generationAttempt === maxAttempts;
      logTelemetry("pmm_album_stage_failed", {
        product: "album",
        result: retryable && !isLastAttempt ? "pending" : "error",
        durationMs: Date.now() - startedAt,
        continuationCount: generationAttempt - 1,
        albumStage: stage,
        attempt,
        errorCode: retryable ? "rate_limited" : "ai_error",
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

  if (!output.plan) {
    const startedAt = Date.now();
    let plan: AlbumPlan;
    try {
      plan = await generateAlbumPlan(configuration.generation);
      logTelemetry("pmm_album_stage_completed", { product: "album", result: "success", durationMs: Date.now() - startedAt, albumStage: "plan", aiProvider: "vertex", model: plan.textModel });
    } catch (error) {
      logTelemetry("pmm_album_stage_failed", { product: "album", result: "error", durationMs: Date.now() - startedAt, albumStage: "plan", errorCode: "ai_error" });
      throw error;
    }
    output = { ...output, plan, progress: { stage: "cover", current: 0, total: 13 } };
    await checkpoint(output);
    logTelemetry("pmm_story_text_completed", {
      product: "album",
      result: "success",
      generationMode: "ai",
      pageCount: 13,
      wordCount: plan.scenes.reduce((total, scene) => total + scene.text.split(/\s+/).filter(Boolean).length, 0),
      aiProvider: "vertex",
      model: plan.textModel,
    });
  }

  const plan = output.plan;
  if (!plan) throw new Error("Planul albumului lipsește după etapa de generare.");

  if (!output.assets.cover) {
    const cover = await generateAndStoreImage({ orderId, basename: "album-cover", prompt: plan.coverPrompt, stage: "cover" });
    output = {
      ...output,
      assets: { ...output.assets, cover: cover.objectName },
      imageModels: withModel(output, cover.model),
      progress: { stage: "scenes", current: output.assets.scenes.filter(Boolean).length, total: 13 },
    };
    await checkpoint(output);
  }

  const coverObjectName = output.assets.cover;
  if (!coverObjectName) throw new Error("Coperta albumului lipsește după etapa de generare.");
  const reference = await readOrderCover(coverObjectName);
  const pacingMs = readBoundedInteger(process.env.ALBUM_IMAGE_PACING_MS, 4_000, 0, 30_000);
  for (let index = 0; index < 13; index += 1) {
    if (output.assets.scenes[index]) continue;
    const generated = await generateAndStoreImage({
      orderId,
      basename: `album-scene-${String(index + 1).padStart(2, "0")}`,
      prompt: plan.scenes[index].imagePrompt,
      reference,
      stage: "scene",
      attempt: index + 1,
    });
    const scenes = [...output.assets.scenes];
    scenes[index] = generated.objectName;
    output = {
      ...output,
      assets: { ...output.assets, scenes },
      imageModels: withModel(output, generated.model),
      progress: { stage: "scenes", current: scenes.filter(Boolean).length, total: 13 },
    };
    await checkpoint(output);
    if (pacingMs > 0 && index < 12) await wait(pacingMs);
  }

  if (!output.assets.coloring) {
    if (pacingMs > 0) await wait(pacingMs);
    const coloring = await generateAndStoreImage({
      orderId,
      basename: "album-coloring",
      prompt: plan.coloringPrompt,
      reference,
      stage: "coloring",
    });
    output = {
      ...output,
      assets: { ...output.assets, coloring: coloring.objectName },
      imageModels: withModel(output, coloring.model),
      progress: { stage: "rendering", current: 13, total: 13 },
    };
    await checkpoint(output);
  }

  if (!output.documents) {
    const coloringObjectName = output.assets.coloring;
    if (!coloringObjectName || output.assets.scenes.some((objectName) => !objectName)) {
      throw new Error("Ilustrațiile albumului nu sunt complete înainte de randare.");
    }
    const startedAt = Date.now();
    try {
      const [coverFile, coloringFile, ...sceneFiles] = await Promise.all([
        readOrderFile(coverObjectName),
        readOrderFile(coloringObjectName),
        ...output.assets.scenes.map((objectName) => readOrderFile(objectName)),
      ]);
      const documents = await renderAlbumDocuments(configuration, plan, {
        cover: coverFile.buffer,
        coloring: coloringFile.buffer,
        scenes: sceneFiles.map((file) => file.buffer),
      });
      const [storybook, activityBooklet] = await Promise.all([
        saveOrderFile(orderId, documents.storybook, "album-storybook", "application/pdf"),
        saveOrderFile(orderId, documents.activityBooklet, "album-activity-booklet", "application/pdf"),
      ]);
      output = {
        ...output,
        documents: { storybook, activityBooklet },
        progress: { stage: "delivery", current: 13, total: 13 },
      };
      await checkpoint(output);
      logTelemetry("pmm_pdf_render_completed", { product: "album", result: "success", durationMs: Date.now() - startedAt, pageCount: 24 });
      logTelemetry("pmm_album_stage_completed", { product: "album", result: "success", durationMs: Date.now() - startedAt, albumStage: "render", pageCount: 24 });
    } catch (error) {
      logTelemetry("pmm_album_stage_failed", { product: "album", result: "error", durationMs: Date.now() - startedAt, albumStage: "render", errorCode: "render_error" });
      throw error;
    }
  }

  return output;
}
