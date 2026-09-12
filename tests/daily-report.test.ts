import test from "node:test";
import assert from "node:assert/strict";
import { previousReportWindow, summarizeReport, reportMessage } from "../src/lib/dailyReportData.ts";

test("report uses previous Bucharest day including DST transitions", () => {
  const spring = previousReportWindow(new Date("2026-03-30T06:00:00Z"));
  assert.equal(spring.date, "2026-03-29");
  assert.equal((Date.parse(spring.end) - Date.parse(spring.start)) / 3600000, 23);
  const autumn = previousReportWindow(new Date("2026-10-26T07:00:00Z"));
  assert.equal((Date.parse(autumn.end) - Date.parse(autumn.start)) / 3600000, 25);
});
test("report separates test sales and ignores personal fields", () => {
  const event = (event: string, fields = {}) => ({ jsonPayload: { event, ...fields } });
  const sale = { insertId: "one", ...event("pmm_conversion_completed", { live_mode: true, amount_minor: 5900, currency: "ron" }) };
  const r = summarizeReport([event("pmm_site_visited"), event("pmm_product_started", { product: "album", childName: "PRIVATE" }), sale, sale, event("pmm_conversion_completed", { live_mode: false, amount_minor: 5900, currency: "ron" }), event("pmm_conversion_completed", { live_mode: "true" }), event("pmm_page_viewed", { page_path: "/orders/PRIVATE?token=SECRET" })]);
  assert.equal(r.liveSales, 1); assert.equal(r.testSales, 1); assert.equal(r.unknownModeSales, 1);
  assert.equal(r.revenueRon, 59); assert.equal(r.generationsPerVisit, 1);
  assert.deepEqual(r.pages, {}); assert.deepEqual(r.products, { album: 1 });
  assert.doesNotMatch(reportMessage("2026-09-10", r).html, /PRIVATE|SECRET/);
  assert.equal(summarizeReport([]).conversionPercent, null);
});
