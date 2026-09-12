import { mkdir, writeFile } from "node:fs/promises";
import { createReadyEmailHtml } from "../src/lib/emailTemplates.ts";
import { createInvoiceEmailHtml, createWatchdogEmailHtml } from "../src/lib/emailAdminTemplates.ts";
import { reportMessage, summarizeReport } from "../src/lib/dailyReportData.ts";

const out = "/private/tmp/pmm-email-brand-preview";
const siteUrl = "https://www.povestea-mea-magica.ro";
await mkdir(out, { recursive: true });
const examples = [
  ["poveste", "Povestea Magică", createReadyEmailHtml({ product: "album", childName: "Erica", siteUrl, deliveryMode: "secure-link", deliveryUrl: `${siteUrl}/povestea-magica/livrare?exemplu=1` })],
  ["atelier", "Atelierul Scutului Magic", createReadyEmailHtml({ product: "monster", childName: "Erica", siteUrl, deliveryMode: "secure-link", deliveryUrl: `${siteUrl}/scutul-de-noapte?exemplu=1` })],
  ["explorator", "Dosarul Micului Explorator", createReadyEmailHtml({ product: "emergency", childName: "Raul", siteUrl, deliveryMode: "attachment" })],
  ["pachet", "Pachetul Complet", createReadyEmailHtml({ product: "complete_bundle", siteUrl, deliveryMode: "secure-link", deliveryUrl: `${siteUrl}/pachet/livrare?exemplu=1` })],
  ["factura", "Factură (exemplu)", createInvoiceEmailHtml({ siteUrl, series: "EXEMPLU", number: "0001", documentUrl: `${siteUrl}/contact?exemplu=1` })],
  ["alerta", "Alertă operațională", createWatchdogEmailHtml({ reason: "Exemplu de alertă, nu este o comandă reală.", staleMinutes: 40, rows: [["Comandă", "exemplu-uat"], ["Produs", "Povestea Magică"], ["Etapă", "trimiterea emailului"]], consoleUrl: "https://console.cloud.google.com/" })],
  ["raport", "Raport zilnic (date fictive)", reportMessage("2026-09-10", summarizeReport([])).html],
] as const;
for (const [id, , html] of examples) await writeFile(`${out}/${id}.html`, html);
await writeFile(`${out}/index.html`, `<!doctype html><html lang="ro"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Emailuri · Povestea Mea Magică</title><style>body{margin:0;background:#edf2f6;color:#0b2035;font:15px Arial,sans-serif}header{padding:24px;background:#0b2035;color:white}h1{font:28px Georgia,serif;margin:0 0 12px}nav{display:flex;gap:12px;flex-wrap:wrap}a{color:inherit;padding:10px 0}main{max-width:1280px;margin:24px auto;padding:0 16px;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr));gap:28px}iframe{width:100%;height:1060px;border:1px solid #dbe3e9;background:#fff}h2{font:22px Georgia,serif}</style><header><h1>Noua identitate, în inbox</h1><p>Mostre vizuale. Nicio comandă sau factură reală; niciun email trimis.</p><nav>${examples.map(([id,label])=>`<a href="${id}.html">${label}</a>`).join("")}</nav></header><main>${examples.map(([id,label])=>`<section><h2>${label}</h2><iframe src="${id}.html" title="${label}" loading="lazy"></iframe><a href="${id}.html">Deschide emailul complet</a></section>`).join("")}</main></html>`);
console.log(`${out}/index.html`);
