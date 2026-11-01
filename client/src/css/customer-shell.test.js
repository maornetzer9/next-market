import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentUrl = new URL("../components/Navbar-Model/NavbarModel.jsx", import.meta.url);
const navUrl = new URL("../components/Customer/NeuralWaveNav.jsx", import.meta.url);
const stylesUrl = new URL("./customer-shell.css", import.meta.url);
const waveStylesUrl = new URL("./neural-wave.css", import.meta.url);

test("V5 customer shell preserves existing navigation targets and logout", async () => {
  const source = await readFile(componentUrl, "utf8");
  const nav = await readFile(navUrl, "utf8");

  for (const route of ["/customer/account", "/customer/orders", "/customer/products", "/"]) {
    assert.ok(source.includes(`page: '${route}'`) || source.includes(`page: "${route}"`));
  }
  assert.match(source, /handler:\s*handleDisconnect/);
  assert.match(nav, /<NavLink/);
});

test("V7 customer shell has desktop spine and mobile dock breakpoints", async () => {
  const css = await readFile(stylesUrl, "utf8");
  const wave = await readFile(waveStylesUrl, "utf8");

  assert.match(css, /grid-template-columns:\s*var\(--b25-spine-width\)/);
  assert.match(css, /@media \(max-width: 820px\)/);
  assert.match(css, /grid-template-columns:\s*repeat\(5, 1fr\)/);
  assert.match(wave, /@media \(max-width: 820px\)[\s\S]*\.nm-mobile/);
});

test("V8 shell exposes focusable semantic navigation and theme controls", async () => {
  const source = await readFile(componentUrl, "utf8");
  const nav = await readFile(navUrl, "utf8");

  assert.match(nav, /aria-label="Customer navigation"/);
  assert.match(source, /aria-pressed=\{darkMode\}/);
  assert.match(nav, /type="button"/);
  assert.match(nav, /aria-label=\{collapsed \? "Expand navigation" : "Collapse navigation"\}/);
});

