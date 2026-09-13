import { NextResponse } from "next/server";
import { readAlbumOutput } from "@/lib/album/schema";
import { ALBUM_AUDIO_ENABLED } from "@/lib/album/features";
import { bundleVariantForProductId, readBundleConfiguration, readBundleOutput } from "@/lib/bundle";
import { getOrder, isValidDeliveryToken, readOrderFile, saveOrderFile } from "@/lib/orders";
import { albumNarrationParts } from "@/lib/narration";
import { narrationCacheKey, synthesizeRomanianSpeech } from "@/lib/googleTextToSpeech";
import { checkRateLimit, requestExceedsBodyLimit } from "@/lib/requestProtection";
import { logTelemetry } from "@/lib/telemetry";
import { readLimitedJson } from "@/lib/limitedJson";

export const runtime = "nodejs";
const headers = { "Content-Type": "audio/mpeg", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const pending = new Map<string, Promise<Buffer>>();

async function storedNarration(orderId: string, text: string) {
  const basename = `voice-${narrationCacheKey(text, "story").slice(0, 48)}`;
  const objectName = `orders/${orderId}/${basename}.mpeg`;
  const existing = pending.get(objectName);
  if (existing) return existing;
  const promise = (async () => {
    try { return (await readOrderFile(objectName)).buffer; } catch (error) {
      if (!(error instanceof Error) || error.message !== "Cloud Storage download failed (404).") throw error;
    }
    const audio = await synthesizeRomanianSpeech(text, "story");
    await saveOrderFile(orderId, audio, basename, "audio/mpeg");
    return audio;
  })().finally(() => pending.delete(objectName));
  pending.set(objectName, promise);
  return promise;
}

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  if (!ALBUM_AUDIO_ENABLED) return NextResponse.json({ error: "Audio indisponibil." }, { status: 503 });
  if (requestExceedsBodyLimit(request, 2_000)) return new Response(null, { status: 413 });
  let body: { token?: unknown; part?: unknown; item?: unknown };
  try { body = await readLimitedJson(request, 2_000); } catch (error) {
    return new Response(null, { status: error instanceof Error && error.message === "request_too_large" ? 413 : 400 });
  }
  const { orderId } = await params;
  if (!body || typeof body.token !== "string" || !isValidDeliveryToken(orderId, body.token)) return NextResponse.json({ error: "Linkul de livrare nu este valid sau a expirat." }, { status: 403 });
  if (!Number.isInteger(body.part) || (body.part as number) < 0) return new Response(null, { status: 400 });
  const limit = checkRateLimit(request, "order-narration", { maxRequests: 120, windowMs: 60 * 60_000 });
  if (!limit.allowed) return new Response(null, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  const started = Date.now();
  try {
    const order = await getOrder(orderId);
    if (!order || order.status !== "delivered" || !order.output) return new Response(null, { status: 409 });
    let album = order.product === "album" && (!body.item || body.item === "album") ? readAlbumOutput(order.output) : null;
    if (order.product === "bundle" && body.item === "album") {
      const variant = bundleVariantForProductId(order.productId);
      const configured = variant ? readBundleConfiguration(order.configuration, variant) : null;
      if (configured?.some((item) => item.product === "album")) {
        const generated = readBundleOutput(order.output).find((item) => item.product === "album");
        if (generated) album = readAlbumOutput(generated.output);
      }
    }
    if (!album?.plan || !album.documents?.storybook || !album.documents.activityBooklet) return new Response(null, { status: 404 });
    // The client selects a part, never the text to synthesize under a paid order.
    const part = albumNarrationParts(album.plan)[body.part as number];
    if (!part) return new Response(null, { status: 404 });
    const audio = await storedNarration(orderId, part.text);
    logTelemetry("pmm_album_stage_completed", { product: "album", result: "success", albumStage: "audio", durationMs: Date.now() - started });
    return new Response(new Uint8Array(audio), { headers });
  } catch {
    logTelemetry("pmm_album_stage_failed", { product: "album", result: "error", albumStage: "audio", durationMs: Date.now() - started, errorCode: "ai_error" });
    return NextResponse.json({ error: "Lumi nu poate citi acum. Încearcă din nou; PDF-urile tale sunt disponibile." }, { status: 503 });
  }
}
