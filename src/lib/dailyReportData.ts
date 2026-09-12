import { brandedEmail, emailDetails, emailParagraph } from "./emailBrand.ts";

export type ReportEntry = { insertId?: string; logName?: string; timestamp?: string; jsonPayload?: Record<string, unknown> };
export const publicReportPaths = ["/", "/povestea-magica", "/scutul-de-noapte", "/trusa-de-rabdare", "/pachet-complet", "/preturi", "/modele", "/despre", "/contact", "/cum-functioneaza", "/intrebari-frecvente", "/siguranta-ai", "/livrare-digitala", "/termeni-si-conditii", "/politica-de-confidentialitate", "/politica-cookie-uri", "/politica-de-rambursare"];
function midnight(date: string) {
  const target = Date.parse(date + "T00:00:00Z"); let value = target;
  for (let i = 0; i < 3; i++) {
    const offset = new Intl.DateTimeFormat("en", { timeZone: "Europe/Bucharest", timeZoneName: "longOffset" }).formatToParts(value).find(p => p.type === "timeZoneName")?.value || "GMT";
    const match = /GMT([+-])(\d{2}):(\d{2})/.exec(offset);
    const minutes = match ? (Number(match[2]) * 60 + Number(match[3])) * (match[1] === "+" ? 1 : -1) : 0;
    value = target - minutes * 60_000;
  }
  return new Date(value).toISOString();
}
export function previousReportWindow(now = new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const date = new Date(Date.parse(today + "T12:00:00Z") - 86_400_000).toISOString().slice(0, 10);
  return { date, start: midnight(date), end: midnight(today) };
}
export const reportEvents = ["pmm_site_visited", "pmm_page_viewed", "pmm_product_started", "pmm_album_preview_completed", "pmm_album_preview_failed", "pmm_checkout_started", "pmm_conversion_completed", "pmm_order_delivered", "pmm_order_failed", "pmm_ai_model_completed", "pmm_ai_model_attempt_failed", "pmm_image_model_output", "pmm_image_quality_checked", "pmm_generation_incident"];
export function summarizeReport(entries: ReportEntry[]) {
  const seen = new Set<string>();
  const seenIncidents = new Set<string>();
  const models: Record<string, { calls: number; failures: number; images1K: number; images2K: number; qualityRejected: number; durationMs: number }> = {};
  const incidents: Record<string, number> = {};
  const r = { visits: 0, pageViews: 0, generationStarts: 0, previewCovers: 0, previewFailures: 0, checkouts: 0, liveSales: 0, testSales: 0, unknownModeSales: 0, delivered: 0, failures: 0, revenueRon: 0, pages: {} as Record<string, number>, products: {} as Record<string, number> };
  for (const entry of entries) {
    if (entry.insertId) { const key = `${entry.logName}:${entry.timestamp}:${entry.insertId}`; if (seen.has(key)) continue; seen.add(key); }
    const p = entry.jsonPayload || {};
    if (typeof p.model === "string" && /^gemini-[a-z0-9.-]{1,90}$/.test(p.model) && ["pmm_ai_model_completed", "pmm_ai_model_attempt_failed", "pmm_image_model_output", "pmm_image_quality_checked"].includes(String(p.event))) {
      const m = models[p.model] ||= { calls: 0, failures: 0, images1K: 0, images2K: 0, qualityRejected: 0, durationMs: 0 };
      if (p.event === "pmm_ai_model_completed" || p.event === "pmm_ai_model_attempt_failed") { m.calls++; if (p.event === "pmm_ai_model_attempt_failed") m.failures++; if (typeof p.duration_ms === "number" && Number.isFinite(p.duration_ms)) m.durationMs += Math.max(0, p.duration_ms); }
      if (p.event === "pmm_image_model_output") { if (p.resolution === "1K") m.images1K++; if (p.resolution === "2K") m.images2K++; }
      if (p.event === "pmm_image_quality_checked" && p.accepted === false) m.qualityRejected++;
    }
    if (p.event === "pmm_generation_incident" && ["provider_rejected", "quality_rejected", "quality_unavailable", "provider_busy", "provider_timeout", "provider_unavailable", "billing_disabled", "budget_limit", "configuration", "generation_failed"].includes(String(p.error_code))) {
      const id = typeof p.incident === "string" ? p.incident : entry.insertId;
      if (!id || !seenIncidents.has(id)) incidents[String(p.error_code)] = (incidents[String(p.error_code)] || 0) + 1;
      if (id) seenIncidents.add(id);
    }
    switch (p.event) {
      case "pmm_site_visited": r.visits++; break;
      case "pmm_page_viewed": r.pageViews++; if (typeof p.page_path === "string" && publicReportPaths.includes(p.page_path)) r.pages[p.page_path] = (r.pages[p.page_path] || 0) + 1; break;
      case "pmm_product_started": r.generationStarts++; if (["album", "monster", "emergency", "bundle", "story"].includes(String(p.product))) r.products[String(p.product)] = (r.products[String(p.product)] || 0) + 1; break;
      case "pmm_album_preview_completed": r.previewCovers++; break;
      case "pmm_album_preview_failed": r.previewFailures++; break;
      case "pmm_checkout_started": r.checkouts++; break;
      case "pmm_conversion_completed":
        if (p.live_mode === true) { r.liveSales++; if (p.currency === "ron" && typeof p.amount_minor === "number" && Number.isFinite(p.amount_minor) && p.amount_minor >= 0) r.revenueRon += p.amount_minor / 100; }
        else if (p.live_mode === false) r.testSales++; else r.unknownModeSales++;
        break;
      case "pmm_order_delivered": r.delivered++; break;
      case "pmm_order_failed": r.failures++; break;
    }
  }
  return { ...r, models, incidents, generationsPerVisit: r.visits ? r.generationStarts / r.visits : null, conversionPercent: r.visits ? r.liveSales / r.visits * 100 : null };
}
export function reportMessage(date: string, r: ReturnType<typeof summarizeReport>) {
  const n = (v: number | null) => v === null ? "n/a" : v.toLocaleString("ro-RO", { maximumFractionDigits: 2 });
  const rows = [["Vizite de browser", r.visits], ["Vizualizări de pagină", r.pageViews], ["Generări pornite", r.generationStarts], ["Generări pornite / vizită", r.generationsPerVisit], ["Coperți de mostră finalizate", r.previewCovers], ["Mostre eșuate", r.previewFailures], ["Checkout-uri începute", r.checkouts], ["Vânzări reale confirmate", r.liveSales], ["Vânzări Stripe test", r.testSales], ["Plăți cu mod nespecificat", r.unknownModeSales], ["Vânzări reale în RON", r.revenueRon], ["Conversie reală (%)", r.conversionPercent], ["Comenzi livrate", r.delivered], ["Comenzi eșuate", r.failures]] as const;
  const breakdown = [...Object.entries(r.pages), ...Object.entries(r.products)];
  const modelRows = Object.entries(r.models).map(([model, m]) => [model, `${m.calls} apeluri, ${m.failures} erori, medie ${n(m.calls ? m.durationMs / m.calls / 1000 : null)} sec; imagini: ${m.images2K} la 2K / ${m.images1K} la 1K; ${m.qualityRejected} respingeri de calitate`] as const);
  const incidentRows = Object.entries(r.incidents).map(([code, count]) => [code, String(count)] as const);
  const note = "Ziua precedentă, ora României. Vizitele sunt sesiuni de browser, nu persoane unice; blocarea trackingului și roboții pot afecta totalurile. Generările pornite includ încercări repetate și nu sunt PDF-uri finalizate. Coperțile nu reprezintă mostre complete. Vânzările nu includ rambursări ulterioare: raportul nu este contabil. Vizualizările pe pagini sunt înregistrate de la activarea noii versiuni.";
  const diagnostics = [...modelRows, ...incidentRows];
  const diagnosticHtml = emailParagraph("Modele folosite efectiv și incidente. Numărul de imagini include candidații generați, nu doar paginile livrate. Durata este per apel; raportul nu reprezintă factura Google.") + emailDetails(diagnostics.length ? diagnostics : [["Modele", "Niciun apel înregistrat"]]);
  const text = `Raport ${date}\n${rows.map(([k,v])=>`${k}: ${n(v)}`).join("\n")}\n\nPagini și generări per produs:\n${breakdown.map(([k,v])=>`${k}: ${v}`).join("\n")}\n\n${note}`;
  const html = brandedEmail({ siteUrl: "https://www.povestea-mea-magica.ro", preheader: `Raportul zilei ${date}: trafic, generări, vânzări și livrări.`, eyebrow: "Activitatea platformei", title: `Raportul zilei ${date}`, content: emailParagraph("O privire de ansamblu asupra zilei de ieri. Plățile de test sunt separate de vânzările reale.") + emailDetails(rows.map(([label, value]) => [label, n(value)] as const)) + '<h2 style="margin:28px 0 16px;color:#0b2035;font-family:Georgia,serif;font-size:24px;line-height:30px;">Pagini și generări per produs</h2>' + (breakdown.length ? emailDetails(breakdown.map(([label, value]) => [label, String(value)] as const)) : emailParagraph("Nu sunt înregistrate evenimente pentru acest interval.")) + emailParagraph(note) + diagnosticHtml, footer: "Raport operațional agregat. Nu conține date personale ale clienților." });
  return { text: text + "\n\nModele și incidente:\n" + diagnostics.map(([k,v]) => `${k}: ${v}`).join("\n"), html };
}
