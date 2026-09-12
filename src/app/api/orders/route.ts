import { NextResponse } from "next/server";
import { readAlbumConfiguration } from "@/lib/album/schema";
import { isCheckoutProductId } from "@/lib/catalog";
import { bundleVariantForProductId, readBundleConfiguration } from "@/lib/bundle";
import { createOrder, isOrderStoreConfigured, saveOrderCover, setOrderStatus } from "@/lib/orders";
import { checkRateLimit, requestExceedsBodyLimit } from "@/lib/requestProtection";
import { turnstileRejected, verifyTurnstileRequest } from "@/lib/turnstile";
import { readKitInput } from "@/lib/kits/content";
import { verifyCharacterProof } from "@/lib/characterToken";
import { describePhotoTraits } from "@/lib/characterPhotoPolicy";
import { readLimitedJson } from "@/lib/limitedJson";

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
  if (requestExceedsBodyLimit(request, 15_000_000)) return NextResponse.json({ error: "Cererea este prea mare." }, { status: 413 });
  const limit = checkRateLimit(request, "order-create", { windowMs: 60 * 60 * 1000, maxRequests: 8 });
  if (!limit.allowed) return NextResponse.json({ error: "Reincearca putin mai tarziu." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  if (!(await verifyTurnstileRequest(request, "order_create"))) return turnstileRejected();
  if (!isOrderStoreConfigured()) return NextResponse.json({ error: "Comenzile online nu sunt active momentan." }, { status: 503 });

  try {
    const body = await readLimitedJson(request, 15_000_000);
    const { productId, configuration } = body;
    const referenceCharacter = body.referenceCharacter as { photoConsent?: boolean; characterImageDataUrl?: string; referenceImageDataUrl?: string; characterToken?: string } | undefined;
    if (!isCheckoutProductId(productId)) return NextResponse.json({ error: "Produsul selectat nu este disponibil." }, { status: 400 });
    const clean = cleanConfiguration(configuration);
    if (!clean) return NextResponse.json({ error: "Datele materialului nu sunt valide." }, { status: 400 });
    delete clean.referenceCharacter;
    let proof;
    if (productId === "night-shield" || productId === "patience-kit") {
      const input = readKitInput(clean.generation);
      if (!input || input.type !== (productId === "night-shield" ? "monster" : "emergency")) return NextResponse.json({ error: "Verifică personalizarea materialului înainte de plată." }, { status: 400 });
      if (input.referenceMode === "photo") {
        if (referenceCharacter?.photoConsent !== true || typeof referenceCharacter?.characterImageDataUrl !== "string") return NextResponse.json({ error: "Confirmă personajul și permisiunea pentru fotografie." }, { status: 400 });
        try { proof = verifyCharacterProof(referenceCharacter.characterToken, referenceCharacter.referenceImageDataUrl, referenceCharacter.characterImageDataUrl); if (proof.kind !== "character") throw new Error("character_confirmation_required"); }
        catch { return NextResponse.json({ error: "Personajul trebuie confirmat din nou înainte de plată." }, { status: 400 }); }
        input.appearance = describePhotoTraits(proof.traits).slice(0, 240);
      }
      clean.generation = input;
    }
    const bundleVariant = bundleVariantForProductId(productId);
    if (bundleVariant) {
      const bundle = readBundleConfiguration(clean, bundleVariant);
      if (!bundle) {
        return NextResponse.json({ error: "Pachetul trebuie să conțină toate cele trei produse personalizate." }, { status: 400 });
      }
      for (const item of bundle.filter(item => item.product === "monster" || item.product === "emergency")) {
        delete item.configuration.referenceCharacter;
        const input = readKitInput(item.configuration.generation);
        if (!input || input.type !== item.product) return NextResponse.json({ error: "Verifică detaliile Scutului și Dosarului din pachet." }, { status: 400 });
        if (input.referenceMode === "photo") return NextResponse.json({ error: "Pentru personaj după fotografie, personalizează acest material din pagina sa dedicată." }, { status: 400 });
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
    if (proof) {
      const objectName = await saveOrderCover(order.id, referenceCharacter!.characterImageDataUrl!, "kit-character-reference");
      const saved = await setOrderStatus(order, "draft", { configuration: { ...clean, referenceCharacter: { objectName, model: proof.model, traits: proof.traits, consentAt: new Date().toISOString() } } });
      if (!saved) throw new Error("character_checkpoint_failed");
    }
    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    if (error instanceof Error && error.message === "request_too_large") return NextResponse.json({ error: "Datele fotografiei sunt prea mari." }, { status: 413 });
    console.error("Order creation failed", error);
    return NextResponse.json({ error: "Nu am putut pregati comanda acum." }, { status: 502 });
  }
}
