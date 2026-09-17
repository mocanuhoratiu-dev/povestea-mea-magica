import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";

const { chromium } = createRequire(import.meta.url)("playwright");
const base = process.env.QA_BASE_URL || "http://127.0.0.1:3017";
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base)) throw Error("Run this UI audit against a local preview only.");
const out = process.env.QA_OUTPUT || "/private/tmp/pmm-offer-experience-qa";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const report = [];

async function checkViewport(page, label) {
  const result = await page.evaluate(() => {
    const width = innerWidth;
    const floating = document.querySelector(".lumi-floating-button");
    const visible = floating && getComputedStyle(floating).visibility !== "hidden" && floating.getBoundingClientRect().width > 0;
    const overlaps = [];
    if (visible) {
      const a = floating.getBoundingClientRect();
      for (const control of document.querySelectorAll("button,a[href],input,select,textarea,summary,[data-lumi-obstacle]")) {
        if (control.closest("[data-lumi-guide]")) continue;
        const b = control.getBoundingClientRect();
        if (b.width && b.height && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) overlaps.push(control.textContent.trim().slice(0, 60));
      }
    }
    return { overflow: document.documentElement.scrollWidth - width, lumiVisible: Boolean(visible), overlaps };
  });
  assert.ok(result.overflow <= 1, `${label}: horizontal overflow ${result.overflow}`);
  assert.deepEqual(result.overlaps, [], `${label}: Lumi overlaps controls`);
  report.push({ label, ...result });
}

