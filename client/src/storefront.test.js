import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appUrl = new URL("./App.jsx", import.meta.url);
const homepageUrl = new URL("./components/Customer/Homepage.jsx", import.meta.url);
const footerUrl = new URL("./components/Customer/StorefrontFooter.jsx", import.meta.url);
const productsUrl = new URL("./components/Customer/Products.jsx", import.meta.url);
const loginUrl = new URL("./components/Login.jsx", import.meta.url);
const navbarUrl = new URL("./components/Navbar-Model/NavbarModel.jsx", import.meta.url);
const navUrl = new URL("./components/Customer/NeuralWaveNav.jsx", import.meta.url);
const protectedRouteUrl = new URL("./components/ProtectedRoute.jsx", import.meta.url);

test("B3.2 storefront exposes public homepage and catalog without full customer guard", async () => {
  const app = await readFile(appUrl, "utf8");

  assert.match(app, /path="\/" element=\{withRouteLoader\(<Customer \/>\)\}/);
  assert.match(app, /CustomerHomepage/);
  assert.match(app, /path="customer\/products"/);
  assert.match(app, /path="customer" element=\{<Navigate to="\/" replace \/>\}/);
  assert.doesNotMatch(app, /ProtectedRoute[\s\S]*path="\/customer" element=\{withRouteLoader\(<Customer/);
});

test("B3.2 protected commerce routes redirect to login with return location", async () => {
  const [app, protectedRoute] = await Promise.all([
    readFile(appUrl, "utf8"),
    readFile(protectedRouteUrl, "utf8"),
  ]);

  for (const route of ["customer/orders", "customer/account", "customer/cart"]) {
    assert.match(app, new RegExp(`path="${route}"`));
  }

  assert.match(protectedRoute, /redirectTo = '\/login'/);
  assert.match(protectedRoute, /state=\{\{ from: location \}\}/);
});

test("B3.2 login returns to intended route or storefront homepage", async () => {
  const [login, signIn, authRedirect] = await Promise.all([
    readFile(loginUrl, "utf8"),
    readFile(new URL("./auth/SignInForm.jsx", import.meta.url), "utf8"),
    readFile(new URL("./auth/authRedirect.js", import.meta.url), "utf8"),
  ]);

  assert.match(login, /AuthRouteAdapter mode="sign-in"/);
  assert.match(signIn, /resolveLoginRedirect/);
  assert.match(authRedirect, /fromPath && fromPath !== "\/login"/);
  assert.match(authRedirect, /if \(!canReturn\) return "\/"/);
});

test("B3.2 add to cart requires authentication from catalog and homepage", async () => {
  const [homepage, products] = await Promise.all([
    readFile(homepageUrl, "utf8"),
    readFile(productsUrl, "utf8"),
  ]);

  assert.match(homepage, /requireAuthForCart/);
  assert.match(homepage, /openAuthModal\("sign-in"/);
  assert.match(products, /requestAddToCart/);
  assert.match(products, /openAuthModal\("sign-in"/);
});

test("B3.2 navigation adapts to auth state without duplicating storefront pages", async () => {
  const [navbar, nav] = await Promise.all([
    readFile(navbarUrl, "utf8"),
    readFile(navUrl, "utf8"),
  ]);

  assert.match(navbar, /isAuthenticatedUser/);
  assert.match(navbar, /STOREFRONT_PRIMARY_NAV/);
  assert.match(navbar, /PUBLIC_AUTH_NAV/);
  assert.match(navbar, /useLoadCart\(variant === 'customer' && authenticated\)/);
  assert.match(nav, /isAuthenticated/);
  assert.doesNotMatch(nav, /publicAuthOptions/);
  assert.match(nav, /isAuthenticated \? \(/);
  assert.doesNotMatch(navbar, /PublicCatalog|AuthenticatedCatalog/);
});

test("B3.2 homepage uses real catalog data flow", async () => {
  const homepage = await readFile(homepageUrl, "utf8");

  assert.match(homepage, /useLoadProducts\(\)/);
  assert.match(homepage, /useSelector\(\(state\) => state\.productsReducer\)/);
  assert.match(homepage, /to="\/customer\/products"/);
  assert.doesNotMatch(homepage, /fake|mockProducts|placeholder/i);
});

test("Homepage polish avoids internal demo language", async () => {
  const [homepage, footer, css] = await Promise.all([
    readFile(homepageUrl, "utf8"),
    readFile(footerUrl, "utf8"),
    readFile(new URL("./css/homepage.css", import.meta.url), "utf8"),
  ]);

  for (const term of [/reconciled/i, /live catalog/i, /active categories/i, /live products/i, /Sign in to shop/i]) {
    assert.doesNotMatch(homepage, term);
    assert.doesNotMatch(css, term);
  }

  assert.match(homepage, /import ScrollToTop from "\.\/ScrollToTop"/);
  assert.match(homepage, /<ScrollToTop \/>/);
  assert.match(homepage, /Essentials worth bringing home/);
  assert.match(homepage, /Editor/);
  assert.match(homepage, /AuthBrandMark/);
  assert.match(homepage, /auth-brand-mark--hero/);
  assert.match(homepage, /storefront-hero__brand-row/);
  assert.doesNotMatch(homepage, /storefront-footer/);
  assert.match(footer, /storefront-footer__legal/);
  assert.doesNotMatch(homepage, /storefront-category-card__preview/);
});

test("storefront footer mounts at public shell level", async () => {
  const [navbar, footer, navUtil] = await Promise.all([
    readFile(navbarUrl, "utf8"),
    readFile(footerUrl, "utf8"),
    readFile(new URL("./utils/storefrontNavigation.js", import.meta.url), "utf8"),
  ]);

  assert.match(navbar, /shouldShowCustomerFooter\(location\.pathname\)/);
  assert.match(navbar, /<StorefrontFooter[\s\S]*authenticated=\{authenticated\}/);
  assert.match(navbar, /StorefrontMobileBottomNav/);
  assert.match(navbar, /onOpenSignIn=\{onOpenSignIn\}/);
  assert.match(footer, /buildCategoryCatalogPath/);
  assert.match(footer, /selectFooterShopCategories/);
  assert.match(footer, /selectFooterExploreExtraCategory/);
  assert.match(footer, /AuthBrandMark/);
  assert.match(footer, /auth-brand-mark--footer/);
  assert.doesNotMatch(footer, /All categories/);
  assert.match(footer, /Shop all/);
  assert.match(footer, /storefront-footer__mobile/);
  assert.match(footer, /storefront-footer__chips/);
  assert.match(footer, /PaymentMethodTile/);
  assert.match(footer, /Secure shopping/);
  assert.match(footer, /Easy returns/);
  assert.match(footer, /Curated quality/);
  assert.match(footer, /auth-brand-mark--footer-mobile/);
  assert.match(navUtil, /FOOTER_SHOP_CATEGORY_LIMIT/);
  assert.match(navUtil, /FOOTER_EXPLORE_EXTRA_PREFERRED_SLUGS/);
  assert.match(navUtil, /mens-shoes/);
  assert.match(navUtil, /shouldShowCustomerFooter/);
  assert.match(navUtil, /\/customer\/cart/);
});

test("storefront category navigation uses shared catalog filter contract", async () => {
  const [homepage, products, navbar, navUtil, categoryNav] = await Promise.all([
    readFile(homepageUrl, "utf8"),
    readFile(productsUrl, "utf8"),
    readFile(navbarUrl, "utf8"),
    readFile(new URL("./utils/storefrontNavigation.js", import.meta.url), "utf8"),
    readFile(new URL("./components/Customer/StorefrontCategoryNav.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(navUtil, /buildCategoryCatalogPath/);
  assert.match(navUtil, /\?category=\$\{encodeURIComponent\(normalized\)\}/);
  assert.match(navUtil, /deriveStorefrontCategories/);
  assert.match(navUtil, /PRIMARY_NAV_CATEGORY_SLUGS/);
  assert.match(navUtil, /selectPrimaryNavCategories/);
  assert.match(navUtil, /selectOverflowNavCategories/);
  assert.match(homepage, /buildCategoryCatalogPath/);
  assert.match(homepage, /deriveStorefrontCategories/);
  assert.match(products, /useSearchParams/);
  assert.match(products, /getCategoryFromSearch/);
  assert.match(products, /selectedCategory=\{filteredCategory\}/);
  assert.match(navbar, /StorefrontCategoryNav/);
  assert.match(navbar, /deriveStorefrontCategories/);
  assert.match(categoryNav, /Store departments/);
  assert.match(categoryNav, /buildCategoryCatalogPath/);
  assert.match(categoryNav, /isCategoryCatalogActive/);
  assert.match(categoryNav, /selectPrimaryNavCategories/);
  assert.match(categoryNav, /selectOverflowNavCategories/);
  assert.match(categoryNav, /overflowCategories/);
  assert.match(categoryNav, /Categories/);
  assert.match(categoryNav, /b25-category-mega/);
  assert.doesNotMatch(categoryNav, /ResizeObserver/);
  assert.doesNotMatch(categoryNav, />More</);
});
