export const LAUNCH_AT = "2026-09-18T18:00:00+03:00";
export const LAUNCH_TIMEZONE = "Europe/Bucharest";
export const LAUNCH_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
} as const;

type LaunchEnvironment = { LAUNCH_GATE_ENABLED?: string; LAUNCH_AT?: string };
const launchEnvironment = (): LaunchEnvironment => ({
  LAUNCH_GATE_ENABLED: process.env.LAUNCH_GATE_ENABLED,
  LAUNCH_AT: process.env.LAUNCH_AT,
});

export function launchState(env: LaunchEnvironment = launchEnvironment(), now = Date.now()) {
  const configured = env.LAUNCH_AT || LAUNCH_AT;
  // Require an explicit offset. A bad rollout must never leave the shop closed.
  const valid = /(?:Z|[+-]\d{2}:\d{2})$/.test(configured) && Number.isFinite(Date.parse(configured));
  const enabled = env.LAUNCH_GATE_ENABLED === "true" && valid;
  const launchAt = valid ? new Date(configured).toISOString() : new Date(LAUNCH_AT).toISOString();
  return { enabled, launchAt, serverNow: now, timeZone: LAUNCH_TIMEZONE, open: !enabled || now >= Date.parse(launchAt) };
}

const availablePages = new Set([
  "/in-curand", "/acces-preview", "/acces-preview/iesire", "/contact", "/termeni-si-conditii", "/politica-de-confidentialitate",
  "/politica-cookie-uri", "/politica-de-rambursare", "/livrare-digitala", "/siguranta-ai",
  "/comanda-confirmata", "/povestea-magica/livrare", "/album-ilustrat/livrare", "/pachet/livrare",
]);

export function shouldShowLaunchPage(pathname: string, method: string, env: LaunchEnvironment = launchEnvironment(), now = Date.now()) {
  if ((method !== "GET" && method !== "HEAD") || launchState(env, now).open) return false;
  const path = pathname.replace(/\/+$/, "") || "/";
  if (availablePages.has(path) || path === "/api" || path.startsWith("/api/")) return false;
  if (path.startsWith("/_next/") || path.startsWith("/launch/") || /\/[^/]+\.[^/]+$/.test(path)) return false;
  return true;
}

export function launchCalendar() {
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Povestea Mea Magica//Lansare//RO", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT", "UID:lansare-20260918@povestea-mea-magica.ro", "DTSTAMP:20260915T120000Z",
    "DTSTART:20260918T150000Z", "DTEND:20260918T153000Z",
    "SUMMARY:Lansare Povestea Mea Magică", "DESCRIPTION:Povești. Curaj. Descoperiri. Deschidem povestea!",
    "URL:https://www.povestea-mea-magica.ro/", "LOCATION:https://www.povestea-mea-magica.ro/",
    "BEGIN:VALARM", "TRIGGER:-PT15M", "ACTION:DISPLAY", "DESCRIPTION:Povestea începe în 15 minute.",
    "END:VALARM", "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
}
