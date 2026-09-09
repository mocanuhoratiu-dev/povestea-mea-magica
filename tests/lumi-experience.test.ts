import assert from "node:assert/strict";
import test from "node:test";
import {
  clampLumiProgress,
  lumiContextPrompt,
  lumiGenerationCopy,
  lumiStateForGuideStep,
} from "../src/lib/lumiExperience.ts";

test("Lumi uses the six visual states across guidance and generation", () => {
  const guideStates = Array.from({ length: 9 }, (_, step) => lumiStateForGuideStep(step, 8));
  const generationStates = Object.values(lumiGenerationCopy).map((phase) => phase.visualState);

  assert.deepEqual(
    new Set([...guideStates, ...generationStates]),
    new Set(["greeting", "curious", "guiding", "creating", "encouraging", "celebrating"]),
  );
});

test("Lumi contextual prompts follow the album configurator", () => {
  assert.match(lumiContextPrompt(0), /eroul poveștii/i);
  assert.match(lumiContextPrompt(1, "Erica"), /Erica/);
  assert.match(lumiContextPrompt(2), /detaliu adevărat/i);
  assert.match(lumiContextPrompt(99, "Raul"), /Raul/);
});

test("Lumi progress is stable and bounded", () => {
  assert.equal(clampLumiProgress(-7), 0);
  assert.equal(clampLumiProgress(43.6), 44);
  assert.equal(clampLumiProgress(130), 100);
  assert.equal(clampLumiProgress(Number.NaN), 0);
});

test("generation phases provide customer-facing copy and a visual state", () => {
  for (const [phase, copy] of Object.entries(lumiGenerationCopy)) {
    assert.ok(copy.title.length > 5, `${phase} should have a meaningful title`);
    assert.ok(copy.message.length > 20, `${phase} should explain what is happening`);
    assert.ok(copy.visualState, `${phase} should drive Lumi's visual state`);
  }
});
