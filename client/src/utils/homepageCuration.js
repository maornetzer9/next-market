/**
 * Homepage product curation — IDs only.
 * Resolve against the live catalog; never duplicate product payloads here.
 */

/** Preferred Hero: Rolex Submariner — strongest luxury silhouette in mens-watches. */
export const HOMEPAGE_HERO_PRODUCT_ID = 98;

/**
 * Editor's Picks — visual variety across premium categories:
 * 95 Rolex Cellini Date Black Dial (mens-watches)
 * 78 Apple MacBook Pro 14" (laptops)
 * 114 Kawasaki Z800 (motorcycle)
 * 101 Apple AirPods Max Silver (mobile-accessories)
 */
export const HOMEPAGE_EDITOR_PICK_IDS = [95, 78, 114, 101];

/** Category fallbacks when a preferred ID is missing from the catalog. */
export const HOMEPAGE_HERO_FALLBACK_CATEGORY = "mens-watches";

export const HOMEPAGE_EDITOR_PICK_FALLBACK_CATEGORIES = [
  "mens-watches",
  "laptops",
  "motorcycle",
  "mobile-accessories",
];

function sortById(a, b) {
  return Number(a.id ?? a._id ?? 0) - Number(b.id ?? b._id ?? 0);
}

function isValidProduct(item) {
  return item && Number(item.price) > 0;
}

function findById(products, id) {
  const target = Number(id);
  return products.find((item) => Number(item.id ?? item._id) === target);
}

function firstInCategory(products, categorySlug) {
  const key = String(categorySlug || "").toLowerCase();
  return products
    .filter((item) => isValidProduct(item) && String(item.category || "").toLowerCase() === key)
    .sort(sortById)[0];
}

/**
 * Resolve the Homepage Hero product from curated ID with category fallback.
 * @param {object[]} products
 */
export function resolveHomepageHeroProduct(products = []) {
  const valid = products.filter(isValidProduct);
  const preferred = findById(valid, HOMEPAGE_HERO_PRODUCT_ID);
  if (preferred) return preferred;

  return (
    firstInCategory(valid, HOMEPAGE_HERO_FALLBACK_CATEGORY) ||
    valid.sort(sortById)[0] ||
    null
  );
}

/**
 * Resolve Editor's Picks from curated IDs with per-slot category fallbacks.
 * @param {object[]} products
 * @returns {object[]}
 */
export function resolveHomepageEditorPicks(products = []) {
  const valid = products.filter(isValidProduct);
  const used = new Set();
  const picks = [];

  for (let index = 0; index < HOMEPAGE_EDITOR_PICK_IDS.length; index += 1) {
    const preferredId = HOMEPAGE_EDITOR_PICK_IDS[index];
    let match = findById(valid, preferredId);

    if (!match || used.has(Number(match.id ?? match._id))) {
      const fallbackCategory = HOMEPAGE_EDITOR_PICK_FALLBACK_CATEGORIES[index];
      match = valid
        .filter((item) => String(item.category || "").toLowerCase() === fallbackCategory)
        .filter((item) => !used.has(Number(item.id ?? item._id)))
        .sort(sortById)[0];
    }

    if (!match) {
      match = valid.find((item) => !used.has(Number(item.id ?? item._id)));
    }

    if (match) {
      used.add(Number(match.id ?? match._id));
      picks.push(match);
    }
  }

  return picks;
}
