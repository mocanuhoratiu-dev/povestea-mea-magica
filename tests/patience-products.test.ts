import assert from "node:assert/strict";
import test from "node:test";
import { buildNightShieldContent, sanitizeNightShieldContent } from "../src/lib/nightShield.ts";
import { createPatienceMaze, solvePatienceMaze } from "../src/lib/patienceActivities.ts";
import { buildPatienceKitContent, patienceDifferenceAnswers, sanitizePatienceKitContent } from "../src/lib/patienceKit.ts";

test("Scutul de Noapte always keeps the complete nine-page content contract", () => {
  const fallback = buildNightShieldContent({ name: "Erica", age: "3", fear: "frica de intuneric", location: "lângă perdea", helper: "mama", ritual: "o poveste" });
  const content = sanitizeNightShieldContent({}, fallback);
  assert.equal(content.storyParagraphs.length, 3);
  assert.equal(content.safePlaces.length, 3);
  assert.equal(content.ritualSteps.length, 3);
  assert.match(content.courageFormula, /Erica/i);
  assert.doesNotMatch(JSON.stringify(content), /spray|tratament|vindec/i);
});

test("every patience maze is connected and has a verified route", () => {
  for (const difficulty of ["easy", "medium", "advanced"] as const) {
    const maze = createPatienceMaze(difficulty);
    assert.equal(maze.cells.length, maze.size * maze.size);
    assert.deepEqual(solvePatienceMaze(maze.size, maze.cells), maze.solution);
    assert.equal(maze.solution[0], 0);
    assert.equal(maze.solution.at(-1), maze.cells.length - 1);
  }
});

test("Trusa keeps eight activity inputs and exactly five known differences", () => {
  const fallback = buildPatienceKitContent({ name: "Raul", age: "5", context: "la un drum lung cu masina", interest: "biciclete", duration: "20+ minute", difficulty: "medium" });
  const content = sanitizePatienceKitContent({}, fallback);
  assert.equal(content.radar.length, 6);
  assert.equal(content.verbalPrompts.length, 6);
  assert.equal(content.cards.length, 8);
  assert.equal(content.levelChallenges.easy.length, 3);
  assert.equal(content.levelChallenges.medium.length, 3);
  assert.equal(content.levelChallenges.advanced.length, 3);
  assert.equal(patienceDifferenceAnswers.length, 5);
});

test("long interests are summarized without visibly clipped copy", () => {
  const content = buildPatienceKitContent({
    name: "Alexandru-Ștefan Constantin",
    age: "10",
    context: "in aeroport sau avion",
    contextLabel: "Aeroport / avion",
    interest: "rachete spațiale, dinozauri, puzzle-uri complicate și avioane de pasageri",
    duration: "20+ minute",
    difficulty: "advanced",
  });

  const allText = JSON.stringify(content);
  assert.match(allText, /rachete spațiale și dinozauri/);
  assert.doesNotMatch(allText, /\.\.\./);
});
