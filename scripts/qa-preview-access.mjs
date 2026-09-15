import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createRequire } from "node:module";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { issuePreviewSession, PREVIEW_SESSION_SECONDS } from "../src/lib/launchPreview.ts";

const require = createRequire("/Users/hmocanu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json");
const { chromium } = require("playwright");
const port = Number(process.env.QA_PORT || 3018);
const base = `http://127.0.0.1:${port}`;
const output = process.env.QA_OUTPUT || "/private/tmp/pmm-coming-soon-qa";
const credentials = JSON.parse(await readFile(".preview/private-access.json", "utf8"));
const password = (await readFile(".preview/acces-privat.txt", "utf8")).match(/Parola: (\S+)/)[1];
await mkdir(output, { recursive: true });
try { await fetch(`${base}/api/launch`, { signal: AbortSignal.timeout(500) }); throw new Error("QA port already in use"); }
catch (error) { if (error.message === "QA port already in use") throw error; }
let log = "";
const server = spawn(process.execPath, [".next/standalone/server.js"], {
  env: { ...process.env, ...credentials, HOSTNAME: "127.0.0.1", PORT: String(port), LAUNCH_GATE_ENABLED: "true", LAUNCH_AT: "2099-09-18T18:00:00+03:00", LAUNCH_PREVIEW_ALLOW_LOCAL_HTTP: "true" },
  stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.on("data", value => { log += value; });
server.stderr.on("data", value => { log += value; });
let browser;
const report = {};
const login = (body = { password }, headers = {}) => fetch(`${base}/acces-preview`, {
  method: "POST", redirect: "manual", body: new URLSearchParams(body),
  headers: { Origin: base, "x-forwarded-for": "qa-default", ...headers },
});
try {
  for (let n = 0; n < 100; n++) {
    try { if ((await fetch(`${base}/api/launch`)).ok) break; } catch {}
    if (n === 99) throw new Error("QA server did not start");
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  for (const path of ["/", "/povestea-magica", "/scutul-de-noapte", "/trusa-de-rabdare", "/?preview=true", "/?token=invalid"]) {
    const response = await fetch(`${base}${path}`);
    assert.match(await response.text(), /id="launch-bootstrap"/);
    assert.match(response.headers.get("cache-control"), /no-store/);
  }
  report.anonymousGate = "all product pages; forged query flags rejected";
  for (const origin of ["https://evil.com", "null", ""]) {
    assert.equal((await login({ password }, { Origin: origin })).status, 403);
  }
  assert.equal((await fetch(`${base}/acces-preview/iesire`, { method: "POST", headers: { Origin: "https://evil.com" } })).status, 403);
  assert.equal((await fetch(`${base}/acces-preview/iesire`)).status, 405);
  report.csrfAndPostOnlyLogout = "passed";
  const bad = await login({ password: "incorrect" });
  assert.equal(bad.status, 401);
  const invalidHtml = await bad.text();
  assert.ok(!invalidHtml.includes("value=\"incorrect\""));
  assert.match(bad.headers.get("cache-control"), /no-store/);
  const valid = await login({ password, next: "//evil.com" });
  assert.equal(valid.status, 303);
  assert.equal(valid.headers.get("location"), "/");
  assert.match(valid.headers.get("set-cookie"), /HttpOnly/);
  assert.match(valid.headers.get("set-cookie"), /SameSite=lax/);
  assert.match(valid.headers.get("set-cookie"), /Max-Age=28800/);
  assert.match(valid.headers.get("set-cookie"), /Path=\//);
  report.loginAndSafeRedirect = "passed";
  const oversized = await login({ password: "x".repeat(5000) }, { "x-forwarded-for": "qa-oversized" });
  assert.equal(oversized.status, 413);
  for (let n = 0; n < 8; n++) assert.equal((await login({ password: "wrong" }, { "x-forwarded-for": "qa-rate-limit" })).status, 401);
  const limited = await login({ password }, { "x-forwarded-for": "qa-rate-limit" });
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get("retry-after")) > 0);
  report.rateLimitAndPayloadCap = "passed";

  browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
  const owner = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await owner.route("**/*", route => {
    const url = route.request().url();
    if (!url.startsWith(base)) return route.abort();
    if (new URL(url).pathname.startsWith("/api/") && !/\/api\/(launch|preview-access)$/.test(new URL(url).pathname)) return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    return route.continue();
  });
  const page = await owner.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  report.viewports = [];
  for (const [width, height] of [[1440, 1000], [390, 844], [320, 568], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${base}/acces-preview`);
    await page.evaluate(() => document.fonts.ready);
    const geometry = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth, viewport: innerWidth,
      loaded: [...document.images].every(img => img.complete && img.naturalWidth > 0),
      input: document.getElementById("password").getBoundingClientRect().width,
    }));
    assert.ok(geometry.scroll <= width + 1);
    assert.ok(geometry.loaded);
    assert.ok(geometry.input >= 230);
    await page.screenshot({ path: `${output}/access-${width}x${height}.png`, fullPage: true });
    report.viewports.push({ width, height, ...geometry });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/acces-preview?next=${encodeURIComponent("/povestea-magica?utm_source=private-preview#creator")}`);
  await page.locator("#password").fill("wrong");
  await page.getByRole("button", { name: "Arată parola" }).click();
  assert.equal(await page.locator("#password").getAttribute("type"), "text");
  await page.getByRole("button", { name: "Ascunde parola" }).click();
  await page.getByRole("button", { name: "Deschide site-ul complet" }).click();
  await page.getByRole("alert").waitFor();
  assert.equal(await page.locator("#password").inputValue(), "");
  await page.screenshot({ path: `${output}/access-error-mobile.png`, fullPage: true });
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Deschide site-ul complet" }).click();
  await page.waitForURL(`${base}/povestea-magica?utm_source=private-preview#creator`);
  assert.equal(await page.locator("#launch-bootstrap").count(), 0);
  const status = await (await owner.request.get(`${base}/api/preview-access`)).json();
  assert.equal(status.authenticated, true);
  assert.equal(status.launchOpen, false);
  assert.equal(await page.evaluate(() => document.cookie.includes("pmm-launch-preview")), false);
  const authenticated = await owner.request.get(`${base}/scutul-de-noapte`);
  assert.match(authenticated.headers()["cache-control"], /no-store/);
  assert.match(authenticated.headers()["x-robots-tag"], /noindex/);
  assert.ok(!(await authenticated.text()).includes('id="launch-bootstrap"'));
  report.ownerFullSite = "all private; cookie inaccessible to JavaScript; return path retained";
  const anonymous = await browser.newContext();
  assert.ok((await (await anonymous.request.get(`${base}/povestea-magica`)).text()).includes('id="launch-bootstrap"'));
  assert.equal((await (await anonymous.request.get(`${base}/api/preview-access`)).json()).authenticated, false);
  await anonymous.close();
  report.isolatedAnonymousBrowser = "still countdown";

  const management = await owner.newPage();
  await management.goto(`${base}/acces-preview`);
  await management.getByRole("heading", { name: "Bine ai revenit." }).waitFor();
  await management.screenshot({ path: `${output}/access-active-mobile.png`, fullPage: true });
  // The previous product tab has a live private session; logout should revoke
  // access on its next visibility/status check, without touching public deliveries.
  await page.waitForTimeout(1000);
  await management.getByRole("button", { name: "Închide accesul privat" }).click();
  await management.waitForURL(`${base}/in-curand`);
  assert.equal((await owner.cookies()).filter(cookie => cookie.name.includes("pmm-launch-preview")).length, 0);
  await page.bringToFront();
  await page.evaluate(() => window.dispatchEvent(new Event("pageshow")));
  await page.waitForURL(/\/acces-preview\?expired=1/, { timeout: 15000 });
  report.logoutAndOtherTab = "cookie removed; old tab asks for access again";

  for (const token of ["forged", issuePreviewSession(credentials, Date.now() - (PREVIEW_SESSION_SECONDS + 10) * 1000)]) {
    const response = await fetch(`${base}/povestea-magica`, { headers: { Cookie: `pmm-launch-preview-local=${token}` } });
    assert.match(await response.text(), /id="launch-bootstrap"/);
  }
  report.expiredAndTamperedCookie = "rejected";
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const nativeForm = await noJs.newPage();
  await nativeForm.goto(`${base}/acces-preview`);
  await nativeForm.locator("#password").fill(password);
  await nativeForm.getByRole("button", { name: "Deschide site-ul complet" }).click();
  await nativeForm.waitForURL(`${base}/`);
  assert.equal((await (await noJs.request.get(`${base}/api/preview-access`)).json()).authenticated, true);
  await noJs.close();
  report.noJavaScriptLogin = "passed";
  assert.deepEqual(errors, []);
  report.browserErrors = errors;
  await writeFile(`${output}/private-access-report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser?.close();
  const exited = once(server, "exit");
  server.kill("SIGTERM");
  await exited;
  assert.ok(!log.includes(password));
  assert.ok(!log.includes(credentials.LAUNCH_PREVIEW_SESSION_SECRET));
  await writeFile(`${output}/private-access-server.log`, log);
}
