import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { faqGroups } from "../src/lib/faq.ts";
import { createReadyEmailHtml, productEmailCopy } from "../src/lib/emailTemplates.ts";

test("FAQ anchors are unique and include practical delivery help", () => {
  const ids = faqGroups.flatMap(group => [group.id, ...group.questions.map(question => question.id)]);
  assert.equal(new Set(ids).size, ids.length);
  assert(ids.includes("email-neprimit"));
  for (const group of faqGroups) for (const question of group.questions) {
    assert(question.question.length > 10);
    assert(question.answer.length > 20);
  }
});

test("all transactional emails use the master identity and escape the child name", () => {
  for (const product of Object.keys(productEmailCopy) as (keyof typeof productEmailCopy)[]) {
    const html = createReadyEmailHtml({ product, childName: "Ana <script>", siteUrl: "https://example.com", deliveryUrl: "https://example.com/livrare", deliveryMode: "secure-link" });
    assert(html.includes("https://example.com/brand/email-emblem.png"));
    assert(html.includes("#0b2035"));
    assert(html.includes("#f2cd7a"));
    assert(!html.includes("Ana <script>"));
    assert(html.includes(product === "bundle" || product === "complete_bundle" ? "Pentru familia voastră" : "Ana &lt;script&gt;"));
    assert(html.includes("30 de zile"));
  }
});

test("website identity assets stay lightweight and share the master emblem", async () => {
  const root = new URL("../", import.meta.url);
  const component = await readFile(new URL("src/components/BrandMark.tsx", root), "utf8");
  assert(component.includes('/brand/emblem.svg'));
  for (const [file, max] of [["public/brand/emblem.svg", 8000], ["src/app/icon.png", 10000], ["public/brand/email-emblem.png", 30000]] as const) {
    assert((await stat(new URL(file, root))).size < max, file);
  }
});
