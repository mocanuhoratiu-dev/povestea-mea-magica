import assert from "node:assert/strict";
import test from "node:test";
import { albumNarrationParts, isNarrationKind, narrationBytes, narrationDirections, normalizeNarration, splitNarration, NARRATION_MAX_BYTES } from "../src/lib/narration.ts";
import { narrationRequest, narrationCacheKey } from "../src/lib/googleTextToSpeech.ts";

test("one brand voice, four distinct directions, MP3 with native Romanian", () => {
  for (const kind of ["lumi", "story", "shield", "explorer"] as const) {
    const request = narrationRequest("Bun venit!", kind);
    assert.equal(request.voice.name, "Sulafat");
    assert.equal(request.voice.modelName, "gemini-3.1-flash-tts-preview");
    assert.equal(request.voice.languageCode, "ro-RO");
    assert.equal(request.audioConfig.audioEncoding, "MP3");
    assert.equal(request.input.prompt, narrationDirections[kind]);
    assert.ok(narrationBytes(request.input.prompt) < 4000);
  }
  assert.equal(new Set(Object.values(narrationDirections)).size, 4);
});

test("voice kinds reject prototype keys and invalid inputs", () => {
  for (const input of [null, undefined, {}, 1, "__proto__", "toString", "aoede"]) assert.equal(isNarrationKind(input), false);
  assert.ok(isNarrationKind("shield"));
});

test("normalization keeps paragraph breaks for expressive reading", () => {
  assert.equal(normalizeNarration("  Bun   venit!\r\n\r\n Aici e Lumi.  "), "Bun venit!\n\n Aici e Lumi.");
});

test("long Romanian narration keeps every word through the final sentence", () => {
  const text = Array.from({ length: 150 }, (_, i) => `Capitolul ${i}: fetița șoptește încet, în lumină. Apoi începe o nouă aventură!`).join("\n\n") + "\nSfârșit.";
  const chunks = splitNarration(text);
  assert.ok(chunks.length > 3);
  assert.ok(chunks.every((chunk) => narrationBytes(chunk) <= NARRATION_MAX_BYTES));
  assert.equal(chunks.join(" ").replace(/\s+/g, ""), text.replace(/\s+/g, ""));
  assert.ok(chunks.at(-1)?.endsWith("Sfârșit."));
});

test("Unicode, giant words, no punctuation and boundary cases never exceed bytes", () => {
  for (const text of ["ș".repeat(9000), "🌟".repeat(2100), "bine ".repeat(3000), "...!? Bun!", "", "A".repeat(3500), "A".repeat(3501)]) {
    const chunks = splitNarration(text);
    assert.ok(chunks.every((chunk) => narrationBytes(chunk) <= NARRATION_MAX_BYTES && !chunk.includes("\ufffd")));
    assert.equal(chunks.join("").replace(/\s/g, ""), text.replace(/\s/g, ""));
  }
  assert.throws(() => splitNarration("test", 0));
  assert.throws(() => narrationRequest("ș".repeat(2000), "story"), /length/);
  assert.throws(() => narrationRequest(" ", "lumi"), /length/);
});

test("cache keys distinguish performance, text and configured voice", () => {
  assert.notEqual(narrationCacheKey("Bun venit!", "lumi"), narrationCacheKey("Bun venit!", "story"));
  assert.notEqual(narrationCacheKey("Bun venit!", "lumi"), narrationCacheKey("Salut!", "lumi"));
  assert.equal(narrationCacheKey(" Bun  venit! ", "lumi"), narrationCacheKey("Bun venit!", "lumi"));
});

test("album tracks contain the entire story and exact page associations", () => {
  const plan = { title: "O aventură minunată", scenes: Array.from({ length: 13 }, (_, i) => ({ heading: `Titlu ${i}`, text: `Pagina ${i}. ` + "O nouă aventură. ".repeat(i === 4 ? 450 : 5) })) };
  const parts = albumNarrationParts(plan);
  assert.equal(parts[0].text, plan.title);
  assert.equal(parts[0].pageIndex, 0);
  for (let i = 0; i < plan.scenes.length; i++) {
    const text = parts.filter((part) => part.pageIndex === i + 2).map((part) => part.text).join(" ");
    assert.equal(text.replace(/\s/g, ""), `${plan.scenes[i].heading}.${plan.scenes[i].text}`.replace(/\s/g, ""));
  }
  assert.ok(parts.length > 14);
  assert.equal(parts.at(-1)?.pageIndex, 14);
});
