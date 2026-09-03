import sharp from "sharp";
import { albumPreviewTitle, buildAlbumPreviewPrompt } from "@/lib/album/previewPrompt";
import { albumWorldLabel } from "@/lib/album/schema";
import type { AlbumConfiguration, AlbumOrderOutput } from "@/lib/album/types";
import { saveOrderCover } from "@/lib/orders";
import { logTelemetry } from "@/lib/telemetry";
import { generateVertexAlbumIllustration } from "@/lib/vertexImage";

function decodePreview(imageDataUrl: string) {
  const match = /^data:image\/(?:png|jpeg|webp);base64,([a-zA-Z0-9+/=]+)$/.exec(imageDataUrl);
  if (!match) throw new Error("Preview-ul nu are un format de imagine valid.");
  return Buffer.from(match[1], "base64");
}

export async function generateAlbumPreview(orderId: string, configuration: AlbumConfiguration) {
  const prompt = buildAlbumPreviewPrompt(
    configuration.generation,
    albumWorldLabel(configuration.generation.world),
  );
  const previewTitle = albumPreviewTitle(configuration.generation);
  const generated = await generateVertexAlbumIllustration(prompt, undefined, "3:2");
  if ("error" in generated) throw new Error(generated.error);

  const metadata = await sharp(decodePreview(generated.imageDataUrl)).metadata();
  if (!metadata.width || !metadata.height || metadata.width < 768 || metadata.height < 512) {
    throw new Error("Preview-ul primit nu are rezoluția necesară pentru album.");
  }

  const objectName = await saveOrderCover(orderId, generated.imageDataUrl, "album-cover");
  const output: AlbumOrderOutput = {
    kind: "illustrated-album",
    previewTitle,
    assets: {
      cover: objectName,
      scenes: Array.from({ length: 13 }, () => ""),
    },
    progress: { stage: "planning", current: 0, total: 13 },
    imageModels: [generated.model],
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
