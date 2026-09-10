import assert from "node:assert/strict";
import test from "node:test";
import { assessOrderForWatchdog, inferOrderRecoveryStage } from "../src/lib/orderWatchdog.ts";
import type { StoredOrder } from "../src/lib/orders.ts";

const now = Date.parse("2026-09-10T12:00:00.000Z");

function order(overrides: Partial<StoredOrder> = {}): StoredOrder {
  return {
    id: "abcdefghijklmnop",
    productId: "illustrated-album-digital",
    product: "album",
    status: "processing",
    configuration: {},
    createdAt: "2026-09-10T10:00:00.000Z",
    updatedAt: "2026-09-10T11:00:00.000Z",
    expiresAt: "2026-10-10T10:00:00.000Z",
    ...overrides,
  };
}

test("watchdog leaves active and completed orders alone", () => {
  const active = assessOrderForWatchdog(order({ updatedAt: "2026-09-10T11:40:00.000Z" }), now, 35 * 60_000, 3);
  const delivered = assessOrderForWatchdog(order({ status: "delivered" }), now, 35 * 60_000, 3);
  assert.equal(active.action, "skip");
  assert.equal(delivered.action, "skip");
});

test("watchdog requeues stale paid work until the bounded recovery limit", () => {
  const decision = assessOrderForWatchdog(order({ watchdogRecoveryCount: 2 }), now, 35 * 60_000, 3);
  assert.equal(decision.action, "requeue");
  assert.equal(decision.recoveryCount, 2);
  assert.equal(decision.staleMinutes, 60);
});

test("watchdog escalates once automatic recovery is exhausted", () => {
  const decision = assessOrderForWatchdog(order({ watchdogRecoveryCount: 3, errorCode: "provider_timeout" }), now, 35 * 60_000, 3);
  assert.equal(decision.action, "alert");
});

test("watchdog escalates a hard cost limit without wasting more retries", () => {
  const decision = assessOrderForWatchdog(order({ watchdogRecoveryCount: 0, errorCode: "budget_limit" }), now, 35 * 60_000, 3);
  assert.equal(decision.action, "alert");
});

test("watchdog does not duplicate a sent or currently sending alert", () => {
  const sent = assessOrderForWatchdog(order({ watchdogRecoveryCount: 3, watchdogAlertStatus: "sent" }), now, 35 * 60_000, 3);
  const sending = assessOrderForWatchdog(order({
    watchdogRecoveryCount: 3,
    watchdogAlertStatus: "sending",
    watchdogAlertUpdatedAt: "2026-09-10T11:50:00.000Z",
  }), now, 35 * 60_000, 3);
  assert.equal(sent.action, "skip");
  assert.equal(sending.action, "skip");
});

test("watchdog retries an alert whose delivery claim became stale", () => {
  const decision = assessOrderForWatchdog(order({
    watchdogRecoveryCount: 3,
    watchdogAlertStatus: "sending",
    watchdogAlertUpdatedAt: "2026-09-10T11:20:00.000Z",
  }), now, 35 * 60_000, 3);
  assert.equal(decision.action, "alert");
});

test("watchdog identifies the album stage without reading customer content", () => {
  assert.equal(inferOrderRecoveryStage(order()), "generation");
  assert.equal(inferOrderRecoveryStage(order({ output: {
    kind: "illustrated-album",
    progress: { stage: "rendering", current: 1, total: 2 },
  } })), "rendering");
  assert.equal(inferOrderRecoveryStage(order({ output: {
    kind: "illustrated-album",
    progress: { stage: "delivery", current: 1, total: 2 },
    documents: { storybook: "story.pdf", activityBooklet: "activity.pdf" },
  } })), "audio");
  assert.equal(inferOrderRecoveryStage(order({ deliveryExpiresAt: "2026-10-10T10:00:00.000Z" })), "email");
});
