import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveAdminProductImage,
  resolveAdminPurchaseImage,
} from "./adminProductImage.js";

test("Admin product image precedence is stable across display and edit sources", () => {
  const product = { thumbnail: " https://example.test/current.webp " };
  assert.equal(resolveAdminProductImage(product), "https://example.test/current.webp");
  assert.equal(
    resolveAdminProductImage({ thumbnail: "", images: ["https://example.test/gallery.webp"] }, product),
    "https://example.test/gallery.webp"
  );
  assert.equal(
    resolveAdminProductImage({ thumbnail: "Add Link To Product Image" }, product),
    "https://example.test/current.webp"
  );
});

test("Admin purchase image preserves historical snapshot precedence", () => {
  const product = { thumbnail: "https://example.test/current.webp" };
  assert.equal(
    resolveAdminPurchaseImage({ thumbnail: "https://example.test/snapshot.webp" }, product),
    "https://example.test/snapshot.webp"
  );
  assert.equal(resolveAdminPurchaseImage({}, product), product.thumbnail);
  assert.equal(resolveAdminPurchaseImage({}, {}), "");
});
