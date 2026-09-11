import assert from "node:assert/strict";
import test from "node:test";
import { checkRateLimit, reserveRateLimit } from "../src/lib/requestProtection.ts";

test("reading the preview allowance never consumes a generation attempt", () => {
  const request = new Request("http://localhost/api/album-preview", {
    headers: { "x-real-ip": "preview-allowance-test" },
  });
  const options = { maxRequests: 4, windowMs: 86_400_000 };
  for (let i = 0; i < 8; i++)
    assert.equal(
      checkRateLimit(request, "preview-test", { ...options, readOnly: true })
        .remaining,
      4,
    );
  for (let i = 3; i >= 0; i--) {
    const result = checkRateLimit(request, "preview-test", options);
    assert.equal(result.allowed, true);
    assert.equal(result.remaining, i);
    assert.equal(
      checkRateLimit(request, "preview-test", { ...options, readOnly: true })
        .remaining,
      i,
    );
  }
  assert.equal(checkRateLimit(request, "preview-test", options).allowed, false);
});

test("failed reservations are refunded once without refunding concurrent successes", () => {
  const request = new Request("http://localhost", { headers: { "x-real-ip": "refund-test" } });
  const options = { maxRequests: 2, windowMs: 86_400_000 };
  const failed = reserveRateLimit(request, "refund", options);
  const successful = reserveRateLimit(request, "refund", options);
  assert.equal(successful.allowed, true);
  const blocked = reserveRateLimit(request, "refund", options);
  assert.equal(blocked.allowed, false);
  blocked.release();
  assert.equal(checkRateLimit(request, "refund", { ...options, readOnly: true }).remaining, 0);
  failed.release();
  failed.release();
  assert.equal(checkRateLimit(request, "refund", { ...options, readOnly: true }).remaining, 1);
});

test("an old reservation cannot refund a new window", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: 1000 });
  const request = new Request("http://localhost", { headers: { "x-real-ip": "expired-refund-test" } });
  const options = { maxRequests: 1, windowMs: 100 };
  const old = reserveRateLimit(request, "expired-refund", options);
  t.mock.timers.tick(101);
  reserveRateLimit(request, "expired-refund", options);
  old.release();
  assert.equal(checkRateLimit(request, "expired-refund", { ...options, readOnly: true }).remaining, 0);
});

test("refunded sample quota does not refund the separate request cost guard", () => {
  const request = new Request("http://localhost", { headers: { "x-real-ip": "request-guard-test" } });
  for (let i = 0; i < 12; i++) {
    assert.equal(checkRateLimit(request, "request-guard", { maxRequests: 12 }).allowed, true);
    reserveRateLimit(request, "sample-quota", { maxRequests: 4 }).release();
  }
  assert.equal(checkRateLimit(request, "request-guard", { maxRequests: 12 }).allowed, false);
  assert.equal(checkRateLimit(request, "sample-quota", { maxRequests: 4, readOnly: true }).remaining, 4);
});
