export const CATALOG_PATH = "/customer/products";

/** Preferred storefront order for known DummyJSON categories (not an exclusivity list). */
export const PREFERRED_CATEGORY_SLUGS = [
  "mens-watches",
  "laptops",
  "smartphones",
  "mobile-accessories",
  "motorcycle",
  "sunglasses",
  "home-decoration",
  "beauty",
  "fragrances",
  "furniture",
  "groceries",
];

/**
 * Desktop top-nav primary promotions — slugs only.
 * Labels and availability always come from the live catalog list.
 * Missing slugs are skipped gracefully.
 */
export const PRIMARY_NAV_CATEGORY_SLUGS = [
  "beauty",
  "fragrances",
  "furniture",
  "groceries",
  "home-decoration",
  "kitchen-accessories",
];

/** Compact footer link budgets — derived from live catalog order, never hardcoded labels. */
export const FOOTER_SHOP_CATEGORY_LIMIT = 4;
export const FOOTER_EXPLORE_CATEGORY_LIMIT = 4;

/**
 * Preferred replacement for the former redundant "All categories" Explore link.
 * Resolved against live catalog; skipped when already shown in Shop/Explore.
 */
export const FOOTER_EXPLORE_EXTRA_PREFERRED_SLUGS = [
  "mens-shoes",
  "mens-shirts",
  "womens-bags",
  "skin-care",
];

/** Desktop primary link budget by viewport (mega-menu always holds the full set). */
export function getPrimaryNavLimit(viewportWidth = 1440) {
  const width = Number(viewportWidth) || 1440;
  if (width < 1180) return 4;
  if (width < 1480) return 5;
  if (width < 1680) return 6;
  return PRIMARY_NAV_CATEGORY_SLUGS.length;
}

/**
 * Resolve configured primary nav categories against the live catalog.
 * @param {{ slug: string, label: string }[]} categories
 * @param {number} [limit]
 */
export function selectPrimaryNavCategories(categories = [], limit = PRIMARY_NAV_CATEGORY_SLUGS.length) {
  const bySlug = new Map(
    categories.map((item) => [String(item.slug || "").toLowerCase(), item])
  );
  const resolved = [];
  for (const slug of PRIMARY_NAV_CATEGORY_SLUGS) {
    if (resolved.length >= limit) break;
    const match = bySlug.get(slug);
    if (match) resolved.push(match);
  }
  return resolved;
}

/**
 * Categories for the Categories mega-menu: catalog order minus currently visible primaries.
 * @param {{ slug: string, label: string }[]} categories
 * @param {{ slug: string, label: string }[]} visiblePrimaryCategories
 */
export function selectOverflowNavCategories(categories = [], visiblePrimaryCategories = []) {
  const visible = new Set(
    visiblePrimaryCategories.map((item) => String(item.slug || "").toLowerCase())
  );
  return categories.filter((item) => !visible.has(String(item.slug || "").toLowerCase()));
}

