import { NextResponse } from "next/server";
import { listApprovedReviews } from "@/lib/reviews";

export const runtime = "nodejs";

export async function GET() {
  try {
    const reviews = await listApprovedReviews(6);
    return NextResponse.json({ reviews: reviews.map((review) => ({
      id: review.id,
      product: review.product,
      rating: review.rating,
      displayName: review.displayName,
      quote: review.quote,
      verifiedOrder: true,
      hasPhoto: Boolean(review.photoObjectName),
      hasVideo: Boolean(review.videoObjectName),
    })) }, { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } });
  } catch (error) {
    console.error("Public review listing failed", error);
    return NextResponse.json({ reviews: [] }, { headers: { "Cache-Control": "public, s-maxage=60" } });
  }
}
