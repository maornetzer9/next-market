import test from "node:test";
import assert from "node:assert/strict";
import {
  formatReviewCountLabel,
  getDeterministicDemoReviewCount,
  getDisplayReviewCount,
  getRealReviewCount,
  isUsableReviewCount,
} from "./storefrontReviews.js";

test("getRealReviewCount prefers reviewsCount", () => {
  assert.equal(getRealReviewCount({ reviewsCount: 42, reviews: [1, 2, 3] }), 42);
});

test("getRealReviewCount falls back to reviews.length", () => {
  assert.equal(getRealReviewCount({ reviews: [{}, {}, {}, {}] }), 4);
});

test("DummyJSON fixture count is not presentation-usable", () => {
  assert.equal(isUsableReviewCount(3), false);
  assert.equal(isUsableReviewCount(120), true);
});

test("getDisplayReviewCount uses demo when only fixture count exists", () => {
  const a = getDisplayReviewCount({ id: 1, reviewsCount: 3 });
  const b = getDisplayReviewCount({ id: 1, reviewsCount: 3 });
  assert.equal(a, b);
  assert.notEqual(a, 3);
  assert.ok(a >= 18 && a <= 480);
});

test("getDisplayReviewCount prefers genuine varied API counts", () => {
  assert.equal(getDisplayReviewCount({ id: 1, reviewsCount: 134 }), 134);
});

test("deterministic demo counts are stable and varied by id", () => {
  const ids = [1, 7, 31, 16];
  const counts = ids.map((id) => getDeterministicDemoReviewCount(id));
  assert.equal(new Set(counts).size, counts.length);
  for (const count of counts) {
    assert.ok(count >= 18 && count <= 480);
    assert.notEqual(count % 100, 0);
  }
});

test("formatReviewCountLabel pluralizes", () => {
  assert.equal(formatReviewCountLabel(1), "1 review");
  assert.equal(formatReviewCountLabel(120), "120 reviews");
});
