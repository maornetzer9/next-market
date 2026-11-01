import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("./Products.jsx", import.meta.url), "utf8");
const product = readFileSync(new URL("./Product.jsx", import.meta.url), "utf8");
const filters = readFileSync(new URL("./AdminProductFilters.jsx", import.meta.url), "utf8");
const image = readFileSync(new URL("./AdminEntityImage.jsx", import.meta.url), "utf8");
const pageCss = readFileSync(new URL("../../css/admin-products.css", import.meta.url), "utf8");
const productCss = readFileSync(new URL("../../css/admin-product.css", import.meta.url), "utf8");
const categoryTone = readFileSync(new URL("../../utils/categoryTone.js", import.meta.url), "utf8");
const imageResolver = readFileSync(new URL("../../utils/adminProductImage.js", import.meta.url), "utf8");

test("Admin Products preserves existing API, Redux, and filter contracts", () => {
  assert.match(page, /loadProductsAction\(PRODUCTS_URL_LOAD, \{ authenticated: true \}\)/);
  assert.match(page, /modifyProductsAction\(editData, MODIFY_PRODUCT_URL\)/);
  assert.match(page, /modifyProductsAction\(newProduct, MODIFY_PRODUCT_URL\)/);
  assert.match(page, /useSelector\(\(state\) => state\.productsReducer\)/);
  for (const handler of ["handlePriceChange", "handleCategoryChange", "handleSearchChange"]) {
    assert.match(page, new RegExp(handler));
  }
});

test("Products performs one request per route mount without replaying the blocking loader", () => {
  assert.match(page, /const productRequestRef = useRef\(null\)/);
  assert.match(page, /useState\(\(\) => products\.length === 0\)/);
  assert.match(page, /if \(!productRequestRef\.current\)/);
  assert.match(page, /productRequestRef\.current = Promise\.resolve\(dispatch\(loadProductsAction\(PRODUCTS_URL_LOAD, \{ authenticated: true \}\)\)\)/);
  assert.match(page, /hasProductsOnEntryRef\.current/);
  assert.doesNotMatch(page, /\[dispatch, products\.length, PRODUCTS_URL_LOAD\]/);
  assert.doesNotMatch(page, /__adminProductsTrace/);
});

test("Products summary and purchase history derive only persisted real fields", () => {
  assert.match(page, /products\.filter\(\(p\) => Number\(p\.stock\) === 0\)/);
  assert.match(page, /Array\.isArray\(p\.purchases\)/);
  assert.match(page, /product\.purchases/);
  assert.match(page, /purchase\.quantity \?\? purchase\.qty/);
  assert.match(page, /purchase\.date \|\| purchase\.joinedAt \|\| purchase\.createdAt/);
  assert.match(page, /resolveAdminPurchaseImage\(purchase, product\)/);
  assert.match(page, /admin-products__purchase-image[\s\S]*loading="eager"/);
  assert.doesNotMatch(page, />Active<|>Draft<|publish state|sales value/i);
});

test("Product row becomes a coherent editor with existing editable fields and cancel", () => {
  for (const field of ["title", "category", "description", "price", "thumbnail"]) {
    assert.match(product, new RegExp(`name=["']${field}["']`));
  }
  assert.match(page, /handleCancelEdit/);
  assert.match(page, />\s*Cancel\s*</);
  assert.match(page, />\s*Save\s*/);
  assert.match(productCss, /admin-product__editor/);
  assert.match(productCss, /@media \(min-width: 821px\)[\s\S]*admin-product__editor \{[^}]*grid-template-columns: minmax\(300px, \.82fr\) minmax\(0, 2\.18fr\)[^}]*align-items: stretch/s);
  assert.match(productCss, /admin-product__editor-media \{[^}]*display: grid[^}]*align-self: stretch[^}]*min-height: 0/s);
  assert.match(productCss, /admin-product__editor-media \.admin-product__thumb \{[^}]*width: 100% !important[^}]*height: 100% !important/s);
  assert.match(productCss, /admin-product__editor-form \{[^}]*grid-template-columns/s);
  assert.match(productCss, /admin-product__input[^}]*box-sizing: border-box[^}]*min-width: 0/s);
  assert.match(product, /function ProductStock/);
  assert.match(product, /admin-product__stock-units/);
});

