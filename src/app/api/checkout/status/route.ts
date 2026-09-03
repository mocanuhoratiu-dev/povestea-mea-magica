import { NextResponse } from "next/server";
import { readAlbumOutput } from "@/lib/album/schema";
import { createDeliveryTokenForExpiry, createOrderDeliveryUrl, getOrder } from "@/lib/orders";
import { checkRateLimit } from "@/lib/requestProtection";
import { siteUrl } from "@/lib/siteMode";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const sessionPattern = /^cs_(?:test_|live_)?[a-zA-Z0-9_]{20,200}$/;

export async function GET(request: Request) {
  const limit = checkRateLimit(request, "checkout-status", { windowMs: 60 * 60 * 1000, maxRequests: 240 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Verificarea comenzii a fost făcută prea des." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds), "Cache-Control": "no-store" } },
    );
  }

  const sessionId = new URL(request.url).searchParams.get("session_id") || "";
  const stripe = getStripe();
  if (!stripe || !sessionPattern.test(sessionId)) {
    return NextResponse.json({ error: "Comanda nu poate fi verificată." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = session.metadata?.order_id || "";
    const paymentConfirmed = session.payment_status === "paid" || session.payment_status === "no_payment_required";
    if (!orderId || !paymentConfirmed) {
      return NextResponse.json({ status: "pending_payment" }, { headers: { "Cache-Control": "no-store" } });
    }

    const order = await getOrder(orderId);
    if (!order || order.productId !== session.metadata?.product_id) {
      return NextResponse.json({ error: "Comanda nu a fost găsită." }, { status: 404, headers: { "Cache-Control": "no-store" } });
    }

    const album = order.product === "album" ? readAlbumOutput(order.output) : null;
    const response: Record<string, unknown> = {
      status: order.status,
      product: order.product,
      ...(album?.progress ? { progress: album.progress } : {}),
      delayed: order.status === "processing" && Date.now() - Date.parse(order.updatedAt) > 20 * 60 * 1000,
    };

    if (order.status === "delivered" && order.deliveryExpiresAt) {
      const token = createDeliveryTokenForExpiry(order.id, order.deliveryExpiresAt);
      response.deliveryUrl = createOrderDeliveryUrl(order, token, siteUrl);
    }

    return NextResponse.json(response, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Checkout status lookup failed", error);
    return NextResponse.json({ error: "Comanda nu poate fi verificată acum." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
