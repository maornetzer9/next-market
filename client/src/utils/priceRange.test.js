import assert from "node:assert/strict";
import test from "node:test";

import {
  clampPriceRange,
  getValidPriceBounds,
  isValidCatalogPrice,
  resolvePriceRange,
} from "./priceRange.js";

test("V13 derives initial bounds from finite positive product prices", () => {
  const products = [
    { price: 19.99 },
    { price: 8.99 },
    { price: 2499.99 },
    { price: 0 },
    { price: -5 },
    { price: Number.NaN },
    { price: Number.POSITIVE_INFINITY },
    { price: "145.00" },
    {},
  ];

  assert.deepEqual(getValidPriceBounds(products), {
    min: 8.99,
    max: 2499.99,
  });
  assert.deepEqual(resolvePriceRange(products), [8.99, 2499.99]);
  assert.equal(isValidCatalogPrice("145.00"), true);
  assert.equal(isValidCatalogPrice(0), false);
});

test("V13 handles empty or invalid product prices safely", () => {
  assert.equal(getValidPriceBounds([]), null);
  assert.equal(getValidPriceBounds([{ price: "invalid" }, { price: null }]), null);
  assert.deepEqual(resolvePriceRange([]), [0, 0]);
});

test("V13 preserves a manually selected range within available bounds", () => {
  const selectedRange = [25, 300];
  const reloadedProducts = [{ price: 8.99 }, { price: 2499.99 }];

  assert.deepEqual(
    resolvePriceRange(reloadedProducts, selectedRange),
    selectedRange,
  );
});

test("category-scoped bounds ignore other categories and clamp selection", () => {
  const products = [
    { category: "groceries", price: 1.99 },
    { category: "groceries", price: 12.5 },
    { category: "laptops", price: 899 },
    { category: "laptops", price: 36999.99 },
  ];

  assert.deepEqual(getValidPriceBounds(products, { category: "groceries" }), {
    min: 1.99,
    max: 12.5,
  });
  assert.deepEqual(getValidPriceBounds(products, { category: "laptops" }), {
    min: 899,
    max: 36999.99,
  });
  assert.deepEqual(getValidPriceBounds(products), {
    min: 1.99,
    max: 36999.99,
  });

  assert.deepEqual(
    clampPriceRange([0, 50000], getValidPriceBounds(products, { category: "groceries" })),
    [1.99, 12.5],
  );
});
