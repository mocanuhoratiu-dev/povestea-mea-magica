import { NextResponse } from "next/server";
import { readAlbumConfiguration, readAlbumOutput } from "@/lib/album/schema";
import type { AlbumOrderOutput } from "@/lib/album/types";
import { bundleProducts, bundleVariantForProductId, readBundleConfiguration, readBundleOutput, type BundleProduct } from "@/lib/bundle";
import { getOrder, isValidDeliveryToken, readOrderCover } from "@/lib/orders";

export const runtime = "nodejs";

function albumDeliveryPayload({ album, configuration, orderId, token, item }: { album: AlbumOrderOutput; configuration: Record<string, unknown>; orderId: string; token: string; item?: string }) {
  const config = readAlbumConfiguration(configuration);
  if (!config || !album.documents || !album.plan) return null;
  const assetUrl = (asset: string) => {
    const query = new URLSearchParams({ token, asset, ...(item ? { item } : {}) });
    return `/api/orders/${encodeURIComponent(orderId)}/asset?${query.toString()}`;
  };
  const documentUrl = (file: string) => {
    const query = new URLSearchParams({ token, file, ...(item ? { item } : {}) });
    return `/api/orders/${encodeURIComponent(orderId)}/document?${query.toString()}`;
  };
  return {
    product: "album" as const,
    childName: config.generation.name,
    title: album.plan.title,
    referenceMode: album.plan.storyBible.characterLock.referenceMode,
    qualitySummary: {
      accepted: album.quality.filter((result) => result.accepted).length,
      checked: album.quality.length,
    },
    pages: [
      { kind: "cover", eyebrow: "Copertă", title: album.plan.title, text: `O aventură creată pentru ${config.generation.name}`, imageUrl: assetUrl("cover") },
      { kind: "dedication", eyebrow: "Dedicație", title: `Pentru ${config.generation.name}`, text: config.dedication || `Pentru ${config.generation.name}, cu drag și cu lumină pentru fiecare aventură.`, signature: config.dedicationFrom },
      ...album.plan.scenes.map((scene, index) => ({ kind: "story", eyebrow: `Pagina ${index + 1}`, title: scene.heading, text: scene.text, imageUrl: assetUrl(`scene-${index}`), layout: scene.layout })),
      { kind: "back", eyebrow: "Coperta finală", title: "Povestea continuă cu voi", text: "O poveste în care copilul tău contează." },
    ],
    documents: [
      { id: "storybook", label: "Cartea ilustrată", pages: 16 },
      { id: "activities", label: "Caietul de activități", pages: 5 },
    ],
    ...(album.documents.narration ? { audioUrl: documentUrl("narration") } : {}),
  };
}

export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!isValidDeliveryToken(orderId, token)) return NextResponse.json({ error: "Linkul de livrare nu este valid sau a expirat." }, { status: 403 });

  const order = await getOrder(orderId);
  if (!order) return NextResponse.json({ error: "Comanda nu a fost gasita." }, { status: 404 });
  if (order.status !== "delivered" || !order.output) return NextResponse.json({ status: order.status }, { status: 202 });

  if (order.product === "album") {
    const album = readAlbumOutput(order.output);
    if (!album) return NextResponse.json({ error: "Albumul nu este complet." }, { status: 409 });
    const payload = albumDeliveryPayload({ album, configuration: order.configuration, orderId, token });
    return payload ? NextResponse.json(payload) : NextResponse.json({ error: "Albumul nu este complet." }, { status: 409 });
  }

  const requestedItem = new URL(request.url).searchParams.get("item");
  if (order.product === "bundle") {
    const variant = bundleVariantForProductId(order.productId);
    const configuredItems = variant ? readBundleConfiguration(order.configuration, variant) : null;
    const outputItems = readBundleOutput(order.output);
    if (!configuredItems || outputItems.length !== configuredItems.length || configuredItems.some((item) => !outputItems.some((output) => output.product === item.product))) {
      return NextResponse.json({ error: "Pachetul nu este complet." }, { status: 409 });
    }

    if (!requestedItem) {
      return NextResponse.json({
        product: "bundle",
        items: configuredItems.map((item) => ({ product: item.product, configuration: item.configuration })),
      });
    }

    if (!bundleProducts.includes(requestedItem as BundleProduct)) return NextResponse.json({ error: "Materialul nu exista in pachet." }, { status: 404 });
    const configured = configuredItems.find((item) => item.product === requestedItem);
    const generated = outputItems.find((item) => item.product === requestedItem);
    if (!configured || !generated) return NextResponse.json({ error: "Materialul nu este pregatit." }, { status: 404 });
    if (generated.product === "album") {
      const album = readAlbumOutput(generated.output);
      if (!album) return NextResponse.json({ error: "Albumul nu este complet." }, { status: 409 });
      const payload = albumDeliveryPayload({ album, configuration: configured.configuration, orderId, token, item: "album" });
      return payload ? NextResponse.json(payload) : NextResponse.json({ error: "Albumul nu este complet." }, { status: 409 });
    }
    const coverImageDataUrl = generated.coverObjectName ? await readOrderCover(generated.coverObjectName) : "";
    return NextResponse.json({ product: generated.product, configuration: configured.configuration, output: generated.output, coverImageDataUrl });
  }

  if (requestedItem && requestedItem !== order.product) return NextResponse.json({ error: "Materialul nu apartine comenzii." }, { status: 404 });

  const coverImageDataUrl = order.coverObjectName ? await readOrderCover(order.coverObjectName) : "";
  return NextResponse.json({ product: order.product, configuration: order.configuration, output: order.output, coverImageDataUrl });
}
