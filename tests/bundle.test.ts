import assert from "node:assert/strict";
import test from "node:test";
import { bundleVariantForProductId, readBundleConfiguration } from "../src/lib/bundle.ts";
import { checkoutCatalog } from "../src/lib/catalog.ts";
import { createReadyEmailSubject, productEmailCopy } from "../src/lib/emailTemplates.ts";

function item(product: "story" | "monster" | "emergency" | "album") {
  return { product, configuration: { generation: { type: product } } };
}

const familyConfiguration = { items: [item("story"), item("monster"), item("emergency")] };
const completeConfiguration = { items: [item("album"), item("monster"), item("emergency")] };

test("bundle product ids resolve to distinct variants", () => {
  assert.equal(bundleVariantForProductId("family-bundle"), "family");
  assert.equal(bundleVariantForProductId("complete-bundle"), "complete");
  assert.equal(bundleVariantForProductId("story-long"), null);
});

test("family bundle accepts exactly the three family materials", () => {
  assert.equal(readBundleConfiguration(familyConfiguration, "family")?.length, 3);
  assert.equal(readBundleConfiguration(completeConfiguration, "family"), null);
});

test("complete bundle requires the three current products", () => {
  assert.equal(readBundleConfiguration(completeConfiguration, "complete")?.length, 3);
  assert.equal(readBundleConfiguration(familyConfiguration, "complete"), null);
  assert.equal(readBundleConfiguration({ items: [item("album"), item("monster"), item("monster")] }, "complete"), null);
});

test("complete bundle has the approved price and delivery copy", () => {
  assert.equal(checkoutCatalog["family-bundle"].amount, 4_900);
  assert.equal(checkoutCatalog["complete-bundle"].amount, 7_900);
  assert.match(productEmailCopy.complete_bundle.message, /patru PDF-uri/i);
  assert.doesNotMatch(productEmailCopy.complete_bundle.message, /cinci/i);
  assert.equal(createReadyEmailSubject("complete_bundle"), "Pachetul Complet Povestea Mea Magică este gata");
});
