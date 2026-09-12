import { GoogleAuth } from "google-auth-library";
import { previousReportWindow, reportEvents, summarizeReport, reportMessage, type ReportEntry } from "./dailyReportData";

// Daily aggregate email to the address explicitly approved by the site owner.
export async function deliverDailyReport() {
  const project = process.env.VERTEX_AI_PROJECT_ID, key = process.env.RESEND_API_KEY, from = process.env.EMAIL_FROM;
  if (!project || !key || !from) throw new Error("daily_report_configuration");
  const window = previousReportWindow();
  const client = await new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] }).getClient();
  const access = await client.getAccessToken();
  if (!access.token) throw new Error("daily_report_auth");
  const headers = { Authorization: `Bearer ${access.token}`, "Content-Type": "application/json" };
  const collection = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/dailyReports`, url = `${collection}/${window.date}`;
  let saved = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
  if (saved.status === 404) {
    const entries: ReportEntry[] = []; let pageToken: string | undefined;
    do {
      const response = await fetch("https://logging.googleapis.com/v2/entries:list", { method: "POST", headers, signal: AbortSignal.timeout(20000), body: JSON.stringify({ resourceNames: [`projects/${project}`], filter: `resource.type="cloud_run_revision" AND (resource.labels.service_name="povestea-mea-magica" OR resource.labels.service_name="povestea-mea-magica-domain") AND timestamp>="${window.start}" AND timestamp<"${window.end}" AND jsonPayload.event=(${reportEvents.map(e=>`"${e}"`).join(" OR ")})`, pageSize: 1000, pageToken, orderBy: "timestamp asc" }) });
      if (!response.ok) throw new Error(`daily_report_logs_${response.status}`);
      const page = await response.json() as { entries?: ReportEntry[]; nextPageToken?: string };
      entries.push(...(page.entries || [])); pageToken = page.nextPageToken;
      if (entries.length >= 20000 && pageToken) throw new Error("daily_report_too_large_no_partial_email");
    } while (pageToken);
    const summary = summarizeReport(entries), message = reportMessage(window.date, summary);
    const created = await fetch(`${collection}?documentId=${window.date}`, { method: "POST", headers, signal: AbortSignal.timeout(20000), body: JSON.stringify({ fields: { date: { stringValue: window.date }, summary: { stringValue: JSON.stringify(summary) }, html: { stringValue: message.html }, text: { stringValue: message.text }, recipient: { stringValue: "office@povestea-mea-magica.ro" }, sender: { stringValue: from }, sent: { booleanValue: false } } }) });
    if (!created.ok && created.status !== 409) throw new Error(`daily_report_store_${created.status}`);
    saved = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
  }
  if (!saved.ok) throw new Error(`daily_report_read_${saved.status}`);
  const { fields: f } = await saved.json() as { fields: Record<string, { stringValue?: string; booleanValue?: boolean }> };
  if (f.sent?.booleanValue) return { date: window.date, status: "already_sent" };
  const response = await fetch("https://api.resend.com/emails", { method: "POST", signal: AbortSignal.timeout(20000), headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": `pmm-daily-report-${window.date}` }, body: JSON.stringify({ from: `Povestea Mea Magică <${f.sender.stringValue}>`, to: [f.recipient.stringValue], subject: `Povestea Mea Magică · Raport ${window.date}`, html: f.html.stringValue, text: f.text.stringValue }) });
  if (!response.ok) throw new Error(`daily_report_email_${response.status}`);
  const marked = await fetch(`${url}?updateMask.fieldPaths=sent`, { method: "PATCH", headers, signal: AbortSignal.timeout(20000), body: JSON.stringify({ fields: { sent: { booleanValue: true } } }) });
  if (!marked.ok) throw new Error("daily_report_delivery_checkpoint");
  return { date: window.date, status: "sent" };
}
