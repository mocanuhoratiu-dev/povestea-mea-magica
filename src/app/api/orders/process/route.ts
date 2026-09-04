import { NextResponse } from "next/server";
import { createAlbumOrderOutput } from "@/lib/album/orchestrator";
import { readAlbumConfiguration, readAlbumOutput } from "@/lib/album/schema";
import { bundleVariantForProductId, readBundleConfiguration, readBundleOutput, type BundleOutputItem } from "@/lib/bundle";
import { createReadyEmailHtml, createReadyEmailSubject, createReadyEmailText, type TransactionalEmailProduct } from "@/lib/emailTemplates";
import { createDeliveryToken, createDeliveryTokenForExpiry, createOrderDeliveryUrl, getOrder, saveOrderCover, setOrderStatus, verifyTaskIdentity, type OrderProduct, type StoredOrder } from "@/lib/orders";
import { siteUrl } from "@/lib/siteMode";
import { logTelemetry } from "@/lib/telemetry";

export const runtime = "nodejs";

function workerSecret() {
  return process.env.ORDER_WORKER_SECRET?.trim();
}

function readChildName(configuration: Record<string, unknown>) {
  const generation = configuration.generation;
  if (!generation || typeof generation !== "object" || Array.isArray(generation)) return "";
  const name = (generation as Record<string, unknown>).name;
  return typeof name === "string" ? name.replace(/[^\p{L}\p{M}\s'-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 40) : "";
}

async function sendReadyEmail({ email, product, deliveryUrl, orderId, childName = "" }: { email: string; product: TransactionalEmailProduct; deliveryUrl: string; orderId: string; childName?: string }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) throw new Error("Emailul transactional nu este configurat.");
  const replyTo = process.env.EMAIL_REPLY_TO?.trim();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `pmm-order-ready-${orderId}` },
    body: JSON.stringify({
      from: `Povestea Mea Magică <${from}>`,
      to: [email],
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject: createReadyEmailSubject(product, childName),
      html: createReadyEmailHtml({ product, childName, siteUrl, deliveryUrl, deliveryMode: "secure-link" }),
      text: createReadyEmailText({ product, childName, deliveryUrl, deliveryMode: "secure-link" }),
    }),
  });
  if (!response.ok) throw new Error(`Email delivery failed (${response.status}).`);
}

