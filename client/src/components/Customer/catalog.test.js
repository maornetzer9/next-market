import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const productsUrl = new URL("./Products.jsx", import.meta.url);
const productUrl = new URL("./Product.jsx", import.meta.url);
const filterUrl = new URL("../Filter-Model/FilterModel.jsx", import.meta.url);

test("V1 and V4 catalog keeps existing load, filter, and cart handlers", async () => {
  const products = await readFile(productsUrl, "utf8");

  for (const surface of [
    "useLoadProducts()",
    "useCartOperations()",
    "useProductFilter(products)",
    "requestAddToCart",
    "addToCart(product, quantity)",
    "onAddToCart={requestAddToCart}",
  ]) {
    assert.ok(products.includes(surface), `missing existing surface: ${surface}`);
  }
});

test("V2 catalog renders real product fields without proposed controls", async () => {
  const product = await readFile(productUrl, "utf8");
  const products = await readFile(productsUrl, "utf8");
  const combined = `${product}\n${products}`;

  for (const field of [
    "item.thumbnail",
    "item.title",
    "item.description",
    "item.price",
    "item.stock",
    "item.category",
  ]) {
    assert.ok(combined.includes(field), `missing real product field: ${field}`);
  }

  // "Secure checkout" is approved Benefits copy — not a checkout control.
  for (const proposed of ["wishlist", "compare", "quick view", "sort"]) {
    assert.ok(!combined.toLowerCase().includes(proposed), `proposed control leaked: ${proposed}`);
  }
  assert.match(product, /Secure checkout/);
  assert.doesNotMatch(combined, /Proceed to checkout|checkout button|className=["'`][^"'`]*checkout/i);
});

test("V3 B2.5 controls preserve title, category, and inclusive range inputs", async () => {
  const source = await readFile(filterUrl, "utf8");

  assert.match(source, /onSearch\(value\)/);
  assert.match(source, /onCategoryChange\(value\)/);
  assert.match(source, /onPriceChange\(newValue\)/);
  assert.match(source, /aria-label="Minimum price"/);
  assert.match(source, /aria-label="Maximum price"/);
  assert.match(source, /catalog-controls__price-value/);
  assert.match(source, /formatCatalogPrice/);
  assert.doesNotMatch(source, /type="number"/);
});

test("V44 product loading accepts an empty database response without implicit seed assumptions", async () => {
  const actions = await readFile(new URL("../../actions/productActions.js", import.meta.url), "utf8");

  assert.match(actions, /!Array\.isArray\(products\)/);
  assert.doesNotMatch(actions, /!products\.length/);
});

test("V79 product readiness completes for success, empty, or failure without owning a global loader", async () => {
  const products = await readFile(productsUrl, "utf8");
  const hook = await readFile(new URL("../../utils/products.js", import.meta.url), "utf8");

  assert.match(hook, /const \[loading, setLoading\] = useState\(true\)/);
  assert.match(hook, /finally[\s\S]*setLoading\(false\)/);
  assert.match(hook, /return \{ loading, error \}/);
  assert.match(products, /ReadyPageContent ready=\{!productLoad\.loading\}/);
  assert.doesNotMatch(products, /GlobalLoader/);
});

test("V8 product actions remain semantic and labelled", async () => {
  const source = await readFile(productUrl, "utf8");

  assert.match(source, /<article/);
  assert.match(source, /<button/);
  assert.match(source, /Increase quantity of/);
  assert.match(source, /Decrease quantity of/);
  assert.match(source, /Add \$\{quantity \|\| 1\} \$\{item\.title\} to cart/);
  assert.match(source, /alt=\{item.title\}/);
});

test("V7 and V9 catalog styles include mobile recomposition and precise motion", async () => {
  const productsCss = await readFile(new URL("../../css/products.css", import.meta.url), "utf8");
  const productCss = await readFile(new URL("../../css/product.css", import.meta.url), "utf8");
  const combined = `${productsCss}\n${productCss}`;

  assert.match(combined, /@media \(max-width: 420px\)/);
  assert.match(combined, /product-grid__item:not\(:first-child\)/);
  assert.match(combined, /min-width:\s*36px/);
  assert.match(combined, /var\(--b26-interface\)/);
  assert.match(combined, /var\(--b27-(?:micro|spatial)\)/);
  assert.doesNotMatch(combined, /transition:\s*all/);
});

test("V14-V16 B2.6 products use spatial surfaces, state icons, and precise feedback", async () => {
  const product = await readFile(productUrl, "utf8");
  const products = await readFile(productsUrl, "utf8");
  const filter = await readFile(filterUrl, "utf8");
  const productCss = await readFile(new URL("../../css/product.css", import.meta.url), "utf8");

  assert.match(product, /MdInventory2/);
  assert.match(product, /is-in-cart/);
  assert.match(filter, /MdSearch/);
  assert.match(filter, /MdCategory/);
  assert.match(products, /AnimatePresence/);
  assert.match(products, /product-collection-shell/);
  assert.match(products, /getCatalogCollectionEnterMotion/);
  assert.match(productCss, /var\(--b26-radius-md\)/);
  assert.match(productCss, /var\(--b271-trace-enter\)/);
  assert.doesNotMatch(productCss, /transition:\s*all/);
});

test("V20 price legend is normalized to the shared toolbar baseline", async () => {
  const filter = await readFile(filterUrl, "utf8");
  const productsCss = await readFile(new URL("../../css/products.css", import.meta.url), "utf8");

  assert.match(filter, /catalog-controls__section-label/);
  assert.match(filter, /<legend className="sr-only">Price range<\/legend>/);
  assert.match(productsCss, /\.catalog-controls__price-stage\s*\{[^}]*min-height:\s*var\(--catalog-control-h\)/s);
  assert.match(productsCss, /\.catalog-controls__price-stage\s*\{[^}]*height:\s*var\(--catalog-control-h\)/s);
  assert.match(productsCss, /\.catalog-controls__price-slider \.MuiSlider-thumb\.Mui-active\s*\{[^}]*translate\(-50%,\s*-50%\)/s);
});

test("V23 product accent trace enters from top to bottom", async () => {
  const productCss = await readFile(new URL("../../css/product.css", import.meta.url), "utf8");

  assert.match(productCss, /\.b25-product-card::before\s*\{[^}]*transform-origin:\s*top/s);
  assert.match(productCss, /\.b25-product-card::before\s*\{[^}]*transform:\s*scaleY\(0\)/s);
  assert.match(productCss, /(?:hover|focus-within)::before[^}]*transform:\s*scaleY\(1\)/s);
});

test("V24 route entrance and sticky toolbar state remain presentational", async () => {
  const products = await readFile(productsUrl, "utf8");
  const filter = await readFile(filterUrl, "utf8");

  assert.match(products, /ReadyPageContent/);
  assert.match(products, /catalogScrolled/);
  assert.match(filter, /motion\.section/);
  assert.match(filter, /is-stuck/);
});

test("V30 price numbers keep semantics with one styled focus treatment", async () => {
  const filter = await readFile(filterUrl, "utf8");
  const productsCss = await readFile(new URL("../../css/products.css", import.meta.url), "utf8");

  assert.match(filter, /catalog-controls__price-value/);
  assert.match(filter, /<output className="catalog-controls__price-value"/);
  assert.doesNotMatch(filter, /type="number"/);
  assert.match(productsCss, /\.catalog-controls__price-value\s*\{[^}]*user-select:\s*none/s);
  assert.match(productsCss, /\.catalog-controls__price-value\.is-max\s*\{[^}]*text-align:\s*right/s);
  assert.match(productsCss, /\.catalog-controls__price-slider \.MuiSlider-thumb\.Mui-active/);
});

test("V31 category menu uses the existing accessible themed MUI control", async () => {
  const filter = await readFile(filterUrl, "utf8");
  const productsCss = await readFile(new URL("../../css/products.css", import.meta.url), "utf8");

  assert.match(filter, /catalog-controls__category-select/);
  assert.match(filter, /is-open/);
  assert.match(filter, /onOpen=\{\(\) => setCategoryMenuOpen\(true\)\}/);
  assert.match(filter, /handleCategoryClose/);
  assert.match(filter, /TransitionComponent:\s*Fade/);
  assert.match(filter, /b27-category-menu__paper/);
  assert.match(filter, /onCategoryChange\(value\)/);
  assert.match(productsCss, /\.b27-category-menu__paper\.is-dark/);
  assert.match(productsCss, /\.b27-category-menu__option\.Mui-selected/);
  assert.doesNotMatch(productsCss, /\.catalog-controls__category-select\.MuiInputBase-root\.Mui-focused\s*[,\{]/);
  assert.match(productsCss, /\.catalog-controls__category-select\.MuiInputBase-root:has\(\.MuiSelect-select:focus-visible\)/);
  assert.match(productsCss, /\.catalog-controls__field\s*\{[^}]*border:\s*1px solid var\(--catalog-control-idle-border\)/s);
  assert.match(productsCss, /--catalog-control-radius:\s*var\(--b26-radius-sm\)/);
  assert.match(productsCss, /\.catalog-controls__price-stage\s*\{[^}]*height:\s*var\(--catalog-control-h\)/s);
});

test("V84-V85 Category menu preserves scoped Popover geometry with internal scroll", async () => {
  const filter = await readFile(filterUrl, "utf8");
  const productsCss = await readFile(new URL("../../css/products.css", import.meta.url), "utf8");
  const paperBlock = productsCss.match(/\.b27-category-menu__paper\.MuiPaper-root\s*\{([^}]*)\}/)?.[1] || "";
  const listBlock = productsCss.match(/\.b27-category-menu__list\.MuiList-root\s*\{([^}]*)\}/)?.[1] || "";

  assert.match(filter, /disableScrollLock:\s*true/);
  assert.match(filter, /onWheel:\s*\(event\)\s*=>\s*event\.stopPropagation\(\)/);
  assert.match(filter, /anchorOrigin:\s*\{\s*vertical:\s*"bottom",\s*horizontal:\s*"left"\s*\}/s);
  assert.match(filter, /transformOrigin:\s*\{\s*vertical:\s*"top",\s*horizontal:\s*"left"\s*\}/s);
  assert.doesNotMatch(paperBlock, /position:\s*relative/);
  assert.doesNotMatch(paperBlock, /(?:width:\s*100%|100vw)/);
  assert.match(paperBlock, /max-height:\s*min\(360px,\s*calc\(100dvh - 32px\)\)/);
  assert.match(listBlock, /overflow-y:\s*auto/);
  assert.match(listBlock, /max-height:\s*min\(348px/);
  assert.doesNotMatch(productsCss, /(?:^|\})\s*\.Mui(?:Paper-root|Popover-paper)\s*\{/m);
});

test("Category Paper glass does not paint a raised layer behind the first row", async () => {
  const productsCss = await readFile(new URL("../../css/products.css", import.meta.url), "utf8");
  const selectedBlock = productsCss.match(/\.b27-category-menu__paper \.b27-category-menu__option\.Mui-selected:hover\s*\{([^}]*)\}/)?.[1] || "";

  assert.doesNotMatch(productsCss, /\.b27-category-menu__paper\.MuiPaper-root::before/);
  assert.match(selectedBlock, /background:\s*color-mix\([^;]+var\(--b25-accent\) 11%/);
  assert.match(productsCss, /\.b27-category-menu__paper\.MuiPaper-root\s*\{[^}]*backdrop-filter:/s);
});

test("V27 product hover waits for intent without inflating the card", async () => {
  const productCss = await readFile(new URL("../../css/product.css", import.meta.url), "utf8");
  const hoverBlock = productCss.match(/\.b25-product-card:hover\s*\{([^}]*)\}/)?.[1] || "";

  assert.match(productCss, /\.b25-product-card::before\s*\{[^}]*transform:\s*scaleY\(0\)/s);
  assert.match(productCss, /\.b25-product-card:hover::before\s*\{[^}]*transition-delay:\s*var\(--b271-hover-intent\)/s);
  assert.match(hoverBlock, /transform:\s*translateY\(-2px\)/);
  assert.doesNotMatch(hoverBlock, /scale\(/);
  assert.match(productCss, /\.b25-product-card:hover \.b25-product-card__media img\s*\{[^}]*scale\(1\.018\)/s);
  assert.match(productCss, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.b25-product-card:hover \.b25-product-card__media img[\s\S]*transform:\s*none/);
});

test("V28-V29 filtering preserves real product identity and collection-level category motion", async () => {
  const products = await readFile(productsUrl, "utf8");
  const filter = await readFile(filterUrl, "utf8");
  const productsCss = await readFile(new URL("../../css/products.css", import.meta.url), "utf8");
  const hook = await readFile(new URL("../../hooks/filterModel.js", import.meta.url), "utf8");
  const entrance = await readFile(new URL("../../UI/PageContentEntrance.jsx", import.meta.url), "utf8");

  assert.match(products, /product-collection-shell/);
  assert.match(products, /getCatalogCollectionEnterMotion/);
  assert.match(products, /getCatalogCollectionExitMotion/);
  assert.match(products, /useReducedMotion/);
  assert.match(filter, /useReducedMotion/);
  assert.match(products, /key=\{collectionKey\}/);
  assert.match(products, /key=\{item\.id \?\? item\._id\}/);
  assert.match(products, /<AnimatePresence mode="wait" initial=\{false\}/);
  assert.doesNotMatch(products, /mode="popLayout"/);
  assert.match(products, /LayoutGroup id="catalog-product-cards"/);
  assert.match(products, /layout=\{enableSiblingLayout \? "position" : false\}/);
  assert.match(products, /is-filtered-compact/);
  assert.match(hook, /isFiltering/);
  assert.match(productsCss, /\.product-grid:not\(\.is-filtered-compact\) > \.product-grid__item:first-child/);
  assert.match(entrance, /getCatalogCollectionEnterMotion/);
  assert.match(entrance, /CATALOG_COLLECTION_EXIT_DURATION/);
});

test("V35 Catalog prioritizes one featured image and lazily reveals the rest", async () => {
  const product = await readFile(productUrl, "utf8");
  const productCss = await readFile(new URL("../../css/product.css", import.meta.url), "utf8");

  assert.match(product, /loading=\{featured \? "eager" : "lazy"\}/);
  assert.match(product, /fetchpriority=\{featured \? "high" : "auto"\}/);
  assert.match(product, /decoding=\{featured \? "auto" : "async"\}/);
  assert.match(product, /onLoad=\{\(\) => setImageLoaded\(true\)\}/);
  assert.match(productCss, /\.b25-product-card__media\s*\{[^}]*aspect-ratio:/s);
  assert.match(productCss, /\.b25-product-card__media img\.is-loaded/);
  assert.match(productCss, /prefers-reduced-motion:[\s\S]*\.b25-product-card__media img/);
});

test("V54 completed product media stays visible when featured state changes", async () => {
  const product = await readFile(productUrl, "utf8");
  const productCss = await readFile(new URL("../../css/product.css", import.meta.url), "utf8");

  assert.match(product, /imageRef\.current\?\.complete/);
  assert.match(product, /className=\{imageLoaded \? "is-loaded" : ""\}/);
  assert.doesNotMatch(product, /className=\{featured \? "is-loaded" : ""\}/);
  assert.match(productCss, /\.b25-product-card__media img\.is-loaded\s*\{[^}]*opacity:\s*1/s);
});

test("V37 required scroll thresholds are requestAnimationFrame-gated", async () => {
  const products = await readFile(productsUrl, "utf8");

  assert.match(products, /requestAnimationFrame/);
  assert.match(products, /cancelAnimationFrame/);
  assert.match(products, /addEventListener\("scroll", handleScroll, \{ passive: true \}\)/);
});

test("V58-V63 B2.9 applies glass only to contextual Catalog controls", async () => {
  const productsCss = await readFile(new URL("../../css/products.css", import.meta.url), "utf8");
  const productCss = await readFile(new URL("../../css/product.css", import.meta.url), "utf8");

  assert.match(productsCss, /\.catalog-controls\.is-stuck\s*\{[^}]*background:\s*var\(--b291-glass-regular-bg\)[^}]*backdrop-filter:[^}]*var\(--b29-glass-blur\)/s);
  assert.match(productsCss, /\.b27-category-menu__paper\.MuiPaper-root\s*\{[^}]*background:\s*var\(--b291-glass-regular-bg\)[^}]*backdrop-filter:[^}]*var\(--b29-glass-blur\)/s);
  assert.match(productsCss, /\.catalog-scroll-top\s*\{[^}]*background:\s*var\(--b291-glass-regular-bg\)[^}]*box-shadow:\s*var\(--b291-shadow-rest\)/s);
  assert.match(productCss, /\.product_amount_form\s*\{[^}]*background:\s*var\(--b29-glass-bg\)/s);
  assert.doesNotMatch(productCss, /backdrop-filter/);
});

