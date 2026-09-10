import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("the flagship cover is presented as a complete hardcover book", () => {
  const mockup = read("../src/components/PremiumBookMockup.tsx");
  const productPage = read("../src/app/povestea-magica/page.tsx");
  const collection = read("../src/components/ProductExamples.tsx");

  assert.match(mockup, /aspect-\[1\.42\]/);
  assert.match(mockup, /book-mockup\.webp/);
  const render = read("../scripts/render-book-mockup.mjs");
  assert.match(render, /BoxGeometry/);
  assert.match(render, /shadowMap.enabled=true/);
  assert.match(render, /cover\.webp/);
  assert.ok(readFileSync(new URL("../public/examples/album/collection/book-mockup.webp", import.meta.url)).length > 10000);
  assert.match(mockup, /object-contain/);
  assert.match(productPage, /<AlbumFlipbook/);
  assert.match(productPage, /ediția digitală/);
  assert.match(collection, /PremiumBookMockup/);
});

test("demo documents and video posters always keep the complete page in frame", () => {
  const samples = read("../src/components/ProductSampleGallery.tsx");
  const videos = read("../src/components/ProductWalkthroughVideo.tsx");
  const flipbook = read("../src/components/AlbumFlipbook.tsx");
  const productPreview = read("../src/components/AlbumPreviewFlipbook.tsx");

  assert.match(samples, /aspect-\[\.707\]/);
  assert.doesNotMatch(samples, /object-cover/);
  assert.match(videos, /object-contain/);
  assert.match(flipbook, /object-contain/);
  assert.doesNotMatch(productPreview, /object-cover/);
});
