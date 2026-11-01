import test from "node:test";
import assert from "node:assert/strict";
import {
  HOMEPAGE_EDITOR_PICK_IDS,
  HOMEPAGE_HERO_PRODUCT_ID,
  resolveHomepageEditorPicks,
  resolveHomepageHeroProduct,
} from "./homepageCuration.js";

const catalog = [
  { id: 1, title: "Mascara", category: "beauty", price: 9.99 },
  { id: 11, title: "Bed", category: "furniture", price: 1899.99 },
  { id: 78, title: "MacBook Pro", category: "laptops", price: 1999.99 },
  { id: 95, title: "Rolex Cellini", category: "mens-watches", price: 8999.99 },
  { id: 98, title: "Rolex Submariner", category: "mens-watches", price: 13999.99 },
  { id: 101, title: "AirPods Max", category: "mobile-accessories", price: 549.99 },
  { id: 114, title: "Kawasaki Z800", category: "motorcycle", price: 8999.99 },
];

test("hero resolves curated Submariner id", () => {
  const hero = resolveHomepageHeroProduct(catalog);
  assert.equal(hero.id, HOMEPAGE_HERO_PRODUCT_ID);
  assert.equal(hero.category, "mens-watches");
});

test("hero falls back to mens-watches when preferred id missing", () => {
  const withoutPreferred = catalog.filter((item) => item.id !== HOMEPAGE_HERO_PRODUCT_ID);
  const hero = resolveHomepageHeroProduct(withoutPreferred);
  assert.equal(hero.category, "mens-watches");
  assert.equal(hero.id, 95);
});

test("editor picks resolve curated ids in order", () => {
  const picks = resolveHomepageEditorPicks(catalog);
  assert.deepEqual(
    picks.map((item) => item.id),
    HOMEPAGE_EDITOR_PICK_IDS
  );
});

test("editor picks fall back by category without duplicates", () => {
  const withoutLaptop = catalog.filter((item) => item.id !== 78);
  const picks = resolveHomepageEditorPicks(withoutLaptop);
  assert.equal(picks.length, 4);
  assert.equal(new Set(picks.map((item) => item.id)).size, 4);
  assert.ok(picks.some((item) => item.category === "laptops") === false);
});
