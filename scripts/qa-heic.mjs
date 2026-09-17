import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium, webkit, devices } = require('playwright');
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3017';
if (!/^https?:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base)) throw Error('Local test only.');
const out = '/private/tmp/pmm-heic-qa'; await mkdir(out, { recursive: true });
const fixture = await readFile(new URL('../tests/fixtures/heic/quadrants.heic', import.meta.url));
const reports = [];
for (const profile of [
  { name: 'chrome', engine: chromium, device: devices['Pixel 7'] },
  { name: 'webkit', engine: webkit, device: devices['iPhone 13'] },
]) {
  const browser = await profile.engine.launch({ headless: true, ...(profile.name === 'chrome' ? { executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' } : {}) });
  try {
    const context = await browser.newContext({ ...profile.device, reducedMotion: 'reduce', ignoreHTTPSErrors: base.startsWith('https:') });
    const page = await context.newPage(); page.setDefaultTimeout(60_000);
    const errors = [], requests = []; let workers = 0;
    page.on('pageerror', e => errors.push(e.message));
    page.on('worker', () => workers++);
    await page.route('**/api/**', route => { if (route.request().method() !== 'GET' && !/telemetry|analytics|metrics|web-vitals/.test(route.request().url())) requests.push(route.request().url()); return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"reviews":[]}' }); });
    for (const path of ['/povestea-magica', '/scutul-de-noapte', '/trusa-de-rabdare', '/pachet-complet']) {
      const response = await page.goto(base + path, { waitUntil: 'networkidle', timeout: 120_000 });
      if (base.startsWith('https:')) {
        const csp = response.headers()['content-security-policy'];
        assert.match(csp, /upgrade-insecure-requests/);
        assert.doesNotMatch(csp, /unsafe-eval/);
      }
      if (path === '/povestea-magica') assert.equal(workers, 0, 'No photo decoder worker on initial page load');
      const photo = page.getByRole('region', { name: 'Personaj după fotografie' });
      const count = workers;
      const input = photo.locator('input[type=file]');
      assert.equal(await photo.locator('details').getAttribute('open'), null);
      await input.setInputFiles({ name: 'photo.heic', mimeType: 'image/heic', buffer: fixture });
      const image = photo.getByAltText('Fotografia aleasă pentru personaj'); await image.waitFor();
      await image.evaluate(img => img.decode());
      const result = await image.evaluate(img => {
        const canvas = document.createElement('canvas'); canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        const c = canvas.getContext('2d'); c.drawImage(img, 0, 0);
        return { size: [img.naturalWidth, img.naturalHeight], jpeg: img.src.startsWith('data:image/jpeg;base64,'), pixels: [[300,200],[900,200],[300,600],[900,600]].map(([x,y])=>[...c.getImageData(x,y,1,1).data].slice(0,3)) };
      });
      assert.deepEqual(result.size, [1200, 800]); assert.equal(result.jpeg, true);
      assert.ok(result.pixels[0][0] > 160 && result.pixels[0][1] < 100, 'Red quadrant must stay top-left');
      assert.ok(result.pixels[1][1] > 150 && result.pixels[1][0] < 100, 'Green quadrant must stay top-right');
      assert.ok(result.pixels[2][2] > 150, 'Blue quadrant must stay bottom-left');
      assert.ok(result.pixels[3][0] > 150 && result.pixels[3][1] > 150, 'Yellow quadrant must stay bottom-right');
      assert.ok(workers > count, 'Conversion must run outside the main thread');
      assert.equal(await photo.getByRole('checkbox').isChecked(), false);
      assert.equal(await photo.getByRole('button', { name: 'Analizează fotografia', exact: true }).isDisabled(), true);
      await photo.scrollIntoViewIfNeeded(); await page.screenshot({ path: `${out}/${profile.name}-${path.slice(1)}.png` });
      await photo.getByRole('button', { name: 'Fără fotografie', exact: true }).click();
      reports.push({ engine: profile.name, path, ...result, noUploadBeforeConsent: true });
    }
    const photo = page.getByRole('region', { name: 'Personaj după fotografie' });
    const input = photo.locator('input[type=file]');
    const heif = Buffer.from(fixture); heif.write('mif1', 8, 'ascii');
    await input.setInputFiles({ name: 'photo.HEIF', mimeType: '', buffer: heif });
    await photo.getByAltText('Fotografia aleasă pentru personaj').waitFor();
    await photo.getByRole('button', { name: 'Fără fotografie', exact: true }).click();
    const oversized = Buffer.from(fixture);
    const ispe = oversized.indexOf(Buffer.from('ispe')); assert.ok(ispe > 0);
    oversized.writeUInt32BE(20000, ispe + 8); oversized.writeUInt32BE(20000, ispe + 12);
    const sequence = Buffer.from(fixture); sequence.write('hevc', 8, 'ascii');
    for (const [buffer, message] of [[Buffer.from('broken HEIC'), /HEIC/], [oversized, /40 megapixeli/], [sequence, /statică/], [Buffer.alloc(10 * 1024 * 1024 + 1), /10 MB/]]) {
      await input.setInputFiles({ name: 'photo.heic', mimeType: 'image/heic', buffer });
      await photo.getByRole('alert').filter({ hasText: message }).waitFor();
    }
    await page.evaluate(() => {
      const Original = window.Worker; window.__photoWorkersStopped = 0;
      window.Worker = class extends Original {
        postMessage(...args) { if (!window.__stallPhotoWorker) super.postMessage(...args); }
        terminate() { window.__photoWorkersStopped++; super.terminate(); }
      };
      window.__stallPhotoWorker = true;
    });
    await input.setInputFiles({ name: 'photo.heic', mimeType: 'image/heic', buffer: fixture });
    await photo.getByRole('status').waitFor();
    await photo.getByRole('button', { name: 'Anulează', exact: true }).click();
    assert.equal(await photo.locator('img').count(), 0);
    assert.equal(await page.evaluate(() => window.__photoWorkersStopped), 1);
    await page.clock.install();
    await input.setInputFiles({ name: 'photo.heic', mimeType: 'image/heic', buffer: fixture });
    await photo.getByRole('status').waitFor(); await page.clock.fastForward(46_000);
    await photo.getByRole('alert').filter({ hasText: /durează prea mult/ }).waitFor();
    assert.equal(await page.evaluate(() => window.__photoWorkersStopped), 2);
    await page.evaluate(() => { window.__stallPhotoWorker = false; });
    await input.setInputFiles({ name: 'photo.heic', mimeType: 'image/heic', buffer: fixture });
    await photo.getByAltText('Fotografia aleasă pentru personaj').waitFor();
    assert.deepEqual(requests, [], 'No photo may leave the browser without consent');
    assert.deepEqual(errors, []);
    reports.push({ engine: profile.name, heifWithoutMime: true, corrupt: true, oversizedDimensions: true, byteLimit: true, cancel: true, timeout: true, retryAfterTimeout: true });
    console.log(`PASS ${profile.name}: HEIC across four products, HEIF, limits, cancel, timeout and retry`);
  } finally { await browser.close(); await writeFile(`${out}/report.json`, JSON.stringify({ physicalPhoneTested: false, base, reports }, null, 2)); }
}
