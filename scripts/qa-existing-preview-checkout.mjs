import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile, mkdir } from "node:fs/promises";
const { chromium } = createRequire(import.meta.url)("playwright");
const base = process.env.QA_BASE_URL || "https://www.povestea-mea-magica.ro";
const fixture = process.env.QA_PREVIEW_FILE;
assert.ok(fixture, "Provide an existing, unpaid UAT preview; no generation or payment is performed.");
const preview = JSON.parse(await readFile(fixture, "utf8"));
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
await mkdir("/private/tmp/pmm-checkout-uat", { recursive: true });
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    // Reuse the paid-generation-free UAT order, while exercising real status and checkout endpoints.
    await page.route("**/api/album-preview", route => route.fulfill({ json: preview }));
    await page.goto(`${base}/povestea-magica`, { waitUntil: "networkidle" });
    await page.getByLabel("Prenume", { exact: true }).fill("Erica");
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Continuă", exact: true }).click();
    await page.getByRole("button", { name: "Vezi mostra personalizată", exact: true }).click();
    await page.getByText("Mostra este completă", { exact: true }).waitFor({ timeout: 30000 });
    await page.locator('input[type="checkbox"]').last().check();
    const checkoutResponse = page.waitForResponse(r => r.url().endsWith("/api/checkout"));
    await page.getByRole("button", { name: "Continuă către plată", exact: true }).click();
    const response = await checkoutResponse;
    assert.equal(response.status(), 200);
    await page.waitForURL("https://checkout.stripe.com/**", { timeout: 30000 });
    assert.match(page.url(), /^https:\/\/checkout\.stripe\.com\/.*cs_test_/);
    await page.getByText(/Sandbox|Test mode|Modul de testare/i).first().waitFor({ timeout: 30000 });
    await page.screenshot({ path: `/private/tmp/pmm-checkout-uat/stripe-test-${width}.png` });
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Continuă către plată", exact: true }).waitFor({ timeout: 30000 });
    assert.equal(await page.getByRole("button", { name: "Continuă către plată", exact: true }).isEnabled(), true);
    console.log(JSON.stringify({ width, checkoutHttp: response.status(), stripeTest: true, reachedCheckout: true, backToPreview: true, errors }));
    await page.close();
  }
} finally { await browser.close(); }
