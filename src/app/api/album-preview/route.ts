import { NextResponse } from "next/server";
import sharp from "sharp";
import { generateAlbumPreview, logAlbumPreviewFailure } from "@/lib/album/preview";
import { readAlbumConfiguration, readAlbumOutput } from "@/lib/album/schema";
import {
  createDeliveryToken,
  createOrder,
  enqueueOrderPreview,
  getOrder,
  isOrderStoreConfigured,
  isValidDeliveryToken,
  readOrderFile,
  saveOrderCover,
  setOrderStatus,
} from "@/lib/orders";
import { checkRateLimit, requestExceedsBodyLimit } from "@/lib/requestProtection";
import { logTelemetry } from "@/lib/telemetry";
import { sanitizeAlbumReferencePhoto } from "@/lib/album/referencePhoto";
import { readBundleConfiguration, readBundleOutput } from "@/lib/bundle";
import { siteUrl } from "@/lib/siteMode";
import { isAlbumPreviewReady } from "@/lib/album/previewState";

export const runtime = "nodejs";

function previewLimit() {
  const configured = Number.parseInt(process.env.ALBUM_PREVIEW_RATE_LIMIT_MAX || "", 10);
  return Number.isFinite(configured) ? Math.min(8, Math.max(1, configured)) : 4;
}

