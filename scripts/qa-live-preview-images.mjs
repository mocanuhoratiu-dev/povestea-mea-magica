import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
const { chromium } = createRequire(import.meta.url)("playwright");
const output = "/private/tmp/pmm-photo-live-20260912";
const state = JSON.parse(await readFile(`${output}/preview-ready.json`, "utf8"));
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
try {
 for (let i = 0; i < state.pages.length; i++) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(new URL(state.pages[i].imageUrl, "https://www.povestea-mea-magica.ro").href, { waitUntil: "networkidle" });
  await page.locator("img").evaluateAll(images => Promise.all(images.map(image => image.decode())));
  await page.screenshot({ path: `${output}/preview-${i + 1}.png` });
  console.log(JSON.stringify({ page: i + 1, text: state.pages[i].text, title: state.pages[i].title }));
  await page.close();
 }
} finally { await browser.close(); }
