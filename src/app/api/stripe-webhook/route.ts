import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { logTelemetry } from "@/lib/telemetry";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const stripe = getStripe();

  if (!signature || !webhookSecret || !stripe) {
    return NextResponse.json({ error: "Webhook Stripe neconfigurat." }, { status: 503 });
  }

  const body = await request.text();
  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Semnatura webhook invalida." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      // Fulfillment will be attached to the durable order store before payments
      // are enabled. This endpoint must remain idempotent when that happens.
      logTelemetry("pmm_checkout_completed", { result: "success" });
      break;
    }
    case "checkout.session.async_payment_failed":
      logTelemetry("pmm_checkout_failed", { result: "error", errorCode: "unknown" });
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
