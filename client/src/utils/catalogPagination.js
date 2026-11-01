/**
 * Desktop catalog page size.
 * Grid is 4 columns; featured card spans 2×2 (= 1 featured + 4 standard beside it),
 * then complete rows of 4. Full pages need: 5 + 4k → 13 fills featured block + 2 rows.
 */
export const CATALOG_PAGE_SIZE = 13;

/**
 * Soft page-change scroll duration (~450–700ms by distance).
 * @param {number} distance
 * @param {boolean} [reduceMotion=false]
 * @returns {number}
 */
export function resolveCatalogPageScrollDuration(distance, reduceMotion = false) {
  if (reduceMotion) return 0;
  const travel = Math.abs(distance);
  if (travel <= 24) return 0;
  if (travel <= 160) return 480;
  if (travel <= 480) return 560;
  return 640;
}

/**
 * @param {string | URLSearchParams | null | undefined} search
 * @returns {number}
 */
export function getPageFromSearch(search) {
  const params = typeof search === "string"
    ? new URLSearchParams(search)
    : search;

  const raw = params?.get?.("page");
  const page = Number.parseInt(String(raw || ""), 10);
  if (!Number.isFinite(page) || page < 1) return 1;
  return page;
}

/**
 * @param {{ category?: string, page?: number }} input
 * @returns {URLSearchParams}
 */
export function buildCatalogSearchParams({ category = "", page = 1 } = {}) {
  const next = new URLSearchParams();
  const normalizedCategory = String(category || "").toLowerCase().trim();
  if (normalizedCategory) next.set("category", normalizedCategory);

  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
  if (safePage > 1) next.set("page", String(safePage));

  return next;
}

/**
 * @param {number} totalItems
 * @param {number} [pageSize=CATALOG_PAGE_SIZE]
 * @returns {number}
 */
export function getCatalogTotalPages(totalItems, pageSize = CATALOG_PAGE_SIZE) {
  const total = Math.max(0, Number(totalItems) || 0);
  const size = Math.max(1, Number(pageSize) || CATALOG_PAGE_SIZE);
  if (total === 0) return 0;
  return Math.ceil(total / size);
}

/**
 * @param {number} page
 * @param {number} totalPages
 * @returns {number}
 */
export function clampCatalogPage(page, totalPages) {
  const safeTotal = Math.max(0, Number(totalPages) || 0);
  if (safeTotal <= 0) return 1;
  const safePage = Number.isFinite(page) ? Math.floor(page) : 1;
  return Math.min(Math.max(1, safePage), safeTotal);
}

/**
 * @template T
 * @param {T[]} items
 * @param {number} page
 * @param {number} [pageSize=CATALOG_PAGE_SIZE]
 * @returns {T[]}
 */
export function sliceCatalogPage(items, page, pageSize = CATALOG_PAGE_SIZE) {
  const list = Array.isArray(items) ? items : [];
  const size = Math.max(1, Number(pageSize) || CATALOG_PAGE_SIZE);
  const totalPages = getCatalogTotalPages(list.length, size);
  const current = clampCatalogPage(page, totalPages);
  const start = (current - 1) * size;
  return list.slice(start, start + size);
}

/**
 * Compact page window with ellipsis tokens.
 * @param {number} currentPage
 * @param {number} totalPages
 * @returns {Array<number | "ellipsis">}
 */
export function getCatalogPageWindow(currentPage, totalPages) {
  const total = Math.max(0, Number(totalPages) || 0);
  if (total <= 0) return [];

  const current = clampCatalogPage(currentPage, total);
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set([1, total, current]);
  for (let offset = -1; offset <= 1; offset += 1) {
    const neighbor = current + offset;
    if (neighbor > 1 && neighbor < total) pages.add(neighbor);
  }

  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }

  if (current >= total - 2) {
    pages.add(total - 1);
    pages.add(total - 2);
    pages.add(total - 3);
  }

  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  /** @type {Array<number | "ellipsis">} */
  const windowItems = [];

  for (let index = 0; index < sorted.length; index += 1) {
    const page = sorted[index];
    const previous = sorted[index - 1];
    if (previous != null && page - previous > 1) {
      windowItems.push("ellipsis");
    }
    windowItems.push(page);
  }

  return windowItems;
}

/**
 * @param {number} page
 * @param {number} totalItems
 * @param {number} [pageSize=CATALOG_PAGE_SIZE]
 * @returns {{ start: number, end: number, total: number }}
 */
export function getCatalogPageRange(page, totalItems, pageSize = CATALOG_PAGE_SIZE) {
  const total = Math.max(0, Number(totalItems) || 0);
  if (total === 0) return { start: 0, end: 0, total: 0 };

  const size = Math.max(1, Number(pageSize) || CATALOG_PAGE_SIZE);
  const totalPages = getCatalogTotalPages(total, size);
  const current = clampCatalogPage(page, totalPages);
  const start = (current - 1) * size + 1;
  const end = Math.min(current * size, total);
  return { start, end, total };
}
