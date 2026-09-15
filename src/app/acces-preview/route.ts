import { NextRequest, NextResponse } from "next/server";
import { LAUNCH_HEADERS } from "@/lib/launchGate";
import { issuePreviewSession, previewConfigured, previewCookie, readPreviewForm, safePreviewReturn, validPreviewOrigin, verifyPreviewPassword, verifyPreviewSession } from "@/lib/launchPreview";
import { launchPreviewPage } from "@/lib/launchPreviewPage";
import { checkRateLimit } from "@/lib/requestProtection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function page(options: Parameters<typeof launchPreviewPage>[0], status = 200, headers: Record<string, string> = {}) {
  return new NextResponse(launchPreviewPage(options), { status, headers: {
    ...LAUNCH_HEADERS, "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex, nofollow, noarchive", ...headers,
  } });
}

export function GET(request: NextRequest) {
  const cookie = previewCookie(request.nextUrl);
  const session = verifyPreviewSession(request.cookies.get(cookie.name)?.value);
  return page({
    next: safePreviewReturn(request.nextUrl.searchParams.get("next")),
    expiresAt: session?.expiresAt, configured: previewConfigured(),
    error: request.nextUrl.searchParams.has("expired") ? "Accesul tău a expirat. Introdu parola pentru a continua." : "",
  });
}

export async function POST(request: NextRequest) {
  if (!validPreviewOrigin(request)) return page({ error: "Cererea nu a fost acceptată. Revino la pagina de acces." }, 403);
  if (!previewConfigured()) return page({ configured: false }, 503);
  const rate = checkRateLimit(request, "launch-preview-login", { windowMs: 15 * 60 * 1000, maxRequests: 8 });
  if (!rate.allowed) return page({ error: "Prea multe încercări. Așteaptă 15 minute înainte de a reîncerca." }, 429, { "Retry-After": String(rate.retryAfterSeconds) });
  let form: Awaited<ReturnType<typeof readPreviewForm>>;
  try { form = await readPreviewForm(request); }
  catch (error) { return page({ error: "Cererea nu este validă. Introdu din nou parola." }, error instanceof Error && error.message === "too_large" ? 413 : 400); }
  if (!await verifyPreviewPassword(form.password)) return page({ next: form.next, error: "Parola nu este corectă. Încearcă din nou." }, 401);
  const { name, ...options } = previewCookie(request.nextUrl);
  const response = new NextResponse(null, { status: 303, headers: { ...LAUNCH_HEADERS, Location: form.next } });
  response.cookies.set(name, issuePreviewSession(), options);
  return response;
}
