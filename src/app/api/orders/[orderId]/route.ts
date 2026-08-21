import { NextResponse } from "next/server";
import { bundleProducts, readBundleConfiguration, readBundleOutput, type BundleProduct } from "@/lib/bundle";
import { getOrder, isValidDeliveryToken, readOrderCover } from "@/lib/orders";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!isValidDeliveryToken(orderId, token)) return NextResponse.json({ error: "Linkul de livrare nu este valid sau a expirat." }, { status: 403 });

  const order = await getOrder(orderId);
  if (!order) return NextResponse.json({ error: "Comanda nu a fost gasita." }, { status: 404 });
  if (order.status !== "delivered" || !order.output) return NextResponse.json({ status: order.status }, { status: 202 });

  const requestedItem = new URL(request.url).searchParams.get("item");
  if (order.product === "bundle") {
    const configuredItems = readBundleConfiguration(order.configuration);
    const outputItems = readBundleOutput(order.output);
    if (!configuredItems || outputItems.length !== bundleProducts.length) return NextResponse.json({ error: "Pachetul nu este complet." }, { status: 409 });

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
    const coverImageDataUrl = generated.coverObjectName ? await readOrderCover(generated.coverObjectName) : "";
    return NextResponse.json({ product: generated.product, configuration: configured.configuration, output: generated.output, coverImageDataUrl });
  }

  if (requestedItem && requestedItem !== order.product) return NextResponse.json({ error: "Materialul nu apartine comenzii." }, { status: 404 });

  const coverImageDataUrl = order.coverObjectName ? await readOrderCover(order.coverObjectName) : "";
  return NextResponse.json({ product: order.product, configuration: order.configuration, output: order.output, coverImageDataUrl });
}
