import { NextResponse } from "next/server";
import { readOrderFile } from "@/lib/orders";
import { getReview } from "@/lib/reviews";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = await params;
  const asset = new URL(request.url).searchParams.get("asset");
  const review = await getReview(reviewId);
  if (!review || review.moderationStatus !== "approved" || !review.consentToPublish) return NextResponse.json({ error: "Media indisponibilă." }, { status: 404 });
  const objectName = asset === "photo" ? review.photoObjectName : asset === "video" ? review.videoObjectName : undefined;
  if (!objectName) return NextResponse.json({ error: "Media indisponibilă." }, { status: 404 });
  const file = await readOrderFile(objectName);
  return new Response(new Uint8Array(file.buffer), {
    headers: { "Content-Type": file.contentType, "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" },
  });
}
