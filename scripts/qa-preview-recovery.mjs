import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
const { chromium } = createRequire(import.meta.url)("playwright");
const base = process.env.QA_BASE_URL || "http://127.0.0.1:3014";
const out = "/private/tmp/pmm-preview-recovery";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const report = [];
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    let calls = 0,
      pending = false,
      networkFailure = false;
    const polls = new Map();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/api/album-preview?view=limits", (route) =>
      route.fulfill({
        json: { maxAttempts: 4, remaining: Math.max(0, 4 - calls) },
      }),
    );
    await page.route("**/api/album-preview", async (route) => {
      if (route.request().method() !== "POST")
        throw Error("Unexpected request");
      calls++;
      if (pending) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return route.abort();
      }
      const id = `mock-${calls}`;
      await route.fulfill({
        json: {
          orderId: id,
          previewUrl: "/examples/album/collection/coperta.webp",
          statusUrl: `/api/album-preview?order=${id}&token=test&view=status`,
          title: `Aventura ${calls}`,
          maxAttempts: 4,
          remaining: 4 - calls,
        },
      });
    });
    await page.route("**/api/album-preview?order=**", async (route) => {
      const id = new URL(route.request().url()).searchParams.get("order");
      polls.set(id, (polls.get(id) || 0) + 1);
      if (networkFailure)
        return route.fulfill({ status: 503, json: { error: "offline" } });
      if (id === "mock-1")
        return route.fulfill({
          json: {
            status: "failed",
            error: "Generarea s-a oprit. Alege altă mostră.",
          },
        });
      if (polls.get(id) === 1)
        return route.fulfill({
          status: 202,
          json: { status: "processing", progress: 1 },
        });
      await route.fulfill({
        json: {
          status: "ready",
          qualityChecked: true,
          pages: ["cover", "story", "story"].map((kind, i) => ({
            kind,
            imageUrl: "/examples/album/collection/coperta.webp",
            title: `Aventura ${id}`,
            eyebrow: "Test",
            text: `Pagina ${i + 1} pentru Erica.`,
          })),
        },
      });
    });
    await page.goto(`${base}/povestea-magica`, { waitUntil: "networkidle" });
    await page.getByLabel("Prenume", { exact: true }).fill("Erica");
    await page.getByRole("button", { name: "Continuă", exact: true }).click();
    await page
      .getByRole("button", { name: /lume.*(voastr|voi|invent)/i })
      .first()
      .click();
    const world = page.locator("#configureaza-albumul textarea").first();
    await world.pressSequentially("O lume roz a zanelor", { delay: 150 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}/world-${width}.png` });
    assert.equal(await world.inputValue(), "O lume roz a zanelor");
    await page
      .getByRole("button", { name: "Ajutor de la Lumi", exact: true })
      .click();
    await page.waitForTimeout(300);
    for (let i = 0; i < 3; i++)
      await page
        .getByRole("button", { name: "Întoarce pagina", exact: true })
        .click();
    const lumiWorld = page
      .getByRole("dialog", { name: "Creează povestea cu Lumi" })
      .locator("textarea");
    await lumiWorld.fill("");
    await page.waitForTimeout(300);
    await lumiWorld.pressSequentially("O lume roz a zanelor si flori", {
      delay: 200,
    });
    await page.waitForTimeout(500);
    assert.equal(await lumiWorld.inputValue(), "O lume roz a zanelor si flori");
    await page
      .getByRole("button", { name: "Închide Lumi", exact: true })
      .click();
    await page.waitForTimeout(300);
    assert.equal(await world.inputValue(), "O lume roz a zanelor si flori");
    await page.getByRole("button", { name: "Continuă", exact: true }).click();
    await page.getByRole("button", { name: "Continuă", exact: true }).click();
    await page
      .getByRole("button", { name: "Vezi mostra personalizată", exact: true })
      .click();
    await page.getByText("Generarea s-a oprit", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Încearcă altă variantă", exact: true })
      .click();
    await page
      .getByText("Mostra este completă", { exact: true })
      .waitFor({ timeout: 20000 });
    assert.equal(calls, 2);
    await page.getByRole("button", { name: "Înapoi", exact: true }).click();
    await page.getByRole("button", { name: "Continuă", exact: true }).click();
    await page.reload({ waitUntil: "networkidle" });
    await page.getByText("Mostra este completă", { exact: true }).waitFor();
    assert.equal(calls, 2, "Back/reload must not generate again");
    const history = page.getByRole("region", { name: "Mostrele tale" });
    assert.equal(await history.getByRole("button").count(), 2);
    await history.getByRole("button", { name: /Mostra 1/ }).click();
    await page
      .getByRole("button", { name: "Creează altă mostră", exact: true })
      .waitFor();
    await history.getByRole("button", { name: /Mostra 2/ }).click();
    await page.getByText("Mostra este completă", { exact: true }).waitFor();
    networkFailure = true;
    await page
      .getByRole("button", { name: "Încearcă altă variantă", exact: true })
      .click();
    await page
      .getByRole("button", { name: /Reia verificarea ·/ })
      .waitFor({ timeout: 25000 });
    networkFailure = false;
    await page.getByRole("button", { name: /Reia verificarea ·/ }).click();
    await page
      .getByText("Mostra este completă", { exact: true })
      .waitFor({ timeout: 20000 });
    assert.equal(calls, 3, "Resuming polling must not consume an attempt");
    pending = true;
    const fourthRequest = page.waitForRequest(request => request.url().endsWith("/api/album-preview") && request.method() === "POST");
    await page
      .getByRole("button", { name: "Încearcă altă variantă", exact: true })
      .click();
    await fourthRequest;
    await page.waitForTimeout(200);
    await page.getByRole("button", { name: "Înapoi", exact: true }).click();
    await page.waitForTimeout(1800);
    await page.getByRole("button", { name: "Continuă", exact: true }).click();
    await page.getByText(/Variante rămase: 0/).waitFor();
    assert.equal(
      await history.getByRole("button").count(),
      3,
      "Aborted request keeps earlier samples",
    );
    await history.getByRole("button", { name: /Mostra 2/ }).click();
    await page.getByText("Mostra este completă", { exact: true }).waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Încearcă altă variantă", exact: true })
        .isDisabled(),
      true,
    );
    await history.screenshot({ path: `${out}/history-${width}.png` });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    assert.deepEqual(errors, []);
    report.push({ width, calls, passed: true });
    await page.close();
  }
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(report);
} finally {
  await browser.close();
}
