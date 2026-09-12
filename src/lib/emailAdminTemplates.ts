import { brandedEmail, emailAction, emailDetails, emailParagraph } from "./emailBrand.ts";

export function createInvoiceEmailHtml({ siteUrl, series, number, documentUrl }: { siteUrl: string; series: string; number: string; documentUrl: string }) {
  return brandedEmail({
    siteUrl, preheader: `Factura ${series} ${number} este pregătită.`, eyebrow: "Documentele comenzii tale", title: "Factura ta este pregătită",
    content: emailParagraph("Îți mulțumim că ne-ai ales. Poți deschide și descărca factura de mai jos.")
      + emailDetails([["Serie", series], ["Număr", number], ["Emitent", "Growth IT Labs SRL"]])
      + emailAction("Deschide factura", documentUrl)
      + emailParagraph("Ai o întrebare despre factură? Răspunde la acest email și te ajutăm."),
    footer: "Acesta este un mesaj tranzacțional pentru comanda ta, nu un newsletter.",
  });
}

export function createWatchdogEmailHtml({ reason, staleMinutes, rows, consoleUrl }: { reason: string; staleMinutes: number; rows: ReadonlyArray<readonly [string, string]>; consoleUrl: string }) {
  return brandedEmail({
    siteUrl: "https://www.povestea-mea-magica.ro", preheader: "O comandă are nevoie de verificare.", eyebrow: "Monitorizarea livrărilor", title: "O comandă are nevoie de atenție",
    content: emailParagraph(`${reason} Comanda nu a progresat de aproximativ ${Math.max(0, staleMinutes)} minute.`)
      + emailDetails(rows) + emailAction("Verifică în Google Cloud", consoleUrl),
    footer: "Mesaj operațional automat. Nu conține numele copilului, adresa clientului sau conținutul poveștii.",
  });
}
