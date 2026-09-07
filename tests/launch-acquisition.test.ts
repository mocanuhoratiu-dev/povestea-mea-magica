import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import test from "node:test";
import { sanitizeCampaignAttribution, sanitizeCampaignValue } from "../src/lib/campaignAttribution.ts";

const root = new URL("../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");

test("campaign attribution is bounded and excludes unsafe landing URLs", () => {
  assert.equal(sanitizeCampaignValue("  meta\n ads  "), "meta ads");
  assert.deepEqual(sanitizeCampaignAttribution({
    utmSource: "facebook",
    utmMedium: "paid_social",
    utmCampaign: "lansare-septembrie",
    landingPath: "https://example.com/private",
    referrerHost: "facebook.com",
  }), {
    utmSource: "facebook",
    utmMedium: "paid_social",
    utmCampaign: "lansare-septembrie",
    referrerHost: "facebook.com",
  });
  assert.equal(sanitizeCampaignValue("x".repeat(200))?.length, 80);
});

test("launch image assets stay lightweight and social cards are 1200 by 630", () => {
  const icon = new URL("src/app/icon.png", root);
  assert.ok(statSync(icon).size < 100_000, "icon.png must stay under 100 KB");

  for (const path of [
    "public/social/og-scutul-de-noapte.webp",
    "public/social/og-trusa-de-rabdare.webp",
    "public/examples/scut/certificat-display.webp",
    "public/examples/trusa-premium/page-1-display.webp",
  ]) {
    const url = new URL(path, root);
    assert.ok(existsSync(url), `${path} must exist`);
    assert.ok(statSync(url).size < 150_000, `${path} must stay under 150 KB`);
  }

  for (const page of ["src/app/scutul-de-noapte/page.tsx", "src/app/trusa-de-rabdare/page.tsx"]) {
    const source = read(page);
    assert.match(source, /width:\s*1200/);
    assert.match(source, /height:\s*630/);
    assert.match(source, /\/social\/og-/);
  }
});

test("paid public operations verify Turnstile while the worker keeps a trusted path", () => {
  const routes = [
    "src/app/api/generate/route.ts",
    "src/app/api/generate-cover/route.ts",
    "src/app/api/lumi/route.ts",
    "src/app/api/album-preview/route.ts",
    "src/app/api/narrate/route.ts",
    "src/app/api/deliver-email/route.ts",
    "src/app/api/orders/route.ts",
  ];
  for (const route of routes) {
    const source = read(route);
    assert.match(source, /verifyTurnstileRequest/);
    assert.match(source, /turnstileRejected/);
  }

  const server = read("src/lib/turnstile.ts");
  assert.match(server, /ORDER_WORKER_SECRET/);
  assert.match(server, /siteverify/);
  assert.match(server, /verification\.action !== expectedAction/);
});

test("Meta purchase reporting is consented, verified with Stripe, and deduplicated", () => {
  const capi = read("src/app/api/marketing-conversion/route.ts");
  const client = read("src/lib/metaPixel.ts");
  assert.match(capi, /payload\.consent !== true/);
  assert.match(capi, /session\.payment_status !== "paid"/);
  assert.match(capi, /event_id: payload\.eventId/);
  assert.match(client, /eventID: eventId/);
  assert.match(client, /readMarketingConsent\(\) !== "accepted"/);
});
