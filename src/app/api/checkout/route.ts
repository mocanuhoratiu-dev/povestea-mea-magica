import { NextResponse } from "next/server";
import { checkoutCatalog, isCheckoutProductId } from "@/lib/catalog";
import { checkRateLimit, requestExceedsBodyLimit } from "@/lib/requestProtection";
import { commerce, siteUrl } from "@/lib/siteMode";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { logTelemetry } from "@/lib/telemetry";

export const runtime = "nodejs";

const checkoutUnavailable = "Platile online nu sunt active momentan.";

export async function POST(request: Request) {
  if (requestExceedsBodyLimit(request, 2_000)) {
    return NextResponse.json({ error: "Cererea este prea mare." }, { status: 413 });
  }

  const limit = checkRateLimit(request, "checkout", { windowMs: 60 * 60 * 1000, maxRequests: 8 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Ai incercat prea des. Reincearca putin mai tarziu." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  // A payment flow is not safe until the order/fulfillment store is enabled.
  if (!commerce.acceptsPayments || !isStripeConfigured()) {
    return NextResponse.json({ error: checkoutUnavailable }, { status: 503 });
  }

  let productId: unknown;
  try {
    ({ productId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Cererea nu este valida." }, { status: 400 });
  }

  if (!isCheckoutProductId(productId)) {
    return NextResponse.json({ error: "Produsul selectat nu este disponibil." }, { status: 400 });
  }

  const product = checkoutCatalog[productId];
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: checkoutUnavailable }, { status: 503 });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_creation: "always",
      line_items: [{
        quantity: 1,
        price_data: {
          currency: product.currency,
          unit_amount: product.amount,
          product_data: { name: product.name, description: product.description },
        },
      }],
      success_url: `${siteUrl}/comanda-confirmata?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/preturi?plata=anulata`,
      metadata: {
        product_id: product.id,
        catalog_version: "2026-08",
      },
      // No child name, story text or other personalisation is sent to Stripe.
    });

    if (!session.url) throw new Error("Stripe did not return a Checkout URL.");

    logTelemetry("pmm_checkout_started", { product: productId === "night-shield" ? "monster" : productId === "patience-kit" ? "emergency" : "story", result: "success" });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout session failed", error);
    logTelemetry("pmm_checkout_failed", { result: "error", errorCode: "unknown" });
    return NextResponse.json({ error: "Nu am putut deschide plata acum. Reincearca putin mai tarziu." }, { status: 502 });
  }
}
