import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium, webkit, devices } = require('playwright');
const sharp = require('sharp');
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3017';
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base)) throw Error('Local UI test only; photo analysis and generation are mocked.');
const out = process.env.QA_OUTPUT || '/private/tmp/pmm-mobile-photo-qa';
await mkdir(out, { recursive: true });
const source = { create: { width: 1200, height: 800, channels: 3, background: '#b8d8ce' } };
const jpeg = await sharp(source).jpeg().toBuffer();
const png = await sharp(source).png().toBuffer();
const webp = await sharp(source).webp().toBuffer();
const rotated = await sharp(source).withMetadata({ orientation: 6 }).jpeg().toBuffer();
const small = await sharp({ create: { width: 400, height: 400, channels: 3, background: '#b8d8ce' } }).png().toBuffer();
const candidateImage = `data:image/jpeg;base64,${jpeg.toString('base64')}`;
const traits = { hairStyle: 'scurt și drept', hairColor: 'șaten', eyeColor: 'căprui', skinTone: 'deschisă', outfit: 'pulover verde', appearanceDetail: 'ochelari rotunzi' };
const report = [];
const fixtures = (name, mimeType, buffer) => ({ name, mimeType, buffer });

for (const profile of [
  { name: 'webkit-iphone', engine: webkit, options: devices['iPhone 13'] },
  { name: 'chrome-android', engine: chromium, options: devices['Pixel 7'] },
  { name: 'chrome-small', engine: chromium, options: { ...devices['iPhone SE'], viewport: { width: 320, height: 568 } } },
]) {
  const browser = await profile.engine.launch({ headless: true, ...(profile.engine === chromium ? { executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' } : {}) });
  try {
    const context = await browser.newContext({ ...profile.options, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(90000);
    page.setDefaultTimeout(15000);
    const errors = [], apiCalls = [], unexpected = [];
    let rejectOnce = false;
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/api/**', async route => {
      const request = route.request(), path = new URL(request.url()).pathname;
      if (path === '/api/character-reference') {
        const input = request.postDataJSON();
        apiCalls.push({ action: input.action, consent: input.photoConsent, correction: input.correction, traits: input.correctedTraits });
        assert.equal(input.photoConsent, true);
        if (rejectOnce) { rejectOnce = false; return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Serviciu de test indisponibil. Reîncearcă.' }) }); }
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(input.action === 'analyze' ? { traits, analysisToken: 'local-test-analysis' } : { traits: input.correctedTraits, characterImageDataUrl: candidateImage, characterToken: 'local-test-character' }) });
      }
      if (request.method() !== 'GET' && !/telemetry|analytics|metrics|web-vitals/.test(path)) unexpected.push(path);
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, reviews: [] }) });
    });
    const frame = async label => {
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label + ': overflow');
      await page.screenshot({ path: `${out}/${profile.name}-${label}.png` });
    };
    await page.goto(base + '/pachet-complet', { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const comparison = page.getByRole('region', { name: 'Două feluri diferite de joacă.' });
    await comparison.scrollIntoViewIfNeeded();
    for (const image of await comparison.locator('img').all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(element => { element.loading = 'eager'; });
      try {
        await page.waitForFunction(element => element.complete && element.naturalWidth > 0, await image.elementHandle(), { timeout: 15000 });
      } catch {
        throw Error(`Comparison image did not load: ${JSON.stringify(await image.evaluate(element => ({ src: element.currentSrc, complete: element.complete, width: element.naturalWidth })))}`);
      }
    }
    await comparison.evaluate(element => element.scrollIntoView({ block: 'start' }));
    assert.match(await comparison.innerText(), /5 pagini A5/);
    assert.match(await comparison.innerText(), /10 pagini A4/);
    await frame('comparison');

    for (const path of ['/povestea-magica', '/scutul-de-noapte', '/trusa-de-rabdare', '/pachet-complet']) {
      await page.goto(base + path, { waitUntil: 'load' });
      await page.waitForTimeout(500);
      const form = page.locator(path === '/povestea-magica' ? '.album-configurator' : path === '/pachet-complet' ? '.bundle-configurator' : '.pk-form');
      const name = form.getByLabel(path === '/povestea-magica' ? 'Prenume' : 'Numele copilului', { exact: true });
      await name.fill('Ștefan Luca');
      await name.focus();
      assert.ok(await name.evaluate(el => parseFloat(getComputedStyle(el).fontSize) >= 16), 'Name field should avoid small-text mobile zoom');
      const photo = form.getByRole('region', { name: 'Personaj după fotografie' });
      const choose = file => photo.locator('input[type=file]').setInputFiles(file);
      const callsBefore = apiCalls.length;
      for (const [file, message] of [
        [fixtures('photo.heic', 'image/heic', Buffer.from('not-an-image')), /HEIC/],
        [fixtures('large.jpg', 'image/jpeg', Buffer.alloc(10 * 1024 * 1024 + 1)), /10 MB/],
        [fixtures('small.png', 'image/png', small), /512/],
        [fixtures('broken.jpg', 'image/jpeg', Buffer.from('broken')), /nu a putut fi citită/],
      ]) {
        await choose(file);
        await photo.getByRole('alert').filter({ hasText: message }).waitFor();
      }
      for (const file of [fixtures('photo.jpg', 'image/jpeg', jpeg), fixtures('photo.png', 'image/png', png), fixtures('photo.webp', 'image/webp', webp), fixtures('portrait.jpg', 'image/jpeg', rotated)]) {
        await choose(file);
        const sourceImage = photo.getByAltText('Fotografia aleasă pentru personaj');
        await sourceImage.waitFor();
        await sourceImage.evaluate(el => el.decode());
        if (file.name === 'portrait.jpg') assert.deepEqual(await sourceImage.evaluate(el => [el.naturalWidth, el.naturalHeight]), [800, 1200], 'EXIF orientation');
        assert.equal(await photo.getByRole('button', { name: 'Analizează fotografia', exact: true }).isDisabled(), true);
        await photo.getByRole('button', { name: 'Fără fotografie', exact: true }).click();
      }
      assert.equal(apiCalls.length, callsBefore, 'Uploading without consent must not send the image');
      await choose(fixtures('photo.jpg', 'image/jpeg', jpeg));
      await photo.getByRole('button', { name: 'Decupează copilul', exact: true }).click();
      const crop = photo.getByLabel('Mărimea selecției', { exact: true });
      await crop.focus(); await crop.press('Home');
      await photo.getByRole('button', { name: 'Păstrează selecția', exact: true }).click();
      await photo.getByRole('alert').filter({ hasText: /Decupajul/ }).waitFor();
      await crop.press('End');
      await photo.getByRole('button', { name: 'Păstrează selecția', exact: true }).click();
      await photo.getByRole('checkbox').check();
      rejectOnce = true;
      await photo.getByRole('button', { name: 'Analizează fotografia', exact: true }).click();
      await photo.getByRole('alert').filter({ hasText: /indisponibil/ }).waitFor();
      assert.equal(await photo.getByAltText('Fotografia aleasă pentru personaj').count(), 1);
      await photo.getByRole('button', { name: 'Analizează fotografia', exact: true }).click();
      await photo.getByLabel('Păr', { exact: true }).fill('blond închis');
      const correction = photo.getByRole('textbox', { name: /^Ce ai corecta/ });
      await correction.fill('Părul este blond închis, cu șuvițe.');
      assert.ok(await correction.evaluate(el => parseFloat(getComputedStyle(el).fontSize) >= 16));
      await photo.getByRole('checkbox').uncheck();
      assert.equal(await photo.getByRole('button', { name: 'Creează personajul', exact: true }).isDisabled(), true);
      await photo.getByRole('checkbox').check();
      await photo.getByRole('button', { name: 'Creează personajul', exact: true }).click();
      await photo.getByRole('button', { name: 'Da, acesta este personajul', exact: true }).click();
      assert.equal(await photo.getByRole('button', { name: 'Personaj confirmat', exact: true }).isDisabled(), true);
      assert.equal(apiCalls.at(-1).traits.hairColor, 'blond închis');
      await photo.scrollIntoViewIfNeeded();
      await frame(path.slice(1) + '-photo');
      await photo.getByRole('button', { name: 'Fără fotografie', exact: true }).click();
      assert.equal(await photo.locator('input[type=file]').count(), 1);
      assert.equal(await name.inputValue(), 'Ștefan Luca');
      report.push({ profile: profile.name, page: path, result: 'pass', checks: ['formats', 'limits', 'corrupt file', 'EXIF', 'consent', 'crop', 'retry', 'edit traits', 'confirm', 'remove'], ai: 'mocked' });
    }

    await page.goto(base, { waitUntil: 'load' });
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const viewport = new EventTarget();
      Object.assign(viewport, { height: innerHeight, offsetTop: 0, scale: 1 });
      Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
      window.dispatchEvent(new Event('pmm:lumi-open'));
    });
    const dialog = page.getByRole('dialog', { name: 'Creează povestea cu Lumi', exact: true });
    await dialog.waitFor();
    await dialog.getByLabel('Prenumele copilului').fill('Ștefan Luca');
    for (const offsetTop of [0, 65]) {
      await page.evaluate(offset => {
        Object.assign(window.visualViewport, { height: 360, offsetTop: offset });
        window.visualViewport.dispatchEvent(new Event('resize'));
      }, offsetTop);
      await page.waitForTimeout(600);
      await dialog.getByLabel('Prenumele copilului').scrollIntoViewIfNeeded();
      const box = await dialog.boundingBox(), input = await dialog.getByLabel('Prenumele copilului').boundingBox();
      assert.ok(box.y >= offsetTop && box.y + box.height <= offsetTop + 360, 'Lumi outside the simulated visual viewport');
      assert.ok(input.y >= box.y && input.y + input.height <= box.y + box.height, 'Focused field not visible');
      await frame(`keyboard-${offsetTop}`);
    }
    await page.evaluate(() => { Object.assign(window.visualViewport, { height: innerHeight, offsetTop: 0 }); window.visualViewport.dispatchEvent(new Event('resize')); });
    await dialog.getByRole('button', { name: 'Întoarce pagina', exact: true }).click();
    await dialog.getByRole('button', { name: '5 ani', exact: true }).waitFor();
    await dialog.getByRole('button', { name: 'Închide Lumi', exact: true }).click();
    assert.deepEqual(unexpected, []);
    assert.deepEqual(errors, []);
    report.push({ profile: profile.name, keyboard: 'simulated visual viewport', result: 'pass' });
    console.log(`PASS ${profile.name}`);
  } finally {
    await browser.close();
    await writeFile(`${out}/report.json`, JSON.stringify({ physicalDeviceTested: false, aiServices: 'mocked', results: report }, null, 2));
  }
}
console.log(`PASS ${report.length} scenarios. Physical phone and real AI checks remain separate. ${out}`);
