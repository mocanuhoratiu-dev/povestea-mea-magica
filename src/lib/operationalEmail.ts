import type { OrderProduct, OrderStatus } from "@/lib/orders";
import type { OrderRecoveryStage } from "@/lib/orderWatchdog";
import { createWatchdogEmailHtml } from "./emailAdminTemplates.ts";

const productLabels: Record<OrderProduct, string> = {
  story: "Poveste",
  monster: "Atelierul Scutului Magic",
  emergency: "Dosarul Micului Explorator",
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
      html: createWatchdogEmailHtml({ reason, staleMinutes, consoleUrl, rows: [["Comandă", orderId], ["Produs", productLabel], ["Stare", status], ["Etapă", stageLabel], ["Cod", code]] }),
      text: `O comandă are nevoie de verificare.\n\n${reason}\n\nComandă: ${orderId}\nProdus: ${productLabel}\nStare: ${status}\nEtapă: ${stageLabel}\nRecuperări automate: ${recoveryCount}\nFără progres: aproximativ ${Math.max(0, staleMinutes)} minute\nCod: ${code}\n\nLoguri: ${consoleUrl}`,
    }),
  });

  const payload = await response.json().catch(() => ({})) as { id?: string };
  if (!response.ok) throw new Error(`watchdog_alert_${response.status}`);
  return payload.id?.trim().slice(0, 160) || "accepted";
}
