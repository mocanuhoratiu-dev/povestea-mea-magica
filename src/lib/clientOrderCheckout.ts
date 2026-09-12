import type { ActiveCheckoutProductId } from "@/lib/catalog";
import { protectedFetch } from "@/lib/clientTurnstile";

export async function beginOrderCheckout(productId: ActiveCheckoutProductId, configuration: Record<string, unknown>, referenceCharacter?: Record<string, unknown>) {
  const orderResponse = await protectedFetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, configuration, ...(referenceCharacter ? { referenceCharacter } : {}) }),
  }, "order_create");
  const orderResult = await orderResponse.json() as { orderId?: string; error?: string };
  if (!orderResponse.ok || !orderResult.orderId) throw new Error(orderResult.error || "Nu am putut pregati comanda.");

  return beginPreparedOrderCheckout(productId, orderResult.orderId);
}

export async function beginPreparedOrderCheckout(productId: ActiveCheckoutProductId, orderId: string) {
  const checkoutResponse = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, orderId }),
    signal: AbortSignal.timeout(25_000),
  });
  const checkoutResult = await checkoutResponse.json() as { url?: string; error?: string };
  if (!checkoutResponse.ok || !checkoutResult.url) throw new Error(checkoutResult.error || "Nu am putut deschide plata.");
  window.location.assign(checkoutResult.url);
}
