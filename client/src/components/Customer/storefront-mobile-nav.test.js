import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const navUrl = new URL("./StorefrontMobileBottomNav.jsx", import.meta.url);
const cssUrl = new URL("../../css/storefront-mobile-nav.css", import.meta.url);
const footerCssUrl = new URL("../../css/storefront-footer.css", import.meta.url);
const navbarUrl = new URL("../Navbar-Model/NavbarModel.jsx", import.meta.url);
const utilUrl = new URL("../../utils/storefrontNavigation.js", import.meta.url);
const iconUrl = new URL("./CategoryBrowseIcon.jsx", import.meta.url);
const categoryNavUrl = new URL("./StorefrontCategoryNav.jsx", import.meta.url);

test("mobile bottom nav mounts beside footer and stays phone-scoped", async () => {
  const [nav, css, navbar, footerCss] = await Promise.all([
    readFile(navUrl, "utf8"),
    readFile(cssUrl, "utf8"),
    readFile(navbarUrl, "utf8"),
    readFile(footerCssUrl, "utf8"),
  ]);

  assert.match(navbar, /StorefrontMobileBottomNav/);
  assert.match(navbar, /showStorefrontFooter \? \([\s\S]*StorefrontMobileBottomNav/);
  assert.match(navbar, /className="b25-customer-command__tool is-logout"/);
  assert.match(navbar, /onClick=\{handleDisconnect\}/);
  assert.match(css, /@media \(max-width: 767px\)/);
  assert.match(css, /\.storefront-mobile-nav\s*\{[^}]*position:\s*fixed/s);
  assert.match(css, /env\(safe-area-inset-bottom/);
  assert.match(css, /\.b25-customer-command__center\s*\{[^}]*display:\s*none/s);
  assert.match(css, /\.storefront-mobile-sheet\.is-dark[\s\S]*?--sms-text:\s*#f4f1ec/);
  assert.match(css, /html\[data-b25-theme="dark"\] \.storefront-mobile-sheet/);
  assert.match(css, /var\(--sms-text,\s*var\(--b25-text\)\)/);
  assert.match(css, /box-sizing:\s*border-box/);
  assert.match(css, /\.storefront-mobile-sheet__search-field\s*\{[^}]*height:\s*46px/s);
  assert.match(footerCss, /@media \(max-width: 767px\)[\s\S]*\.storefront-footer__mobile/);
  assert.match(footerCss, /\.storefront-footer__inner[\s\S]*display:\s*none/);
  assert.match(footerCss, /storefront-mobile-nav-pad/);
  assert.match(footerCss, /\.storefront-footer__chips a\.storefront-footer__chip/);
  assert.match(footerCss, /\.storefront-footer__chips button\.storefront-footer__chip/);
  assert.match(footerCss, /\.storefront-footer__chips/);
  assert.match(footerCss, /\.storefront-footer__payments/);
  assert.match(footerCss, /\.storefront-footer__trust/);
  assert.doesNotMatch(footerCss, /\.storefront-footer__trace\s*\{\s*display:\s*none/);
  assert.match(nav, /Open categories menu/);
  assert.match(nav, /Search categories\.\.\./);
  assert.match(nav, /Close categories menu/);
  assert.match(nav, /AuthBrandMark/);
  assert.match(nav, /auth-brand-mark--mobile-sheet/);
  assert.match(nav, /lockBodyScroll/);
  assert.match(nav, /groupMobileMenuCategories/);
  assert.match(nav, /CategoryBrowseIcon/);
  assert.match(nav, /aria-label="Orders"/);
  assert.match(nav, /MdShoppingCart/);
  assert.match(nav, /cartReducer\.user\?\.cart/);
  assert.match(navbar, /b25-customer-command__mobile-tools/);
  assert.match(navbar, /aria-label="Account"/);
  assert.match(navbar, /aria-label="Logout"/);
  assert.doesNotMatch(nav, /fetch\(|axios/);
});

test("mobile sheet reuses live catalog grouping and shared category icon", async () => {
  const [util, icon, categoryNav, nav] = await Promise.all([
    readFile(utilUrl, "utf8"),
    readFile(iconUrl, "utf8"),
    readFile(categoryNavUrl, "utf8"),
    readFile(navUrl, "utf8"),
  ]);

  assert.match(util, /groupMobileMenuCategories/);
  assert.match(util, /MOBILE_MENU_SHOP_LIMIT/);
  assert.match(util, /MOBILE_MENU_EXPLORE_LIMIT/);
  assert.match(icon, /b25-category-browse__cell/);
  assert.match(categoryNav, /from "\.\/CategoryBrowseIcon"/);
  assert.match(nav, /buildCategoryCatalogPath/);
  assert.match(nav, /Shop all/);
  assert.match(nav, /No categories found/);
  assert.match(nav, /More/);
  assert.doesNotMatch(nav, /My account/);
  assert.doesNotMatch(nav, /storefront-mobile-sheet__account/);
  assert.match(nav, /prefers-reduced-motion|useReducedMotion/);
});
