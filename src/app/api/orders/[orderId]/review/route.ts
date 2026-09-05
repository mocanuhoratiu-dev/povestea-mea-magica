import { NextResponse } from "next/server";
import { getOrder, isValidDeliveryToken, saveOrderFile } from "@/lib/orders";
import { checkRateLimit, requestExceedsBodyLimit } from "@/lib/requestProtection";
import { createVerifiedReview, isReviewMediaAllowed, reviewDraftError } from "@/lib/reviews";
import { logTelemetry } from "@/lib/telemetry";

export const runtime = "nodejs";

function cleanText(value: FormDataEntryValue | null, max: number) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

async function readOptionalFile(value: FormDataEntryValue | null, kind: "photo" | "video") {
  if (!(value instanceof File) || value.size === 0) return null;
  if (!isReviewMediaAllowed(kind, value.type, value.size)) throw new Error("invalid_media");
  return { buffer: Buffer.from(await value.arrayBuffer()), mimeType: value.type };
}

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  if (requestExceedsBodyLimit(request, 28_000_000)) return NextResponse.json({ error: "Fișierele depășesc limita de 28 MB." }, { status: 413 });
  const rateLimit = checkRateLimit(request, "verified-review", { windowMs: 24 * 60 * 60 * 1000, maxRequests: 4 });
  if (!rateLimit.allowed) return NextResponse.json({ error: "Recenzia a fost deja înregistrată sau limita a fost atinsă." }, { status: 429 });

  const { orderId } = await params;
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!isValidDeliveryToken(orderId, token)) return NextResponse.json({ error: "Linkul comenzii nu mai este valid." }, { status: 403 });

  try {
    const order = await getOrder(orderId);
    if (!order || order.status !== "delivered") return NextResponse.json({ error: "Recenzia poate fi lăsată după livrarea comenzii." }, { status: 409 });
    const form = await request.formData();
    const rating = Number(form.get("rating"));
    const displayName = cleanText(form.get("displayName"), 50);
    const quote = cleanText(form.get("quote"), 700);
    const consentToPublish = form.get("consentToPublish") === "true";
    const photo = await readOptionalFile(form.get("photo"), "photo");
    const video = await readOptionalFile(form.get("video"), "video");
    const validationError = reviewDraftError({ rating, displayName, quote, consentToPublish, hasPhoto: Boolean(photo), hasVideo: Boolean(video) });
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const [photoObjectName, videoObjectName] = await Promise.all([
      photo ? saveOrderFile(orderId, photo.buffer, "review-photo", photo.mimeType) : Promise.resolve(undefined),
      video ? saveOrderFile(orderId, video.buffer, "review-video", video.mimeType) : Promise.resolve(undefined),
    ]);
    await createVerifiedReview({
      id: orderId,
      orderId,
      product: order.product,
      rating,
      displayName: displayName || "Părinte",
      quote,
      consentToPublish,
      verifiedOrder: true,
      moderationStatus: "pending",
      ...(photoObjectName ? { photoObjectName } : {}),
      ...(videoObjectName ? { videoObjectName } : {}),
      createdAt: new Date().toISOString(),
    });
    logTelemetry("pmm_verified_review_submitted", { product: order.product, result: "success", reviewRating: rating, mediaAttached: Boolean(photo || video) });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "invalid_media") return NextResponse.json({ error: "Fotografia sau clipul nu are un format acceptat ori este prea mare." }, { status: 400 });
    if (error instanceof Error && error.message === "review_exists") return NextResponse.json({ error: "Recenzia acestei comenzi a fost deja trimisă. Mulțumim!" }, { status: 409 });
    console.error("Verified review submission failed", error);
    logTelemetry("pmm_verified_review_failed", { result: "error", errorCode: "unknown" });
    return NextResponse.json({ error: "Recenzia nu a putut fi trimisă acum." }, { status: 500 });
  }
}
