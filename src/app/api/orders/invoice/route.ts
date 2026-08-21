import { NextResponse } from "next/server";
import { checkoutCatalog } from "@/lib/catalog";
import { getOrder, updateOrderInvoice, verifyTaskIdentity } from "@/lib/orders";
import { issueSmartBillInvoice, SmartBillError, validateSmartBillEnvironment } from "@/lib/smartbill";
import { siteUrl } from "@/lib/siteMode";
import { getStripe } from "@/lib/stripe";
import { logTelemetry } from "@/lib/telemetry";

export const runtime = "nodejs";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] || character);
}

async function sendInvoiceEmail({
  email,
  orderId,
  series,
  number,
  documentUrl,
}: {
  email: string;
  orderId: string;
  series: string;
  number: string;
  documentUrl: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) return;
  const replyTo = process.env.EMAIL_REPLY_TO?.trim();
  const safeSeries = escapeHtml(series);
  const safeNumber = escapeHtml(number);
  const safeDocumentUrl = escapeHtml(documentUrl);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `pmm-invoice-${orderId}`,
    },
    body: JSON.stringify({
      from: `Povestea Mea Magică <${from}>`,
      to: [email],
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject: `Factura ${series} ${number} - Povestea Mea Magică`,
      html: `<!doctype html><html lang="ro"><body style="margin:0;padding:0;background:#f3eee4;color:#24324f;font-family:Arial,Helvetica,sans-serif;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f3eee4;"><tr><td align="center" style="padding:32px 16px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#fffdf8;border:1px solid #e5b84f;"><tr><td style="height:5px;background:#e5b84f;font-size:0;line-height:0;">&nbsp;</td></tr><tr><td style="padding:28px 34px;background:#24324f;text-align:center;"><img src="${siteUrl}/icon.png" width="52" height="52" alt="Povestea Mea Magică" style="display:block;margin:0 auto 12px;border:0;border-radius:8px;"><p style="margin:0;color:#f7edcf;font-size:12px;font-weight:700;letter-spacing:1.5px;line-height:18px;text-transform:uppercase;">Povestea Mea Magică</p></td></tr><tr><td style="padding:34px;text-align:center;"><h1 style="margin:0 0 16px;color:#24324f;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;line-height:36px;">Factura ta este pregătită</h1><p style="margin:0 0 24px;color:#4c5a72;font-size:15px;line-height:24px;">Îți mulțumim. Factura ${safeSeries} ${safeNumber} poate fi deschisă și descărcată de mai jos.</p><a href="${safeDocumentUrl}" style="display:inline-block;background:#8b5daf;color:#fff;font-size:14px;font-weight:700;line-height:20px;padding:13px 22px;text-decoration:none;border-radius:6px;">Deschide factura</a></td></tr><tr><td style="padding:20px 30px;background:#efe6d5;text-align:center;"><p style="margin:0;color:#61708a;font-size:11px;line-height:17px;">Acesta este un mesaj tranzacțional pentru comanda ta.</p></td></tr></table></td></tr></table></body></html>`,
      text: `Factura ${series} ${number} este pregătită.\n\nDeschide factura: ${documentUrl}\n\nPovestea Mea Magică`,
    }),
  });
  if (!response.ok) throw new Error(`Invoice email delivery failed (${response.status}).`);
}

function invoiceTimestamp() {
  return new Date().toISOString();
}

