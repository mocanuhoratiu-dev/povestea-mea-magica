import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

export const PREVIEW_SESSION_SECONDS = 8 * 60 * 60;
export type PreviewEnvironment = {
  LAUNCH_PREVIEW_PASSWORD_HASH?: string;
  LAUNCH_PREVIEW_SESSION_SECRET?: string;
  LAUNCH_PREVIEW_ALLOW_LOCAL_HTTP?: string;
  K_SERVICE?: string;
  VERCEL?: string;
};

const passwordPattern = /^scrypt\$32768\$8\$1\$([a-f0-9]{32})\$([a-f0-9]{128})$/;
const previewEnvironment = (): PreviewEnvironment => ({
  LAUNCH_PREVIEW_PASSWORD_HASH: process.env.LAUNCH_PREVIEW_PASSWORD_HASH,
  LAUNCH_PREVIEW_SESSION_SECRET: process.env.LAUNCH_PREVIEW_SESSION_SECRET,
  LAUNCH_PREVIEW_ALLOW_LOCAL_HTTP: process.env.LAUNCH_PREVIEW_ALLOW_LOCAL_HTTP,
  K_SERVICE: process.env.K_SERVICE,
  VERCEL: process.env.VERCEL,
});

export function previewConfigured(env: PreviewEnvironment = previewEnvironment()) {
  return passwordPattern.test(env.LAUNCH_PREVIEW_PASSWORD_HASH || "")
    && /^[a-f0-9]{64}$/.test(env.LAUNCH_PREVIEW_SESSION_SECRET || "");
}

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error); else resolve(key);
    });
  });
}

export async function hashPreviewPassword(password: string) {
  if (password.length < 16 || password.length > 256) throw new Error("invalid_password_length");
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$32768$8$1$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPreviewPassword(password: string, env: PreviewEnvironment = previewEnvironment()) {
  if (!previewConfigured(env) || !password || password.length > 256) return false;
  const match = env.LAUNCH_PREVIEW_PASSWORD_HASH!.match(passwordPattern)!;
  const actual = await derive(password, Buffer.from(match[1], "hex"));
  return timingSafeEqual(actual, Buffer.from(match[2], "hex"));
}

function passwordVersion(env: PreviewEnvironment) {
  return createHash("sha256").update(env.LAUNCH_PREVIEW_PASSWORD_HASH!).digest("hex");
}

function signature(payload: string, env: PreviewEnvironment) {
  return createHmac("sha256", Buffer.from(env.LAUNCH_PREVIEW_SESSION_SECRET!, "hex")).update(payload).digest();
}

export function issuePreviewSession(env: PreviewEnvironment = previewEnvironment(), now = Date.now()) {
  if (!previewConfigured(env)) throw new Error("preview_not_configured");
  const issuedAt = Math.floor(now / 1000);
  const payload = Buffer.from(JSON.stringify({
    v: 1, aud: "pmm-launch-preview", iat: issuedAt, exp: issuedAt + PREVIEW_SESSION_SECONDS,
    nonce: randomBytes(16).toString("hex"), pv: passwordVersion(env),
  })).toString("base64url");
  return `${payload}.${signature(payload, env).toString("base64url")}`;
}

export function verifyPreviewSession(token: string | undefined, env: PreviewEnvironment = previewEnvironment(), now = Date.now()) {
  if (!previewConfigured(env) || !token || token.length > 1024) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[A-Za-z0-9_-]{43}$/.test(parts[1])) return null;
  const expected = signature(parts[0], env);
  const received = Buffer.from(parts[1], "base64url");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    const seconds = Math.floor(now / 1000);
    if (!data || data.v !== 1 || data.aud !== "pmm-launch-preview"
      || !Number.isSafeInteger(data.iat) || !Number.isSafeInteger(data.exp)
      || data.iat > seconds || data.exp <= seconds || data.exp - data.iat !== PREVIEW_SESSION_SECONDS
      || !/^[a-f0-9]{32}$/.test(data.nonce) || data.pv !== passwordVersion(env)) return null;
    return { expiresAt: data.exp * 1000 };
  } catch { return null; }
}

function localHttp(url: URL, env: PreviewEnvironment) {
  return env.LAUNCH_PREVIEW_ALLOW_LOCAL_HTTP === "true" && !env.K_SERVICE && !env.VERCEL
    && url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
}

export function previewCookie(url: URL, env: PreviewEnvironment = previewEnvironment()) {
  const local = localHttp(url, env);
  return {
    name: local ? "pmm-launch-preview-local" : "__Host-pmm-launch-preview",
    httpOnly: true, secure: !local, sameSite: "lax" as const, path: "/", maxAge: PREVIEW_SESSION_SECONDS,
  };
}

export function validPreviewOrigin(request: Request, env: PreviewEnvironment = previewEnvironment()) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (localHttp(url, env)) {
    // NextURL normalizes loopback IPs to localhost. Accept only loopback origins
    // on this exact port, and only in the explicit, non-hosted local preview.
    try {
      const source = new URL(origin || "");
      return origin === source.origin && localHttp(source, env) && source.port === url.port;
    } catch { return false; }
  }
  return origin === "https://www.povestea-mea-magica.ro";
}

export function safePreviewReturn(value: string | null | undefined) {
  if (!value || value.length > 2048 || !value.startsWith("/") || value.startsWith("//") || /[\\\x00-\x20]/.test(value)) return "/";
  try {
    const url = new URL(value, "https://www.povestea-mea-magica.ro");
    const decoded = decodeURIComponent(url.pathname);
    if (url.origin !== "https://www.povestea-mea-magica.ro" || /[\\\x00-\x20]/.test(decoded)
      || decoded.startsWith("//") || /^\/(api|acces-preview|_next|launch)(\/|$)/.test(decoded)) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return "/"; }
}

export async function readPreviewForm(request: Request) {
  const limit = 4096;
  if (Number(request.headers.get("content-length") || 0) > limit) throw new Error("too_large");
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/x-www-form-urlencoded") throw new Error("invalid_form");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("invalid_form");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new Error("too_large"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const form = new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
  if (form.getAll("password").length !== 1 || form.getAll("next").length > 1) throw new Error("invalid_form");
  return { password: form.get("password")!, next: safePreviewReturn(form.get("next")) };
}
