import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { hashPreviewPassword, issuePreviewSession, PREVIEW_SESSION_SECONDS, previewConfigured, previewCookie, readPreviewForm, safePreviewReturn, validPreviewOrigin, verifyPreviewPassword, verifyPreviewSession } from "../src/lib/launchPreview.ts";
import { launchPreviewPage } from "../src/lib/launchPreviewPage.ts";

const password = "test-password-not-a-real-credential";
const env = { LAUNCH_PREVIEW_PASSWORD_HASH: await hashPreviewPassword(password), LAUNCH_PREVIEW_SESSION_SECRET: "ab".repeat(32) };
const local = { ...env, LAUNCH_PREVIEW_ALLOW_LOCAL_HTTP: "true" };
const now = Date.parse("2026-09-15T12:00:00Z");

test("passwords use salted scrypt and constant-time verification; invalid config fails closed", async () => {
  assert.equal(previewConfigured(env), true);
  assert.equal(await verifyPreviewPassword(password, env), true);
  assert.equal(await verifyPreviewPassword("incorrect", env), false);
  assert.equal(await verifyPreviewPassword("x".repeat(257), env), false);
  assert.equal(await verifyPreviewPassword(password, {}), false);
  assert.equal(previewConfigured({ ...env, LAUNCH_PREVIEW_SESSION_SECRET: "short" }), false);
  assert.equal(previewConfigured({ ...env, LAUNCH_PREVIEW_PASSWORD_HASH: "scrypt$999999999$8$1$invalid" }), false);
  assert.notEqual(await hashPreviewPassword(password), env.LAUNCH_PREVIEW_PASSWORD_HASH);
  await assert.rejects(hashPreviewPassword("short"));
  assert.throws(() => issuePreviewSession({}));
});

test("signed owner access lasts exactly eight hours with no sliding extension", () => {
  const token = issuePreviewSession(env, now);
  const expiry = now + PREVIEW_SESSION_SECONDS * 1000;
  assert.deepEqual(verifyPreviewSession(token, env, now), { expiresAt: expiry });
  assert.deepEqual(verifyPreviewSession(token, env, expiry - 1), { expiresAt: expiry });
  assert.equal(verifyPreviewSession(token, env, expiry), null);
  assert.equal(verifyPreviewSession(token, env, now - 1000), null);
  assert.notEqual(issuePreviewSession(env, now), token);
});

test("forged, malformed or oversized sessions never bypass launch", () => {
  const token = issuePreviewSession(env, now);
  const [payload, mac] = token.split(".");
  for (const invalid of [undefined, "", "true", "x".repeat(2000), `${payload}.${mac}.extra`, `${payload}.invalid`, `x${payload}.${mac}`]) {
    assert.equal(verifyPreviewSession(invalid, env, now), null);
  }
  const content = JSON.parse(Buffer.from(payload, "base64url").toString());
  for (const change of [{ aud: "different-audience" }, { v: 2 }, { exp: content.exp + 100 }, { iat: "123" }, { nonce: "" }, { pv: "different-password" }]) {
    const altered = Buffer.from(JSON.stringify({ ...content, ...change })).toString("base64url");
    const signed = createHmac("sha256", Buffer.from(env.LAUNCH_PREVIEW_SESSION_SECRET, "hex")).update(altered).digest("base64url");
    assert.equal(verifyPreviewSession(`${altered}.${signed}`, env, now), null);
  }
});

test("rotating either password or session secret invalidates existing access", async () => {
  const token = issuePreviewSession(env, now);
  assert.equal(verifyPreviewSession(token, {}, now), null);
  assert.equal(verifyPreviewSession(token, { ...env, LAUNCH_PREVIEW_SESSION_SECRET: "cd".repeat(32) }, now), null);
  assert.equal(verifyPreviewSession(token, { ...env, LAUNCH_PREVIEW_PASSWORD_HASH: await hashPreviewPassword("a-different-strong-password") }, now), null);
});

test("production cookie is host-only, Secure, HttpOnly and SameSite, including behind Cloud Run", () => {
  for (const url of ["https://www.povestea-mea-magica.ro", "http://internal-cloudrun:8080", "http://localhost:3016"]) {
    const cookie = previewCookie(new URL(url), env);
    assert.equal(cookie.name, "__Host-pmm-launch-preview");
    assert.equal(cookie.secure, true);
    assert.equal(cookie.httpOnly, true);
    assert.equal(cookie.sameSite, "lax");
    assert.equal(cookie.path, "/");
    assert.equal(cookie.maxAge, 28800);
    assert.equal("domain" in cookie, false);
  }
});

