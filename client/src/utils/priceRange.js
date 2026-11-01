/**
 * Sellable Shop prices: finite and greater than zero.
 * Matches catalog visibility (`item.price > 0`) after numeric coercion.
 * @param {unknown} price
 * @returns {boolean}
 */
export const isValidCatalogPrice = (price) => {
  const amount = Number(price);
  return Number.isFinite(amount) && amount > 0;
};

/**
 * Available Price Range bounds from the full (or category-scoped) catalog.
 * Pagination must never slice the input — pass the complete product list.
 *
 * @param {Array<{ price?: unknown, category?: string }>} [products]
 * @param {{ category?: string }} [options]
 * @returns {{ min: number, max: number } | null}
 */
export const getValidPriceBounds = (products = [], options = {}) => {
  const category = typeof options.category === "string" ? options.category : "";
  const prices = [];

  for (const product of products) {
    if (category && product?.category !== category) continue;
    if (!isValidCatalogPrice(product?.price)) continue;
    prices.push(Number(product.price));
  }

  if (!prices.length) return null;

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
};

/**
 * Clamp a selected [min, max] into available bounds.
 * @param {[number, number] | null | undefined} range
 * @param {{ min: number, max: number } | null} bounds
 * @returns {[number, number] | null}
 */
export const clampPriceRange = (range, bounds) => {
  if (!bounds) return null;
  if (!Array.isArray(range) || range.length < 2) {
    return [bounds.min, bounds.max];
  }

  const low = Math.min(Number(range[0]), Number(range[1]));
  const high = Math.max(Number(range[0]), Number(range[1]));
  const nextMin = Math.min(Math.max(low, bounds.min), bounds.max);
  const nextMax = Math.min(Math.max(high, bounds.min), bounds.max);

  return [Math.min(nextMin, nextMax), Math.max(nextMin, nextMax)];
};

/**
 * Resolve the active selected range; default to full available bounds.
 * @param {Array} products
 * @param {[number, number] | null} [selectedRange]
 * @param {{ category?: string }} [options]
 * @returns {[number, number]}
 */
export const resolvePriceRange = (products = [], selectedRange = null, options = {}) => {
  const bounds = getValidPriceBounds(products, options);
  if (!bounds) return [0, 0];
  if (!selectedRange) return [bounds.min, bounds.max];
  return clampPriceRange(selectedRange, bounds) || [bounds.min, bounds.max];
};

const catalogPriceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const formatCatalogPrice = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? catalogPriceFormatter.format(amount) : "$0.00";
};
