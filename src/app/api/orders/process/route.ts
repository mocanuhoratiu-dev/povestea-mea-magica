import { NextResponse } from "next/server";
import { createDeliveryToken, createDeliveryTokenForExpiry, getOrder, saveOrderCover, setOrderStatus, verifyTaskIdentity } from "@/lib/orders";
import { siteUrl } from "@/lib/siteMode";
import { logTelemetry } from "@/lib/telemetry";

export const runtime = "nodejs";

function workerSecret() {
  return process.env.ORDER_WORKER_SECRET?.trim();
}

async function sendReadyEmail(email: string, product: string, deliveryUrl: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) throw new Error("Emailul transactional nu este configurat.");
  const title = product === "story" ? "Povestea ta este gata" : product === "monster" ? "Scutul de Noapte este gata" : "Trusa de Rabdare este gata";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: `Povestea Mea Magică <${from}>`, to: [email], subject: title, html: `<p>${title}.</p><p><a href="${deliveryUrl}">Deschide materialul tau</a></p><p>Linkul este valabil 30 de zile.</p>`, text: `${title}. Deschide materialul: ${deliveryUrl}` }),
  });
  if (!response.ok) throw new Error(`Email delivery failed (${response.status}).`);
}

export async function POST(request: Request) {
  if (!await verifyTaskIdentity(request, siteUrl)) return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  const secret = workerSecret();
  if (!secret) return NextResponse.json({ error: "Workerul nu este configurat." }, { status: 503 });

  const { orderId } = await request.json() as { orderId?: string };
  const order = orderId ? await getOrder(orderId) : null;
  if (!order) return NextResponse.json({ error: "Comanda nu a fost gasita." }, { status: 404 });
  if (order.status === "delivered") return NextResponse.json({ success: true });
  if (order.status !== "paid" && order.status !== "processing") return NextResponse.json({ error: "Comanda nu este gata de procesare." }, { status: 409 });

  try {
    let prepared = order;
    if (!prepared.output || !prepared.deliveryExpiresAt) {
      const locked = order.status === "paid" ? await setOrderStatus(order, "processing") : order;
      if (!locked) return NextResponse.json({ success: true });
      const configuration = locked.configuration.generation;
      if (!configuration || typeof configuration !== "object") throw new Error("Configuratia comenzii este invalida.");
      const generated = await fetch(`${siteUrl}/api/generate`, { method: "POST", headers: { "Content-Type": "application/json", "x-pmm-order-worker": secret }, body: JSON.stringify(configuration) });
      const payload = await generated.json() as { success?: boolean; data?: Record<string, unknown>; error?: string };
      if (!generated.ok || !payload.success || !payload.data) throw new Error(payload.error || "Generarea materialului a esuat.");

      let coverObjectName = "";
      if (locked.product === "story") {
        const prompt = typeof payload.data.imagePrompt === "string" ? payload.data.imagePrompt : "";
        if (prompt) {
          const cover = await fetch(`${siteUrl}/api/generate-cover`, { method: "POST", headers: { "Content-Type": "application/json", "x-pmm-order-worker": secret }, body: JSON.stringify({ imagePrompt: prompt }) });
          const coverPayload = await cover.json() as { success?: boolean; data?: { imageDataUrl?: string } };
          if (coverPayload.success && coverPayload.data?.imageDataUrl) coverObjectName = await saveOrderCover(locked.id, coverPayload.data.imageDataUrl);
        }
      }

      const token = createDeliveryToken(locked.id);
      const expiresAt = token.slice(0, token.lastIndexOf("."));
      const saved = await setOrderStatus(locked, "processing", { output: payload.data, ...(coverObjectName ? { coverObjectName } : {}), deliveryExpiresAt: expiresAt });
      if (!saved) throw new Error("Comanda nu a putut fi pregatita pentru livrare.");
      prepared = saved;
    }

    if (!prepared.customerEmail || !prepared.deliveryExpiresAt) throw new Error("Comanda platita nu este pregatita pentru livrare.");
    const token = createDeliveryTokenForExpiry(prepared.id, prepared.deliveryExpiresAt);
    await sendReadyEmail(prepared.customerEmail, prepared.product, `${siteUrl}/?order=${encodeURIComponent(prepared.id)}&token=${encodeURIComponent(token)}#creator`);
    const delivered = await setOrderStatus(prepared, "delivered");
    if (!delivered) throw new Error("Comanda nu a putut fi finalizata.");
    logTelemetry("pmm_order_delivered", { product: delivered.product, result: "success" });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Order processing failed", error);
    // Return 500 so Cloud Tasks retries. A prepared order keeps its output and
    // retry only attempts delivery; it does not ask Vertex to create it again.
    logTelemetry("pmm_order_failed", { product: order.product, result: "error", errorCode: "unknown" });
    return NextResponse.json({ error: "Procesarea comenzii a esuat." }, { status: 500 });
  }
}
