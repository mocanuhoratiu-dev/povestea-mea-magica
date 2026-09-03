import assert from "node:assert/strict";
import test from "node:test";
import {
  albumArtStyleOptions,
  albumCompanionOptions,
  albumLessonOptions,
  albumMoodOptions,
  albumWorldOptions,
} from "../src/lib/album/types.ts";

test("premium album offers a substantial set of story choices", () => {
  assert.equal(albumWorldOptions.length, 10);
  assert.equal(albumCompanionOptions.length, 10);
  assert.equal(albumLessonOptions.length, 8);
  assert.equal(albumMoodOptions.length, 4);
  assert.equal(albumArtStyleOptions.length, 4);
});

test("new premium worlds remain available", () => {
  const worldIds = new Set(albumWorldOptions.map((option) => option.id));
  for (const id of ["library", "garden", "aurora", "inventions"]) {
    assert.ok(worldIds.has(id as (typeof albumWorldOptions)[number]["id"]));
  }
});
