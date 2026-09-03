import assert from "node:assert/strict";
import test from "node:test";
import { albumProgressPresentation, albumWorldFromLumi } from "../src/lib/album/presentation.ts";

test("Lumi maps the story space world to the album stars world", () => {
  assert.equal(albumWorldFromLumi("space"), "stars");
  assert.equal(albumWorldFromLumi("dinosaurs"), "dinosaurs");
  assert.equal(albumWorldFromLumi("unknown"), null);
});

test("album progress uses real scene counts and stays bounded", () => {
  assert.deepEqual(albumProgressPresentation({ stage: "scenes", current: 0, total: 13 }), {
    label: "Ilustrăm scenele 0 din 13",
    detail: "Fiecare imagine este creată separat și verificată înainte de a continua.",
    percent: 22,
  });
  assert.equal(albumProgressPresentation({ stage: "scenes", current: 13, total: 13 }).percent, 76);
  assert.equal(albumProgressPresentation({ stage: "scenes", current: 99, total: 13 }).percent, 76);
});

test("album progress exposes every production stage", () => {
  assert.equal(albumProgressPresentation({ stage: "planning", current: 0, total: 13 }).percent, 12);
  assert.equal(albumProgressPresentation({ stage: "cover", current: 0, total: 13 }).percent, 20);
  assert.equal(albumProgressPresentation({ stage: "activity", current: 13, total: 13 }).percent, 80);
  assert.equal(albumProgressPresentation({ stage: "rendering", current: 13, total: 13 }).percent, 90);
  assert.equal(albumProgressPresentation({ stage: "delivery", current: 13, total: 13 }).percent, 97);
});
