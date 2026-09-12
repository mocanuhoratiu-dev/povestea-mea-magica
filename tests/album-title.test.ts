import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { readEditorialTitle } from "../src/lib/album/title.ts";

test("expressive titles survive unchanged; presentation labels do not", () => {
  assert.equal(readEditorialTitle("Erica și steaua care uitase să strălucească"), "Erica și steaua care uitase să strălucească");
  assert.equal(readEditorialTitle("Titlu: „Scrisoarea de sub aripa lunii”"), "Scrisoarea de sub aripa lunii");
  assert.equal(readEditorialTitle("2. O bătaie la fereastră"), "O bătaie la fereastră");
  assert.equal(readEditorialTitle("Scena 3: O lumină mică"), "O lumină mică");
  assert.equal(readEditorialTitle("O lumină mică - Mostra 2"), "O lumină mică");
  assert.equal(readEditorialTitle("7 chei pentru o singură ușă"), "7 chei pentru o singură ușă");
  for (const invalid of [undefined, "", "3", "Scena 2", "Mostra 3", "a".repeat(101)]) assert.throws(() => readEditorialTitle(invalid));
});

test("preview and fulfillment retain the AI plan title instead of overwriting it", () => {
  const source = readFileSync(new URL("../src/lib/album/orchestrator.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /title:\s*previewTitle/);
  assert.equal(source.match(/previewTitle: plan.title/g)?.length, 2);
});
