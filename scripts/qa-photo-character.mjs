import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const { chromium } = createRequire(import.meta.url)("playwright");
const base = process.env.QA_BASE_URL || "http://127.0.0.1:3022";
const out = "/private/tmp/pmm-photo-uat";
await mkdir(out, { recursive: true });
const photo = await readFile("public/examples/album/collection/coperta.webp");
const data = `data:image/webp;base64,${photo.toString("base64")}`;
const traits = { hairStyle: "scurt și drept", hairColor: "șaten", eyeColor: "nu se distinge", skinTone: "deschisă", outfit: "rochie roz", appearanceDetail: "chip rotund" };
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
try {
 for (const width of [360, 390, 1440]) {
  for (const path of ["/povestea-magica", "/scutul-de-noapte", "/trusa-de-rabdare"]) {
   const page = await browser.newPage({ viewport: { width, height: 900 } });
   const errors = []; let calls = 0; let preview = null;
   page.on("pageerror", e => errors.push(e.message));
   await page.route("**/api/character-reference", async r => {
    const body = r.request().postDataJSON(); calls++;
    assert.equal(body.photoConsent, true);
    return r.fulfill({ json: body.action === "analyze" ? { traits, analysisToken: "analysis-proof" } : { traits, characterImageDataUrl: data, characterToken: "character-proof" } });
   });
   await page.route("**/api/album-preview?view=limits", r => r.fulfill({ json: { remaining: 4, maxAttempts: 4 } }));
   await page.route("**/api/album-preview", r => {
    preview = r.request().postDataJSON();
    return r.fulfill({ json: { orderId: "test-photo", title: "Erica și lumina", previewUrl: "/examples/album/collection/coperta.webp", statusUrl: "/api/album-preview?order=test-photo&view=status", coverReady: false } });
   });
   await page.route("**/api/album-preview?order=test-photo**", r => r.fulfill({ json: { status: "processing", progress: 0, coverReady: false } }));
   await page.goto(base + path, { waitUntil: "networkidle" });
   const section = page.getByRole("region", { name: "Personaj după fotografie" });
   await section.locator('input[type="file"]').setInputFiles({ name: "reference.webp", mimeType: "image/webp", buffer: photo });
   const analyze = section.getByRole("button", { name: "Analizează fotografia", exact: true });
   await analyze.waitFor(); assert.equal(await analyze.isDisabled(), true); assert.equal(calls, 0);
   await section.getByRole("checkbox").check(); await analyze.click();
   await section.getByText("Trăsăturile din fotografie", { exact: true }).waitFor();
   await section.getByRole("button", { name: "Creează personajul", exact: true }).click();
   await section.getByRole("button", { name: "Da, acesta este personajul", exact: true }).click();
   await section.getByRole("button", { name: "Personaj confirmat", exact: true }).waitFor();
   assert.equal(calls, 2);
   await section.scrollIntoViewIfNeeded();
   assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
   await page.screenshot({ path: `${out}/${path.slice(1)}-${width}.png` });
   if (path === "/povestea-magica") {
    await page.getByLabel("Prenume", { exact: true }).fill("Erica");
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Continuă", exact: true }).click();
    await page.getByRole("button", { name: "Vezi mostra personalizată", exact: true }).click();
    await page.waitForTimeout(500);
    assert.equal(preview.characterToken, "character-proof"); assert.equal(preview.characterImageDataUrl, data);
    assert.equal(preview.configuration.generation.hairColor, "șaten");
    await writeFile(`${out}/configuration.json`, JSON.stringify(preview.configuration));
    assert.equal(await page.getByRole("button", { name: "Pregătim paginile...", exact: true }).isDisabled(), true);
   }
   assert.deepEqual(errors, []);
   console.log(JSON.stringify({ path, width, consent: true, characterApproved: true, noOverflow: true, errors }));
   await page.close();
  }
 }
 const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
 let posts = 0, polls = 0;
 await page.route("**/api/album-preview?view=limits", r => r.fulfill({ json: { remaining: 4, maxAttempts: 4 } }));
 await page.route("**/api/album-preview", r => { posts++; return r.fulfill({ json: { orderId: "retry-order", previewUrl: "/examples/album/collection/coperta.webp", statusUrl: "/api/album-preview?order=retry-order&view=status", title: "Erica", coverReady: false } }); });
 await page.route("**/api/album-preview?order=retry-order**", r => {
   polls++;
   return r.fulfill({ json: polls === 1 ? { status: "failed", canResume: true, error: "Verificarea se reia." } : { status: "ready", qualityChecked: true, pages: ["cover", "story", "story"].map(kind => ({ kind, imageUrl: "/examples/album/collection/coperta.webp", title: "Erica", text: "Test", eyebrow: "Test" })) } });
 });
 await page.goto(base + "/povestea-magica", { waitUntil: "networkidle" });
 await page.getByLabel("Prenume", { exact: true }).fill("Erica");
 for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Continuă", exact: true }).click();
 await page.getByRole("button", { name: "Vezi mostra personalizată", exact: true }).click();
 await page.getByText("Mostra este completă", { exact: true }).waitFor();
 assert.equal(posts, 1); assert.ok(polls >= 2);
 console.log(JSON.stringify({ queuedPreviewRecovery: true, newVariants: posts }));
 await page.close();
} finally { await browser.close(); }
