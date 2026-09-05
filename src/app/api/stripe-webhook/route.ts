import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { logTelemetry } from "@/lib/telemetry";
import { enqueueOrderInvoicing, enqueueOrderProcessing, getOrder, setOrderStatus } from "@/lib/orders";
import { isSmartBillConfigured } from "@/lib/smartbill";
import { siteUrl } from "@/lib/siteMode";
import { commercialProductFromMetadata, commercialTelemetryFields } from "@/lib/commercialTelemetry";
import type Stripe from "stripe";

export const runtime = "nodejs";

async function sessionForCommercialTelemetry(stripe: Stripe, session: Stripe.Checkout.Session) {
  if ((session.total_details?.amount_discount || 0) <= 0) return session;
  try {
    return await stripe.checkout.sessions.retrieve(session.id, { expand: ["discounts.promotion_code"] });
  } catch {
    console.warn("Stripe promotion details could not be expanded for telemetry");
    return session;
  }
}

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
      const metadataProduct = commercialProductFromMetadata(session.metadata);
      const basicCommercialFields = commercialTelemetryFields(session);
      const paymentConfirmed =
        event.type === "checkout.session.async_payment_succeeded"
        || session.payment_status === "paid"
        || session.payment_status === "no_payment_required";
      if (!paymentConfirmed) {
        logTelemetry("pmm_checkout_awaiting_payment", { product: metadataProduct, result: "pending", ...basicCommercialFields });
        return NextResponse.json({ received: true });
      }
      if (session.consent?.terms_of_service !== "accepted") {
        console.error("Stripe Checkout completed without terms consent", event.id);
        return NextResponse.json({ error: "Consimtamantul pentru livrarea digitala lipseste." }, { status: 409 });
      }
      const orderId = session.metadata?.order_id;
      const order = orderId ? await getOrder(orderId) : null;
      if (!order) {
        console.error("Stripe event did not match an order", event.id);
        return NextResponse.json({ error: "Comanda nu a fost gasita." }, { status: 409 });
      }
      const firstCompletion = ["draft", "pending_payment"].includes(order.status);
      const commercialSession = firstCompletion
        ? await sessionForCommercialTelemetry(stripe, session)
        : session;
      const commercialFields = commercialTelemetryFields(commercialSession);
      const invoiceRequired = isSmartBillConfigured() && typeof session.amount_total === "number" && session.amount_total > 0;
      const nextStatus = ["draft", "pending_payment"].includes(order.status) ? "paid" : order.status;
      const paidOrder = await setOrderStatus(order, nextStatus, {
        customerEmail: session.customer_details?.email || order.customerEmail,
        expiresAt: new Date(Date.now() + 31 * 86_400_000).toISOString(),
        stripeSessionId: session.id,
        stripeLivemode: session.livemode,
        invoiceStatus: order.invoiceStatus || (invoiceRequired ? "pending" : "not_required"),
        invoiceUpdatedAt: order.invoiceUpdatedAt || new Date().toISOString(),
      });
      if (!paidOrder) return NextResponse.json({ error: "Comanda nu a putut fi actualizata." }, { status: 409 });
      if (paidOrder.status !== "delivered") await enqueueOrderProcessing(order.id, siteUrl);
      if (paidOrder.invoiceStatus === "pending") await enqueueOrderInvoicing(order.id, siteUrl);
      if (firstCompletion) {
        logTelemetry("pmm_checkout_completed", { product: order.product, result: "success", ...commercialFields });
        logTelemetry("pmm_conversion_completed", { product: order.product, result: "success", ...commercialFields });
        if (session.payment_status === "paid" || event.type === "checkout.session.async_payment_succeeded") {
          logTelemetry("pmm_payment_succeeded", { product: order.product, result: "success", ...commercialFields });
        }
        if ((commercialFields.discountAmountMinor || 0) > 0) {
          logTelemetry("pmm_promotion_applied", { product: order.product, result: "success", ...commercialFields });
        }
      }
      break;
    }
    case "checkout.session.async_payment_failed": {
      const session = event.data.object;
      logTelemetry("pmm_checkout_failed", {
        product: commercialProductFromMetadata(session.metadata),
        result: "error",
        errorCode: "payment_failed",
        ...commercialTelemetryFields(session),
      });
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      logTelemetry("pmm_payment_failed", {
        product: commercialProductFromMetadata(paymentIntent.metadata),
        result: "error",
        errorCode: "payment_failed",
        amountMinor: paymentIntent.amount,
        currency: paymentIntent.currency,
        liveMode: event.livemode,
      });
      break;
    }
    case "checkout.session.expired": {
      const session = event.data.object;
      logTelemetry("pmm_checkout_expired", {
        product: commercialProductFromMetadata(session.metadata),
        result: "rejected",
        errorCode: "checkout_expired",
        ...commercialTelemetryFields(session),
      });
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