test("V60 B2.9 keeps Product depth solid, restrained, and motion-safe", async () => {
  const productCss = await readFile(new URL("../../css/product.css", import.meta.url), "utf8");
  const cardBlock = productCss.match(/\.b25-product-card\s*\{([^}]*)\}/)?.[1] || "";
  const hoverBlock = productCss.match(/\.b25-product-card:hover\s*\{([^}]*)\}/)?.[1] || "";

  assert.match(cardBlock, /background:\s*var\(--b25-surface\)/);
  assert.match(cardBlock, /box-shadow:\s*var\(--b29-depth-1\)/);
  assert.doesNotMatch(cardBlock, /backdrop-filter/);
  assert.match(hoverBlock, /box-shadow:\s*var\(--b29-depth-2\),\s*0 0 0 1px var\(--b29-accent-light\)/);
  assert.match(hoverBlock, /transform:\s*translateY\(-2px\)/);
  assert.doesNotMatch(hoverBlock, /scale\(/);
  assert.match(productCss, /\.b25-product-card__media\s*\{[^}]*radial-gradient[^}]*linear-gradient[^}]*box-shadow:\s*inset/s);
  assert.match(productCss, /\.b25-product-card__media img\.is-loaded\s*\{[^}]*opacity:\s*1/s);
  assert.match(productCss, /\.b25-customer-shell\.is-dark \.b25-product-card:hover,[\s\S]*box-shadow:\s*var\(--b29-depth-2\),\s*0 0 0 1px var\(--b29-teal-light\)/);
  assert.match(productCss, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.b25-product-card:hover,[\s\S]*transform:\s*none/);
});

