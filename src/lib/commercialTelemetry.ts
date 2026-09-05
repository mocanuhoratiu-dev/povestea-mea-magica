import type { TelemetryFields, TelemetryProduct } from "@/lib/telemetry";

type CommercialSession = {
  metadata?: Record<string, string> | null;
  amount_total?: number | null;
  currency?: string | null;
  livemode?: boolean;
  total_details?: { amount_discount?: number | null } | null;
  discounts?: Array<{
    promotion_code?: string | { code?: string | null } | null;
  }> | null;
};

const productByCheckoutId: Record<string, TelemetryProduct> = {
  "night-shield": "monster",
  "patience-kit": "emergency",
  "complete-bundle": "bundle",
  "illustrated-album-digital": "album",
};

export function commercialProductFromMetadata(metadata: Record<string, string> | null | undefined) {
  return productByCheckoutId[metadata?.product_id || ""];
}

function boundedMoney(value: number | null | undefined) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100_000_000
    ? value
    : undefined;
}

function currencyCode(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase() || "";
  return /^[a-z]{3}$/.test(normalized) ? normalized : undefined;
}

export function promotionCodeFromSession(session: CommercialSession) {
  for (const discount of session.discounts || []) {
    const promotion = discount.promotion_code;
    if (!promotion || typeof promotion === "string" || typeof promotion.code !== "string") continue;
    const normalized = promotion.code.trim().toUpperCase();
    if (/^[A-Z0-9_-]{1,32}$/.test(normalized)) return normalized;
  }
  return undefined;
}

export function commercialTelemetryFields(session: CommercialSession): Pick<TelemetryFields, "amountMinor" | "discountAmountMinor" | "currency" | "liveMode" | "promotionCode"> {
  return {
    amountMinor: boundedMoney(session.amount_total),
    discountAmountMinor: boundedMoney(session.total_details?.amount_discount),
    currency: currencyCode(session.currency),
    liveMode: typeof session.livemode === "boolean" ? session.livemode : undefined,
    promotionCode: promotionCodeFromSession(session),
  };
}
