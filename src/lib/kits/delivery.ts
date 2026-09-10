import { readPremiumKit } from "./content.ts";

export function kitDeliveryOutput(output: Record<string, unknown>, orderId: string, token: string, item?: string) {
  const premium = readPremiumKit(output.premium);
  if (!premium) return output;
  const asset = (role: string) => `/api/orders/${encodeURIComponent(orderId)}/asset?${new URLSearchParams({ token, asset: `kit-${role}`, ...(item ? { item } : {}) })}`;
  return { ...output, premium: { ...premium, assets: { ...(premium.assets.cover ? { cover: asset("cover") } : {}), ...(premium.assets.scene ? { scene: asset("scene") } : {}) } } };
}
