import assert from "node:assert/strict";
import test from "node:test";
import { printImagePlacement } from "../src/lib/kits/printImages.ts";

test("portrait kit art is cropped, never stretched into a horizontal certificate", () => {
  const image = printImagePlacement(100, 200, 200, 100, "cover");
  assert.deepEqual(image, { x: 0, y: -150, width: 200, height: 400 });
  assert.equal(image.width / image.height, .5);
});
test("contained art retains its ratio and the whole image", () => {
  assert.deepEqual(printImagePlacement(100, 200, 200, 100, "contain"), { x: 75, y: 0, width: 50, height: 100 });
});
test("print crops respect bottom and percentage positioning", () => {
  assert.equal(printImagePlacement(100, 200, 200, 100, "cover", "center bottom").y, -300);
  assert.equal(printImagePlacement(100, 200, 200, 100, "cover", "50% 42%").y, -126);
});
