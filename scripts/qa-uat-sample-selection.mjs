import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
const { chromium } = createRequire(import.meta.url)("playwright");
const base = process.env.QA_BASE_URL || "http://127.0.0.1:3020";
const out = "/private/tmp/pmm-uat-selection";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    let calls = 0, releaseSecond, checkout;
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.route("**/api/album-preview?view=limits", r => r.fulfill({ json: { maxAttempts: 3, remaining: 3 - calls } }));
    await page.route("**/api/album-preview", async r => {
      const id = `uat-${++calls}`;
      if (calls === 2) await new Promise(resolve => { releaseSecond = resolve; });
      await r.fulfill({ json: { orderId: id, previewUrl: "/examples/album/collection/coperta.webp", statusUrl: `/api/album-preview?order=${id}&view=status`, title: id, remaining: 3 - calls, maxAttempts: 3 } });
    });
    await page.route("**/api/album-preview?order=**", r => r.fulfill({ json: { status: "ready", qualityChecked: true, pages: ["cover", "story", "story"].map(kind => ({ kind, imageUrl: "/examples/album/collection/coperta.webp", title: "Erica", text: "Poveste de test", eyebrow: "Test" })) } }));
    await page.route("**/api/checkout", r => {
      checkout = r.request().postDataJSON();
      return r.fulfill({ status: 409, json: { error: "Checkout interceptat pentru test, fără plată." } });
    });
    await page.goto(`${base}/povestea-magica`, { waitUntil: "networkidle" });
    await page.getByLabel("Prenume", { exact: true }).fill("Erica");
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Continuă", exact: true }).click();
    await page.getByRole("button", { name: "Vezi mostra personalizată", exact: true }).click();
    await page.getByText("Mostra este completă", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Încearcă altă variantă", exact: true }).click();
    await page.waitForTimeout(300);
    const history = page.getByRole("region", { name: "Mostrele tale" });
    await history.getByRole("button", { name: /Mostra 1/ }).click();
    assert.equal(await page.getByRole("button", { name: "Continuă către plată", exact: true }).isEnabled(), true);
    releaseSecond();
    await page.waitForTimeout(500);
    assert.equal(await history.getByRole("button").count(), 2);
    assert.equal(await history.getByRole("button", { name: /Mostra 1/ }).getAttribute("aria-pressed"), "true");
    await history.getByRole("button", { name: /Mostra 2/ }).click();
    await page.getByText("Mostra este completă", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Continuă către plată", exact: true }).click();
    await page.getByText("Confirmă livrarea imediată a produsului digital înainte de plată.", { exact: true }).waitFor();
    assert.equal(await page.locator('input[type="checkbox"]').last().evaluate(el => document.activeElement === el), true);
    await page.locator('input[type="checkbox"]').last().check();
    await page.getByRole("button", { name: "Continuă către plată", exact: true }).click();
    await page.getByText("Checkout interceptat pentru test, fără plată.", { exact: true }).waitFor();
    assert.equal(checkout.orderId, "uat-2");
    await history.getByRole("button", { name: /Mostra 1/ }).click();
    await page.locator('input[type="checkbox"]').last().check();
    await page.getByRole("button", { name: "Continuă către plată", exact: true }).click();
    await page.getByText("Checkout interceptat pentru test, fără plată.", { exact: true }).waitFor();
    assert.equal(checkout.orderId, "uat-1");
    // Simulate restoration from the browser's Back/Forward cache with an outstanding checkout.
    let finishCheckout;
    await page.route("**/api/checkout", r => new Promise(resolve => { finishCheckout = async () => { await r.fulfill({ status: 409, json: { error: "Checkout interceptat pentru test, fără plată." } }); resolve(); }; }));
    await page.getByRole("button", { name: "Continuă către plată", exact: true }).click();
    await page.getByRole("button", { name: "Deschidem plata...", exact: true }).waitFor();
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })));
    assert.equal(await page.getByRole("button", { name: "Continuă către plată", exact: true }).isEnabled(), true);
    await finishCheckout();
    await page.getByText("Checkout interceptat pentru test, fără plată.", { exact: true }).waitFor();
    await page.evaluate(() => {
      const draft = JSON.parse(sessionStorage.getItem("pmm-album-draft"));
      draft.preview = { ...draft.preview, ready: false, issue: "failed" };
      sessionStorage.setItem("pmm-album-draft", JSON.stringify(draft));
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.getByText("Mostra este completă", { exact: true }).waitFor();
    assert.equal(calls, 2, "Restoring a stale error must not start a new generation");
    assert.equal(await page.getByRole("button", { name: "Continuă către plată", exact: true }).isEnabled(), true);
    await page.screenshot({ path: `${out}/checkout-${width}.png` });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ width, selectedFirstDuringSecond: true, bothCheckoutIdsCorrect: true, errors }));
    await page.close();
  }
} finally { await browser.close(); }
