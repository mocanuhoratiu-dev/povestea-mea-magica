import { NextResponse } from "next/server";
import { sendOrderWatchdogAlert } from "@/lib/operationalEmail";
import { assessOrderForWatchdog } from "@/lib/orderWatchdog";
import { enqueueOrderRecovery, getOrder, listOrdersForWatchdog, saveOrder, verifyTaskIdentity, type StoredOrder } from "@/lib/orders";
import { siteUrl } from "@/lib/siteMode";
import { logTelemetry } from "@/lib/telemetry";

export const runtime = "nodejs";

function boundedInteger(value: string | undefined, fallback: number, minimum: number, maximum: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
}

async function claimSnapshot(order: StoredOrder, next: StoredOrder) {
  try {
    return await saveOrder(next, order.updateTime);
  } catch (error) {
    if (error instanceof Error && error.message.includes("(412)")) return null;
    throw error;
  }
}

async function updateAlertState(
  orderId: string,
  fields: Pick<StoredOrder, "watchdogAlertStatus" | "watchdogAlertUpdatedAt"> & Partial<Pick<StoredOrder, "watchdogAlertErrorCode">>,
) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const current = await getOrder(orderId);
    if (!current) return null;
    try {
      return await saveOrder({ ...current, ...fields }, current.updateTime);
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("(412)") || attempt === 3) throw error;
    }
  }
  return null;
}

export async function POST(request: Request) {
  if (!await verifyTaskIdentity(request, siteUrl)) {
    return NextResponse.json({ error: "Neautorizat." }, { status: 401 });
  }

  const nowMs = Date.now();
  const now = new Date(nowMs).toISOString();
  const staleMinutes = boundedInteger(process.env.ORDER_WATCHDOG_STALE_MINUTES, 35, 20, 180);
  const maxRecoveries = boundedInteger(process.env.ORDER_WATCHDOG_MAX_RECOVERIES, 3, 1, 6);
  const scanLimit = boundedInteger(process.env.ORDER_WATCHDOG_SCAN_LIMIT, 100, 10, 200);
  const summary = { checked: 0, stale: 0, requeued: 0, alerted: 0, skipped: 0, errors: 0 };

  let orders: StoredOrder[];
  try {
    orders = await listOrdersForWatchdog(scanLimit);
  } catch (error) {
    console.error("Order watchdog could not scan orders", error);
    logTelemetry("pmm_order_recovery_failed", { result: "error", errorCode: "unknown" });
    return NextResponse.json({ error: "Watchdog-ul nu a putut verifica comenzile." }, { status: 500 });
  }

  summary.checked = orders.length;
  for (const order of orders) {
    const decision = assessOrderForWatchdog(order, nowMs, staleMinutes * 60_000, maxRecoveries);
    if (decision.action === "skip") {
      summary.skipped += 1;
      continue;
    }
    summary.stale += 1;

    if (decision.action === "requeue") {
      const nextRecoveryCount = decision.recoveryCount + 1;
      try {
        const claimed = await claimSnapshot(order, {
          ...order,
          updatedAt: now,
          watchdogRecoveryCount: nextRecoveryCount,
          watchdogLastRecoveryAt: now,
          watchdogLastStage: decision.stage,
          watchdogAlertErrorCode: "",
        });
        if (!claimed) {
          summary.skipped += 1;
          continue;
        }

        await enqueueOrderRecovery(claimed.id, siteUrl, nextRecoveryCount);
        summary.requeued += 1;
        logTelemetry("pmm_order_recovery_enqueued", {
          product: claimed.product,
          result: "pending",
          attempt: nextRecoveryCount,
          orderStage: decision.stage,
          staleMinutes: decision.staleMinutes,
        });
      } catch (error) {
        summary.errors += 1;
        console.error("Order watchdog recovery enqueue failed", {
          orderId: order.id,
          recoveryCount: nextRecoveryCount,
          stage: decision.stage,
          error: error instanceof Error ? error.message : "unknown",
        });
        logTelemetry("pmm_order_recovery_failed", {
          product: order.product,
          result: "error",
          attempt: nextRecoveryCount,
          orderStage: decision.stage,
          staleMinutes: decision.staleMinutes,
          errorCode: "unknown",
        });
      }
      continue;
    }

    try {
      const claimed = await claimSnapshot(order, {
        ...order,
        watchdogLastStage: decision.stage,
        watchdogAlertStatus: "sending",
        watchdogAlertUpdatedAt: now,
        watchdogAlertErrorCode: "",
      });
      if (!claimed) {
        summary.skipped += 1;
        continue;
      }

      await sendOrderWatchdogAlert({
        orderId: claimed.id,
        product: claimed.product,
        status: claimed.status,
        stage: decision.stage,
        recoveryCount: decision.recoveryCount,
        staleMinutes: decision.staleMinutes,
        errorCode: claimed.errorCode || claimed.deliveryEmailErrorCode,
      });
      await updateAlertState(claimed.id, {
        watchdogAlertStatus: "sent",
        watchdogAlertUpdatedAt: new Date().toISOString(),
        watchdogAlertErrorCode: "",
      });
      summary.alerted += 1;
      logTelemetry("pmm_order_attention_required", {
        product: claimed.product,
        result: "error",
        attempt: decision.recoveryCount,
        orderStage: decision.stage,
        staleMinutes: decision.staleMinutes,
        errorCode: claimed.errorCode === "budget_limit" ? "budget_limit" : "unknown",
      });
    } catch (error) {
      const errorCode = error instanceof Error ? error.message.replace(/[^a-zA-Z0-9_.-]/g, "_").slice(0, 100) : "watchdog_alert_unknown";
      summary.errors += 1;
      console.error("Order watchdog alert failed", { orderId: order.id, stage: decision.stage, error: errorCode });
      try {
        await updateAlertState(order.id, {
          watchdogAlertStatus: "failed",
          watchdogAlertUpdatedAt: new Date().toISOString(),
          watchdogAlertErrorCode: errorCode,
        });
      } catch (checkpointError) {
        console.error("Order watchdog alert checkpoint failed", checkpointError);
      }
      logTelemetry("pmm_order_recovery_failed", {
        product: order.product,
        result: "error",
        attempt: decision.recoveryCount,
        orderStage: decision.stage,
        staleMinutes: decision.staleMinutes,
        errorCode: "unknown",
      });
    }
  }

  logTelemetry("pmm_order_watchdog_checked", { result: summary.errors ? "error" : "success" });
  return NextResponse.json({ success: summary.errors === 0, ...summary });
}
