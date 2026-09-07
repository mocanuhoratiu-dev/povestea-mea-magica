import { NextResponse } from "next/server";
import { checkoutCatalog, isCheckoutProductId } from "@/lib/catalog";
import { checkRateLimit, requestExceedsBodyLimit } from "@/lib/requestProtection";
import { siteUrl } from "@/lib/siteMode";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

function boundedMetaCookie(value: unknown) {
  return typeof value === "string" && /^fb\.\d+\.[\w.-]{1,110}$/.test(value) ? value : undefined;
}

function clientAddress(request: Request) {
  const addresses = request.headers.get("x-forwarded-for")?.split(",").map((item) => item.trim()).filter(Boolean);
  return request.headers.get("cf-connecting-ip") || addresses?.[0] || request.headers.get("x-real-ip") || undefined;
}

export async function POST(request: Request) {
  if (requestExceedsBodyLimit(request, 1_200)) return NextResponse.json({ error: "Cerere prea mare." }, { status: 413 });
  const limit = checkRateLimit(request, "marketing-conversion", { windowMs: 60 * 60 * 1000, maxRequests: 8 });
  if (!limit.allowed) return new NextResponse(null, { status: 204 });

  const pixelId = (process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || "").trim();
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN?.trim() || "";
  if (!pixelId || !accessToken) return new NextResponse(null, { status: 204 });

  try {
    const payload = await request.json() as Record<string, unknown>;
    if (payload.consent !== true || typeof payload.sessionId !== "string" || typeof payload.eventId !== "string") {
      return NextResponse.json({ error: "Conversie invalidă." }, { status: 400 });
    }
    if (!/^cs_(test_|live_)?[A-Za-z0-9_]{8,180}$/.test(payload.sessionId) || !/^[A-Za-z0-9-]{8,100}$/.test(payload.eventId)) {
      return NextResponse.json({ error: "Identificator invalid." }, { status: 400 });
    }

    const stripe = getStripe();
    if (!stripe) return new NextResponse(null, { status: 204 });
    const session = await stripe.checkout.sessions.retrieve(payload.sessionId);
    const productId = session.metadata?.product_id;
    if (session.payment_status !== "paid" || !isCheckoutProductId(productId)) {
      return NextResponse.json({ error: "Plata nu este confirmată." }, { status: 409 });
    }

    const product = checkoutCatalog[productId];
    const userAgent = request.headers.get("user-agent")?.slice(0, 500);
    const userData = {
      ...(clientAddress(request) ? { client_ip_address: clientAddress(request) } : {}),
      ...(userAgent ? { client_user_agent: userAgent } : {}),
      ...(boundedMetaCookie(payload.fbc) ? { fbc: boundedMetaCookie(payload.fbc) } : {}),
      ...(boundedMetaCookie(payload.fbp) ? { fbp: boundedMetaCookie(payload.fbp) } : {}),
    };
    const body = {
      data: [{
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: payload.eventId,
        action_source: "website",
        event_source_url: `${siteUrl}/comanda-confirmata`,
        user_data: userData,
        custom_data: {
          currency: product.currency.toUpperCase(),
          value: product.amount / 100,
          content_ids: [product.id],
          content_type: "product",
        },
      }],
      ...(process.env.META_CAPI_TEST_EVENT_CODE ? { test_event_code: process.env.META_CAPI_TEST_EVENT_CODE } : {}),
    };
    const apiVersion = process.env.META_CAPI_API_VERSION?.trim() || "v23.0";
    const response = await fetch(`https://graph.facebook.com/${encodeURIComponent(apiVersion)}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      console.error(JSON.stringify({ severity: "ERROR", event: "pmm_meta_capi_failed", status: response.status }));
      return NextResponse.json({ error: "Conversia nu a putut fi raportată." }, { status: 502 });
    }
    console.info(JSON.stringify({ severity: "INFO", event: "pmm_meta_capi_completed", product: product.id, live_mode: session.livemode }));
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Conversie invalidă." }, { status: 400 });
  }
}
