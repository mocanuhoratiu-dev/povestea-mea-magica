import { NextResponse } from "next/server";
import { readAlbumConfiguration } from "@/lib/album/schema";
import { isCheckoutProductId } from "@/lib/catalog";
import { bundleVariantForProductId, readBundleConfiguration } from "@/lib/bundle";
import { createOrder, isOrderStoreConfigured } from "@/lib/orders";
import { checkRateLimit, requestExceedsBodyLimit } from "@/lib/requestProtection";
import { turnstileRejected, verifyTurnstileRequest } from "@/lib/turnstile";
import { readKitInput } from "@/lib/kits/content";

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
  if (!(await verifyTurnstileRequest(request, "order_create"))) return turnstileRejected();
  if (!isOrderStoreConfigured()) return NextResponse.json({ error: "Comenzile online nu sunt active momentan." }, { status: 503 });

  try {
    const { productId, configuration } = await request.json();
    if (!isCheckoutProductId(productId)) return NextResponse.json({ error: "Produsul selectat nu este disponibil." }, { status: 400 });
    const clean = cleanConfiguration(configuration);
    if (!clean) return NextResponse.json({ error: "Datele materialului nu sunt valide." }, { status: 400 });
    if (productId === "night-shield" || productId === "patience-kit") {
      const input = readKitInput(clean.generation);
      if (!input || input.type !== (productId === "night-shield" ? "monster" : "emergency")) return NextResponse.json({ error: "Verifică personalizarea materialului înainte de plată." }, { status: 400 });
      clean.generation = input;
    }
    const bundleVariant = bundleVariantForProductId(productId);
    if (bundleVariant) {
      const bundle = readBundleConfiguration(clean, bundleVariant);
      if (!bundle) {
        return NextResponse.json({ error: "Pachetul trebuie să conțină toate cele trei produse personalizate." }, { status: 400 });
      }
      for (const item of bundle.filter(item => item.product === "monster" || item.product === "emergency")) {
        const input = readKitInput(item.configuration.generation);
        if (!input || input.type !== item.product) return NextResponse.json({ error: "Verifică detaliile Scutului și Dosarului din pachet." }, { status: 400 });
        item.configuration.generation = input;
      }
      const album = bundle.find((item) => item.product === "album");
      if (bundleVariant === "complete" && (!album || !readAlbumConfiguration(album.configuration))) {
        return NextResponse.json({ error: "Verifică toate detaliile Poveștii Magice din pachet înainte de plată." }, { status: 400 });
      }
    }
    if (productId === "illustrated-album-digital" && !readAlbumConfiguration(clean)) {
      return NextResponse.json({ error: "Verifică toate detaliile Poveștii Magice înainte de plată." }, { status: 400 });
    }
    const order = await createOrder(productId, clean);
    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    console.error("Order creation failed", error);
    return NextResponse.json({ error: "Nu am putut pregati comanda acum." }, { status: 502 });
  }
}
