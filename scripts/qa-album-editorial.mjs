import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)('playwright');
const out='/private/tmp/pmm-album-editorial-qa';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const report=[];
try {
 for(const width of [1440,390,360,768]) {
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:3014/povestea-magica',{waitUntil:'networkidle'});
  await page.screenshot({path:`${out}/${width}.png`,fullPage:true});
  await page.locator('#configureaza-albumul').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.screenshot({path:`${out}/${width}-form.png`});
  await page.getByLabel('Prenume',{exact:true}).fill('Erica');
  await page.getByLabel(/^Vârsta/).selectOption('3');
  await page.getByText('Aspectul și ținuta personajului',{exact:true}).click();
  await page.getByLabel(/^Culoarea părului/).selectOption('blond');
  await page.getByRole('button',{name:'Continuă',exact:true}).click();
  await page.locator('.album-world-grid').waitFor();
  await page.locator('.album-world-option').nth(2).click();
  if(await page.locator('.album-world-option[aria-pressed=true]').count()!==1) throw Error('World selection');
  await page.locator('.album-world-grid').screenshot({path:`${out}/${width}-worlds.png`});
  if(!(await page.locator('.album-character-summary').innerText()).includes('Erica')) throw Error('Summary missing name');
  await page.getByRole('button',{name:'Înapoi',exact:true}).click();
  if(await page.getByLabel('Prenume',{exact:true}).inputValue()!=='Erica') throw Error('Lost configuration');
  await page.getByRole('button',{name:'Ajutor de la Lumi',exact:true}).click();
  await page.waitForTimeout(600);
  await page.screenshot({path:`${out}/${width}-lumi.png`});
  report.push({width,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),errors});
  await page.close();
 }
 await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
} finally {await browser.close();}
