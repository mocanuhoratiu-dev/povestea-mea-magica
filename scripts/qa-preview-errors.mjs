import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { AlbumPreviewError, previewFailureResponse } from '../src/lib/album/previewFailure.ts';
const { chromium } = createRequire(import.meta.url)('playwright');
const base=process.env.QA_BASE_URL || 'http://127.0.0.1:3014';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const report=[];
const out='/private/tmp/pmm-preview-errors';
await mkdir(out,{recursive:true});
try {
  for(const width of [390,1440]) {
    const page=await browser.newPage({viewport:{width,height:900}});
    let calls=0;
    const failures=['provider_busy','quality_rejected','provider_rejected'];
    await page.route('**/api/album-preview?view=limits',route=>route.fulfill({json:{maxAttempts:4,remaining:4}}));
    await page.route('**/api/album-preview',route=>{
      const failure=previewFailureResponse(new AlbumPreviewError(failures[calls++]));
      return route.fulfill({status:failure.status,json:{error:failure.error,code:failure.code,maxAttempts:4,remaining:4}});
    });
    await page.goto(`${base}/povestea-magica`,{waitUntil:'networkidle'});
    await page.getByLabel('Prenume',{exact:true}).fill('Mara');
    for(let i=0;i<3;i++)await page.getByRole('button',{name:'Continuă',exact:true}).click();
    for(const code of failures){
      await page.getByRole('button',{name:'Vezi mostra personalizată',exact:true}).click();
      await page.getByText(previewFailureResponse(new AlbumPreviewError(code)).error,{exact:true}).waitFor();
      assert.equal(await page.getByRole('button',{name:'Vezi mostra personalizată',exact:true}).isEnabled(),true);
      await page.getByText(/Variante rămase: 4/).waitFor();
    }
    await page.screenshot({path:`${out}/${width}.png`});
    await page.getByRole('button',{name:'Înapoi',exact:true}).click();
    await page.getByRole('button',{name:'Înapoi',exact:true}).click();
    await page.getByRole('button',{name:'Înapoi',exact:true}).click();
    assert.equal(await page.getByLabel('Prenume',{exact:true}).inputValue(),'Mara');
    assert.equal(calls,3);
    report.push({width,calls,passed:true});
    await page.close();
  }
} finally {await browser.close();await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));}
console.log(report);
