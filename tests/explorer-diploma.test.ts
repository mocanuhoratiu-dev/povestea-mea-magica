import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { kitSample } from "../src/lib/kits/sample.ts";
import { buildKitPages } from "../src/lib/kits/template.ts";
import { explorerDiplomaName } from "../src/lib/kits/explorerKeepsake.ts";
import { kitPageGeometry } from "../src/lib/kits/pageGeometry.ts";

test("Explorer closes with the approved map diploma, without adding or changing activity pages", () => {
  const { input, kit } = kitSample("emergency");
  const pages = buildKitPages(input, kit);
  assert.equal(pages.length, 10);
  assert.equal(pages[9].title, "Diploma Micilor Descoperiri");
  assert.deepEqual(pages.map(p => p.orientation || "portrait"), [...Array(9).fill("portrait"), "landscape"]);
  assert.equal(kitPageGeometry(pages[9]).widthMm, 297);
  assert.equal(kitPageGeometry(pages[9]).heightMm, 210);
  assert.match(pages[9].html, /explorer-diploma-map\.webp/);
  assert.doesNotMatch(pages[9].html, /award-initial|DIN JURNALUL EXPEDIȚIEI/);
  assert.ok(readFileSync(new URL("../public/examples/kits-v2/explorer-diploma-map.webp", import.meta.url)).length > 100_000);
});

test("The reusable diploma uses the supplied name, keeps Romanian accents and escapes HTML", () => {
  const { input, kit } = kitSample("emergency");
  for (const name of ["Raul", "Erica", "Ștefan-Andrei", "Alexandra Ștefania Maria Constantinescu", "W".repeat(40)]) {
    const page = buildKitPages({ ...input, name }, kit).at(-1)!;
    assert.ok(page.html.includes(`aria-label="${name}"`));
    if (name !== "Raul") assert.doesNotMatch(page.html, /\bRAUL\b/);
    const layout = explorerDiplomaName(name);
    assert.ok(layout.lines.length <= 2);
    assert.ok(layout.fontSize >= 17 && layout.fontSize <= 76);
    assert.equal(layout.lines.join("").replaceAll(" ", ""), name.toLocaleUpperCase("ro-RO").replaceAll(" ", ""));
  }
  const malicious = buildKitPages({ ...input, name: '<img onerror="alert(1)">' }, kit).at(-1)!;
  assert.doesNotMatch(malicious.html, /<img onerror=/);
  assert.match(malicious.html, /&lt;img/);
  assert.match(buildKitPages(input, kit, true).at(-1)!.html, /sample-watermark/);
});

test("Diploma layout stays bounded in PDF and uses the existing font baseline fix", () => {
  const print = readFileSync(new URL("../src/components/PremiumKitPrint.tsx", import.meta.url), "utf8");
  const layout = readFileSync(new URL("../src/lib/kits/printLayout.ts", import.meta.url), "utf8");
  assert.match(print, /\.gold-keepsake,\.explorer-diploma/);
  assert.match(layout, /\.explorer-diploma-name/);
  assert.match(layout, /footerRect\?\.height/);
});
