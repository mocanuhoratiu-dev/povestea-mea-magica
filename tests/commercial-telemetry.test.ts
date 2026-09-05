import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { commercialProductFromMetadata, commercialTelemetryFields, promotionCodeFromSession } from "../src/lib/commercialTelemetry.ts";

test("commercial events map every active checkout product to an aggregate product", () => {
  assert.equal(commercialProductFromMetadata({ product_id: "night-shield" }), "monster");
  assert.equal(commercialProductFromMetadata({ product_id: "patience-kit" }), "emergency");
  assert.equal(commercialProductFromMetadata({ product_id: "complete-bundle" }), "bundle");
  assert.equal(commercialProductFromMetadata({ product_id: "illustrated-album-digital" }), "album");
  assert.equal(commercialProductFromMetadata({ product_id: "story-long" }), undefined);
});

test("commercial fields expose only bounded aggregate payment values", () => {
  const fields = commercialTelemetryFields({
    amount_total: 5_310,
    currency: "RON",
    livemode: false,
    total_details: { amount_discount: 590 },
    discounts: [{ promotion_code: { code: "MAGIE10" } }],
    metadata: { customer_email: "ignored@example.com" },
  });

  assert.deepEqual(fields, {
    amountMinor: 5_310,
    discountAmountMinor: 590,
    currency: "ron",
    liveMode: false,
    promotionCode: "MAGIE10",
  });
  assert.doesNotMatch(JSON.stringify(fields), /example\.com/);
});

test("promotion codes are allow-listed before they reach logs", () => {
  assert.equal(promotionCodeFromSession({ discounts: [{ promotion_code: { code: " POVESTECADOU100 " } }] }), "POVESTECADOU100");
  assert.equal(promotionCodeFromSession({ discounts: [{ promotion_code: { code: "private email@example.com" } }] }), undefined);
  assert.equal(promotionCodeFromSession({ discounts: [{ promotion_code: "promo_internal_id" }] }), undefined);
});

test("commercial monitoring provisions the complete launch funnel", () => {
  const metrics = readFileSync(new URL("../scripts/setup-commercial-telemetry.sh", import.meta.url), "utf8");
  const dashboard = readFileSync(new URL("../scripts/setup-commercial-dashboard.sh", import.meta.url), "utf8");

  for (const metric of ["pmm_album_product_ctas", "pmm_checkout_starts", "pmm_payments_succeeded", "pmm_payment_failures", "pmm_promotion_uses", "pmm_conversions", "pmm_orders_delivered", "pmm_verified_reviews"]) {
    assert.match(metrics, new RegExp(`\\b${metric}\\b`));
    assert.match(dashboard, new RegExp(`\\b${metric}\\b`));
  }
});