test("V61-V67 B2.9.1 controls use layered regular glass and tactile choreography", async () => {
  const productsCss = await readFile(new URL("../../css/products.css", import.meta.url), "utf8");
  const productCss = await readFile(new URL("../../css/product.css", import.meta.url), "utf8");

  assert.match(productsCss, /\.catalog-controls\.is-stuck\s*\{[^}]*background:\s*var\(--b291-glass-regular-bg\)[^}]*box-shadow:\s*var\(--b29-depth-3\)/s);
  assert.match(productsCss, /\.catalog-controls\.is-stuck::before\s*\{[^}]*var\(--b291-specular-light\)/s);
  assert.match(productsCss, /\.b27-category-menu__paper\.MuiPaper-root\s*\{[^}]*background:\s*var\(--b291-glass-regular-bg\)/s);
  assert.doesNotMatch(productsCss, /\.b27-category-menu__paper\.MuiPaper-root::before/);
  assert.match(productsCss, /\.catalog-scroll-top\s*\{[^}]*background:\s*var\(--b291-glass-regular-bg\)[^}]*box-shadow:\s*var\(--b291-shadow-rest\)/s);
  assert.match(productsCss, /\.catalog-scroll-top::before\s*\{[^}]*var\(--b291-specular-light\)/s);
  assert.match(productsCss, /\.catalog-scroll-top:hover\s*\{[^}]*transform:\s*translateY\(-1px\)[^}]*box-shadow:\s*var\(--b291-shadow-hover\)/s);
  assert.match(productsCss, /\.catalog-scroll-top:active\s*\{[^}]*transform:\s*translateY\(1px\)/s);
  assert.doesNotMatch(productsCss.match(/\.catalog-scroll-top:active\s*\{([^}]*)\}/)?.[1] || "", /scale\(/);
  assert.match(productCss, /\.product_amount_form button:hover:not\(:disabled\)\s*\{[^}]*transform:\s*translateY\(-1px\)/s);
  assert.match(productCss, /\.product_amount_form button:active:not\(:disabled\)\s*\{[^}]*transform:\s*translateY\(1px\)/s);
  assert.doesNotMatch(productCss.match(/\.product_amount_form button:active:not\(:disabled\)\s*\{([^}]*)\}/)?.[1] || "", /scale\(/);
  assert.doesNotMatch(productCss, /backdrop-filter/);
});

