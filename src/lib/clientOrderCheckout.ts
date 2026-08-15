import type { CheckoutProductId } from "@/lib/catalog";

export async function beginOrderCheckout(productId: CheckoutProductId, configuration: Record<string, unknown>) {
  const orderResponse = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, configuration }),
  });
  const orderResult = await orderResponse.json() as { orderId?: string; error?: string };
  if (!orderResponse.ok || !orderResult.orderId) throw new Error(orderResult.error || "Nu am putut pregati comanda.");

  const checkoutResponse = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, orderId: orderResult.orderId }),
  });
  const checkoutResult = await checkoutResponse.json() as { url?: string; error?: string };
  if (!checkoutResponse.ok || !checkoutResult.url) throw new Error(checkoutResult.error || "Nu am putut deschide plata.");
  window.location.assign(checkoutResult.url);
}
