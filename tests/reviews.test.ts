import assert from "node:assert/strict";
import test from "node:test";
import { isReviewMediaAllowed, reviewDraftError } from "../src/lib/reviews.ts";

test("verified review ratings stay within the public five-star scale", () => {
  assert.equal(reviewDraftError({ rating: 0, displayName: "", quote: "", consentToPublish: false, hasPhoto: false, hasVideo: false }), "Alege un rating de la 1 la 5.");
  assert.equal(reviewDraftError({ rating: 5, displayName: "", quote: "", consentToPublish: false, hasPhoto: false, hasVideo: false }), null);
});

test("public review content requires an explicit, complete consent payload", () => {
  assert.equal(reviewDraftError({ rating: 5, displayName: "Ana", quote: "Ne-a plăcut mult.", consentToPublish: true, hasPhoto: false, hasVideo: false }), null);
  assert.equal(reviewDraftError({ rating: 5, displayName: "", quote: "Ne-a plăcut mult.", consentToPublish: true, hasPhoto: false, hasVideo: false }), "Completează numele și câteva cuvinte înainte de publicare.");
  assert.equal(reviewDraftError({ rating: 4, displayName: "", quote: "", consentToPublish: false, hasPhoto: true, hasVideo: false }), "Confirmă acordul de publicare pentru fișierele încărcate.");
});

test("review media accepts only the bounded formats exposed by the form", () => {
  assert.equal(isReviewMediaAllowed("photo", "image/webp", 6_000_000), true);
  assert.equal(isReviewMediaAllowed("photo", "image/gif", 1000), false);
  assert.equal(isReviewMediaAllowed("video", "video/mp4", 20_000_000), true);
  assert.equal(isReviewMediaAllowed("video", "video/mp4", 20_000_001), false);
});
