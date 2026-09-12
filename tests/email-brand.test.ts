import test from "node:test";
import assert from "node:assert/strict";
import { createReadyEmailHtml, createReadyEmailText, productEmailCopy } from "../src/lib/emailTemplates.ts";
import { createInvoiceEmailHtml, createWatchdogEmailHtml } from "../src/lib/emailAdminTemplates.ts";
import { reportMessage, summarizeReport } from "../src/lib/dailyReportData.ts";

const siteUrl = "https://www.povestea-mea-magica.ro";
test("all products preserve secure links and attachment delivery without unsafe HTML", () => {
  for (const product of Object.keys(productEmailCopy) as (keyof typeof productEmailCopy)[]) {
    const html = createReadyEmailHtml({ product, childName: 'Ana <img onerror="bad">', siteUrl, deliveryMode: "secure-link", deliveryUrl: `${siteUrl}/livrare?order=test&token=abc` });
    assert(html.includes("order=test&amp;token=abc"));
    assert(!html.includes('<img onerror="bad">'));
    assert(html.includes('charset="utf-8"'));
    assert(html.includes("30 de zile"));
    assert(Buffer.byteLength(html) < 25000);
    const attached = createReadyEmailHtml({ product, siteUrl, deliveryMode: "attachment" });
    assert(attached.includes("atașate"));
    assert(!attached.includes("Linkul privat"));
    assert(!attached.includes("Din linkul privat"));
    assert(createReadyEmailText({ product, deliveryMode: "attachment" }).includes("office@povestea-mea-magica.ro"));
  }
  assert.throws(() => createReadyEmailHtml({ product: "album", siteUrl, deliveryMode: "secure-link" }));
  assert.throws(() => createReadyEmailHtml({ product: "album", siteUrl, deliveryMode: "secure-link", deliveryUrl: "javascript:alert(1)" }));
});
test("invoice, alert and report use the same brand without changing operational data", () => {
  const invoice = createInvoiceEmailHtml({ siteUrl, series: "TEST<script>", number: "1", documentUrl: "https://example.com/invoice?x=1&y=2" });
  const alert = createWatchdogEmailHtml({ reason: "Verificare <script>", staleMinutes: 40, rows: [["Comandă", "uat-123"]], consoleUrl: "https://console.cloud.google.com/" });
  const report = reportMessage("2026-09-10", summarizeReport([])).html;
  for (const html of [invoice, alert, report]) {
    assert(html.includes("/brand/email-emblem.png"));
    assert(html.includes("Povești. Curaj. Descoperiri."));
    assert(!html.includes("<script>"));
    assert(!html.includes("#8b5daf"));
    assert(html.includes('role="presentation"'));
  }
  assert(invoice.includes("TEST&lt;script&gt;"));
  assert(alert.includes("uat-123"));
  assert(report.includes("Nu sunt înregistrate evenimente"));
});
