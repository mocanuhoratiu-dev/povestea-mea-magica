import assert from "node:assert/strict";
import test from "node:test";
import { offerFacts, productOffers, type OfferProduct } from "../src/lib/productOffer.ts";
import { albumSampleShortcuts, kitSampleShortcuts } from "../src/lib/sampleNavigation.ts";
import { kitSample } from "../src/lib/kits/sample.ts";
import { buildKitPages } from "../src/lib/kits/template.ts";

test("all offers describe delivery, contents, personalization and the actual prepayment preview", () => {
  for (const product of Object.keys(productOffers) as OfferProduct[]) {
    const facts = offerFacts(product);
    assert.deepEqual(facts.map(fact => fact.label), ["Format digital", "Ce primești", "Personalizare inclusă", "Înainte de plată"]);
    assert.match(facts[0].text, /PDF pe email.*Tipărirea nu este inclusă/);
    assert.ok(facts.every(fact => fact.text.length > 20));
  }
  assert.match(productOffers.album.preview, /Coperta și două pagini/);
  for (const product of ["monster", "emergency"] as const) {
    assert.match(productOffers[product].preview, /orientativă.*după plată/);
  }
  assert.match(productOffers.bundle.preview, /modele publice pentru cele două kituri/);
});

test("kit shortcuts target the real templates, including keepsakes at the end", () => {
  for (const kind of ["monster", "emergency"] as const) {
    const { input, kit } = kitSample(kind);
    const pages = buildKitPages(input, kit);
    const shortcuts = kitSampleShortcuts(pages);
    assert.equal(shortcuts.find(item => item.label === "Coperta")?.index, 0);
    assert.equal(new Set(shortcuts.map(item => item.index)).size, shortcuts.length);
    assert.ok(shortcuts.every(item => pages[item.index]));
    assert.equal(shortcuts.find(item => item.label === "Diploma")?.index, kind === "monster" ? 10 : 9);
    const labels = shortcuts.map(item => item.label);
    for (const label of kind === "monster" ? ["Scutul", "Camera", "Rețeta", "Etichetele"] : ["Labirintul", "Diferențele", "Cartonașele"]) {
      assert.ok(labels.includes(label), `Missing ${kind}: ${label}`);
    }
  }
  assert.deepEqual(kitSampleShortcuts([]), []);
  assert.deepEqual(kitSampleShortcuts([{ title: "Un singur model" }]), []);
});

test("album shortcuts cover distinct story sections within its sixteen pages", () => {
  assert.deepEqual(albumSampleShortcuts.map(item => item.index), [0, 1, 2, 8, 14]);
  assert.ok(albumSampleShortcuts.every(item => item.index >= 0 && item.index < 16));
});
