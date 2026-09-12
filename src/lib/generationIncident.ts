import { createHash } from "node:crypto";
import { brandedEmail, emailDetails, emailParagraph } from "./emailBrand";
import { generationFailureReason } from "./generationFailureReason";
export { generationFailureReason } from "./generationFailureReason";
export function failureModels(error: unknown) {
  const chain = []; let current = error;
  for (let i = 0; i < 4 && current; i++) { chain.push(current instanceof Error ? current.message : String(current)); current = current instanceof Error ? current.cause : undefined; }
  const message = chain.join(" ");
  return [...new Set(message.match(/gemini-[a-z0-9.-]+/gi) || [])].slice(0, 6);
}
const explanations: Record<string, string> = {
  provider_rejected: "Furnizorul a refuzat cererea prin filtrele sale. Nu putem atribui refuzul unui trademark sau fotografiei fără un motiv explicit oferit de furnizor.",
  quality_rejected: "Imaginea nu a trecut verificarea de asemănare sau calitate. Nu este o eroare de disponibilitate a modelului.",
  quality_unavailable: "Evaluatorii nu au putut verifica imaginea. Candidatul păstrat poate fi verificat din nou fără regenerare.",
  provider_busy: "Furnizorul a răspuns cu limitare de trafic sau capacitate insuficientă.",
  provider_timeout: "Modelele nu au răspuns în intervalul disponibil.",
  provider_unavailable: "Modelele încercate nu au fost disponibile sau nu au returnat o imagine.",
  billing_disabled: "Furnizorul semnalează o problemă de facturare. Verifică Google Cloud Billing.",
  budget_limit: "Generarea a atins plafonul intern. Nu se reîncearcă automat pentru a evita costuri suplimentare.",
  configuration: "Verifică permisiunile și configurarea serviciilor.",
  generation_failed: "Generarea nu a putut fi finalizată; verifică incidentul în loguri.",
};
/** One immutable payload per incident; retries and multiple instances share Resend's idempotency key. */
export async function notifyGenerationFailure(id: string, product: string, stage: string, error: unknown) {
  const code = generationFailureReason(error), models = failureModels(error);
  const incident = createHash("sha256").update(`${id}:${stage}`).digest("hex").slice(0, 32);
  console.error(JSON.stringify({ event: "pmm_generation_incident", incident, product, stage, error_code: code, models }));
  const key = process.env.RESEND_API_KEY, from = process.env.EMAIL_FROM;
  if (!key || !from) { console.error(JSON.stringify({ event: "pmm_incident_email_failed", incident, reason: "configuration" })); return; }
  const rows = [["Incident", incident], ["Produs", product], ["Etapă", stage], ["Motiv", code], ["Modele din răspuns", models.join(", ") || "Nespecificat de furnizor; vezi raportul de încercări"]] as const;
  try {
    const response = await fetch("https://api.resend.com/emails", { method: "POST", signal: AbortSignal.timeout(12_000), headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": `pmm-generation-${incident}` }, body: JSON.stringify({
      from: `Povestea Mea Magică <${from}>`, to: ["office@povestea-mea-magica.ro"], subject: `Generare oprită · ${product} · ${incident.slice(0, 8)}`,
      text: `${explanations[code]}\n\n${rows.map(([k,v]) => `${k}: ${v}`).join("\n")}\nNu sunt incluse fotografii, nume de copii sau texte introduse de clienți.`,
      html: brandedEmail({ siteUrl: "https://www.povestea-mea-magica.ro", preheader: "O generare are nevoie de verificare.", eyebrow: "Verificare necesară", title: "O generare s-a oprit", content: emailParagraph(explanations[code]) + emailDetails(rows), footer: "Notificare operațională fără datele personale ale familiei." }),
    }) });
    if (!response.ok && response.status !== 409) throw new Error(`email_${response.status}`);
  } catch { console.error(JSON.stringify({ event: "pmm_incident_email_failed", incident, reason: "delivery" })); }
}
