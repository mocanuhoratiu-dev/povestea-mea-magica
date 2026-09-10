import type { StoredOrder } from "@/lib/orders";

export type OrderRecoveryStage = "generation" | "rendering" | "audio" | "email" | "delivery";
export type OrderWatchdogAction = "skip" | "requeue" | "alert";

export type OrderWatchdogDecision = {
  action: OrderWatchdogAction;
  stage: OrderRecoveryStage;
  staleMinutes: number;
  recoveryCount: number;
};

type AlbumLikeOutput = {
  kind?: unknown;
  progress?: unknown;
  documents?: unknown;
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function albumOutputFromOrder(order: StoredOrder): AlbumLikeOutput | null {
  const output = record(order.output);
  if (!output) return null;
  if (output.kind === "illustrated-album") return output;

  const items = Array.isArray(output.items) ? output.items : [];
  for (const itemValue of items) {
    const item = record(itemValue);
    const itemOutput = record(item?.output);
    if (item?.product === "album" && itemOutput?.kind === "illustrated-album") return itemOutput;
  }
  return null;
}

export function inferOrderRecoveryStage(order: StoredOrder): OrderRecoveryStage {
  if (order.deliveryEmailStatus === "sending" || order.deliveryEmailStatus === "failed") return "email";
  if (order.deliveryExpiresAt) return order.deliveryEmailStatus === "sent" ? "delivery" : "email";

  const album = albumOutputFromOrder(order);
  if (album) {
    const documents = record(album.documents);
    if (documents?.storybook && documents.activityBooklet && !documents.narration) return "audio";
    if (documents?.narration) return "delivery";

    const progress = record(album.progress);
    if (progress?.stage === "rendering") return "rendering";
  }

  return order.output ? "delivery" : "generation";
}

export function assessOrderForWatchdog(
  order: StoredOrder,
  nowMs: number,
  staleAfterMs: number,
  maxRecoveries: number,
  alertRetryAfterMs = 20 * 60 * 1000,
): OrderWatchdogDecision {
  const recoveryCount = Math.max(0, order.watchdogRecoveryCount || 0);
  const stage = inferOrderRecoveryStage(order);
  const lastActivityMs = Date.parse(order.updatedAt || order.createdAt);
  const ageMs = Number.isFinite(lastActivityMs) ? Math.max(0, nowMs - lastActivityMs) : Number.POSITIVE_INFINITY;
  const staleMinutes = Number.isFinite(ageMs) ? Math.floor(ageMs / 60_000) : -1;

  if (!["paid", "processing"].includes(order.status) || ageMs < staleAfterMs) {
    return { action: "skip", stage, staleMinutes, recoveryCount };
  }

  const reachedHardLimit = order.errorCode === "budget_limit";
  if (!reachedHardLimit && recoveryCount < maxRecoveries) {
    return { action: "requeue", stage, staleMinutes, recoveryCount };
  }

  if (order.watchdogAlertStatus === "sent") {
    return { action: "skip", stage, staleMinutes, recoveryCount };
  }

  const alertUpdatedAtMs = Date.parse(order.watchdogAlertUpdatedAt || "");
  if (
    order.watchdogAlertStatus === "sending"
    && Number.isFinite(alertUpdatedAtMs)
    && nowMs - alertUpdatedAtMs < alertRetryAfterMs
  ) {
    return { action: "skip", stage, staleMinutes, recoveryCount };
  }

  return { action: "alert", stage, staleMinutes, recoveryCount };
}
