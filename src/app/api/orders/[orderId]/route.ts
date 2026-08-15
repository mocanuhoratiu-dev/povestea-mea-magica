import { NextResponse } from "next/server";
import { getOrder, isValidDeliveryToken, readOrderCover } from "@/lib/orders";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!isValidDeliveryToken(orderId, token)) return NextResponse.json({ error: "Linkul de livrare nu este valid sau a expirat." }, { status: 403 });

  const order = await getOrder(orderId);
  if (!order) return NextResponse.json({ error: "Comanda nu a fost gasita." }, { status: 404 });
  if (order.status !== "delivered" || !order.output) return NextResponse.json({ status: order.status }, { status: 202 });

  const coverImageDataUrl = order.coverObjectName ? await readOrderCover(order.coverObjectName) : "";
  return NextResponse.json({ product: order.product, configuration: order.configuration, output: order.output, coverImageDataUrl });
}
