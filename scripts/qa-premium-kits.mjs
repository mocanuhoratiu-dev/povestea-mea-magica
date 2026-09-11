import { createRequire } from 'node:module';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { kitSample } from '../src/lib/kits/sample.ts';
import { KIT_TEXT_SCHEMA } from '../src/lib/kits/content.ts';
const { chromium } = createRequire(import.meta.url)('playwright');
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3014';
const out = process.env.QA_LIVE ? '/private/tmp/pmm-premium-kit-qa-live' : process.env.QA_STRESS ? '/private/tmp/pmm-premium-kit-qa-stress' : '/private/tmp/pmm-premium-kit-qa';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const report = [];
try {
  for (const kind of ['monster', 'emergency'].filter(kind => !process.env.QA_KIND || process.env.QA_KIND === kind)) {
    const sample = process.env.QA_LIVE ? JSON.parse(await readFile(`/private/tmp/pmm-premium-kit-live/${kind}.json`, 'utf8')) : kitSample(kind), path = kind === 'monster' ? '/scutul-de-noapte' : '/trusa-de-rabdare';
    if (process.env.QA_STRESS) {
      const longest = n => 'Împreună descoperim o aventură minunată. '.repeat(20).slice(0,n);
      sample.input.name = 'Alexandra Ștefania Maria Constantinescu';
      sample.input.context = longest(180); sample.input.interest = longest(100); sample.input.trustedAdult = longest(40);
      sample.input.difficulty = 'advanced';
      for (const [key, rule] of Object.entries(KIT_TEXT_SCHEMA.properties)) {
        if (key === 'codeWord') continue;
        if (rule.type === 'string') sample.kit[key] = longest(rule.maxLength);
        else sample.kit[key] = Array.from({ length: rule.minItems }, () => rule.items.type === 'string' ? longest(rule.items.maxLength) : { title: longest(36), text: longest(rule.items.properties.text.maxLength) });
      }
    }
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    context.setDefaultTimeout(30000);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/orders/qa-kit?*', route => route.fulfill({ json: { product: kind, output: { premium: sample.kit }, configuration: { generation: sample.input } } }));
    await page.goto(`${base}${path}?order=qa-kit&token=qa`, { waitUntil: 'networkidle' });
    await page.locator('#kit-result').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${out}/${kind}-desktop.png`, fullPage: true });
    const print = page.locator('[data-print="true"]');
    const bounds = await print.locator('.paper').evaluateAll(papers => papers.map(paper => {
      const rect = paper.getBoundingClientRect(), footer = paper.querySelector('.folio')?.getBoundingClientRect();
      return { index: paper.dataset.pageIndex, title: paper.querySelector('h2')?.textContent, overflow: [...paper.querySelectorAll('p,h2,h3,.note,.quote')].filter(node => {
        const r = node.getBoundingClientRect(); return r.width && r.height && ((footer && r.bottom > footer.top - 3) || r.right > rect.right || r.left < rect.left);
      }).map(node => ({ text: node.textContent, top: node.getBoundingClientRect().top - rect.top, bottom: node.getBoundingClientRect().bottom - rect.top })) };
    }));
    const reader = page.locator('#kit-result .pk-reader').first();
    console.log(JSON.stringify({kind, bounds}));
    const pageCount = kind === 'monster' ? 13 : 10;
    for (let i = 0; i < pageCount; i++) {
      await reader.locator('.paper').first().screenshot({ path: `${out}/${kind}-page-${i+1}.png` });
      if (i < pageCount - 1) await reader.getByRole('button', { name: 'Pagina următoare', exact: true }).click();
    }
    const pendingDownload = page.waitForEvent('download', { timeout: 45000 });
    pendingDownload.catch(() => {});
    await page.getByRole('button', { name: 'Descarcă materialul', exact: true }).click();
    try {
      const download = await pendingDownload;
      await download.saveAs(`${out}/${kind}.pdf`);
    } catch { errors.push('PDF: ' + await page.locator('.pk-error').allTextContents()); }
    for (const width of process.env.QA_STRESS || process.env.QA_LIVE ? [] : [360, 390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
      await page.screenshot({ path: `${out}/${kind}-${width}.png`, fullPage: true });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      report.push({ kind, width, horizontalOverflow: overflow });
    }
    report.push({ kind, bounds, errors });
    if (bounds.some(p => p.overflow.length) || errors.length) process.exitCode = 1;
    await context.close();
  }
} finally {
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  await browser.close();
}