test("V68 Catalog entrance is staged once and filtering never replays it", async () => {
  const products = await readFile(productsUrl, "utf8");
  const filter = await readFile(filterUrl, "utf8");
  const product = await readFile(productUrl, "utf8");

  assert.match(products, /ReadyPageContent ready=\{!productLoad\.loading\}/);
  assert.match(filter, /duration:\s*reduceMotion \? 0\.09 : 0\.26/);
  assert.match(filter, /delay:\s*reduceMotion \? 0 : 0\.11/);
  assert.match(products, /hasPresentedProducts\.current = true/);
  assert.match(products, /<AnimatePresence mode="wait" initial=\{false\}/);
  assert.match(products, /key=\{collectionKey\}/);
  assert.doesNotMatch(products, /isFiltering[^\n]*(?:initial|delay)/);
  assert.match(product, /loading=\{featured \? "eager" : "lazy"\}/);
});

test("V66-V70 browser tuning keeps Cart and price hover immediately legible", async () => {
  const productsCss = await readFile(new URL("../../css/products.css", import.meta.url), "utf8");
  const waveCss = await readFile(new URL("../../css/neural-wave.css", import.meta.url), "utf8");

  assert.match(waveCss, /--sidebar-cart-text-hover:\s*#ffd2c4/);
  assert.match(waveCss, /\.nm-cart-access:hover,[\s\S]*?\{[^}]*color:\s*var\(--sidebar-cart-text-hover\)/s);
  assert.match(productsCss, /\.catalog-controls__price-slider \.MuiSlider-thumb:hover/);
  assert.match(productsCss, /\.b27-category-menu__paper\.MuiPaper-root\[style\*="top:"\]/);
});

test("V71 dark portaled category material does not inherit Light root tokens", async () => {
  const productsCss = await readFile(new URL("../../css/products.css", import.meta.url), "utf8");

  assert.match(productsCss, /\.b27-category-menu__paper\.is-dark\.MuiPaper-root\s*\{[^}]*--b291-glass-regular-bg:\s*rgba\(39, 46, 51, 0\.94\)[^}]*--b291-specular-light:\s*var\(--b291-specular-dark\)/s);
});

