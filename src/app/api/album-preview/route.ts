import { NextResponse } from "next/server";
import sharp from "sharp";
import { logAlbumPreviewFailure } from "@/lib/album/preview";
import { albumPreviewTitle } from "@/lib/album/previewPrompt";
import { createAlbumBudget } from "@/lib/album/budget";
import type { AlbumOrderOutput } from "@/lib/album/types";
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
import { checkRateLimit, reserveRateLimit, requestExceedsBodyLimit } from "@/lib/requestProtection";
import { logTelemetry } from "@/lib/telemetry";
import { sanitizeAlbumReferencePhoto } from "@/lib/album/referencePhoto";
import { readBundleConfiguration, readBundleOutput } from "@/lib/bundle";
import { siteUrl } from "@/lib/siteMode";
import { isAlbumPreviewReady } from "@/lib/album/previewState";
import { turnstileRejected, verifyTurnstileRequest } from "@/lib/turnstile";
import { previewFailureResponse } from "@/lib/album/previewFailure";
import { verifyCharacterProof } from "@/lib/characterToken";
import { notifyGenerationFailure } from "@/lib/generationIncident";
import { randomUUID } from "node:crypto";
import { readLimitedJson } from "@/lib/limitedJson";
import { readKitInput } from "@/lib/kits/content";
import { describePhotoTraits } from "@/lib/characterPhotoPolicy";

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
  if (requestExceedsBodyLimit(request, 15_000_000)) {
    return NextResponse.json({ error: "Datele pentru mostră sunt prea mari." }, { status: 413 });
  }

  const allowance = () => checkRateLimit(request, "album-preview", { windowMs: 86_400_000, maxRequests: previewLimit(), readOnly: true });
  const attempts = checkRateLimit(request, "album-preview-requests", { windowMs: 3_600_000, maxRequests: 12 });
  if (!attempts.allowed) {
    logAlbumPreviewFailure(startedAt, "rate_limited");
    return NextResponse.json(
      { error: "Au fost prea multe cereri într-un interval scurt. Ia o pauză înainte de o nouă încercare. Mostrele păstrate rămân disponibile.", maxAttempts: previewLimit(), remaining: allowance().remaining },
      { status: 429, headers: { "Retry-After": String(attempts.retryAfterSeconds) } },
    );
  }
  if (!(await verifyTurnstileRequest(request, "album_preview"))) return turnstileRejected();

  if (!isOrderStoreConfigured() || !process.env.VERTEX_AI_PROJECT_ID?.trim()) {
    logAlbumPreviewFailure(startedAt, "configuration");
    return NextResponse.json({ error: "Mostra personalizată nu este disponibilă momentan." }, { status: 503 });
  }

  let reservation: ReturnType<typeof reserveRateLimit> | undefined;
  let incidentId: string = randomUUID();
  try {
    const body = await readLimitedJson(request, 15_000_000);
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
    let characterProof;
    if (wantsPhoto) {
      try { characterProof = verifyCharacterProof(body.characterToken, body.referenceImageDataUrl, body.characterImageDataUrl); }
      catch { return NextResponse.json({ error: "Confirmă mai întâi personajul ilustrat din fotografie." }, { status: 400 }); }
      if (characterProof.kind !== "character" || characterProof.style !== configuration.generation.artStyle) return NextResponse.json({ error: "Stilul s-a schimbat. Confirmă personajul în stilul ales." }, { status: 400 });
      Object.assign(configuration.generation, characterProof.traits);
    }
    const kitProofs: Array<{ product: string; proof: ReturnType<typeof verifyCharacterProof>; image: string }> = [];
    if (bundle) for (const item of bundle.filter(i => i.product !== "album")) {
      delete item.configuration.referenceCharacter;
      const input = readKitInput(item.configuration.generation);
      if (!input || input.type !== item.product) return NextResponse.json({ error: "Verifică detaliile materialelor din pachet." }, { status: 400 });
      if (input.referenceMode === "photo") {
        const selected = (body.kitCharacters as Record<string, unknown> | undefined)?.[item.product];
        try {
          const ref = selected === "album" ? body : selected as Record<string, unknown>;
          if (!ref || ref.photoConsent !== true || typeof ref.characterImageDataUrl !== "string") throw new Error("missing_photo_consent");
          if (selected === "album" && (input.name !== configuration.generation.name || input.age !== configuration.generation.age)) throw new Error("different_child");
          const proof = verifyCharacterProof(ref.characterToken, ref.referenceImageDataUrl, ref.characterImageDataUrl);
          if (proof.kind !== "character") throw new Error("character_confirmation_required");
          input.appearance = describePhotoTraits(proof.traits).slice(0, 240);
          kitProofs.push({ product: item.product, proof, image: ref.characterImageDataUrl });
        } catch { return NextResponse.json({ error: "Confirmă personajul pentru fiecare material din pachet." }, { status: 400 }); }
      }
      item.configuration.generation = input;
    }
    reservation = reserveRateLimit(request, "album-preview", { windowMs: 86_400_000, maxRequests: previewLimit() });
    if (!reservation.allowed) {
      logAlbumPreviewFailure(startedAt, "rate_limited");
      return NextResponse.json({ error: "Ai folosit variantele disponibile în acest interval de 24 de ore. Alege o mostră păstrată sau revino după resetarea limitei.", maxAttempts: previewLimit(), remaining: 0 }, {
        status: 429, headers: { "Retry-After": String(reservation.retryAfterSeconds) },
      });
    }
    const consent = { confirmedAt: new Date().toISOString(), policyVersion: "2026-09-04" };
    const storedAlbumConfiguration = wantsPhoto ? { ...configuration, referencePhotoConsent: consent } : configuration;
    const storedConfiguration = isCompleteBundle && bundle
      ? { items: bundle.map((item) => item.product === "album" ? { ...item, configuration: storedAlbumConfiguration } : item) }
      : storedAlbumConfiguration;
    const order = await createOrder(isCompleteBundle ? "complete-bundle" : "illustrated-album-digital", storedConfiguration as unknown as Record<string, unknown>);
    incidentId = order.id;
    const sourceReference = sanitizedReference ? await saveOrderCover(order.id, sanitizedReference.dataUrl, "album-parent-reference") : undefined;
    const characterReference = characterProof ? await saveOrderCover(order.id, body.characterImageDataUrl as string, "album-character-reference") : undefined;
    if (bundle && kitProofs.length) {
      for (const item of kitProofs) {
        const objectName = await saveOrderCover(order.id, item.image, `kit-${item.product}-character-reference`);
        const configuration = bundle.find(i => i.product === item.product)!.configuration;
        configuration.referenceCharacter = { objectName, model: item.proof.model, traits: item.proof.traits, consentAt: consent.confirmedAt };
      }
      await setOrderStatus(order, "draft", { configuration: { items: bundle.map(item => item.product === "album" ? { ...item, configuration: storedAlbumConfiguration } : item) } });
    }
    logTelemetry("pmm_album_preview_started", { product: "album", result: "success", albumStage: "cover" });
    const title = albumPreviewTitle(configuration.generation);
    const output: AlbumOrderOutput = { kind: "illustrated-album", previewTitle: title,
      assets: { ...(sourceReference ? { sourceReference } : {}), ...(characterReference ? { characterReference } : {}), scenes: Array.from({ length: 13 }, () => "") },
      imageModels: [], ...(characterProof ? { preferredImageModel: characterProof.model } : {}), quality: [], budget: createAlbumBudget(), progress: { stage: "cover", current: 0, total: 13 } };
    const storedOutput = isCompleteBundle ? { items: [{ product: "album", output }] } : output;
    await setOrderStatus(order, "draft", { output: storedOutput });
    await enqueueOrderPreview(order.id, siteUrl);
    const token = createDeliveryToken(order.id, 1);
    const query = new URLSearchParams({ order: order.id, token, ...(isCompleteBundle ? { item: "album" } : {}) });
    const statusQuery = new URLSearchParams(query);
    statusQuery.set("view", "status");

    return NextResponse.json({
      orderId: order.id,
      previewUrl: `/api/album-preview?${query.toString()}`,
      statusUrl: `/api/album-preview?${statusQuery.toString()}`,
      title,
      coverReady: false,
      qualityChecked: false,
      maxAttempts: previewLimit(),
      remaining: allowance().remaining,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    reservation?.release();
    if (error instanceof Error && error.message === "request_too_large") return NextResponse.json({ error: "Datele fotografiei sunt prea mari." }, { status: 413 });
    console.error("Album preview generation failed", error);
    const failure = previewFailureResponse(error);
    await notifyGenerationFailure(incidentId, "album", "preview_cover", error);
    logAlbumPreviewFailure(startedAt, failure.code);
    return NextResponse.json({ error: failure.error, code: failure.code, maxAttempts: previewLimit(), remaining: allowance().remaining }, {
      status: failure.status,
      headers: { "Cache-Control": "no-store", ...(failure.retryAfterSeconds ? { "Retry-After": String(failure.retryAfterSeconds) } : {}) },
    });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("view") === "limits") {
    const limit = checkRateLimit(request, "album-preview", { windowMs: 86_400_000, maxRequests: previewLimit(), readOnly: true });
    return NextResponse.json({ maxAttempts: previewLimit(), remaining: limit.remaining, retryAfterSeconds: limit.retryAfterSeconds }, { headers: { "Cache-Control": "private, no-store" } });
  }
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
    if (!order || !["draft", "pending_payment", "failed"].includes(order.status) || !output) {
      return NextResponse.json({ error: "Mostra nu mai este disponibilă." }, { status: 404 });
    }

    if (url.searchParams.get("view") === "status") {
      const ready = isAlbumPreviewReady(output);
      const jobFailed = order.previewJob?.errorCode;
      if (order.status === "failed" || (jobFailed && !ready)) {
        const canResume = order.status !== "failed" && (order.previewJob?.attempts || 0) < 4 && ["provider_busy", "provider_timeout", "provider_unavailable", "quality_unavailable", "generation_failed"].includes(jobFailed || "");
        const failure = previewFailureResponse(new Error(jobFailed || "generation_failed"));
        return NextResponse.json({ status: "failed", canResume, error: canResume ? `${failure.error} Poți relua aceeași mostră fără să regenerezi paginile finalizate.` : failure.error }, { headers: { "Cache-Control": "private, no-store" } });
      }
      if (!ready) {
        return NextResponse.json({
          status: "processing",
          progress: Math.min(2, output.assets.scenes.slice(0, 2).filter(Boolean).length),
          total: 2,
          coverReady: Boolean(output.assets.cover),
          title: output.plan?.title || output.previewTitle,
          stage: output.progress.stage,
          canResume: Boolean(order.previewJob && Date.parse(order.previewJob.leaseUntil || "") <= Date.now()),
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

export async function PATCH(request: Request) {
  const limit = checkRateLimit(request, "album-preview-resume", { windowMs: 3_600_000, maxRequests: 10 });
  if (!limit.allowed) return NextResponse.json({ error: "Așteaptă puțin înainte să reiei mostra." }, { status: 429 });
  const url = new URL(request.url), orderId = url.searchParams.get("order") || "", token = url.searchParams.get("token") || "";
  if (!isValidDeliveryToken(orderId, token)) return NextResponse.json({ error: "Linkul mostrei nu mai este valid." }, { status: 404 });
  const order = await getOrder(orderId);
  if (!order || !["draft", "pending_payment"].includes(order.status) || (order.previewJob?.attempts || 0) >= 4) return NextResponse.json({ error: "Mostra nu mai poate fi reluată. Poți alege alta dintre variantele păstrate." }, { status: 409 });
  if (order.previewJob?.errorCode && !["provider_busy", "provider_timeout", "provider_unavailable", "quality_unavailable", "generation_failed"].includes(order.previewJob.errorCode)) return NextResponse.json({ error: "Revizuiește detaliile și creează o variantă nouă." }, { status: 409 });
  if (!(Date.parse(order.previewJob?.leaseUntil || "") > Date.now())) await enqueueOrderPreview(order.id, siteUrl, true);
  return NextResponse.json({ resumed: true }, { headers: { "Cache-Control": "no-store" } });
}