export function formatCategoryLabel(slug) {
  return String(slug || "")
    .trim()
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const STOREFRONT_CATEGORIES = PREFERRED_CATEGORY_SLUGS.map((slug) => ({
  slug,
  label: formatCategoryLabel(slug),
}));

export const STOREFRONT_CATEGORY_SLUGS = STOREFRONT_CATEGORIES.map((item) => item.slug);

/**
 * Derive unique in-stock categories from the loaded catalog.
 * Preferred slugs keep a stable front-of-list order; everything else is A–Z.
 */
export function deriveStorefrontCategories(products = []) {
  const present = new Set();

  for (const product of products) {
    if (!(Number(product?.price) > 0)) continue;
    const slug = String(product?.category || "").trim().toLowerCase();
    if (slug) present.add(slug);
  }

  const preferred = PREFERRED_CATEGORY_SLUGS.filter((slug) => present.has(slug));
  const rest = [...present]
    .filter((slug) => !PREFERRED_CATEGORY_SLUGS.includes(slug))
    .sort((a, b) => a.localeCompare(b));

  return [...preferred, ...rest].map((slug) => ({
    slug,
    label: formatCategoryLabel(slug),
  }));
}

export function selectFooterShopCategories(categories = []) {
  return categories.slice(0, FOOTER_SHOP_CATEGORY_LIMIT);
}

export function selectFooterExploreCategories(categories = []) {
  return categories.slice(
    FOOTER_SHOP_CATEGORY_LIMIT,
    FOOTER_SHOP_CATEGORY_LIMIT + FOOTER_EXPLORE_CATEGORY_LIMIT
  );
}

/**
 * Mobile Categories sheet Explore list — all catalog entries after the Shop slice.
 * Unlike the compact footer Explore budget, the sheet surfaces the full remainder.
 */
export function selectMobileSheetExploreCategories(categories = []) {
  return categories.slice(FOOTER_SHOP_CATEGORY_LIMIT);
}

/** Preferred Shop / Explore / More budgets for the mobile commerce menu sheet. */
export const MOBILE_MENU_SHOP_LIMIT = 4;
export const MOBILE_MENU_EXPLORE_LIMIT = 8;

/**
 * Group the full canonical category list for the mobile menu.
 * Every catalog category appears in exactly one group — none are dropped.
 * @param {{ slug: string, label: string }[]} categories
 */
export function groupMobileMenuCategories(categories = []) {
  const catalog = Array.isArray(categories) ? categories : [];
  return {
    shop: catalog.slice(0, MOBILE_MENU_SHOP_LIMIT),
    explore: catalog.slice(
      MOBILE_MENU_SHOP_LIMIT,
      MOBILE_MENU_SHOP_LIMIT + MOBILE_MENU_EXPLORE_LIMIT
    ),
    more: catalog.slice(MOBILE_MENU_SHOP_LIMIT + MOBILE_MENU_EXPLORE_LIMIT),
  };
}

/**
 * One additional Explore category beyond the compact Shop/Explore slices.
 * Prefers fashion/care slugs not already linked in the footer.
 * @param {{ slug: string, label: string }[]} categories
 */
export function selectFooterExploreExtraCategory(categories = []) {
  const used = new Set(
    [
      ...selectFooterShopCategories(categories),
      ...selectFooterExploreCategories(categories),
    ].map((item) => String(item.slug || "").toLowerCase())
  );
  const bySlug = new Map(
    categories.map((item) => [String(item.slug || "").toLowerCase(), item])
  );

  for (const slug of FOOTER_EXPLORE_EXTRA_PREFERRED_SLUGS) {
    if (used.has(slug)) continue;
    const match = bySlug.get(slug);
    if (match) return match;
  }

  return (
    categories.find((item) => !used.has(String(item.slug || "").toLowerCase())) || null
  );
}

export function isStorefrontCategorySlug(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return Boolean(normalized);
}

export function buildCategoryCatalogPath(slug) {
  const normalized = String(slug || "").trim().toLowerCase();
  if (!normalized) return CATALOG_PATH;
  return `${CATALOG_PATH}?category=${encodeURIComponent(normalized)}`;
}

export function getCategoryFromSearch(search) {
  const params = typeof search === "string"
    ? new URLSearchParams(search)
    : search;

  const raw = params?.get?.("category");
  const normalized = String(raw || "").toLowerCase().trim();
  return normalized;
}

export function isCategoryCatalogActive(location, slug) {
  if (!location || location.pathname !== CATALOG_PATH) return false;
  return getCategoryFromSearch(location.search) === String(slug).toLowerCase();
}

export function isPublicStorefrontRoute(pathname) {
  const path = String(pathname || "");
  if (path === "/") return true;
  if (path === CATALOG_PATH) return true;
  return false;
}

/**
 * Canonical customer Footer visibility in the shared shell.
 * Public storefront + primary authenticated commerce pages.
 */
export function shouldShowCustomerFooter(pathname) {
  const path = String(pathname || "");
  if (isPublicStorefrontRoute(path)) return true;
  if (path === "/customer/cart") return true;
  if (path === "/customer/orders") return true;
  if (path === "/customer/account") return true;
  return false;
}