async function generateMaterial({ orderId, product, configuration, secret, coverBasename = "cover" }: { orderId: string; product: Exclude<OrderProduct, "bundle" | "album">; configuration: Record<string, unknown>; secret: string; coverBasename?: string }) {
  const generation = configuration.generation;
  if (!generation || typeof generation !== "object" || Array.isArray(generation)) throw new Error("Configuratia materialului este invalida.");

  const generated = await fetch(`${siteUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-pmm-order-worker": secret },
    body: JSON.stringify(generation),
  });
  const payload = await generated.json() as { success?: boolean; data?: Record<string, unknown>; error?: string };
  if (!generated.ok || !payload.success || !payload.data) throw new Error(payload.error || "Generarea materialului a esuat.");

  let coverObjectName = "";
  if (product === "story") {
    const prompt = typeof payload.data.imagePrompt === "string" ? payload.data.imagePrompt : "";
    if (prompt) {
      const cover = await fetch(`${siteUrl}/api/generate-cover`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-pmm-order-worker": secret },
        body: JSON.stringify({ imagePrompt: prompt }),
      });
      const coverPayload = await cover.json() as { success?: boolean; data?: { imageDataUrl?: string } };
      if (coverPayload.success && coverPayload.data?.imageDataUrl) coverObjectName = await saveOrderCover(orderId, coverPayload.data.imageDataUrl, coverBasename);
    }
  }

  return { output: payload.data, ...(coverObjectName ? { coverObjectName } : {}) };
}

async function ensureDeliveryExpiry(order: StoredOrder) {
  if (order.deliveryExpiresAt) return order;
  const token = createDeliveryToken(order.id);
  const expiresAt = token.slice(0, token.lastIndexOf("."));
  const saved = await setOrderStatus(order, "processing", { deliveryExpiresAt: expiresAt });
  if (!saved) throw new Error("Comanda nu a putut fi pregatita pentru livrare.");
  return saved;
}

async function prepareSingleOrder(order: StoredOrder, secret: string) {
  let prepared = order.status === "paid" ? await setOrderStatus(order, "processing") : order;
  if (!prepared) throw new Error("Comanda nu a putut fi blocata pentru procesare.");

  if (!prepared.output) {
    const generated = await generateMaterial({ orderId: prepared.id, product: prepared.product as Exclude<OrderProduct, "bundle" | "album">, configuration: prepared.configuration, secret });
    const saved = await setOrderStatus(prepared, "processing", { output: generated.output, ...(generated.coverObjectName ? { coverObjectName: generated.coverObjectName } : {}) });
    if (!saved) throw new Error("Comanda nu a putut salva materialul generat.");
    prepared = saved;
  }

  return ensureDeliveryExpiry(prepared);
}

async function prepareAlbumOrder(order: StoredOrder) {
  const configuration = readAlbumConfiguration(order.configuration);
  if (!configuration) throw new Error("Configurația Poveștii Magice este invalidă.");
  let prepared = order.status === "paid" ? await setOrderStatus(order, "processing") : order;
  if (!prepared) throw new Error("Povestea Magică nu a putut fi pregătită pentru procesare.");

  await createAlbumOrderOutput({
    orderId: prepared.id,
    configuration,
    existing: prepared.output,
    checkpoint: async (output) => {
      const saved = await setOrderStatus(prepared as StoredOrder, "processing", { output });
      if (!saved) throw new Error("Progresul Poveștii Magice nu a putut fi salvat.");
      prepared = saved;
    },
  });

  return ensureDeliveryExpiry(prepared);
}

async function prepareBundleOrder(order: StoredOrder, secret: string) {
  const variant = bundleVariantForProductId(order.productId);
  const configuredItems = variant ? readBundleConfiguration(order.configuration, variant) : null;
  if (!configuredItems) throw new Error("Configuratia pachetului este invalida.");

  let prepared = order.status === "paid" ? await setOrderStatus(order, "processing") : order;
  if (!prepared) throw new Error("Pachetul nu a putut fi blocat pentru procesare.");
  let completedItems = readBundleOutput(prepared.output);

  const upsertItem = (nextItem: BundleOutputItem) => [
    ...completedItems.filter((completed) => completed.product !== nextItem.product),
    nextItem,
  ];

  const pendingSimpleItems = configuredItems.filter((item) =>
    item.product !== "album" && !completedItems.some((completed) => completed.product === item.product),
  );
  if (pendingSimpleItems.length > 0) {
    const preparedOrderId = prepared.id;
    const generatedItems = await Promise.allSettled(pendingSimpleItems.map(async (item) => {
      const generated = await generateMaterial({
        orderId: preparedOrderId,
        product: item.product as Exclude<OrderProduct, "bundle" | "album">,
        configuration: item.configuration,
        secret,
        coverBasename: `${item.product}-cover`,
      });
      return {
        product: item.product,
        output: generated.output,
        ...(generated.coverObjectName ? { coverObjectName: generated.coverObjectName } : {}),
      } as BundleOutputItem;
    }));

    for (const result of generatedItems) {
      if (result.status === "fulfilled") completedItems = upsertItem(result.value);
    }
    const checkpoint = await setOrderStatus(prepared, "processing", { output: { items: completedItems } });
    if (!checkpoint) throw new Error("Pachetul nu a putut salva materialele generate.");
    prepared = checkpoint;

    const failed = generatedItems.find((result): result is PromiseRejectedResult => result.status === "rejected");
    if (failed) throw failed.reason;
  }

  for (const item of configuredItems) {
    const existing = completedItems.find((completed) => completed.product === item.product);
    if (item.product === "album") {
      const albumConfiguration = readAlbumConfiguration(item.configuration);
      if (!albumConfiguration) throw new Error("Configuratia albumului din pachet este invalida.");
      if (readAlbumOutput(existing?.output)?.documents?.narration) continue;
      await createAlbumOrderOutput({
        orderId: prepared.id,
        configuration: albumConfiguration,
        existing: existing?.output,
        checkpoint: async (albumOutput) => {
          completedItems = upsertItem({ product: "album", output: albumOutput });
          const checkpoint = await setOrderStatus(prepared as StoredOrder, "processing", { output: { items: completedItems } });
          if (!checkpoint) throw new Error("Pachetul nu a putut salva progresul albumului.");
          prepared = checkpoint;
        },
      });
      continue;
    }
    if (!existing) throw new Error(`Materialul ${item.product} nu a fost salvat în pachet.`);
  }

  return ensureDeliveryExpiry(prepared);
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
    const prepared = order.product === "bundle"
      ? await prepareBundleOrder(order, secret)
      : order.product === "album"
        ? await prepareAlbumOrder(order)
        : await prepareSingleOrder(order, secret);
    if (!prepared.customerEmail || !prepared.deliveryExpiresAt) throw new Error("Comanda platita nu este pregatita pentru livrare.");
    const token = createDeliveryTokenForExpiry(prepared.id, prepared.deliveryExpiresAt);
    await sendReadyEmail({
      email: prepared.customerEmail,
      product: prepared.productId === "complete-bundle" ? "complete_bundle" : prepared.product,
      deliveryUrl: createOrderDeliveryUrl(prepared, token, siteUrl),
      orderId: prepared.id,
      childName: prepared.product === "bundle" ? "" : readChildName(prepared.configuration),
    });
    const delivered = await setOrderStatus(prepared, "delivered");
    if (!delivered) throw new Error("Comanda nu a putut fi finalizata.");
    logTelemetry("pmm_order_delivered", { product: delivered.product, result: "success" });
    if (delivered.product === "album" || delivered.product === "bundle") {
      const album = delivered.product === "album"
        ? readAlbumOutput(delivered.output)
        : readAlbumOutput(readBundleOutput(delivered.output).find((item) => item.product === "album")?.output);
      if (album) {
        logTelemetry("pmm_album_stage_completed", { product: "album", result: "success", albumStage: "delivery", estimatedCostMicros: album.budget.estimatedCostMicros });
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Order processing failed", error);
    // Checkpoints keep completed bundle items. A retry resumes at the first
    // missing material and Resend idempotency prevents duplicate ready emails.
    logTelemetry("pmm_order_failed", { product: order.product, result: "error", errorCode: "unknown" });
    return NextResponse.json({ error: "Procesarea comenzii a esuat." }, { status: 500 });
  }
}
