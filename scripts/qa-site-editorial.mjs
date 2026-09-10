import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
const { chromium } = createRequire(import.meta.url)("playwright");
const base = process.env.QA_BASE_URL || "http://127.0.0.1:3014";
const out = process.env.QA_OUTPUT || "/private/tmp/pmm-site-editorial-qa";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const report = [];
try {
  for (const width of [1440, 390, 360, 768]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const routes =
      width === 768
        ? ["/", "/modele", "/povestea-magica"]
        : [
            "/",
            "/povestea-magica",
            "/scutul-de-noapte",
            "/trusa-de-rabdare",
            "/pachet-complet",
            "/preturi",
            "/modele",
            "/despre",
            "/contact",
            "/intrebari-frecvente",
            "/politica-de-confidentialitate",
          ];
    for (const route of routes) {
      await page.goto(base + route, {
        waitUntil: "networkidle",
        timeout: 60000,
      });
      await page.evaluate(() => document.fonts.ready);
      const id = route.slice(1) || "home";
      await page.screenshot({ path: `${out}/${id}-${width}.png` });
      if (route === "/") {
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 650) {
            scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 180));
          }
          scrollTo(0, 0);
        });
        await page.screenshot({
          path: `${out}/home-full-${width}.png`,
          fullPage: true,
        });
        await page
          .getByRole("button", {
            name: "Deschide ghidul Lumi și creează povestea",
            exact: true,
          })
          .click();
        await page.getByPlaceholder("Exemplu: Erica").fill("Raul");
        await page
          .getByRole("button", { name: "Întoarce pagina", exact: true })
          .click();
        await page.getByRole("button", { name: "4 ani", exact: true }).click();
        await page
          .getByRole("button", { name: "Întoarce pagina", exact: true })
          .click();
        await page.screenshot({ path: `${out}/lumi-${width}.png` });
        const within = await page
          .locator('aside[aria-label^="Lumi"]')
          .evaluate((e) => {
            const r = e.getBoundingClientRect();
            return (
              r.left >= 0 &&
              r.top >= 0 &&
              r.right <= innerWidth &&
              r.bottom <= innerHeight + 1
            );
          });
        if (!within) throw Error(`Lumi outside viewport ${width}`);
        await page
          .getByRole("button", { name: "Închide Lumi", exact: true })
          .click();
      }
      if (route === "/modele") {
        for (const index of [0, 1]) {
          const reader = page.locator(".pk-reader").nth(index);
          await reader.scrollIntoViewIfNeeded();
          await page.waitForTimeout(200);
          await page.screenshot({
            path: `${out}/models-kit-${index}-${width}.png`,
          });
          const fits = await reader.evaluate((e) => {
            const r = e.getBoundingClientRect();
            return r.left >= 0 && r.right <= innerWidth + 1;
          });
          if (!fits) throw Error(`Kit outside viewport ${width}`);
          await reader
            .getByRole("button", { name: "Pagina următoare", exact: true })
            .click();
          await reader
            .getByRole("button", { name: "Mărește pagina", exact: true })
            .click();
          await page.locator("dialog[open]").waitFor();
          await page
            .getByRole("button", { name: "Închide pagina mărită", exact: true })
            .click();
        }
      }
      report.push({
        route,
        width,
        ...(await page.evaluate(() => ({
          height: document.body.scrollHeight,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          font: getComputedStyle(document.querySelector("h1")).fontFamily,
        }))),
      });
      console.log(width, route);
    }
    if (errors.length) throw Error(errors.join("\n"));
    await page.close();
  }
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  if (report.some((x) => x.overflow))
    throw Error(
      "Horizontal overflow: " +
        JSON.stringify(report.filter((x) => x.overflow)),
    );
  console.log("All responsive checks passed.");
} finally {
  await browser.close();
}
