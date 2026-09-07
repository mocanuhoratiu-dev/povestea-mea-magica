import { timingSafeEqual } from "node:crypto";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type TurnstileResponse = {
  success?: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
};

function clientAddress(request: Request) {
  const addresses = request.headers.get("x-forwarded-for")?.split(",").map((item) => item.trim()).filter(Boolean);
  return request.headers.get("cf-connecting-ip") || addresses?.[0] || request.headers.get("x-real-ip") || "";
}

function isTrustedWorker(request: Request) {
  const configured = process.env.ORDER_WORKER_SECRET?.trim();
  const received = request.headers.get("x-pmm-order-worker") || "";
  if (!configured || !received) return false;
  const expected = Buffer.from(configured);
  const supplied = Buffer.from(received);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

export function isTurnstileConfigured() {
  return Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());
}

export async function verifyTurnstileRequest(request: Request, expectedAction: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret || isTrustedWorker(request)) return true;

  const token = request.headers.get("x-pmm-turnstile-token")?.trim();
  const action = request.headers.get("x-pmm-turnstile-action")?.trim();
  if (!token || token.length > 2_048 || action !== expectedAction) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7_000);
  try {
    const form = new URLSearchParams({ secret, response: token });
    const remoteIp = clientAddress(request);
    if (remoteIp) form.set("remoteip", remoteIp);
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) return false;
    const verification = await response.json() as TurnstileResponse;
    if (!verification.success || verification.action !== expectedAction) return false;

    const allowedHostnames = (process.env.TURNSTILE_ALLOWED_HOSTNAMES || "www.povestea-mea-magica.ro,povestea-mea-magica.ro")
      .split(/[,|;]/)
      .map((hostname) => hostname.trim().toLowerCase())
      .filter(Boolean);
    return !verification.hostname || allowedHostnames.includes(verification.hostname.toLowerCase());
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export function turnstileRejected() {
  return Response.json(
    { error: "Verificarea de securitate nu a putut fi confirmată. Reîncearcă o dată." },
    { status: 403 },
  );
}
