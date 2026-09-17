import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const { chromium } = createRequire(import.meta.url)('playwright');
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3017';
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base)) throw Error('Local test only.');
const out = '/private/tmp/pmm-compact-collection-qa';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const reports = [];
try {
  for (const width of [320,390,768,1440]) {
    const page = await browser.newPage({ viewport: { width, height: width > 700 ? 960 : 844 }, reducedMotion: 'reduce' });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.route('**/api/**', r => r.fulfill({ status:200, contentType:'application/json', body:'{"ok":true,"reviews":[]}' }));
    await page.goto(base, { waitUntil:'networkidle', timeout:120000 });
    await page.evaluate(() => document.fonts.ready);
    const section = page.locator('#colectia');
    assert.equal(await section.locator('[data-offer-product]').count(), 4);
    assert.equal(await section.getByText(/Tipărirea nu este inclusă/).count(), 1);
    assert.match(await section.locator('.collection-format').innerText(), /PDF pe email.*Personalizare.*O singură plată/);
    for (const [product,price,href] of [['album','59 lei','/povestea-magica'],['monster','19 lei','/scutul-de-noapte'],['emergency','19 lei','/trusa-de-rabdare']]) {
      const item = section.locator(`[data-offer-product=${product}]`);
      assert.equal(await item.locator('footer strong').innerText(), price);
      assert.equal(await item.locator('footer a').getAttribute('href'), href);
      assert.match(await item.locator('.collection-preview').innerText(), /Înainte de plată/);
      await item.scrollIntoViewIfNeeded();
      await item.locator('img').evaluate(img => img.decode());
      assert.equal(await item.locator('img').evaluate(img => getComputedStyle(img).objectFit), 'contain');
      assert.ok((await item.locator('footer a').boundingBox()).height >= 44);
      const boxes = await item.evaluate(e => [...e.children].map(el => { const r=el.getBoundingClientRect(); return { name:el.tagName, x:r.x, y:r.y, right:r.right, bottom:r.bottom }; }));
      for (let i=0;i<boxes.length;i++) for (let j=i+1;j<boxes.length;j++) {
        const a=boxes[i], b=boxes[j];
        assert.ok(!(a.x < b.right-1 && a.right > b.x+1 && a.y < b.bottom-1 && a.bottom > b.y+1), `${product} overlap at ${width}: ${a.name}/${b.name}`);
      }
    }
    assert.match(await section.locator('[data-offer-product=album]').innerText(), /caiet de 5 pagini inclus/);
    assert.match(await section.locator('[data-offer-product=emergency]').innerText(), /separată de caietul poveștii/);
    for (const product of ['monster','emergency']) assert.match(await section.locator(`[data-offer-product=${product}] .collection-preview`).innerText(), /orientativă.*după plată/);
    assert.match(await section.locator('[data-offer-product=bundle]').innerText(), /79 lei.*Patru PDF-uri.*copii diferiți.*18 lei/s);
    const size = await section.evaluate(e => ({ sectionHeight:Math.round(e.getBoundingClientRect().height), pageHeight:document.documentElement.scrollHeight, overflow:document.documentElement.scrollWidth-innerWidth }));
    assert.ok(size.overflow <= 1);
    if (width === 390) assert.ok(size.sectionHeight < 1900, `Collection still too long: ${size.sectionHeight}`);
    await section.screenshot({ path:`${out}/collection-${width}.png` });
    await section.locator('[data-offer-product=album] footer a').click();
    await page.waitForURL('**/povestea-magica');
    assert.equal(await page.locator('.offer-product-band .offer-facts > div').count(),4);
    await page.goto(base+'/intrebari-frecvente#fotografie', {waitUntil:'networkidle'});
    const photo = page.locator('#fotografie');
    if (await photo.getAttribute('open') === null) await photo.locator('summary').click();
    assert.match(await photo.innerText(),/HEIC și HEIF sunt convertite în JPG pe dispozitiv/);
    await page.goto(base+'/livrare-digitala', {waitUntil:'networkidle'});
    assert.match(await page.locator('main').innerText(),/diplomele ambelor produse sunt în format orizontal/);
    assert.deepEqual(errors, []);
    reports.push({width,...size,commercialFactsPreserved:true,completeImages:true,noOverlaps:true,fullProductOfferUnchanged:true,faqUpdated:true,deliveryUpdated:true});
    console.log(JSON.stringify(reports.at(-1))); await page.close();
  }
} finally { await browser.close(); await writeFile(`${out}/report.json`,JSON.stringify(reports,null,2)); }