test("Product imagery uses the shared failure-safe Admin image primitive", () => {
  assert.match(page, /AdminEntityImage/);
  assert.match(product, /AdminEntityImage/);
  assert.match(image, /onLoad=\{\(\) => setLoadedSrc\(normalizedSrc\)\}/);
  assert.match(image, /setFailedSrc\(normalizedSrc\)/);
  assert.match(image, /Image unavailable/);
  assert.match(image, /IntersectionObserver/);
  assert.match(image, /root: host\.closest\("\.admin-products__list-viewport, \.admin-products__purchases-list, \.admin-customers__order-cards"\)/);
  assert.match(image, /loading="eager"/);
  assert.match(image, /data-image-status=\{imageStatus\}/);
  assert.match(image, /imageStatus === "failed"/);
  assert.match(image, /imageStatus === "idle" \|\| imageStatus === "loading"/);
  assert.match(product, /resolveAdminProductImage\(display, product\)/);
  assert.match(imageResolver, /resolveAdminProductImage/);
  assert.match(imageResolver, /resolveAdminPurchaseImage/);
});

test("Products reuses the deterministic Admin category tone resolver", () => {
  assert.match(product, /getCategoryTone\(product\.category\)/);
  assert.match(product, /--category-accent/);
  assert.match(categoryTone, /export function getCategoryTone/);
  assert.doesNotMatch(categoryTone, /Math\.random/);
});

test("Products reuses shared premium KPI and section-card primitives", () => {
  assert.match(page, /import AdminMetricCard/);
  assert.match(page, /<AdminMetricCard tone="coral"/);
  assert.match(page, /<AdminMetricCard tone="green"/);
  assert.match(page, /<AdminSectionCard/);
  assert.doesNotMatch(pageCss, /admin-products__metric\.is-accent \{[^}]*border-color/s);
});

test("Admin product controls retain semantic and accessible filter inputs", () => {
  assert.match(filters, /type="search"/);
  assert.match(filters, /<select/);
  assert.match(filters, /<fieldset/);
  assert.match(filters, /getAriaLabel/);
  assert.match(filters, /onChangeCommitted=\{handlePriceCommit\}/);
  assert.match(filters, /Product command bar/);
  assert.match(filters, /getCategoryTone\(selectedCategory\)/);
  assert.doesNotMatch(pageCss, /admin-products__btn::after\s*\{[^}]*content:/s);
});

test("Products uses deliberate desktop density and mobile card recomposition", () => {
  assert.match(pageCss, /max-height: min\(535px, calc\(100vh - 365px\)\)/);
  assert.match(pageCss, /overflow-y: auto/);
  assert.match(productCss, /grid-template-areas: "thumb identity price" "thumb category stock"/);
  assert.match(pageCss, /@media \(max-width: 370px\)/);
  assert.match(pageCss, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(page, /motion\.article|layout\s*=/);
  assert.match(product, /function sourceLabel/);
  assert.match(product, /OpenInNewRoundedIcon/);
});

test("Products mobile owns bounded catalog and purchase history scrolling", () => {
  assert.match(pageCss, /admin-products__list \{ height: clamp\(340px, 58dvh, 560px\)[^}]*overflow: hidden/s);
  assert.match(pageCss, /max-height: calc\(100dvh - var\(--b25-command-height, 64px\) - var\(--admin-mobile-nav-height, 64px\) - env\(safe-area-inset-bottom, 0px\) - 28px\)/);
  assert.match(pageCss, /admin-products__list-viewport \{ height: 100%; overflow-x: hidden; overflow-y: auto/);
  assert.match(pageCss, /admin-products__list-head \{ position: sticky; top: 0/);
  assert.match(pageCss, /admin-products__purchases-list \{ grid-template-columns: 1fr; max-height: min\(46dvh, 390px\); overflow-x: hidden; overflow-y: auto/);
  assert.match(pageCss, /overscroll-behavior-y: auto/);
});

test("Admin Products reuses the approved Customer Back to Top component", () => {
  assert.match(page, /import ScrollToTop from "\.\.\/Customer\/ScrollToTop"/);
  assert.match(page, /<ScrollToTop \/>/);
  assert.doesNotMatch(page, /admin-products__scroll-top|MdOutlineArrowCircleUp|const scrollToTop/);
});
