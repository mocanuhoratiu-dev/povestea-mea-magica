import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

const require = createRequire("/Users/hmocanu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json");
const { chromium } = require("playwright");
const base = process.env.QA_BASE || "http://127.0.0.1:3016";
const out = process.env.QA_OUTPUT || "/private/tmp/pmm-coming-soon-qa";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const report = [];
try {
  for (const [name, width, height] of [["desktop",1440,1000],["laptop",1366,768],["wide",2560,1440],["tablet",768,1024],["mobile",390,844],["mobile-small",320,640],["mobile-wide",430,932]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    const response = await page.goto(`${base}/in-curand`, { waitUntil: "networkidle" });
    assert.equal(response.status(),200);
    assert.match(response.headers()["cache-control"], /no-store/);
    await page.evaluate(() => document.fonts.ready);
    await page.locator(".launch-invitation").scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await page.evaluate(() => scrollTo(0,0));
    const before = await page.locator('[data-count="seconds"]').textContent();
    await page.waitForTimeout(1100);
    const after = await page.locator('[data-count="seconds"]').textContent();
    const state = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      brokenImages: [...document.images].filter(x => !x.complete || !x.naturalWidth).map(x => x.src),
      countdownVisible: document.querySelector(".countdown").getBoundingClientRect().bottom < innerHeight,
      headingFits: document.querySelector("h1").getBoundingClientRect().right <= innerWidth,
      heroHeight: document.querySelector(".launch-hero").getBoundingClientRect().height,
      fonts: document.fonts.check("16px LaunchFraunces") && document.fonts.check("16px LaunchNunito"),
      socialCount: document.querySelectorAll(".social-links a").length,
      date: document.querySelector("time").getAttribute("datetime"),
    }));
    assert.equal(state.overflow,false,name);
    assert.deepEqual(state.brokenImages,[],name);
    assert.equal(state.countdownVisible,true,name);
    assert.equal(state.headingFits,true,name);
    assert.equal(state.fonts,true,name);
    assert.equal(state.socialCount,3);
    assert.notEqual(before,after,name);
    assert.deepEqual(errors,[],name);
    await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
    await page.screenshot({ path: `${out}/${name}-viewport.png` });
    await page.locator('a[href="#trei-lumi"]').click();
    await page.waitForTimeout(100);
    assert.ok(await page.locator("#trei-lumi").evaluate(el => el.getBoundingClientRect().top < 30));
    const downloadPromise = page.waitForEvent("download");
    await page.locator(".calendar-button").click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), "povestea-mea-magica-lansare.ics");
    report.push({ name, ...state, clockTicks: true, anchor: true, calendar: true, errors });
    await page.close();
  }

  const skew = await browser.newPage({ timezoneId: "America/Los_Angeles" });
  await skew.addInitScript(() => { Date.now = () => 0; });
  await skew.goto(`${base}/in-curand`, { waitUntil: "networkidle" });
  const time = await (await fetch(`${base}/api/launch`)).json();
  const expected = Math.floor(Math.max(0,Date.parse(time.launchAt)-time.serverNow)/86400000);
  assert.equal(Number(await skew.locator('[data-count="days"]').textContent()),expected);
  report.push({ name: "device-timezone-and-clock-skew", passed: true });
  await skew.close();

  const calendar = await (await fetch(`${base}/launch/calendar`)).text();
  assert.match(calendar,/DTSTART:20260918T150000Z/);
} finally { await browser.close(); }
await writeFile(`${out}/report.json`, JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
