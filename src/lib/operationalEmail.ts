import type { OrderProduct, OrderStatus } from "@/lib/orders";
import type { OrderRecoveryStage } from "@/lib/orderWatchdog";

const productLabels: Record<OrderProduct, string> = {
  story: "Poveste",
  monster: "Scutul de Noapte",
  emergency: "Trusa de Răbdare",
  bundle: "Pachet",
  album: "Povestea Magică",
};

const stageLabels: Record<OrderRecoveryStage, string> = {
  generation: "generarea conținutului",
  rendering: "randarea PDF-urilor",
  audio: "generarea audio",
  email: "trimiterea emailului",
  delivery: "finalizarea livrării",
};

function safeCode(value: string | undefined) {
  return value?.replace(/[^a-zA-Z0-9_.-]/g, "_").slice(0, 100) || "nespecificat";
}

export async function sendOrderWatchdogAlert({
  orderId,
  product,
  status,
  stage,
  recoveryCount,
  staleMinutes,
  errorCode,
}: {
  orderId: string;
  product: OrderProduct;
  status: OrderStatus;
  stage: OrderRecoveryStage;
  recoveryCount: number;
  staleMinutes: number;
  errorCode?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const to = process.env.ORDER_WATCHDOG_ALERT_EMAIL?.trim() || "office@povestea-mea-magica.ro";
  if (!apiKey || !from || !to) throw new Error("watchdog_alert_configuration");

  const replyTo = process.env.EMAIL_REPLY_TO?.trim();
  const code = safeCode(errorCode);
  const productLabel = productLabels[product];
  const stageLabel = stageLabels[stage];
  const reason = errorCode === "budget_limit"
    ? "Comanda a atins limita sigură de cost și nu a fost relansată automat."
    : `Recuperarea automată a fost încercată de ${recoveryCount} ori.`;
  const consoleUrl = "https://console.cloud.google.com/run/detail/europe-west1/povestea-mea-magica-domain/logs?project=project-e0c2efff-d456-48f9-9fe";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `pmm-watchdog-alert-${orderId}`,
    },
    body: JSON.stringify({
      from: `Povestea Mea Magică <${from}>`,
      to: [to],
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject: `Acțiune necesară: comanda ${orderId}`,
      html: `<!doctype html><html lang="ro"><body style="margin:0;padding:0;background:#f3eee4;color:#24324f;font-family:Arial,Helvetica,sans-serif;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f3eee4;"><tr><td align="center" style="padding:32px 16px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#fffdf8;border:1px solid #e5b84f;"><tr><td style="height:5px;background:#e5b84f;font-size:0;line-height:0;">&nbsp;</td></tr><tr><td style="padding:26px 32px;background:#24324f;text-align:center;"><p style="margin:0;color:#f7edcf;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">Povestea Mea Magică · Watchdog</p></td></tr><tr><td style="padding:32px;"><h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:27px;font-weight:400;line-height:35px;">O comandă are nevoie de verificare</h1><p style="margin:0 0 22px;color:#4c5a72;font-size:15px;line-height:24px;">${reason} Comanda nu a progresat de aproximativ ${Math.max(0, staleMinutes)} minute.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8f1df;border:1px solid #ead8a4;"><tr><td style="padding:18px 20px;color:#24324f;font-size:14px;line-height:24px;"><strong>Comandă:</strong> ${orderId}<br><strong>Produs:</strong> ${productLabel}<br><strong>Stare:</strong> ${status}<br><strong>Etapă:</strong> ${stageLabel}<br><strong>Cod:</strong> ${code}</td></tr></table><p style="margin:24px 0 0;text-align:center;"><a href="${consoleUrl}" style="display:inline-block;background:#8b5daf;color:#fff;font-size:14px;font-weight:700;padding:13px 20px;text-decoration:none;border-radius:6px;">Deschide logurile</a></p></td></tr><tr><td style="padding:18px 28px;background:#efe6d5;text-align:center;color:#61708a;font-size:11px;line-height:17px;">Mesaj operațional automat. Nu conține numele copilului, adresa clientului sau conținutul poveștii.</td></tr></table></td></tr></table></body></html>`,
      text: `O comandă are nevoie de verificare.\n\n${reason}\n\nComandă: ${orderId}\nProdus: ${productLabel}\nStare: ${status}\nEtapă: ${stageLabel}\nRecuperări automate: ${recoveryCount}\nFără progres: aproximativ ${Math.max(0, staleMinutes)} minute\nCod: ${code}\n\nLoguri: ${consoleUrl}`,
    }),
  });

  const payload = await response.json().catch(() => ({})) as { id?: string };
  if (!response.ok) throw new Error(`watchdog_alert_${response.status}`);
  return payload.id?.trim().slice(0, 160) || "accepted";
}
