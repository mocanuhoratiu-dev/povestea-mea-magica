import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { kitSample } from '../src/lib/kits/sample.ts';
const { chromium } = createRequire(import.meta.url)('playwright');
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3014';
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
try {
  for (const kind of ['monster','emergency']) {
    const context = await browser.newContext({ viewport:{width:390,height:844}, acceptDownloads:true });
    context.setDefaultTimeout(30000);
    const page = await context.newPage();
    const calls = [];
    const sample = kitSample(kind);
    const path = kind==='monster'?'/scutul-de-noapte':'/trusa-de-rabdare';
    await page.route('**/api/telemetry', route => { calls.push({type:'telemetry',data:route.request().postDataJSON()}); return route.fulfill({json:{success:true}}); });
    await page.route('**/api/generate', route => { calls.push({type:'generate',data:route.request().postDataJSON()}); return route.fulfill({json:{success:true,data:{premium:sample.kit},generationMode:'ai'}}); });
    await page.route('**/api/orders', route => { calls.push({type:'order',data:route.request().postDataJSON()}); return route.fulfill({json:{orderId:'qa-order'}}); });
    await page.route('**/api/checkout', route => { calls.push({type:'checkout',data:route.request().postDataJSON()}); return route.fulfill({json:{url:base+'/modele?qa=checkout'}}); });
    await page.route('**/api/deliver-email', route => { const data=route.request().postDataJSON(); assert.ok(Buffer.from(data.pdfBase64,'base64').subarray(0,5).equals(Buffer.from('%PDF-'))); assert.equal(data.email,'qa@example.com'); calls.push({type:'email',bytes:Buffer.from(data.pdfBase64,'base64').length}); return route.fulfill({json:{success:true}}); });
    await page.goto(base+path,{waitUntil:'networkidle'});
    await page.addStyleTag({content:'aside[data-lumi-state]{visibility:hidden!important}'});
    await page.getByLabel('Numele copilului',{exact:true}).fill(sample.input.name);
    await page.getByLabel('Cum arată? (opțional)',{exact:true}).fill(sample.input.appearance);
    await page.getByLabel('Adultul de încredere (opțional)',{exact:true}).fill('mama');
    await page.getByRole('button',{name:'Mai departe',exact:true}).click();
    if (kind==='monster') { await page.getByLabel('Umbrele',{exact:true}).check(); await page.getByLabel('Ce îl ajută de obicei?',{exact:true}).fill('veioza mov'); }
    else { await page.getByLabel('Ce îl pasionează?',{exact:true}).fill('bicicleta albastră'); await page.getByRole('combobox').filter({has:page.locator('option[value=advanced]')}).selectOption('advanced'); }
    const consent = page.locator('.pk-form input[type=checkbox]');
    const paid = await consent.count() > 0;
    if (paid) await consent.check();
    await page.getByRole('button',{name:'Vezi coperta orientativă',exact:true}).click();
    const dialog = page.locator('dialog.pk-checkout-dialog[open]');
    await dialog.waitFor();
    assert.equal(calls.filter(x=>['order','checkout','generate'].includes(x.type)).length,0);
    assert.ok(await dialog.locator('.personal').first().textContent().then(text=>text.includes(sample.input.name)));
    const scrollable = await dialog.locator('.pk-checkout-body').evaluate(el=>getComputedStyle(el).overflowY==='auto' && el.getBoundingClientRect().height <= innerHeight);
    assert.ok(scrollable,'mobile confirmation must allow scrolling and fit the viewport');
    await page.screenshot({path:`/private/tmp/pmm-premium-kit-qa/${kind}-confirmation.png`});
    await dialog.getByRole('button',{name:paid?'Continuă la plata securizată':'Creează materialul',exact:true}).click();
    if (paid) {
      await page.waitForURL('**/modele?qa=checkout');
      const order = calls.find(x=>x.type==='order').data;
      assert.equal(order.configuration.generation.kitVersion,2);
      assert.equal(order.configuration.generation.type,kind);
      assert.equal(order.configuration.generation.appearance,sample.input.appearance);
      assert.equal(order.productId,kind==='monster'?'night-shield':'patience-kit');
      assert.equal(calls.filter(x=>x.type==='generate').length,0);
    } else {
      await page.locator('#kit-result').waitFor();
      const request = calls.find(x=>x.type==='generate').data;
      assert.equal(request.kitVersion,2); assert.equal(request.appearance,sample.input.appearance);
      const resultReader = page.locator('#kit-result .pk-reader').first();
      await resultReader.getByRole('button',{name:'Mărește pagina',exact:true}).click();
      await page.locator('#kit-result dialog[open] .paper .cover-art').waitFor();
      await page.getByRole('button',{name:'Închide pagina mărită',exact:true}).last().click();
      const downloadPromise = page.waitForEvent('download',{timeout:60000});
      await page.getByRole('button',{name:'Descarcă materialul',exact:true}).click();
      await downloadPromise;
      await page.getByRole('button',{name:'Da',exact:true}).click();
      await page.getByLabel('Primește PDF-ul pe email',{exact:true}).fill('qa@example.com');
      await page.getByRole('button',{name:'Trimite PDF-ul pe email',exact:true}).click();
      await page.getByText('A plecat. Verifică inboxul și folderul Spam.',{exact:true}).waitFor({timeout:60000});
      assert.equal(calls.filter(x=>x.type==='email').length,1);
    }
    console.log(JSON.stringify({kind,mode:paid?'checkout-mocked':'generation-and-email-mocked',passed:true}));
    await context.close();
  }
} finally { await browser.close(); }
