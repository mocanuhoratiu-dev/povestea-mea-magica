import { NextResponse } from "next/server";
import { checkRateLimit, requestExceedsBodyLimit } from "@/lib/requestProtection";
import { logTelemetry, type TelemetryProduct } from "@/lib/telemetry";

const PRODUCTS: Record<TelemetryProduct, { name: string; eyebrow: string; title: string; message: string }> = {
  story: {
    name: "Povestea de Seară",
    eyebrow: "Lanterna a aprins o poveste",
    title: "Povestea voastră este gata",
    message: "Am așezat aventura în PDF-ul atașat. Păstrați-l pentru seara în care vreți să mai deschideți o lume împreună.",
  },
  monster: {
    name: "Scutul de Noapte",
    eyebrow: "Lanterna pregătește seara",
    title: "Scutul vostru este gata",
    message: "Ritualul de seară este în PDF-ul atașat, pregătit pentru un moment mic de curaj, făcut împreună.",
  },
  emergency: {
    name: "Trusa de Răbdare",
    eyebrow: "Lanterna a pregătit o misiune",
    title: "Trusa voastră este gata",
    message: "Misiunile de răbdare sunt în PDF-ul atașat, gata să transforme următoarea așteptare într-un timp al vostru.",
  },
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

function readChildName(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/[^\p{L}\p{M}\s'-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 40);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] || character);
}

function createEmailHtml({ productInfo, childName, siteUrl }: { productInfo: (typeof PRODUCTS)[TelemetryProduct]; childName: string; siteUrl: string }) {
  const safeName = escapeHtml(childName);
  const salutation = safeName ? `Pentru ${safeName}` : "Pentru voi";
  const markUrl = `${siteUrl}/icon.png`;

  return `<!doctype html>
<html lang="ro">
  <body style="margin:0;padding:0;background:#f3eee4;color:#24324f;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f3eee4;">
      <tr><td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#fffdf8;border:1px solid #e5b84f;">
          <tr><td style="height:5px;background:#e5b84f;font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr>
            <td style="padding:28px 34px 22px;background:#24324f;text-align:center;">
              <img src="${markUrl}" width="50" height="50" alt="Povestea Mea Magică" style="display:block;margin:0 auto 12px;border:0;" />
              <p style="margin:0;color:#f7edcf;font-size:12px;font-weight:700;letter-spacing:1.5px;line-height:18px;text-transform:uppercase;">Povestea Mea Magică</p>
              <p style="margin:5px 0 0;color:#e5b84f;font-size:11px;letter-spacing:1.2px;line-height:16px;text-transform:uppercase;">${productInfo.eyebrow}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:34px 34px 18px;text-align:center;">
              <p style="margin:0 0 9px;color:#8b5daf;font-size:12px;font-weight:700;letter-spacing:1.4px;line-height:18px;text-transform:uppercase;">${salutation}</p>
              <h1 style="margin:0;color:#24324f;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:400;line-height:38px;">${productInfo.title}</h1>
              <div style="width:42px;height:2px;margin:20px auto;background:#e5b84f;line-height:2px;font-size:0;">&nbsp;</div>
              <p style="margin:0;color:#4c5a72;font-size:16px;line-height:26px;">${productInfo.message}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 34px 34px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f8f1df;border:1px solid #ead8a4;">
                <tr>
                  <td style="padding:18px 20px;text-align:center;">
                    <p style="margin:0 0 5px;color:#24324f;font-size:15px;font-weight:700;line-height:22px;">PDF-ul este atașat acestui email.</p>
                    <p style="margin:0;color:#61708a;font-size:13px;line-height:20px;">Îl poți citi, păstra sau printa când vă este bine.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 34px 30px;text-align:center;">
              <a href="${siteUrl}" style="display:inline-block;background:#8b5daf;color:#ffffff;font-size:13px;font-weight:700;line-height:18px;padding:12px 20px;text-decoration:none;">Înapoi la Lanternă</a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 30px;background:#efe6d5;text-align:center;">
              <p style="margin:0;color:#61708a;font-size:11px;line-height:17px;">Ai primit acest email pentru a primi materialul pe care tocmai l-ai creat. Nu trimitem newslettere fără acordul tău.</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
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
    const childName = readChildName(body.childName);
    const replyTo = process.env.EMAIL_REPLY_TO?.trim();
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.povestea-mea-magica.ro").replace(/\/+$/, "");
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
        subject: childName ? `${productInfo.name} pentru ${childName} este gata` : productInfo.title,
        html: createEmailHtml({ productInfo, childName, siteUrl }),
        text: `${childName ? `Pentru ${childName}\n\n` : ""}${productInfo.title}\n\n${productInfo.message}\n\nPDF-ul este atașat acestui email.\n\nPovestea Mea Magică\n${siteUrl}`,
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
