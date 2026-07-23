import { NextResponse } from "next/server";
import { checkRateLimit, requestExceedsBodyLimit } from "@/lib/requestProtection";
import { logTelemetry, type TelemetryProduct } from "@/lib/telemetry";

const PRODUCTS: Record<TelemetryProduct, { name: string; subject: string }> = {
  story: { name: "Povestea de Seară", subject: "Povestea voastră este gata" },
  monster: { name: "Scutul de Noapte", subject: "Scutul vostru este gata" },
  emergency: { name: "Trusa de Răbdare", subject: "Trusa voastră este gata" },
};

const MAX_PDF_BYTES = 9 * 1024 * 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readEmail(value: unknown) {
  if (typeof value !== "string") return "";
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL_PATTERN.test(email) ? email : "";
}

function readPdf(value: unknown) {
  if (typeof value !== "string" || value.length < 20 || value.length > Math.ceil(MAX_PDF_BYTES * 1.37)) return null;
  if (!/^[A-Za-z0-9+/=]+$/.test(value)) return null;

  const file = Buffer.from(value, "base64");
  return file.length > 4 && file.length <= MAX_PDF_BYTES && file.subarray(0, 4).toString("ascii") === "%PDF" ? file : null;
}

function readFilename(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const filename = value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  return filename.endsWith(".pdf") ? filename : fallback;
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  let product: TelemetryProduct | undefined;

  if (requestExceedsBodyLimit(request, Math.ceil(MAX_PDF_BYTES * 1.4))) {
    return NextResponse.json({ error: "PDF-ul este prea mare pentru livrarea pe email." }, { status: 413 });
  }

  const limit = checkRateLimit(request, "deliver-email", {
    windowMs: Number.parseInt(process.env.EMAIL_DELIVERY_RATE_LIMIT_WINDOW_MS || "3600000", 10) || 3_600_000,
    maxRequests: Number.parseInt(process.env.EMAIL_DELIVERY_RATE_LIMIT_MAX || "4", 10) || 4,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Ai trimis deja câteva PDF-uri. Încearcă din nou puțin mai târziu." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    product = body.product === "story" || body.product === "monster" || body.product === "emergency" ? body.product : undefined;
    const email = readEmail(body.email);
    const pdf = readPdf(body.pdfBase64);

    if (!product || !email || !pdf) {
      return NextResponse.json({ error: "Verifică adresa de email și PDF-ul pregătit." }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY?.trim();
    const fromAddress = process.env.EMAIL_FROM?.trim();
    if (!apiKey || !fromAddress) {
      logTelemetry("pmm_email_delivery_failed", {
        product,
        result: "error",
        errorCode: "configuration",
        durationMs: Date.now() - startedAt,
      });
      return NextResponse.json({ error: "Livrarea pe email este activată foarte curând. Poți descărca PDF-ul acum." }, { status: 503 });
    }

    const productInfo = PRODUCTS[product];
    const filename = readFilename(body.filename, `${product}-povestea-mea-magica.pdf`);
    const replyTo = process.env.EMAIL_REPLY_TO?.trim();
    const idempotencyKey = typeof body.deliveryId === "string" && /^[a-zA-Z0-9_-]{12,100}$/.test(body.deliveryId)
      ? body.deliveryId
      : undefined;

    logTelemetry("pmm_email_delivery_started", { product, result: "success" });
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "Idempotency-Key": `pmm-${idempotencyKey}` } : {}),
      },
      body: JSON.stringify({
        from: `Povestea Mea Magică <${fromAddress}>`,
        to: [email],
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject: productInfo.subject,
        html: `<div style="font-family:Arial,sans-serif;color:#24324f;line-height:1.55"><h1 style="font-size:24px">${productInfo.subject}</h1><p>Am pregătit ${productInfo.name} ca atașament PDF.</p><p>Îl poți citi, păstra sau printa când vă este bine.</p><p>Cu drag,<br><strong>Povestea Mea Magică</strong></p></div>`,
        attachments: [{ filename, content: pdf.toString("base64") }],
      }),
    });

    if (!resendResponse.ok) {
      console.error("Resend delivery failed", resendResponse.status);
      logTelemetry("pmm_email_delivery_failed", {
        product,
        result: "error",
        errorCode: "unknown",
        durationMs: Date.now() - startedAt,
      });
      return NextResponse.json({ error: "Emailul nu a plecat încă. Verifică adresa sau descarcă PDF-ul acum." }, { status: 502 });
    }

    logTelemetry("pmm_email_delivery_completed", {
      product,
      result: "success",
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email delivery request failed", error);
    logTelemetry("pmm_email_delivery_failed", {
      ...(product ? { product } : {}),
      result: "error",
      errorCode: "unknown",
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json({ error: "Emailul nu a putut fi pregătit acum. Descarcă PDF-ul și încearcă din nou mai târziu." }, { status: 500 });
  }
}
