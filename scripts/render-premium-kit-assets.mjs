import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { kitSample } from '../src/lib/kits/sample.ts';
import { buildKitPages } from '../src/lib/kits/template.ts';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const sharp = require('sharp');
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3014';
const css = await readFile('src/components/premium-kit-document.css','utf8') + await readFile('src/components/premium-kit.css','utf8');
const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try {
  for (const kind of ['monster','emergency']) {
    const sample = kitSample(kind), prefix = kind === 'monster' ? 'atelier' : 'explorer';
    const context = await browser.newContext({viewport:{width:600,height:849},deviceScaleFactor:2});
    const page = await context.newPage();
    await page.goto(base);
    await page.setContent(`<html lang="ro"><head><base href="${base}/"><style>${css}</style><style>html,body{margin:0;background:white}</style></head><body><div class="kit-document">${buildKitPages(sample.input,sample.kit).find(p => p.html.includes('cover-art')).html}</div></body></html>`);
    await page.evaluate(async()=>{await document.fonts.ready; await Promise.all([...document.images].map(image=>image.decode()));});
    const cover = await page.locator('.paper').screenshot();
    await writeFile(`public/examples/kits-v2/${prefix}-preview.webp`,await sharp(cover).resize({width:900}).webp({quality:88}).toBuffer());
    const night = kind === 'monster', title = night ? 'Atelierul<br>Scutului Magic' : 'Dosarul<br>Micului Explorator';
    await page.setViewportSize({width:1200,height:630});
    await page.setContent(`<html lang="ro"><head><base href="${base}/"><style>html,body{margin:0;width:1200px;height:630px;background:${night?'#2c1b32':'#173f38'};color:white;font-family:Georgia,serif}main{display:flex;height:630px;align-items:center;padding:0 60px;gap:50px;box-sizing:border-box}.copy{flex:1}small{font:15px Arial,sans-serif}h1{font-weight:400;font-size:61px;line-height:1.1;margin:38px 0 26px}p{font:21px/1.6 Arial,sans-serif;color:${night?'#e4cfe3':'#daebcf'}}img{height:548px;width:auto;box-shadow:12px 15px 35px #0005;border:1px solid #ffffff44}footer{font:14px Arial,sans-serif;margin-top:40px;opacity:.8}</style></head><body><main><div class="copy"><small>POVESTEA MEA MAGICĂ</small><h1>${title}</h1><p>${night?'Un ritual de seară, creat pentru copilul tău.':'O aventură în timpul așteptării, creată pentru copilul tău.'}</p><footer>povestea-mea-magica.ro</footer></div><img src="/examples/kits-v2/${prefix}-preview.webp" alt="Model ilustrat"></main></body></html>`);
    await page.evaluate(async()=>{await document.fonts.ready; await Promise.all([...document.images].map(image=>image.decode()));});
    const og = await page.screenshot();
    await writeFile(`public/social/og-${night?'scutul-de-noapte':'trusa-de-rabdare'}.webp`,await sharp(og).resize(1200,630).webp({quality:89}).toBuffer());
    console.log(`${prefix}: cover and 1200 x 630 social image exported`);
    await context.close();
  }
} finally {await browser.close();}
