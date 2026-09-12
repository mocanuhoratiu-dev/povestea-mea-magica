import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const root = "/private/tmp/pmm-email-brand-preview";
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
try {
  for (const width of [320, 390, 700]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    await page.route("https://www.povestea-mea-magica.ro/brand/email-emblem.png", r => r.fulfill({ path: new URL("../public/brand/email-emblem.png", import.meta.url).pathname, contentType: "image/png" }));
    for (const name of ["poveste", "atelier", "explorator", "pachet", "factura", "alerta", "raport"]) {
      await page.goto(`file://${root}/${name}.html`);
      await page.locator("img").evaluate(img => img.decode());
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name} at ${width}px`);
      assert.equal(await page.locator("h1").count(), 1);
      await page.screenshot({ path: `${root}/${name}-${width}.png`, fullPage: true });
    }
    await page.close();
    console.log(`Seven email layouts passed at ${width}px`);
  }
  const page = await browser.newPage({ viewport: { width: 320, height: 1000 } });
  await page.route("**/*.png", r => r.abort());
  await page.goto(`file://${root}/poveste.html`);
  assert.equal(await page.getByRole("link", { name: "Răsfoiește povestea", exact: true }).isVisible(), true);
  assert.equal(await page.getByRole("link", { name: "Povestea Mea Magică", exact: true }).isVisible(), true);
  await page.screenshot({ path: `${root}/images-blocked.png`, fullPage: true });
  console.log("Readable identity and delivery CTA with images blocked");
} finally { await browser.close(); }
