import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { kitSample } from '../src/lib/kits/sample.ts';
const { chromium } = createRequire(import.meta.url)('playwright');
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3014';
const out = process.env.QA_DIPLOMA_DIR || '/private/tmp/pmm-explorer-diploma-qa';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const report = [];
try {
  const names = ['Raul', 'Erica', 'Ștefan-Andrei', 'Alexandra Ștefania Maria Constantinescu', 'W'.repeat(40), 'I'.repeat(40)];
  for (const [index, name] of names.entries()) {
    const sample = kitSample('emergency'); sample.input.name = name;
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    // Test saved-order presentation only. No live generation, payment or email is performed.
    await page.route('**/api/orders/qa-diploma?*', route => route.fulfill({ json: { product: 'emergency', output: { premium: sample.kit }, configuration: { generation: sample.input } } }));
    await page.goto(`${base}/trusa-de-rabdare?order=qa-diploma&token=qa`, { waitUntil: 'networkidle' });
    const reader = page.locator('#kit-result .pk-reader').first();
    await reader.waitFor();
    for (let i = 0; i < 9; i++) await reader.getByRole('button', { name: 'Pagina următoare', exact: true }).click();
    const diploma = reader.locator('.pk-reader-stage .explorer-diploma');
    await diploma.waitFor();
    await diploma.locator('img').evaluate(i => i.decode());
    await page.evaluate(() => document.fonts.ready);
    const nameField = diploma.locator('.explorer-diploma-name');
    assert.equal(await nameField.getAttribute('aria-label'), name);
    const fit = await nameField.evaluate(node => {
      const field = node.getBoundingClientRect();
      const lines = [...node.querySelectorAll('span')].map(span => {
        const range = document.createRange(); range.selectNodeContents(span);
        const r = range.getBoundingClientRect();
        return { width: r.width, top: r.top - field.top, bottom: r.bottom - field.top };
      });
      return { width: field.width, height: field.height, fontSize: getComputedStyle(node).fontSize, lines };
    });
    assert.ok(fit.lines.every(r => r.width <= fit.width + 2 && r.top >= -10 && r.bottom <= fit.height + 10), JSON.stringify({ name, fit }));
    await diploma.screenshot({ path: `${out}/diploma-${index + 1}.png` });
    if (index === 0) {
      for (const width of [360, 390, 768]) {
        await page.setViewportSize({ width, height: 844 });
        await diploma.scrollIntoViewIfNeeded();
        const box = await diploma.boundingBox();
        assert.ok(box && box.x >= -1 && box.x + box.width <= width + 1);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await reader.screenshot({ path: `${out}/reader-${width}.png` });
        await reader.getByRole('button', { name: 'Mărește pagina', exact: true }).click();
        await reader.locator('dialog').waitFor({ state: 'visible' });
        assert.equal(await reader.locator('dialog .explorer-diploma-art').evaluate(i => i.complete && i.naturalWidth > 0), true);
        await reader.getByRole('button', { name: 'Închide pagina mărită', exact: true }).click();
        report.push({ width, inFrame: true, expandedImageLoaded: true });
      }
    }
    assert.deepEqual(errors, []);
    report.push({ name, fit, errors });
    await page.close();
  }
} finally {
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  await browser.close();
}
