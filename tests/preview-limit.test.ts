import assert from "node:assert/strict";
import test from "node:test";
import { checkRateLimit } from "../src/lib/requestProtection.ts";

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