test("V15 customer surfaces use one labelled Material Design icon family", async () => {
  const source = await readFile(componentUrl, "utf8");
  const cart = await readFile(new URL("../components/Customer/Cart.jsx", import.meta.url), "utf8");
  const combined = `${source}\n${cart}`;

  for (const icon of ["MdOutlinePerson", "MdReceiptLong", "MdOutlineInventory2", "MdLogout", "MdShoppingCart"]) {
    assert.ok(combined.includes(icon), `missing customer icon: ${icon}`);
  }
  assert.match(source, /label:\s*["']My Account["']/);
  assert.match(source, /label:\s*["']My Orders["']/);
  assert.match(source, /label:\s*["']Products["']/);
  assert.match(source, /label:\s*["']Logout["']/);
});

test("V19 desktop rail and session controls remain viewport-persistent", async () => {
  const source = await readFile(componentUrl, "utf8");
  const nav = await readFile(navUrl, "utf8");
  const css = await readFile(stylesUrl, "utf8");
  const wave = await readFile(waveStylesUrl, "utf8");

  assert.match(wave, /\.nm-spine\s*\{[^}]*position:\s*fixed/s);
  assert.match(wave, /\.nm-spine\s*\{[^}]*height:\s*100dvh/s);
  assert.match(css, /\.b25-customer-command\s*\{[^}]*grid-column:\s*2/s);
  assert.match(css, /\.b25-customer-main\s*\{[^}]*grid-column:\s*2/s);
  assert.match(nav, /b25-customer-spine__footer/);
  assert.match(nav, /aria-label=\{darkMode \? "Use light theme" : "Use dark theme"\}/);
});

test("Desktop command bar uses a three-zone brand / categories / account layout", async () => {
  const source = await readFile(componentUrl, "utf8");
  const css = await readFile(stylesUrl, "utf8");

  assert.match(source, /b25-customer-command__brand-zone/);
  assert.match(source, /b25-customer-command__center/);
  assert.match(source, /b25-customer-command__meta/);
  assert.doesNotMatch(source, /b25-customer-command__start/);
  assert.match(css, /\.b25-customer-command\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\) auto minmax\(0,\s*1fr\)/s);
  assert.match(css, /\.b25-customer-command__center\s*\{[^}]*justify-content:\s*center/s);
  assert.match(css, /\.b25-customer-command__brand-zone\s*\{[^}]*justify-self:\s*start/s);
  assert.match(css, /\.b25-customer-command__meta\s*\{[^}]*justify-self:\s*end/s);
  assert.match(css, /\.b25-customer-command__brand-zone::after/);
  assert.match(css, /\.b25-customer-command__meta::before/);
  assert.match(css, /@media \(max-width: 820px\)[\s\S]*\.b25-customer-command__brand-zone::after[\s\S]*display:\s*none/s);
  assert.match(
    css,
    /\.b25-customer-shell\s*\{[^}]*grid-template-rows:\s*var\(--b25-command-height\) auto/s
  );
  assert.doesNotMatch(css, /minmax\(calc\(100dvh - var\(--b25-command-height\)\)/);
});

test("V21 customer shell presents NEXT MARKET instead of an internal design version", async () => {
  const [nav, brand, wordmark] = await Promise.all([
    readFile(navUrl, "utf8"),
    readFile(new URL("../components/Shell/MarketBrandLink.jsx", import.meta.url), "utf8"),
    readFile(new URL("../components/Shell/BrandWordmark.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(nav, /<AuthBrandMark className="auth-brand-mark--rail" animateEnter=\{false\} \/>/);
  assert.match(nav, /<small>NEXT MARKET<\/small>/);
  assert.match(brand, /<BrandWordmark \/>/);
  assert.match(wordmark, /<span>NEXT<\/span>/);
  assert.match(wordmark, /<span aria-hidden="true">\/<\/span>/);
  assert.match(wordmark, /<strong>MARKET<\/strong>/);
  assert.doesNotMatch(nav, /<span>B2\.5<\/span>/);
});

test("Neural Wave Cart lives in the sidebar and mobile dock, not the page header", async () => {
  const source = await readFile(componentUrl, "utf8");
  const nav = await readFile(navUrl, "utf8");
  const css = await readFile(stylesUrl, "utf8");
  const wave = await readFile(waveStylesUrl, "utf8");
  const products = await readFile(new URL("../components/Customer/Products.jsx", import.meta.url), "utf8");
  const cart = await readFile(new URL("../components/Customer/Cart.jsx", import.meta.url), "utf8");
  const utilities = await readFile(new URL("../utils/products.js", import.meta.url), "utf8");

  assert.match(nav, /<Cart\s+user=\{user\}/);
  assert.equal((nav.match(/<Cart\s+user=\{user\}/g) || []).length, 2);
  assert.match(source, /useLoadCart\(variant === 'customer' && authenticated\)/);
  assert.match(source, /useCartOperations\(\)/);
  assert.doesNotMatch(source, /<header className="b25-customer-command">[\s\S]*<Cart /);
  assert.doesNotMatch(products, /<Cart|from "\.\/Cart"/);
  assert.match(products, /useLoadProducts\(\)/);
  assert.match(utilities, /export const useLoadCart/);
  assert.match(utilities, /export const useLoadProducts/);
  assert.match(cart, /aria-expanded=\{compact \? onCartPage : previewOpen \|\| onCartPage\}/);
  assert.match(cart, /itemCount > 99 \? "99\+" : itemCount/);
  assert.match(cart, /b272-cart-access/);
  assert.match(wave, /\.nm-cart-access\s*\{[^}]*position:\s*relative/s);
  assert.match(css, /@media \(max-width: 820px\)[\s\S]*\.b25-customer-command\s*\{[^}]*backdrop-filter:\s*none/s);
  assert.match(css, /@media \(max-width: 820px\)[\s\S]*\.b25-customer-command\s*\{[^}]*z-index:\s*40/s);
  assert.match(wave, /@media \(max-width: 820px\)[\s\S]*\.nm-mobile \.nm-cart-access/);
});

test("Mobile dock keeps five columns with Logout last and Cart as a real item", async () => {
  const css = await readFile(stylesUrl, "utf8");
  const wave = await readFile(waveStylesUrl, "utf8");
  const nav = await readFile(navUrl, "utf8");
  const cart = await readFile(new URL("../components/Customer/Cart.jsx", import.meta.url), "utf8");
  const mobileCss = css.split("@media (max-width: 820px)")[1];

  assert.match(mobileCss, /\.b25-customer-mobile-nav \.b25-customer-nav__link:last-child\s*\{[^}]*grid-column:\s*5/s);
  assert.match(nav, /compact/);
  assert.match(cart, /className="b25-customer-nav__label b272-cart-access__label nm-link__label"/);
  assert.match(wave, /@media \(max-width: 820px\)[\s\S]*\.nm-mobile \.nm-cart-access__icon\s*\{[^}]*width:\s*24px[^}]*height:\s*24px/s);
  assert.match(wave, /@media \(max-width: 820px\)[\s\S]*\.nm-mobile \.nm-cart-access__icon svg\s*\{[^}]*width:\s*20px[^}]*height:\s*20px/s);
});

test("Header glass and mobile Theme remain; Neural Wave owns the branded rail", async () => {
  const css = await readFile(stylesUrl, "utf8");
  const wave = await readFile(waveStylesUrl, "utf8");

  assert.match(css, /\.b25-customer-command\s*\{[^}]*background:[^}]*var\(--b29-glass-bg\)[^}]*backdrop-filter:[^}]*var\(--b29-glass-blur\)/s);
  assert.match(css, /\.b25-theme-toggle\s*\{[^}]*border:[^}]*var\(--b291-on-dark-border\)[^}]*background:\s*var\(--b291-glass-on-dark\)[^}]*box-shadow:\s*var\(--b291-shadow-rest\)/s);
  assert.match(wave, /\.nm-cart-preview__cta\s*\{[^}]*background:\s*var\(--b25-accent\)/s);
  assert.match(css, /@keyframes b29-cart-count-change/);
  assert.match(css, /prefers-reduced-motion:[\s\S]*\.b272-cart-access__count[\s\S]*animation:\s*none/);
  assert.match(wave, /prefers-reduced-motion:[\s\S]*\.nm-wave__layer/s);
});

test("V65-V67 Theme is layered dark-rail glass in both website themes", async () => {
  const css = await readFile(stylesUrl, "utf8");
  const base = css.match(/\.b25-theme-toggle\s*\{([^}]*)\}/)?.[1] || "";
  const hover = css.match(/\.b25-theme-toggle:hover\s*\{([^}]*)\}/)?.[1] || "";
  const active = css.match(/\.b25-theme-toggle:active\s*\{([^}]*)\}/)?.[1] || "";

  assert.match(base, /width:\s*44px/);
  assert.match(base, /background:\s*var\(--b291-glass-on-dark\)/);
  assert.match(base, /box-shadow:\s*var\(--b291-shadow-rest\)/);
  assert.match(css, /\.b25-theme-toggle::before\s*\{[^}]*var\(--b291-specular-dark\)/s);
  assert.match(css, /\.b25-theme-toggle::after\s*\{[^}]*var\(--b291-edge-deep\)/s);
  assert.match(hover, /background:\s*var\(--b291-glass-on-dark-hover\)/);
  assert.match(hover, /transform:\s*translateY\(-1px\)/);
  assert.match(active, /transform:\s*translateY\(1px\)/);
  assert.doesNotMatch(css, /\.b25-customer-shell:not\(\.is-dark\) \.b25-theme-toggle[^}]*background:\s*(?:#fff|white|var\(--b29-glass-bg\))/s);
});

test("Neural Wave links use restrained hover and press without scale bounce", async () => {
  const wave = await readFile(waveStylesUrl, "utf8");

  assert.match(wave, /\.nm-link:hover\s*\{[^}]*transform:\s*translateX\(3px\)/s);
  assert.match(wave, /\.nm-link:active\s*\{[^}]*transform:\s*translateX\(1px\)/s);
  assert.doesNotMatch(wave, /\.nm-link:active\s*\{[^}]*scale\(/s);
});

test("V68-V69 only nested Customer route content exits while shell stays stable", async () => {
  const source = await readFile(componentUrl, "utf8");

  assert.match(source, /useLocation/);
  assert.match(source, /useReducedMotion/);
  assert.match(source, /<AnimatePresence mode="wait">[\s\S]*key=\{location\.pathname\}[\s\S]*className="b291-customer-route"[\s\S]*<Outlet \/>/);
  assert.match(source, /initial=\{false\}/);
  assert.match(source, /getPageContentExitMotion\(reduceMotion\)/);
  assert.match(source, /PAGE_CONTENT_EXIT_DURATION/);
  assert.doesNotMatch(source, /className=\{`b25-customer-shell[\s\S]{0,180}variants=\{pageTransition\}/);
});

test("V72 Theme distinguishes pointer focus from branded keyboard focus", async () => {
  const css = await readFile(stylesUrl, "utf8");
  const globalCss = await readFile(new URL("../index.css", import.meta.url), "utf8");

  assert.doesNotMatch(globalCss, /button:focus\s*,\s*button:focus-visible/);
  assert.match(globalCss, /button:focus-visible\s*\{/);
  assert.match(css, /\.b25-theme-toggle:focus:not\(:focus-visible\)\s*\{[^}]*outline:\s*none/s);
  assert.match(css, /\.b25-theme-toggle:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--b25-accent\)[^}]*outline-offset:\s*3px/s);
});
