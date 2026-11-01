import assert from "node:assert/strict";
import test from "node:test";
import { getVisibleCategoryUnits, selectVisibleCategories, toggleHiddenCategory } from "./adminStatisticsChart.js";

const categories = [
  { name: "beauty", quantity: 47, color: "#ff512f" },
  { name: "fragrances", quantity: 17, color: "#168cff" },
  { name: "furniture", quantity: 25, color: "#8f4dff" },
  { name: "groceries", quantity: 28, color: "#08c7c4" },
];

test("all recorded categories are visible initially and retain their colors", () => {
  const visible = selectVisibleCategories(categories, new Set());
  assert.deepEqual(visible, categories);
  assert.equal(getVisibleCategoryUnits(visible), 117);
  assert.equal(visible[0], categories[0]);
});

test("category toggles are immutable, reversible, and derive the visible donut total", () => {
  const initial = new Set();
  const withoutBeauty = toggleHiddenCategory(initial, "beauty");
  assert.equal(initial.size, 0);
  assert.deepEqual([...withoutBeauty], ["beauty"]);
  assert.equal(getVisibleCategoryUnits(selectVisibleCategories(categories, withoutBeauty)), 70);

  const withoutTwo = toggleHiddenCategory(withoutBeauty, "fragrances");
  assert.equal(getVisibleCategoryUnits(selectVisibleCategories(categories, withoutTwo)), 53);
  assert.equal(getVisibleCategoryUnits(selectVisibleCategories(categories, toggleHiddenCategory(withoutTwo, "beauty"))), 100);
  assert.equal(getVisibleCategoryUnits(selectVisibleCategories(categories, toggleHiddenCategory(withoutBeauty, "beauty"))), 117);
});

test("all categories may be hidden without mutating source data", () => {
  const hidden = new Set(categories.map((category) => category.name));
  assert.deepEqual(selectVisibleCategories(categories, hidden), []);
  assert.equal(getVisibleCategoryUnits(selectVisibleCategories(categories, hidden)), 0);
  assert.equal(categories.reduce((total, category) => total + category.quantity, 0), 117);
});