test("insecure development cookie requires explicit loopback exception, never Cloud Run", () => {
  assert.equal(previewCookie(new URL("http://127.0.0.1:3016"), local).secure, false);
  assert.equal(previewCookie(new URL("http://localhost:3016"), local).name, "pmm-launch-preview-local");
  for (const url of ["http://www.povestea-mea-magica.ro", "https://127.0.0.1:3016", "http://localhost.evil.com:3016"]) {
    assert.equal(previewCookie(new URL(url), local).secure, true);
  }
  assert.equal(previewCookie(new URL("http://localhost:8080"), { ...local, K_SERVICE: "pmm" }).secure, true);
  assert.equal(previewCookie(new URL("http://localhost:8080"), { ...local, VERCEL: "1" }).secure, true);
});

test("POST requires exact trusted origin, not spoofed Host or an external form", () => {
  const url = "http://127.0.0.1:3016/acces-preview";
  const origin = "http://127.0.0.1:3016";
  assert.equal(validPreviewOrigin(new Request(url, { headers: { origin } }), local), true);
  assert.equal(validPreviewOrigin(new Request("http://localhost:3016/acces-preview", { headers: { origin } }), local), true);
  for (const origin of ["https://evil.com", "null", "http://127.0.0.1:3017", ""]) {
    assert.equal(validPreviewOrigin(new Request(url, { headers: { origin } }), local), false);
  }
  assert.equal(validPreviewOrigin(new Request(url, { headers: { origin, "sec-fetch-site": "cross-site" } }), local), false);
  assert.equal(validPreviewOrigin(new Request("http://internal:8080/acces-preview", { headers: { origin: "https://www.povestea-mea-magica.ro" } }), env), true);
  assert.equal(validPreviewOrigin(new Request("https://evil.com/acces-preview", { headers: { origin: "https://evil.com", "x-forwarded-host": "evil.com" } }), env), false);
});

test("return address keeps product URL, UTM and fragment but forbids open redirects or API targets", () => {
  const valid = "/povestea-magica?utm_source=qa#creator";
  assert.equal(safePreviewReturn(valid), valid);
  for (const value of [null, "", "https://evil.com", "//evil.com", "/\\evil.com", "/%2f%2fevil.com", "/%5cevil.com", "/api/lumi", "/acces-preview/iesire", "/_next/data", "/launch/index.html", "/%0aLocation:evil", "/%xx", "/" + "a".repeat(2049)]) {
    assert.equal(safePreviewReturn(value), "/", String(value));
  }
});

test("login form is byte-bounded with or without Content-Length", async () => {
  const form = (body: string, extra = {}) => new Request("http://localhost/acces-preview", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", ...extra }, body });
  assert.deepEqual(await readPreviewForm(form(new URLSearchParams({ password, next: "/povestea-magica" }).toString())), { password, next: "/povestea-magica" });
  await assert.rejects(readPreviewForm(form("password=hello", { "Content-Length": "5000" })), /too_large/);
  await assert.rejects(readPreviewForm(form("password=" + "a".repeat(4096))), /too_large/);
  await assert.rejects(readPreviewForm(form("password=one&password=two")), /invalid_form/);
  await assert.rejects(readPreviewForm(form("password=one&next=/&next=/two")), /invalid_form/);
  await assert.rejects(readPreviewForm(form("next=/")), /invalid_form/);
  await assert.rejects(readPreviewForm(form("password=abc", { "Content-Type": "application/json" })), /invalid_form/);
});

test("access page escapes return URL and errors, never includes stored secrets", () => {
  const html = launchPreviewPage({ next: '/?x=" onfocus="alert(1)', error: "<script>alert(1)</script>" });
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("&quot; onfocus=&quot;"));
  assert.ok(html.includes('type="password"'));
  assert.ok(html.includes("noindex,nofollow,noarchive"));
  assert.ok(!html.includes(env.LAUNCH_PREVIEW_PASSWORD_HASH));
  assert.ok(!html.includes(env.LAUNCH_PREVIEW_SESSION_SECRET));
  assert.ok(!launchPreviewPage({ configured: false }).includes('name="password"'));
});

test("local credentials are excluded from Git, Docker and Cloud Build uploads", () => {
  for (const file of [".gitignore", ".dockerignore", ".gcloudignore"]) {
    assert.match(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), /^\.preview\/?$/m, file);
  }
});
