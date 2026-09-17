import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { faqGroups, faqs } from "../src/lib/faq.ts";
import { PHOTO_REQUIREMENTS, PHOTO_TECHNICAL_DETAILS } from "../src/lib/characterPhotoPolicy.ts";

test("photo FAQ follows the upload policy, including local HEIC and HEIF conversion", () => {
  const photo = faqGroups.flatMap<{ id: string; answer: string }>(group => group.questions).find(item => item.id === "fotografie");
  assert.ok(photo);
  assert.ok(photo.answer.includes(PHOTO_REQUIREMENTS));
  assert.ok(photo.answer.includes(PHOTO_TECHNICAL_DETAILS));
  assert.match(photo.answer, /HEIC și HEIF sunt convertite în JPG pe dispozitiv/);
  assert.match(photo.answer, /permisiunea necesară/);
});

test("delivery and print FAQ both describe the landscape diplomas of the two kits", () => {
  const delivery = readFileSync(new URL("../src/app/livrare-digitala/page.tsx", import.meta.url), "utf8");
  const printing = faqs.find(item => item.question === "Pot printa materialele?");
  assert.ok(printing);
  for (const text of [delivery, printing.answer]) {
    assert.match(text, /Atelierul și Dosarul sunt A4; diplomele ambelor produse sunt în format orizontal/);
    assert.match(text, /A5 orizontal/);
  }
  assert.match(printing.answer, /nu include un exemplar tipărit/);
});
