import { generateAlbumPlan } from "@/lib/album/generation";
import { renderAlbumDocuments } from "@/lib/album/renderer";
import { readAlbumOutput } from "@/lib/album/schema";
import type { AlbumConfiguration, AlbumOrderOutput, AlbumPlan } from "@/lib/album/types";
import { readOrderCover, readOrderFile, saveOrderCover, saveOrderFile } from "@/lib/orders";
import { logTelemetry } from "@/lib/telemetry";
import { generateVertexAlbumIllustration } from "@/lib/vertexImage";

type Checkpoint = (output: AlbumOrderOutput) => Promise<void>;

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
  try {
    const generated = await generateVertexAlbumIllustration(prompt, reference);
    if ("error" in generated) throw new Error(generated.error);
    const objectName = await saveOrderCover(orderId, generated.imageDataUrl, basename);
    logTelemetry("pmm_album_stage_completed", {
      product: "album",
      result: "success",
      durationMs: Date.now() - startedAt,
      aiProvider: "vertex",
      model: generated.model,
      albumStage: stage,
      attempt,
    });
    return { objectName, model: generated.model };
  } catch (error) {
    logTelemetry("pmm_album_stage_failed", { product: "album", result: "error", durationMs: Date.now() - startedAt, albumStage: stage, attempt, errorCode: "ai_error" });
    throw error;
  }
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
  for (let start = 0; start < 13; start += 2) {
    const indices = [start, start + 1].filter((index) => index < 13 && !output.assets.scenes[index]);
    if (!indices.length) continue;
    const generated = await Promise.all(indices.map(async (index) => ({
      index,
      ...await generateAndStoreImage({
        orderId,
        basename: `album-scene-${String(index + 1).padStart(2, "0")}`,
        prompt: plan.scenes[index].imagePrompt,
        reference,
        stage: "scene",
        attempt: index + 1,
      }),
    })));
    const scenes = [...output.assets.scenes];
    const models = [...output.imageModels];
    generated.forEach((item) => {
      scenes[item.index] = item.objectName;
      models.push(item.model);
    });
    output = {
      ...output,
      assets: { ...output.assets, scenes },
      imageModels: Array.from(new Set(models)),
      progress: { stage: "scenes", current: scenes.filter(Boolean).length, total: 13 },
    };
    await checkpoint(output);
  }

  if (!output.assets.coloring) {
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