test("Shop purchase uses local quantity, one cart mutation, global toast, and stable cards", async () => {
  const product = await readFile(productUrl, "utf8");
  const products = await readFile(productsUrl, "utf8");
  const hook = await readFile(new URL("../../utils/products.js", import.meta.url), "utf8");
  const toastRoot = await readFile(new URL("../../UI/ToastRoot.jsx", import.meta.url), "utf8");
  const toastCss = await readFile(new URL("../../css/toasts.css", import.meta.url), "utf8");
  const productCss = await readFile(new URL("../../css/product.css", import.meta.url), "utf8");
  const cartAction = await readFile(new URL("../../actions/cartActions.js", import.meta.url), "utf8");
  const cartRoute = await readFile(new URL("../../routes/cart.js", import.meta.url), "utf8");

  assert.match(product, /const \[quantity, setQuantity\] = useState\(0\)/);
  assert.match(product, /setQuantity\(\(prev\) => Math\.min\(stock, prev \+ 1\)\)/);
  assert.match(product, /await onAddToCart\(item, quantity\)/);
  assert.match(product, /outOfStock/);
  assert.match(product, /disabled=\{!canAdd\}/);
  assert.match(product, /b25-product-card__add-lead/);
  assert.match(product, /b25-product-card__add-rest/);
  assert.match(product, /Add[\s\S]*to cart/);
  assert.match(product, /b25-product-tag/);
  assert.doesNotMatch(product, /Added Successfully|Product Not Found In The Cart/);
  assert.doesNotMatch(product, /useSelector/);
  assert.doesNotMatch(products, /messages\[/);

  assert.match(hook, /notifySuccess\(formatAddedMessage/);
  assert.match(hook, /notifyError\(formatCartError/);
  assert.match(hook, /const userId = user\?\._id/);
  assert.match(hook, /addToCartAction\(userId, product, CART_URL_ADD, qty\)/);
  assert.match(cartAction, /addToCartAction = \( userId, product, url, quantity = 1 \)/);
  assert.match(cartRoute, /payload\.quantity/);

  assert.match(toastRoot, /createPortal/);
  assert.match(toastRoot, /b25-toast-stack/);
  assert.match(toastCss, /position:\s*fixed/);
  assert.doesNotMatch(toastCss, /b25-customer-shell\.is-light \.b25-toast/);
  assert.match(productCss, /\.b25-product-tag\s*\{[^}]*height:\s*20px/s);
});

test("Shop catalog matches editorial featured/standard presentation without duplicating purchase logic", async () => {
  const product = await readFile(productUrl, "utf8");
  const products = await readFile(productsUrl, "utf8");
  const filter = await readFile(filterUrl, "utf8");
  const productCss = await readFile(new URL("../../css/product.css", import.meta.url), "utf8");
  const productsCss = await readFile(new URL("../../css/products.css", import.meta.url), "utf8");
  const categoryNav = await readFile(new URL("./StorefrontCategoryNav.jsx", import.meta.url), "utf8");
  const categoryBrowseIcon = await readFile(new URL("./CategoryBrowseIcon.jsx", import.meta.url), "utf8");
  const shellCss = await readFile(new URL("../../css/customer-shell.css", import.meta.url), "utf8");
  const favorites = await readFile(new URL("../../hooks/useStorefrontFavorites.js", import.meta.url), "utf8");

  assert.match(products, /Explore our handpicked products/);
  assert.match(products, /PageHeader/);
  assert.match(products, /MdOutlineInventory2/);
  assert.match(products, /variant=\{!useCompactResults && index === 0 \? "featured" : "standard"\}/);
  assert.match(products, /getCatalogFilterKey/);
  assert.match(products, /presentedProducts/);
  assert.match(products, /pageProducts/);
  assert.match(products, /CATALOG_PAGE_SIZE/);
  assert.match(products, /CatalogPagination/);
  assert.match(products, /useStorefrontFavorites/);
  assert.match(products, /favorited=\{isFavorite/);
  assert.match(product, /aria-pressed=\{favorited\}/);
  assert.match(product, /isFeatured/);
  assert.match(product, /MdFavoriteBorder/);
  assert.match(filter, /catalog-controls__price-slider/);
  assert.match(filter, /getAriaLabel=\{\(index\) => \(index === 0 \? "Minimum price range" : "Maximum price range"\)\}/);
  assert.match(filter, /Search by product title\.\.\./);
  assert.match(productsCss, /\.catalog-controls__price-slider \.MuiSlider-track/);
  assert.match(productsCss, /\.catalog-heading__count/);
  assert.match(productCss, /\.b25-product-card\.is-featured\s*\{[^}]*grid-template-columns/s);
  assert.match(productCss, /\.b25-product-card__favorite/);
  assert.match(productCss, /min-width:\s*36px/);
  assert.match(categoryNav, /CategoryBrowseIcon/);
  assert.match(categoryNav, /from "\.\/CategoryBrowseIcon"/);
  assert.match(categoryNav, /b25-category-browse__chevron/);
  assert.match(categoryNav, /overflowCategories/);
  assert.doesNotMatch(categoryNav, />More</);
  assert.match(categoryBrowseIcon, /b25-category-browse__cell is-neutral/);
  assert.match(categoryBrowseIcon, /b25-category-browse__cell is-accent/);
  assert.match(shellCss, /\.b25-customer-command__nav-link\.is-browse\s*\{[^}]*height:\s*36px/s);
  assert.match(shellCss, /\.b25-category-browse__cell\.is-neutral/);
  assert.match(shellCss, /\.b25-category-browse__cell\.is-accent/);
  assert.match(shellCss, /\.b25-category-browse__cell\s*\{[^}]*background:\s*transparent/s);
  assert.match(shellCss, /box-shadow:\s*inset 0 0 0 1\.15px/);
  assert.match(shellCss, /\.b25-category-browse__icon\s*\{[^}]*width:\s*13px/s);
  assert.match(shellCss, /\.b25-category-nav__browse\.is-open \.b25-category-browse__chevron/);
  assert.match(favorites, /nm\.storefront\.favorites/);
});

test("Catalog pagination slices filtered products client-side with URL page state", async () => {
  const products = await readFile(productsUrl, "utf8");
  const pagination = await readFile(new URL("./CatalogPagination.jsx", import.meta.url), "utf8");
  const utils = await readFile(new URL("../../utils/catalogPagination.js", import.meta.url), "utf8");
  const productsCss = await readFile(new URL("../../css/products.css", import.meta.url), "utf8");

  assert.match(utils, /export const CATALOG_PAGE_SIZE = 13/);
  assert.match(utils, /sliceCatalogPage/);
  assert.match(utils, /getCatalogPageWindow/);
  assert.match(utils, /resolveCatalogPageScrollDuration/);
  assert.match(products, /pageProducts\.map/);
  assert.match(products, /buildCatalogSearchParams/);
  assert.match(products, /getPageFromSearch/);
  assert.match(products, /handlePageChange/);
  assert.match(products, /paginationResetKey/);
  assert.match(products, /selectedPriceRange/);
  assert.match(products, /pendingPageScrollRef/);
  assert.match(products, /writeCatalogParams\(categoryFromUrl, 1, \{ replace: true \}\)/);
  assert.match(products, /resultsCount=\{visibleProducts\.length\}/);
  assert.match(products, /key=\{`\$\{filterIdentity\}\|p\$\{currentPage\}`\}|collectionKey = `\$\{filterIdentity\}\|p\$\{currentPage\}`/);
  assert.match(pagination, /aria-current=\{isCurrent \? "page" : undefined\}/);
  assert.match(pagination, /Previous page/);
  assert.match(pagination, /Next page/);
  assert.match(pagination, /catalog-pagination__rail/);
  assert.match(pagination, /Showing/);
  assert.match(pagination, /totalPages <= 1/);
  assert.match(productsCss, /\.catalog-pagination__rail/);
  assert.match(productsCss, /\.catalog-pagination__page\.is-current::after/);
  assert.match(productsCss, /\.catalog-results-anchor\s*\{[^}]*scroll-margin-top:\s*calc\(var\(--b25-command-height\)/s);
  assert.match(productsCss, /@media \(max-width:\s*820px\)[\s\S]*\.catalog-pagination__mobile-status/);
});
