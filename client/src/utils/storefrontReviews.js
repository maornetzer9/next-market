/**
 * Storefront review presentation helpers.
 * Prefer real API counts; use a stable presentation fallback only when source fixtures lack a meaningful total.
 */

/** DummyJSON ships exactly 3 reviews per product; reconcile persists that as reviewsCount. */
const DUMMYJSON_FIXTURE_REVIEW_COUNT = 3;

const FALLBACK_REVIEW_MIN = 18;
const FALLBACK_REVIEW_MAX = 480;

/**
 * @param {unknown} product
 * @returns {number | null}
 */
export function getRealReviewCount(product) {
  if (!product || typeof product !== "object") return null;

  const candidates = [
    product.reviewsCount,
    product.reviewCount,
    product.meta?.reviewCount,
    typeof product.rating === "object" && product.rating != null
      ? product.rating.count
      : null,
    Array.isArray(product.reviews) ? product.reviews.length : null,
  ];

  for (const value of candidates) {
    if (value == null || value === "") continue;
    const count = Number(value);
    if (Number.isFinite(count) && count >= 0) return Math.round(count);
  }

  return null;
}

/**
 * Stable FNV-1a style hash from a product id (no Math.random).
 * @param {string | number | null | undefined} productId
 * @returns {number}
 */
function hashProductId(productId) {
  const raw = String(productId ?? "0");
  let hash = 2166136261;
  for (let index = 0; index < raw.length; index += 1) {
    hash ^= raw.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Deterministic presentation fallback derived from the product id.
 * Same product id → same count across refresh, theme, and navigation.
 * @param {string | number | null | undefined} productId
 * @returns {number}
 */
export function getDeterministicFallbackReviewCount(productId) {
  const hash = hashProductId(productId);
  const span = FALLBACK_REVIEW_MAX - FALLBACK_REVIEW_MIN;
  let count = FALLBACK_REVIEW_MIN + (hash % (span + 1));

  // Avoid suspicious round hundreds / fifties.
  if (count % 100 === 0) count += (hash % 17) + 3;
  if (count % 50 === 0) count += (hash % 9) + 1;

  return Math.min(FALLBACK_REVIEW_MAX, Math.max(FALLBACK_REVIEW_MIN, count));
}

/**
 * Whether a persisted count is presentation-usable.
 * Uniform DummyJSON fixture counts (always 3) look fabricated on every card.
 * @param {number | null} count
 * @returns {boolean}
 */
export function isUsableReviewCount(count) {
  if (!Number.isFinite(count) || count <= 0) return false;
  if (count === DUMMYJSON_FIXTURE_REVIEW_COUNT) return false;
  return true;
}

/**
 * Presentation-only review count. Never writes to API/DB.
 * @param {unknown} product
 * @returns {number}
 */
export function getDisplayReviewCount(product) {
  const real = getRealReviewCount(product);
  if (isUsableReviewCount(real)) return real;

  const id = product && typeof product === "object"
    ? product.id ?? product._id
    : null;
  return getDeterministicFallbackReviewCount(id);
}

/**
 * @param {number} count
 * @returns {string}
 */
export function formatReviewCountLabel(count) {
  const safe = Number.isFinite(count) ? Math.max(0, Math.round(count)) : 0;
  return `${safe} ${safe === 1 ? "review" : "reviews"}`;
}
