import { NextResponse } from "next/server";
import { readAlbumConfiguration } from "@/lib/album/schema";
import { isCheckoutProductId } from "@/lib/catalog";
import { readBundleConfiguration } from "@/lib/bundle";
import { createOrder, isOrderStoreConfigured } from "@/lib/orders";
import { checkRateLimit, requestExceedsBodyLimit } from "@/lib/requestProtection";

export const runtime = "nodejs";

function cleanConfiguration(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const json = JSON.stringify(value);
  if (json.length > 28_000) return null;
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    return parsed;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (requestExceedsBodyLimit(request, 32_000)) return NextResponse.json({ error: "Cererea este prea mare." }, { status: 413 });
  const limit = checkRateLimit(request, "order-create", { windowMs: 60 * 60 * 1000, maxRequests: 8 });
  if (!limit.allowed) return NextResponse.json({ error: "Reincearca putin mai tarziu." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  if (!isOrderStoreConfigured()) return NextResponse.json({ error: "Comenzile online nu sunt active momentan." }, { status: 503 });

  try {
    const { productId, configuration } = await request.json();
    if (!isCheckoutProductId(productId)) return NextResponse.json({ error: "Produsul selectat nu este disponibil." }, { status: 400 });
    const clean = cleanConfiguration(configuration);
    if (!clean) return NextResponse.json({ error: "Datele materialului nu sunt valide." }, { status: 400 });
    if (productId === "family-bundle" && !readBundleConfiguration(clean)) {
      return NextResponse.json({ error: "Pachetul trebuie să conțină toate cele trei materiale personalizate." }, { status: 400 });
    }
    if (productId === "illustrated-album-digital" && !readAlbumConfiguration(clean)) {
      return NextResponse.json({ error: "Verifică toate detaliile albumului înainte de plată." }, { status: 400 });
    }
    const order = await createOrder(productId, clean);
    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    console.error("Order creation failed", error);
    return NextResponse.json({ error: "Nu am putut pregati comanda acum." }, { status: 502 });
  }
}
