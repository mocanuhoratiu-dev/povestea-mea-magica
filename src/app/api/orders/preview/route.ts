import { NextResponse } from "next/server";
import { createAlbumPreviewScenes } from "@/lib/album/orchestrator";
import { readAlbumConfiguration, readAlbumOutput } from "@/lib/album/schema";
import { readBundleConfiguration, readBundleOutput, type BundleOutputItem } from "@/lib/bundle";
import { getOrder, setOrderStatus, verifyTaskIdentity, type StoredOrder } from "@/lib/orders";
import { siteUrl } from "@/lib/siteMode";
import { logTelemetry } from "@/lib/telemetry";
import { isAlbumPreviewReady } from "@/lib/album/previewState";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!await verifyTaskIdentity(request, siteUrl)) return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  const { orderId } = await request.json() as { orderId?: string };
  let order = orderId ? await getOrder(orderId) : null;
  if (!order) return NextResponse.json({ error: "Comanda nu a fost găsită." }, { status: 404 });
  if (!["draft", "pending_payment"].includes(order.status)) {
    return NextResponse.json({ error: "Comanda nu mai poate primi un preview." }, { status: 409 });
  }

  try {
    if (order.product === "album") {
      const configuration = readAlbumConfiguration(order.configuration);
      const existing = readAlbumOutput(order.output);
      if (!configuration || !existing) throw new Error("Configurația preview-ului este invalidă.");
      if (isAlbumPreviewReady(existing)) return NextResponse.json({ success: true });
      await createAlbumPreviewScenes({
        orderId: order.id,
        configuration,
        existing: order.output,
        checkpoint: async (output) => {
          const saved = await setOrderStatus(order as StoredOrder, order!.status, { output });
          if (!saved) throw new Error("Progresul preview-ului nu a putut fi salvat.");
          order = saved;
        },
      });
    } else if (order.product === "bundle" && order.productId === "complete-bundle") {
      const configuredItems = readBundleConfiguration(order.configuration, "complete");
      const albumConfiguration = configuredItems?.find((item) => item.product === "album")?.configuration;
      const configuration = readAlbumConfiguration(albumConfiguration);
      const completedItems = readBundleOutput(order.output);
      const existing = completedItems.find((item) => item.product === "album")?.output;
      if (!configuration || !readAlbumOutput(existing)) throw new Error("Configurația albumului din pachet este invalidă.");
      if (isAlbumPreviewReady(readAlbumOutput(existing))) return NextResponse.json({ success: true });
      await createAlbumPreviewScenes({
        orderId: order.id,
        configuration,
        existing,
        checkpoint: async (output) => {
          const nextItem: BundleOutputItem = { product: "album", output };
          const items = [...completedItems.filter((item) => item.product !== "album"), nextItem];
          const saved = await setOrderStatus(order as StoredOrder, order!.status, { output: { items } });
          if (!saved) throw new Error("Progresul preview-ului din pachet nu a putut fi salvat.");
          order = saved;
        },
      });
    } else {
      return NextResponse.json({ error: "Produsul nu folosește preview-ul ilustrat." }, { status: 409 });
    }

    logTelemetry("pmm_album_stage_completed", { product: "album", result: "success", albumStage: "preview", pageCount: 2 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Album interior preview failed", error);
    await setOrderStatus(order, "failed", { errorCode: "album_preview_failed" }).catch(() => undefined);
    logTelemetry("pmm_album_stage_failed", { product: "album", result: "error", albumStage: "preview", errorCode: "ai_error" });
    return NextResponse.json({ error: "Preview-ul interior nu a putut fi creat." }, { status: 500 });
  }
}
