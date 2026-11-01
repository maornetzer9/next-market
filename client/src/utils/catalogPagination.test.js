import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  buildCatalogSearchParams,
  CATALOG_PAGE_SIZE,
  clampCatalogPage,
  getCatalogPageRange,
  getCatalogPageWindow,
  getCatalogTotalPages,
  getPageFromSearch,
  resolveCatalogPageScrollDuration,
  sliceCatalogPage,
} from "./catalogPagination.js";

describe("catalogPagination", () => {
  test("uses 13 items per page to fill featured + two standard rows", () => {
    assert.equal(CATALOG_PAGE_SIZE, 13);
  });

  test("parses and builds page query params", () => {
    assert.equal(getPageFromSearch(""), 1);
    assert.equal(getPageFromSearch("?page=3"), 3);
    assert.equal(getPageFromSearch("?page=0"), 1);
    assert.equal(getPageFromSearch("?page=abc"), 1);

    assert.equal(buildCatalogSearchParams({ page: 1 }).toString(), "");
    assert.equal(buildCatalogSearchParams({ page: 4 }).toString(), "page=4");
    assert.equal(
      buildCatalogSearchParams({ category: "Laptops", page: 2 }).toString(),
      "category=laptops&page=2",
    );
  });

  test("computes pages and slices after filtering", () => {
    assert.equal(getCatalogTotalPages(194), 15);
    assert.equal(getCatalogTotalPages(13), 1);
    assert.equal(getCatalogTotalPages(14), 2);
    assert.equal(getCatalogTotalPages(0), 0);
    assert.equal(clampCatalogPage(20, 15), 15);
    assert.equal(clampCatalogPage(0, 15), 1);

    const items = Array.from({ length: 194 }, (_, index) => index + 1);
    assert.deepEqual(sliceCatalogPage(items, 1), items.slice(0, 13));
    assert.deepEqual(sliceCatalogPage(items, 15), items.slice(182, 194));
    assert.deepEqual(sliceCatalogPage(items, 99), items.slice(182, 194));
  });

  test("builds compact page windows", () => {
    assert.deepEqual(getCatalogPageWindow(1, 5), [1, 2, 3, 4, 5]);
    assert.deepEqual(getCatalogPageWindow(1, 15), [1, 2, 3, 4, "ellipsis", 15]);
    assert.deepEqual(getCatalogPageWindow(8, 15), [1, "ellipsis", 7, 8, 9, "ellipsis", 15]);
    assert.deepEqual(getCatalogPageWindow(14, 15), [1, "ellipsis", 12, 13, 14, 15]);
  });

  test("formats showing range labels", () => {
    assert.deepEqual(getCatalogPageRange(1, 194), { start: 1, end: 13, total: 194 });
    assert.deepEqual(getCatalogPageRange(15, 194), { start: 183, end: 194, total: 194 });
    assert.deepEqual(getCatalogPageRange(1, 0), { start: 0, end: 0, total: 0 });
  });

  test("resolves softer page-change scroll durations", () => {
    assert.equal(resolveCatalogPageScrollDuration(10), 0);
    assert.equal(resolveCatalogPageScrollDuration(120), 480);
    assert.equal(resolveCatalogPageScrollDuration(300), 560);
    assert.equal(resolveCatalogPageScrollDuration(900), 640);
    assert.equal(resolveCatalogPageScrollDuration(900, true), 0);
  });
});