async function addPreviewWatermark(image: Buffer) {
  const metadata = await sharp(image).metadata();
  const width = metadata.width || 1200;
  const height = metadata.height || 800;
  const fontSize = Math.max(60, Math.round(width * 0.078));
  const strokeWidth = Math.max(3, Math.round(width * 0.002));
  const label = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(${Math.round(width / 2)} ${Math.round(height / 2)}) rotate(-12)">
        <text x="0" y="0" text-anchor="middle" dominant-baseline="middle"
          font-family="Liberation Sans" font-size="${fontSize}" font-weight="800"
          letter-spacing="${Math.round(fontSize * 0.1)}" fill="#f7eed8"
          stroke="#07122a" stroke-width="${strokeWidth}" paint-order="stroke">MOSTRĂ</text>
      </g>
    </svg>
  `);
  return sharp(image).composite([{ input: label, top: 0, left: 0 }]).webp({ quality: 88 }).toBuffer();
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  if (requestExceedsBodyLimit(request, 1_800_000)) {
    return NextResponse.json({ error: "Datele pentru mostră sunt prea mari." }, { status: 413 });
  }

  const limit = checkRateLimit(request, "album-preview", {
    windowMs: 24 * 60 * 60 * 1000,
    maxRequests: previewLimit(),
  });
  if (!limit.allowed) {
    logAlbumPreviewFailure(startedAt, "rate_limited");
    return NextResponse.json(
      { error: "Ai creat deja mostrele disponibile astăzi. Poți continua cu una dintre ele sau poți reveni mâine." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  if (!isOrderStoreConfigured() || !process.env.VERTEX_AI_PROJECT_ID?.trim()) {
    logAlbumPreviewFailure(startedAt, "configuration");
    return NextResponse.json({ error: "Mostra personalizată nu este disponibilă momentan." }, { status: 503 });
  }

  try {
    const body = await request.json() as { productId?: unknown; configuration?: unknown; bundleConfiguration?: unknown; referenceImageDataUrl?: unknown; photoConsent?: unknown };
    const isCompleteBundle = body.productId === "complete-bundle";
    const bundle = isCompleteBundle ? readBundleConfiguration(body.bundleConfiguration, "complete") : null;
    const albumItem = bundle?.find((item) => item.product === "album");
    const configuration = readAlbumConfiguration(isCompleteBundle ? albumItem?.configuration : body.configuration);
    if (!configuration) {
      logAlbumPreviewFailure(startedAt, "configuration");
      return NextResponse.json({ error: "Verifică detaliile copilului și ale aventurii." }, { status: 400 });
    }

    const wantsPhoto = configuration.generation.referenceMode === "photo";
    if (wantsPhoto !== Boolean(body.referenceImageDataUrl)) {
      return NextResponse.json({ error: "Selectează din nou fotografia sau continuă numai cu descrierea." }, { status: 400 });
    }
    if (wantsPhoto && body.photoConsent !== true) {
      return NextResponse.json({ error: "Este necesară confirmarea permisiunii pentru folosirea fotografiei." }, { status: 400 });
    }
    const sanitizedReference = wantsPhoto ? await sanitizeAlbumReferencePhoto(body.referenceImageDataUrl) : null;
    const consent = { confirmedAt: new Date().toISOString(), policyVersion: "2026-09-04" };
    const storedAlbumConfiguration = wantsPhoto ? { ...configuration, referencePhotoConsent: consent } : configuration;
    const storedConfiguration = isCompleteBundle && bundle
      ? { items: bundle.map((item) => item.product === "album" ? { ...item, configuration: storedAlbumConfiguration } : item) }
      : storedAlbumConfiguration;
    const order = await createOrder(isCompleteBundle ? "complete-bundle" : "illustrated-album-digital", storedConfiguration as unknown as Record<string, unknown>);
    const sourceReference = sanitizedReference ? await saveOrderCover(order.id, sanitizedReference.dataUrl, "album-parent-reference") : undefined;
    logTelemetry("pmm_album_preview_started", { product: "album", result: "success", albumStage: "cover" });
    const preview = await generateAlbumPreview(order.id, configuration, {
      referenceImageDataUrl: sanitizedReference?.dataUrl,
      sourceReference,
    });
    const storedOutput = isCompleteBundle ? { items: [{ product: "album", output: preview.output }] } : preview.output;
    await setOrderStatus(order, "draft", { output: storedOutput, coverObjectName: preview.objectName });
    await enqueueOrderPreview(order.id, siteUrl);
    const token = createDeliveryToken(order.id, 1);
    const query = new URLSearchParams({ order: order.id, token, ...(isCompleteBundle ? { item: "album" } : {}) });
    const statusQuery = new URLSearchParams(query);
    statusQuery.set("view", "status");

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
      statusUrl: `/api/album-preview?${statusQuery.toString()}`,
      title: preview.title,
      qualityChecked: preview.output.quality.some((result) => result.accepted),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Album preview generation failed", error);
    logAlbumPreviewFailure(startedAt, "ai_error");
    return NextResponse.json({ error: "Mostra nu a putut fi creată acum. Încearcă din nou în câteva minute." }, { status: 502 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order") || "";
  const token = url.searchParams.get("token") || "";
  if (!orderId || !token || !isValidDeliveryToken(orderId, token)) {
    return NextResponse.json({ error: "Mostra nu mai este disponibilă." }, { status: 404 });
  }

  try {
    const order = await getOrder(orderId);
    const output = order?.product === "album"
      ? readAlbumOutput(order.output)
      : order?.product === "bundle" && url.searchParams.get("item") === "album"
        ? readAlbumOutput(readBundleOutput(order.output).find((item) => item.product === "album")?.output)
        : null;
    if (!order || !["draft", "pending_payment", "failed"].includes(order.status) || !output?.assets.cover) {
      return NextResponse.json({ error: "Mostra nu mai este disponibilă." }, { status: 404 });
    }

    if (url.searchParams.get("view") === "status") {
      if (order.status === "failed") {
        return NextResponse.json({ status: "failed", error: "Mostra interioară nu a putut fi finalizată. Poți încerca o copertă nouă." });
      }
      const ready = isAlbumPreviewReady(output);
      if (!ready) {
        return NextResponse.json({
          status: "processing",
          progress: Math.min(2, output.assets.scenes.slice(0, 2).filter(Boolean).length),
          total: 2,
        }, { status: 202, headers: { "Cache-Control": "private, no-store, max-age=0" } });
      }
      const plan = output.plan;
      if (!plan) return NextResponse.json({ error: "Planul mostrei lipsește." }, { status: 500 });
      const baseQuery = new URLSearchParams({ order: order.id, token, ...(order.product === "bundle" ? { item: "album" } : {}) });
      const assetUrl = (asset: string) => {
        const assetQuery = new URLSearchParams(baseQuery);
        assetQuery.set("asset", asset);
        return `/api/album-preview?${assetQuery.toString()}`;
      };
      const albumConfiguration = order.product === "album"
        ? readAlbumConfiguration(order.configuration)
        : readAlbumConfiguration(readBundleConfiguration(order.configuration, "complete")?.find((item) => item.product === "album")?.configuration);
      const coverAccepted = output.quality.some((result) => result.asset.startsWith("cover-preview-") && result.accepted);
      const scenesAccepted = ["album-scene-01", "album-scene-02"].every((asset) =>
        output.quality.some((result) => result.asset === asset && result.accepted),
      );
      return NextResponse.json({
        status: "ready",
        title: plan.title,
        qualityChecked: coverAccepted && scenesAccepted,
        pages: [
          { kind: "cover", imageUrl: assetUrl("cover"), eyebrow: "Povestea Magică", title: plan.title, text: `O aventură creată pentru ${albumConfiguration?.generation.name || "copilul tău"}` },
          ...plan.scenes.slice(0, 2).map((scene, index) => ({
            kind: "story",
            imageUrl: assetUrl(`scene-${index}`),
            eyebrow: `Fragment ${index + 1}`,
            title: scene.heading,
            text: scene.text,
            layout: scene.layout,
          })),
        ],
      }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
    }

    const asset = url.searchParams.get("asset") || "cover";
    const sceneMatch = /^scene-([01])$/.exec(asset);
    const objectName = asset === "cover"
      ? output.assets.cover
      : sceneMatch
        ? output.assets.scenes[Number(sceneMatch[1])]
        : undefined;
    if (!objectName) return NextResponse.json({ error: "Pagina mostrei nu este încă disponibilă." }, { status: 404 });
    const image = await readOrderFile(objectName);
    if (!image.contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Mostra este invalidă." }, { status: 500 });
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
    return NextResponse.json({ error: "Mostra nu este disponibilă momentan." }, { status: 502 });
  }
}
