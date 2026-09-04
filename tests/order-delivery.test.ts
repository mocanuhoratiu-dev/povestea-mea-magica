import assert from "node:assert/strict";
import test from "node:test";
import { createOrderDeliveryUrl, type StoredOrder } from "../src/lib/orders.ts";

function order(product: StoredOrder["product"]): StoredOrder {
  return {
    id: "abcdefghijklmnop",
    productId: product === "monster" ? "night-shield" : product === "emergency" ? "patience-kit" : product === "album" ? "illustrated-album-digital" : product === "bundle" ? "complete-bundle" : "story-long",
    product,
    status: "delivered",
    configuration: {},
    createdAt: "2026-09-04T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
    expiresAt: "2026-10-04T00:00:00.000Z",
  };
}

test("standalone products open on the pages that mount their delivery clients", () => {
  const baseUrl = "https://www.povestea-mea-magica.ro";
  const token = "delivery-token";

  assert.equal(
    createOrderDeliveryUrl(order("monster"), token, baseUrl),
    `${baseUrl}/scutul-de-noapte?order=abcdefghijklmnop&token=delivery-token#monster-away`,
  );
  assert.equal(
    createOrderDeliveryUrl(order("emergency"), token, baseUrl),
    `${baseUrl}/trusa-de-rabdare?order=abcdefghijklmnop&token=delivery-token#emergency-kit`,
  );
});

test("album and bundle keep their dedicated delivery pages", () => {
  const baseUrl = "https://www.povestea-mea-magica.ro";
  const token = "delivery-token";

  assert.equal(createOrderDeliveryUrl(order("album"), token, baseUrl), `${baseUrl}/povestea-magica/livrare?order=abcdefghijklmnop&token=delivery-token`);
  assert.equal(createOrderDeliveryUrl(order("bundle"), token, baseUrl), `${baseUrl}/pachet/livrare?order=abcdefghijklmnop&token=delivery-token`);
});
