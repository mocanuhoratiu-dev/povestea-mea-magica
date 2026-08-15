import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { logTelemetry } from "@/lib/telemetry";
import { enqueueOrderProcessing, getOrder, setOrderStatus } from "@/lib/orders";
import { siteUrl } from "@/lib/siteMode";

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
      const session = event.data.object;
      const orderId = session.metadata?.order_id;
      const order = orderId ? await getOrder(orderId) : null;
      if (!order) {
        console.error("Stripe event did not match an order", event.id);
        return NextResponse.json({ error: "Comanda nu a fost gasita." }, { status: 409 });
      }
      if (["delivered", "processing"].includes(order.status)) return NextResponse.json({ received: true });
      const paidOrder = await setOrderStatus(order, "paid", { customerEmail: session.customer_details?.email || order.customerEmail });
      if (!paidOrder) return NextResponse.json({ error: "Comanda nu a putut fi actualizata." }, { status: 409 });
      await enqueueOrderProcessing(order.id, siteUrl);
      logTelemetry("pmm_checkout_completed", { product: order.product, result: "success" });
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
