import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { createHmac } from "node:crypto";
import { once } from "node:events";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const require = createRequire("/Users/hmocanu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json");
const { chromium } = require("playwright");
const port = 3017;
const base = `http://127.0.0.1:${port}`;
const deadline = Date.now() + 24000;
const secret = "local-launch-qa-only-not-a-production-secret";
const out = process.env.QA_OUTPUT || "/private/tmp/pmm-coming-soon-qa";
await mkdir(out, { recursive: true });
let log = "";
const server = spawn(process.execPath, [".next/standalone/server.js"], {
  env: { ...process.env, HOSTNAME:"127.0.0.1", PORT:String(port), LAUNCH_GATE_ENABLED: "true", LAUNCH_AT: new Date(deadline).toISOString(), ORDER_ACCESS_SECRET: secret }, stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.on("data",chunk => { log += chunk; });
server.stderr.on("data",chunk => { log += chunk; });
let browser;
const report = {};
try {
  for (let n=0;n<80;n++) {
    try { if ((await fetch(`${base}/api/launch`)).ok) break; } catch {}
    if (n===79) throw new Error(`Server not ready: ${log}`);
    await new Promise(resolve => setTimeout(resolve,100));
  }
  const paths = ["/", "/povestea-magica", "/scutul-de-noapte", "/trusa-de-rabdare", "/preturi"];
  for (const path of paths) {
    const response = await fetch(`${base}${path}`);
    assert.match(await response.text(), /id="launch-bootstrap"/);
    assert.match(response.headers.get("cache-control"), /no-store/);
  }
  report.before = paths;
  for (const path of ["/politica-de-confidentialitate", "/contact", "/povestea-magica/livrare", "/comanda-confirmata"]) {
    const response = await fetch(`${base}${path}`);
    assert.doesNotMatch(await response.text(), /id="launch-bootstrap"/);
  }
  const order = "qaabcdefghijklmnop";
  const expires = new Date(Date.now()+3600000).toISOString();
  const signature = createHmac("sha256",secret).update(`${order}.${expires}`).digest("base64url");
  for (const path of ["/scutul-de-noapte", "/trusa-de-rabdare"]) {
    const valid = new URLSearchParams({ order, token: `${expires}.${signature}` });
    const response = await fetch(`${base}${path}?${valid}`);
    assert.doesNotMatch(await response.text(), /id="launch-bootstrap"/);
    const invalid = await fetch(`${base}${path}?order=${order}&token=invalid`);
    assert.match(await invalid.text(), /id="launch-bootstrap"/);
  }
  report.existingDeliveryAndForgedToken = "passed";
  const webhook = await fetch(`${base}/api/stripe-webhook`, { method: "POST", body: "{}" });
  assert.doesNotMatch(await webhook.text(), /id="launch-bootstrap"/);
  report.webhookNotIntercepted = true;

  browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
  const page = await browser.newPage({ viewport: { width:390,height:844 }, timezoneId:"Pacific/Auckland" });
  await page.addInitScript(() => { Date.now = () => 4102444800000; });
  // Prevent unrelated third-party calls from the restored homepage during QA.
  await page.route("**/*", route => route.request().url().startsWith(base) ? route.continue() : route.abort());
  const target = `${base}/?utm_source=qa&utm_campaign=launch#trei-lumi`;
  await page.goto(target);
  await page.waitForSelector("#launch-bootstrap", { state: "attached" });
  assert.equal(await page.locator('[data-count="days"]').textContent(),"00");
  await page.waitForFunction(() => !document.getElementById("launch-bootstrap"), undefined, { timeout:40000 });
  assert.equal(page.url(),target);
  report.automaticOpen = { withinMs: Date.now()-deadline, preservesUrl:true, deviceClockIgnored:true };
  const root = await fetch(`${base}/`);
  assert.doesNotMatch(await root.text(), /id="launch-bootstrap"/);
  const expiredPage = await fetch(`${base}/in-curand`,{redirect:"manual"});
  assert.equal(expiredPage.status,307);
  assert.equal(expiredPage.headers.get("location"),"/");
  assert.match(expiredPage.headers.get("cache-control"),/no-store/);
  report.expiredPreviewRedirect = true;
  report.openState = await (await fetch(`${base}/api/launch`)).json();
  assert.equal(report.openState.open,true);
  await writeFile(`${out}/transition-report.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
} finally {
  await browser?.close();
  const exited = once(server,"exit");
  server.kill("SIGTERM");
  await exited;
  await writeFile(`${out}/transition-server.log`,log);
}
