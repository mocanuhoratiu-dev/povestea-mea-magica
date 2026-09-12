import { NextResponse } from "next/server";
import { createAlbumPreviewScenes } from "@/lib/album/orchestrator";
import { generateAlbumPreview, logAlbumPreviewFailure } from "@/lib/album/preview";
import { readAlbumConfiguration, readAlbumOutput } from "@/lib/album/schema";
import { readBundleConfiguration, readBundleOutput } from "@/lib/bundle";
import { getOrder, claimOrderPreview, checkpointOrderPreview, readOrderCover, verifyTaskIdentity } from "@/lib/orders";
import { siteUrl } from "@/lib/siteMode";
import { logTelemetry } from "@/lib/telemetry";
import { isAlbumPreviewReady } from "@/lib/album/previewState";
import { generationFailureReason, notifyGenerationFailure } from "@/lib/generationIncident";
import type { AlbumOrderOutput } from "@/lib/album/types";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!await verifyTaskIdentity(request, siteUrl)) return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  const { orderId } = await request.json() as { orderId?: string };
  let order = orderId ? await getOrder(orderId) : null;
  if (!order) return NextResponse.json({ error: "Comanda nu a fost găsită." }, { status: 404 });
  if (!["draft", "pending_payment"].includes(order.status)) return NextResponse.json({ skipped: true });
  let items = order.product === "bundle" ? readBundleOutput(order.output) : [];
  let existing = readAlbumOutput(order.product === "bundle" ? items.find(i => i.product === "album")?.output : order.output);
  if (isAlbumPreviewReady(existing)) return NextResponse.json({ success: true });
  if (!existing) return NextResponse.json({ error: "Configurație invalidă." }, { status: 400 });
  const configuration = readAlbumConfiguration(order.product === "bundle" ? readBundleConfiguration(order.configuration, "complete")?.find(i => i.product === "album")?.configuration : order.configuration);
  if (!configuration) return NextResponse.json({ error: "Configurație invalidă." }, { status: 400 });
  try {
    order = await claimOrderPreview(order.id);
  } catch {
    return NextResponse.json({ pending: true }, { status: 503, headers: { "Retry-After": "60" } });
  }
  if (!order) return NextResponse.json({ exhausted: true });
  items = order.product === "bundle" ? readBundleOutput(order.output) : [];
  existing = readAlbumOutput(order.product === "bundle" ? items.find(i => i.product === "album")?.output : order.output);
  if (!existing || isAlbumPreviewReady(existing)) {
    await checkpointOrderPreview(order, { finished: true });
    return NextResponse.json({ success: Boolean(existing) });
  }
  const checkpoint = async (output: AlbumOrderOutput) => {
    const stored = order!.product === "bundle" ? { items: [...items.filter(i => i.product !== "album"), { product: "album", output }] } : output;
    const saved = await checkpointOrderPreview(order!, { output: stored as unknown as Record<string, unknown>, coverObjectName: output.assets.cover });
    if (!saved) throw new Error("preview_checkpoint_failed");
    order = saved; existing = output;
  };
  const started = Date.now();
  try {
    if (!existing.assets.cover) {
      const preview = await generateAlbumPreview(order.id, configuration, {
        existing, checkpoint, sourceReference: existing.assets.sourceReference, characterReference: existing.assets.characterReference,
        referenceImageDataUrl: existing.assets.characterReference ? await readOrderCover(existing.assets.characterReference) : undefined,
        preferredModel: existing.preferredImageModel,
      });
      await checkpoint(preview.output);
      logTelemetry("pmm_album_preview_completed", { product: "album", result: "success", durationMs: Date.now() - started, aiProvider: "vertex", model: preview.model, albumStage: "cover" });
    }
    await createAlbumPreviewScenes({ orderId: order!.id, configuration, existing: existing as unknown as Record<string, unknown>, checkpoint });
    await checkpointOrderPreview(order!, { finished: true });
    logTelemetry("pmm_album_stage_completed", { product: "album", result: "success", albumStage: "preview", pageCount: 2 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const code = generationFailureReason(error);
    await checkpointOrderPreview(order!, { finished: true, errorCode: code }).catch(() => undefined);
    logAlbumPreviewFailure(started, "generation_failed");
    const recoverable = ["provider_busy", "provider_timeout", "provider_unavailable", "quality_unavailable", "generation_failed"].includes(code);
    const exhausted = (order!.previewJob?.attempts || 0) >= 4;
    if (!recoverable || exhausted) await notifyGenerationFailure(order!.id, "album", "preview", error);
    return NextResponse.json({ error: code }, { status: recoverable && !exhausted ? 503 : 200, headers: { "Retry-After": "60" } });
  }
}
