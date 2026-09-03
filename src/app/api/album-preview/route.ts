import { NextResponse } from "next/server";
import sharp from "sharp";
import { generateAlbumPreview, logAlbumPreviewFailure } from "@/lib/album/preview";
import { readAlbumConfiguration, readAlbumOutput } from "@/lib/album/schema";
import {
  createDeliveryToken,
  createOrder,
  getOrder,
  isOrderStoreConfigured,
  isValidDeliveryToken,
  readOrderFile,
  setOrderStatus,
} from "@/lib/orders";
import { checkRateLimit, requestExceedsBodyLimit } from "@/lib/requestProtection";
import { logTelemetry } from "@/lib/telemetry";

export const runtime = "nodejs";

function previewLimit() {
  const configured = Number.parseInt(process.env.ALBUM_PREVIEW_RATE_LIMIT_MAX || "", 10);
  return Number.isFinite(configured) ? Math.min(5, Math.max(1, configured)) : 2;
}

async function addPreviewWatermark(image: Buffer) {
  const metadata = await sharp(image).metadata();
  const width = metadata.width || 1200;
  const height = metadata.height || 800;
  const fontSize = Math.max(64, Math.round(width * 0.105));
  const label = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(${Math.round(width / 2)} ${Math.round(height / 2)}) rotate(-12)">
        <text x="0" y="0" text-anchor="middle" dominant-baseline="middle"
          font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="800"
          letter-spacing="${Math.round(fontSize * 0.12)}" fill="rgba(255,255,255,.28)"
          stroke="rgba(7,18,42,.22)" stroke-width="2">PREVIEW</text>
      </g>
    </svg>
  `);
  return sharp(image).composite([{ input: label, top: 0, left: 0 }]).webp({ quality: 88 }).toBuffer();
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  if (requestExceedsBodyLimit(request, 32_000)) {
    return NextResponse.json({ error: "Datele pentru preview sunt prea mari." }, { status: 413 });
  }

  const limit = checkRateLimit(request, "album-preview", {
    windowMs: 24 * 60 * 60 * 1000,
    maxRequests: previewLimit(),
  });
  if (!limit.allowed) {
    logAlbumPreviewFailure(startedAt, "rate_limited");
    return NextResponse.json(
      { error: "Ai creat deja preview-urile disponibile astăzi. Poți continua cu unul dintre ele sau poți reveni mâine." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  if (!isOrderStoreConfigured() || !process.env.VERTEX_AI_PROJECT_ID?.trim()) {
    logAlbumPreviewFailure(startedAt, "configuration");
    return NextResponse.json({ error: "Preview-ul personalizat nu este disponibil momentan." }, { status: 503 });
  }

  try {
    const body = await request.json() as { configuration?: unknown };
    const configuration = readAlbumConfiguration(body.configuration);
    if (!configuration) {
      logAlbumPreviewFailure(startedAt, "configuration");
      return NextResponse.json({ error: "Verifică detaliile copilului și ale aventurii." }, { status: 400 });
    }

    const order = await createOrder("illustrated-album-digital", configuration as unknown as Record<string, unknown>);
    logTelemetry("pmm_album_preview_started", { product: "album", result: "success", albumStage: "cover" });
    const preview = await generateAlbumPreview(order.id, configuration);
    await setOrderStatus(order, "draft", { output: preview.output, coverObjectName: preview.objectName });
    const token = createDeliveryToken(order.id, 1);
    const query = new URLSearchParams({ order: order.id, token });

    logTelemetry("pmm_album_preview_completed", {
      product: "album",
      result: "success",
      durationMs: Date.now() - startedAt,
      aiProvider: "vertex",
      model: preview.model,
      albumStage: "cover",
    });
    return NextResponse.json({
      orderId: order.id,
      previewUrl: `/api/album-preview?${query.toString()}`,
      title: preview.title,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Album preview generation failed", error);
    logAlbumPreviewFailure(startedAt, "ai_error");
    return NextResponse.json({ error: "Preview-ul nu a putut fi creat acum. Încearcă din nou în câteva minute." }, { status: 502 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order") || "";
  const token = url.searchParams.get("token") || "";
  if (!orderId || !token || !isValidDeliveryToken(orderId, token)) {
    return NextResponse.json({ error: "Preview-ul nu mai este disponibil." }, { status: 404 });
  }

  try {
    const order = await getOrder(orderId);
    const output = order?.product === "album" ? readAlbumOutput(order.output) : null;
    if (!order || !["draft", "pending_payment"].includes(order.status) || !output?.assets.cover) {
      return NextResponse.json({ error: "Preview-ul nu mai este disponibil." }, { status: 404 });
    }

    const image = await readOrderFile(output.assets.cover);
    if (!image.contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Preview-ul este invalid." }, { status: 500 });
    }
    const watermarked = await addPreviewWatermark(image.buffer);
    return new Response(new Uint8Array(watermarked), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Album preview delivery failed", error);
    return NextResponse.json({ error: "Preview-ul nu este disponibil momentan." }, { status: 502 });
  }
}
