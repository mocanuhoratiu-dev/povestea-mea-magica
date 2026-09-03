import assert from "node:assert/strict";
import test from "node:test";
import { albumSampleAudio, albumSamplePages } from "../src/lib/album/sample.ts";

test("public premium album sample exposes the complete 16-page book", () => {
  assert.equal(albumSamplePages.length, 16);
  assert.match(albumSamplePages[0].eyebrow, /coperta/i);
  assert.match(albumSamplePages.at(-1)?.eyebrow || "", /coperta finală/i);
});

test("all thirteen story scenes have narration and unique assets", () => {
  const narrated = albumSamplePages.filter((page) => page.narration);
  assert.equal(narrated.length, 13);
  assert.ok(narrated.every((page) => page.narration));
  assert.ok(albumSampleAudio.endsWith(".mp3"));
  assert.equal(new Set(albumSamplePages.map((page) => page.image)).size, albumSamplePages.length);
});
