import assert from "node:assert/strict";
import test from "node:test";
import { albumPreviewTitle, buildAlbumPreviewPrompt } from "../src/lib/album/previewPrompt.ts";

const input = {
  type: "album" as const,
  name: "Sofia",
  age: "6",
  hairStyle: "două împletituri",
  hairColor: "șaten",
  eyeColor: "verzi",
  skinTone: "medie",
  outfit: "salopetă galbenă și cizme mov",
  appearanceDetail: "ochelari rotunzi și pistrui",
  favoriteColor: "mov ametist",
  world: "library",
  customWorld: "",
  companion: "O bufniță care colecționează povești",
  secondaryCharacterName: "",
  secondaryCharacterRole: "",
  secondaryCharacterAppearance: "",
  lesson: "Curaj și încredere",
  mood: "Misterios, dar blând",
  artStyle: "Guașă pictată manual",
  personalDetail: "un rucsac cu o stea cusută",
  storyContext: "Sofia caută finalul dispărut al unei povești.",
  referenceMode: "description" as const,
};

test("album preview prompt carries the family's visual and story choices", () => {
  const prompt = buildAlbumPreviewPrompt(input, "Biblioteca poveștilor vii");
  for (const expected of ["Sofia", "două împletituri", "ochelari rotunzi", "bufniță", "Biblioteca poveștilor vii", "finalul dispărut", "rucsac"]) {
    assert.match(prompt, new RegExp(expected, "i"));
  }
});

test("album preview reserves editorial space and forbids generated typography", () => {
  const prompt = buildAlbumPreviewPrompt(input, "Biblioteca poveștilor vii");
  assert.match(prompt, /upper-left third/i);
  assert.match(prompt, /No title, no words, no letters, no logo, no watermark/i);
  assert.match(prompt, /authoritative visual reference/i);
});

test("album preview explicitly treats a parent photo as the identity anchor", () => {
  const prompt = buildAlbumPreviewPrompt({ ...input, referenceMode: "photo" }, "Biblioteca poveștilor vii");
  assert.match(prompt, /attached photograph is the authoritative identity reference/i);
  assert.match(prompt, /recognizable facial structure/i);
});

test("album preview title remains deterministic for the final renderer", () => {
  assert.equal(albumPreviewTitle(input), "Sofia și biblioteca poveștilor vii");
});