try {
  for (const width of [1440, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: width > 500 ? 900 : 844 }, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error" && /hydrated|hydration|maximum update depth/i.test(message.text())) errors.push(message.text()); });
    // This audit must not create AI jobs, orders, emails or analytics events.
    await page.route("**/api/**", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }));
    for (const path of ["/", "/povestea-magica", "/scutul-de-noapte", "/trusa-de-rabdare", "/pachet-complet", "/preturi"]) {
      await page.goto(base + path, { waitUntil: "networkidle", timeout: 120000 });
      await page.evaluate(() => document.fonts.ready);
      const key = `${path.slice(1) || "home"}-${width}`;
      await page.screenshot({ path: `${out}/${key}-top.png` });
      await checkViewport(page, `${key}: top`);
      assert.ok(await page.locator("[data-offer-product]").count() > 0, `${key}: missing offer facts`);
      const nav = page.getByRole("navigation", { name: "Cuprinsul mostrei", exact: true }).first();
      if (await nav.count()) {
        await nav.scrollIntoViewIfNeeded();
        if (path === "/scutul-de-noapte" || path === "/trusa-de-rabdare") {
          await nav.getByRole("button", { name: "Diploma", exact: true }).click();
          const reader = page.locator(".pk-reader").first();
          assert.match(await reader.locator(".pk-reader-heading strong").innerText(), /Diploma|Certificatul/);
          await reader.getByRole("button", { name: "Mărește pagina", exact: true }).click();
          const dialog = page.locator("dialog[open]").first();
          assert.equal(await dialog.locator(".kit-document").count(), 1);
          await dialog.getByRole("button", { name: "Închide pagina mărită", exact: true }).click();
          if (path === "/scutul-de-noapte") {
            await nav.getByRole("button", { name: "Etichetele", exact: true }).click();
            assert.match(await reader.locator(".pk-reader-heading strong").innerText(), /Etichetele/);
          }
          await nav.getByRole("combobox").selectOption("0");
        } else {
          await nav.getByRole("button", { name: "Aventura", exact: true }).click();
          assert.equal(await nav.getByRole("combobox").inputValue(), "8");
          await nav.getByRole("combobox").selectOption("14");
          assert.equal(await nav.getByRole("button", { name: "Finalul", exact: true }).getAttribute("aria-current"), "page");
        }
        await page.waitForTimeout(400);
        await checkViewport(page, `${key}: sample navigation`);
        if (path === "/scutul-de-noapte" || path === "/trusa-de-rabdare") await page.locator(".pk-reader-stage").first().scrollIntoViewIfNeeded();
        await page.waitForTimeout(250);
        await page.screenshot({ path: `${out}/${key}-sample.png` });
      }
      await page.locator("[data-offer-product]").first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(350);
      await checkViewport(page, `${key}: offer`);
      await page.screenshot({ path: `${out}/${key}-offer.png` });
    }

    await page.goto(base + "/pachet-complet", { waitUntil: "networkidle" });
    const form = page.locator("#configureaza-pachetul");
    await form.scrollIntoViewIfNeeded();
    assert.equal(await form.locator(".bundle-steps li").count(), 5);
    await form.getByRole("button", { name: "Continuă", exact: true }).click();
    assert.match(await form.getByRole("alert").innerText(), /prenumele/);
    await form.getByLabel("Numele copilului", { exact: true }).fill("Eva");
    await form.getByLabel(/^Vârsta/).selectOption("5");
    await form.getByText("Aspectul și ținuta personajului", { exact: true }).click();
    await form.getByLabel("Ținuta personajului", { exact: true }).fill("Rochie galbenă");
    await form.getByText("Aspectul și ținuta personajului", { exact: true }).click();
    await page.screenshot({ path: `${out}/bundle-child-${width}.png` });
    await form.getByRole("button", { name: "Continuă", exact: true }).click();
    await form.getByLabel(/^Lumea poveștii/).selectOption("custom");
    await form.getByLabel("Descrie lumea voastră", { exact: true }).fill("Insula florilor roz");
    await form.getByRole("button", { name: "Continuă", exact: true }).click();
    await form.getByRole("checkbox").uncheck();
    await form.getByLabel("Numele copilului", { exact: true }).fill("Erica");
    await form.getByLabel(/^Vârsta/).selectOption("3");
    await form.getByRole("button", { name: "Continuă", exact: true }).click();
    await form.getByLabel("Ce îl pasionează", { exact: true }).fill("Biciclete și stele");
    await form.getByRole("button", { name: "Continuă", exact: true }).click();
    assert.match(await form.innerText(), /Pentru Eva/);
    assert.match(await form.innerText(), /Pentru Erica/);
    await form.getByRole("button", { name: "Editează Povestea Magică", exact: true }).click();
    assert.equal(await form.getByLabel("Descrie lumea voastră", { exact: true }).inputValue(), "Insula florilor roz");
    await form.getByRole("button", { name: "Modifică personajul", exact: true }).click();
    await form.getByText("Aspectul și ținuta personajului", { exact: true }).click();
    assert.equal(await form.getByLabel("Ținuta personajului", { exact: true }).inputValue(), "Rochie galbenă");
    await form.getByText("Aspectul și ținuta personajului", { exact: true }).click();
    await form.getByRole("button", { name: "Continuă", exact: true }).click();
    await form.getByRole("button", { name: "Continuă", exact: true }).click();
    assert.equal(await form.getByLabel("Numele copilului", { exact: true }).inputValue(), "Erica");
    await form.getByRole("button", { name: "Continuă", exact: true }).click();
    assert.equal(await form.getByLabel("Ce îl pasionează", { exact: true }).inputValue(), "Biciclete și stele");
    await form.getByRole("button", { name: "Continuă", exact: true }).click();
    await page.waitForTimeout(500);
    await checkViewport(page, `bundle-${width}: edited summary`);
    await page.screenshot({ path: `${out}/bundle-summary-${width}.png` });

    await page.goto(base, { waitUntil: "networkidle" });
    await page.evaluate(() => window.dispatchEvent(new Event("pmm:lumi-open")));
    const lumi = page.getByRole("dialog", { name: "Creează povestea cu Lumi", exact: true });
    await lumi.waitFor();
    await lumi.getByLabel("Prenumele copilului").fill("Eva");
    await lumi.getByRole("button", { name: "Întoarce pagina", exact: true }).click();
    await page.waitForTimeout(1200);
    await lumi.getByRole("button", { name: "5 ani", exact: true }).click();
    await lumi.getByRole("button", { name: "Întoarce pagina", exact: true }).click();
    const box = await lumi.boundingBox();
    assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= width && box.y + box.height <= page.viewportSize().height, `Lumi escapes ${width}px viewport`);
    await page.screenshot({ path: `${out}/lumi-${width}.png` });
    assert.equal(await lumi.locator("canvas").count(), 0, "Reduced motion should retain the static Lumi illustration");
    await lumi.getByRole("button", { name: "Închide Lumi", exact: true }).click();

    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.reload({ waitUntil: "networkidle" });
    await page.evaluate(() => window.dispatchEvent(new Event("pmm:lumi-open")));
    const canvas = page.locator('[data-lumi-guide] canvas');
    await canvas.waitFor();
    await page.waitForTimeout(1200);
    const pixels = () => canvas.evaluate(element => new Promise(resolve => requestAnimationFrame(() => {
      const gl = element.getContext("webgl2");
      const data = new Uint8Array(element.width * element.height * 4);
      gl.readPixels(0, 0, element.width, element.height, gl.RGBA, gl.UNSIGNED_BYTE, data);
      let opaque = 0, checksum = 0, minX = element.width, minY = element.height, maxX = 0, maxY = 0;
      for (let i = 0; i < data.length; i += 4) {
        checksum = (checksum + data[i] * ((i % 101) + 1) + data[i + 1] * 7 + data[i + 3]) % 2147483647;
        if (data[i + 3] > 200) {
          opaque++;
          const x = (i / 4) % element.width, y = Math.floor(i / 4 / element.width);
          minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
      }
      resolve({ opaque, checksum, minX, minY, maxX, maxY, width: element.width, height: element.height });
    })));
    const first = await pixels();
    await page.waitForTimeout(800);
    const second = await pixels();
    assert.ok(first.opaque > 200, `Lumi canvas is blank at ${width}px`);
    assert.ok(first.minX > 0 && first.minY > 0 && first.maxX < first.width - 1 && first.maxY < first.height - 1, `Lumi is cropped at ${width}px`);
    assert.notEqual(first.checksum, second.checksum, `Lumi is not moving at ${width}px`);
    await page.screenshot({ path: `${out}/lumi-animated-${width}.png` });
    report.push({ label: `Lumi canvas ${width}`, ...first, moving: true });
    assert.deepEqual(errors, [], `${width}: browser errors`);
    report.push({ label: `bundle and Lumi ${width}`, result: "pass" });
    await page.close();
  }
} finally {
  await browser.close();
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
}
console.log(`PASS: ${report.length} checks. Screenshots: ${out}`);