export async function POST(request: Request) {
  if (!await verifyTaskIdentity(request, siteUrl)) {
    return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  }

  const { orderId } = await request.json() as { orderId?: string };
  let order = orderId ? await getOrder(orderId) : null;
  if (!order) return NextResponse.json({ error: "Comanda nu a fost gasita." }, { status: 404 });
  if (order.invoiceStatus === "issued" || order.invoiceStatus === "not_required") {
    return NextResponse.json({ success: true });
  }
  if (order.invoiceStatus === "issuing") {
    const claimAge = Date.now() - Date.parse(order.invoiceUpdatedAt || "");
    if (Number.isFinite(claimAge) && claimAge > 2 * 60 * 1000) {
      await updateOrderInvoice(order.id, {
        invoiceStatus: "needs_review",
        invoiceErrorCode: "stale_invoice_claim",
        invoiceUpdatedAt: invoiceTimestamp(),
      }, ["issuing"]);
      logTelemetry("pmm_invoice_needs_review", { product: order.product, result: "error", errorCode: "unknown" });
      return NextResponse.json({ success: false, reviewRequired: true });
    }
    return NextResponse.json({ success: false, processing: true });
  }
  if (order.invoiceStatus === "needs_review" || order.invoiceStatus === "failed") {
    return NextResponse.json({ success: false, reviewRequired: order.invoiceStatus === "needs_review" });
  }
  if (!order.stripeSessionId || !["paid", "processing", "delivered"].includes(order.status)) {
    return NextResponse.json({ error: "Comanda nu este gata de facturare." }, { status: 409 });
  }

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe nu este configurat." }, { status: 503 });

  try {
    const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
    if (session.metadata?.order_id !== order.id || session.payment_status !== "paid") {
      throw new SmartBillError("Sesiunea Stripe nu confirma plata comenzii.", "definite", "stripe_session_mismatch");
    }
    if (session.amount_total === 0) {
      await updateOrderInvoice(order.id, {
        invoiceStatus: "not_required",
        invoiceUpdatedAt: invoiceTimestamp(),
      }, ["pending", undefined]);
      return NextResponse.json({ success: true, invoiceRequired: false });
    }

    const environment = validateSmartBillEnvironment(session.livemode);
    if (!environment.ok) {
      throw new SmartBillError("Mediul SmartBill nu corespunde platii Stripe.", "definite", environment.reason);
    }

    const claim = await updateOrderInvoice(order.id, {
      stripeLivemode: session.livemode,
      invoiceStatus: "issuing",
      invoiceErrorCode: "",
      invoiceUpdatedAt: invoiceTimestamp(),
    }, ["pending", undefined]);
    if (!claim.updated) return NextResponse.json({ success: claim.order.invoiceStatus === "issued" });
    order = claim.order;
    logTelemetry("pmm_invoice_started", { product: order.product, result: "pending" });

    const invoice = await issueSmartBillInvoice({
      orderId: order.id,
      stripeSession: session,
      product: checkoutCatalog[order.productId],
    });

    // Once SmartBill confirms a number, never retry invoice creation. A failed
    // Firestore checkpoint is a manual-reconciliation case, not a safe retry.
    let issued;
    try {
      const checkpoint = await updateOrderInvoice(order.id, {
        invoiceStatus: "issued",
        invoiceSeries: invoice.series,
        invoiceNumber: invoice.number,
        invoiceDocumentUrl: invoice.documentViewUrl || "",
        invoiceErrorCode: "",
        invoiceUpdatedAt: invoiceTimestamp(),
      }, ["issuing"]);
      issued = checkpoint.order;
    } catch (checkpointError) {
      console.error("SmartBill invoice was issued but the order checkpoint failed", checkpointError);
      logTelemetry("pmm_invoice_needs_review", { product: order.product, result: "error", errorCode: "unknown" });
      return NextResponse.json({ success: false, reviewRequired: true });
    }
    if (!issued || issued.invoiceStatus !== "issued") throw new Error("Factura emisa nu a putut fi salvata pe comanda.");

    if (invoice.documentViewUrl && issued.customerEmail) {
      try {
        await sendInvoiceEmail({
          email: issued.customerEmail,
          orderId: issued.id,
          series: invoice.series,
          number: invoice.number,
          documentUrl: invoice.documentViewUrl,
        });
      } catch (emailError) {
        console.error("Invoice email delivery failed", emailError);
      }
    }

    logTelemetry("pmm_invoice_completed", { product: issued.product, result: "success" });
    return NextResponse.json({ success: true });
  } catch (error) {
    const smartBillError = error instanceof SmartBillError ? error : null;
    const invoiceStatus = smartBillError?.certainty === "uncertain" ? "needs_review" : "failed";
    const code = smartBillError?.code || "unknown";
    console.error("Order invoicing failed", { code, certainty: smartBillError?.certainty || "definite" });
    try {
      await updateOrderInvoice(order.id, {
        invoiceStatus,
        invoiceErrorCode: code,
        invoiceUpdatedAt: invoiceTimestamp(),
      }, ["issuing", "pending", undefined]);
    } catch (checkpointError) {
      console.error("Invoice failure checkpoint failed", checkpointError);
    }
    logTelemetry(invoiceStatus === "needs_review" ? "pmm_invoice_needs_review" : "pmm_invoice_failed", {
      product: order.product,
      result: "error",
      errorCode: code === "test_live_mismatch" || code === "live_test_mismatch" || code === "smartbill_not_configured" ? "configuration" : "unknown",
    });

    // A retry after an ambiguous SmartBill response can create a duplicate
    // invoice. The order is surfaced for manual review instead.
    return NextResponse.json({ success: false, reviewRequired: invoiceStatus === "needs_review" });
  }
}
