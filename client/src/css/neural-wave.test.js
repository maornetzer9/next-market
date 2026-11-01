import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const navUrl = new URL("../components/Customer/NeuralWaveNav.jsx", import.meta.url);
const fieldUrl = new URL("../components/Customer/NeuralWaveField.jsx", import.meta.url);
const previewUrl = new URL("../components/Customer/CartPreview.jsx", import.meta.url);
const cartUrl = new URL("../components/Customer/Cart.jsx", import.meta.url);
const cssUrl = new URL("../css/neural-wave.css", import.meta.url);
const tokensUrl = new URL("../css/b25-tokens.css", import.meta.url);

test("Neural Wave 05 uses SVG paths, collapse, and a floating cart preview", async () => {
  const [nav, field, preview, css, tokens] = await Promise.all([
    readFile(navUrl, "utf8"),
    readFile(fieldUrl, "utf8"),
    readFile(previewUrl, "utf8"),
    readFile(cssUrl, "utf8"),
    readFile(tokensUrl, "utf8"),
  ]);

  assert.match(nav, /<NeuralWaveField/);
  assert.match(nav, /<CartPreview/);
  assert.match(nav, /nm-collapse/);
  assert.match(nav, /syncMagnetGeometry/);
  assert.match(nav, /data-magnet-target/);
  assert.match(nav, /option\.magnetKey/);
  assert.match(nav, /data-magnet-target=\"theme\"/);
  assert.match(nav, /magnetEls\.find\(\(el\) => el\.dataset\.magnetTarget === magnet\)/);
  assert.match(nav, /--nm-ex-ax/);
  assert.match(field, /<svg/);
  assert.match(field, /nm-wave__path--core/);
  assert.match(field, /SILK/);
  assert.match(field, /motion\.path/);
  assert.match(field, /useReducedMotion/);
  assert.match(field, /duration: 8\.6/);
  const strandCount = (field.match(/id: "[a-f]"/g) || []).length;
  assert.ok(strandCount >= 5, `expected independent silk strands, found ${strandCount}`);
  assert.doesNotMatch(field, /<video|<canvas|particles/i);
  assert.match(css, /@keyframes nm-wave-drift-a/);
  assert.match(css, /@keyframes nm-wave-drift-b/);
  assert.match(css, /@keyframes nm-wave-drift-c/);
  assert.match(css, /@keyframes nm-wave-drift-d/);
  assert.match(css, /--nm-ex-ax/);
  assert.match(css, /translate: calc\(var\(--nm-ex-ax\)/);
  assert.match(css, /\.nm-link:hover:not\(\.is-active\)::before/);
  assert.match(css, /\.nm-link\.is-magnet:not\(\.is-active\)/);
  assert.match(nav, /is-magnet/);
  assert.match(css, /\.b25-customer-shell:not\(\.is-dark\) \.b25-customer-main::before/);
  assert.match(css, /@media \(min-width: 821px\)[\s\S]*grid-template-columns:\s*var\(--b25-spine-width\)/);
  assert.match(css, /@media \(max-width: 820px\)[\s\S]*--b25-spine-width:\s*0px/);
  assert.match(nav, /collapsed=\{collapsed\}/);
  assert.match(field, /nm-wave--expanded/);
  assert.match(field, /is-collapsed-hidden/);
  assert.match(field, /tier: "primary"/);
  assert.match(field, /preserveAspectRatio="none"/);
  assert.match(field, /viewBox="0 0 100 750"/);
  assert.match(field, /animate = !reduceMotion && !collapsed/);
  assert.doesNotMatch(field, /collapsedFrames/);
  assert.doesNotMatch(field, /fitCollapsedPath/);
  assert.doesNotMatch(field, /nm-wave--collapsed/);
  assert.doesNotMatch(field, /breezeFrames/);
  assert.doesNotMatch(field, /densifyExpandedPath/);
  assert.match(field, /useAnimationControls/);
  assert.ok((field.match(/initial=\{\{ d: rest \}\}/g) || []).length >= 2);
  assert.match(css, /\.nm-spine\.is-collapsed \.nm-wave--vertical/);
  assert.match(css, /opacity:\s*0/);
  assert.match(css, /transition:\s*opacity 200ms/);
  assert.match(css, /transition:\s*opacity 220ms[^;]*180ms/);
  assert.doesNotMatch(css, /left:\s*-42%/);
  assert.doesNotMatch(css, /--nm-strand-scale-x/);
  assert.doesNotMatch(css, /\.nm-wave--collapsed/);
  assert.match(tokens, /--b25-spine-collapsed:\s*68px/);
  assert.match(css, /\.nm-spine\s*\{[^}]*width:\s*var\(--b25-spine-width\)/s);
  assert.match(css, /\.nm-wave--vertical\s*\{[^}]*width:\s*100%/s);
  assert.match(css, /\.b25-customer-shell:not\(\.is-dark\)\s*\{[^}]*--nm-rail:\s*color-mix\(in srgb, var\(--b25-surface\)/s);
  assert.match(css, /\.b25-customer-shell:not\(\.is-dark\)\s*\{[^}]*--sidebar-wave-opacity-mult:\s*0\.62/s);
  assert.match(css, /\.b25-customer-shell:not\(\.is-dark\) \.nm-wave--expanded\s*\{[^}]*--sidebar-wave-opacity-mult/s);
  assert.match(css, /\.nm-spine\s*\{[^}]*var\(--nm-rail\)/s);
  assert.match(css, /\.nm-link\s*\{[^}]*color:\s*var\(--sidebar-text\)/s);
  /* Logo badge stays Dark Mode treatment in Light shell */
  assert.match(css, /\.nm-brand__badge\s*\{[^}]*background:\s*color-mix\(in srgb, var\(--b25-graphite\)/s);
  assert.doesNotMatch(css, /\.b25-customer-shell:not\(\.is-dark\)\s*\{[^}]*--sidebar-badge-bg/s);
  assert.doesNotMatch(css, /\.b25-customer-shell:not\(\.is-dark\) \.nm-brand__badge::before/);
  assert.match(nav, /<NeuralWaveField orientation="vertical" collapsed=\{collapsed\} \/>/);
  assert.doesNotMatch(nav, /key=\{.*darkMode/);
  assert.doesNotMatch(nav, /key=\{darkMode\}/);
});

test("Mobile shell clears desktop spine width from layout calculations", async () => {
  const css = await readFile(cssUrl, "utf8");
  const shell = await readFile(new URL("./customer-shell.css", import.meta.url), "utf8");

  assert.match(css, /@media \(max-width: 820px\)[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(css, /@media \(max-width: 820px\)[\s\S]*\.nm-spine[\s\S]*display:\s*none !important/);
  assert.match(shell, /@media \(max-width: 820px\)[\s\S]*--b25-spine-width:\s*0px/);
  assert.doesNotMatch(
    css.replace(/@media \(min-width: 821px\)[\s\S]*?(?=@media|$)/, ""),
    /^\.b25-customer-shell\s*\{[^}]*grid-template-columns:\s*var\(--b25-spine-width\)/m
  );
});

test("Cart preview is keyboard-aware and not hover-only", async () => {
  const nav = await readFile(navUrl, "utf8");
  const cart = await readFile(cartUrl, "utf8");
  const preview = await readFile(previewUrl, "utf8");

  assert.match(nav, /Escape/);
  assert.match(nav, /onFocusCapture=\{/);
  assert.match(nav, /OPEN_DELAY_MS = 70/);
  assert.match(nav, /CLOSE_DELAY_MS = 140/);
  assert.match(nav, /isMobileNav\(\) \|\| onCartPage/);
  assert.match(cart, /aria-haspopup=\{compact \? undefined : "dialog"\}/);
  assert.match(preview, /role="dialog"/);
  assert.match(preview, /Browse products/);
});

test("Cart preview keeps hover layout and expands more-items in place", async () => {
  const [cart, preview, css] = await Promise.all([
    readFile(cartUrl, "utf8"),
    readFile(previewUrl, "utf8"),
    readFile(cssUrl, "utf8"),
  ]);

  assert.doesNotMatch(cart, /data-tooltip/);
  assert.match(cart, /aria-label=\{`Cart, \$\{itemCount\}/);
  assert.match(preview, /PREVIEW_LIMIT = 3/);
  assert.match(preview, /Show \{remaining\} more/);
  assert.match(preview, /Show less/);
  assert.doesNotMatch(preview, /…and \{remaining\} more/);
  assert.match(css, /\.nm-cart-preview__surface\s*\{[^}]*background-color:\s*var\(--b25-surface\)/s);
  assert.match(css, /button\.nm-cart-preview__more\s*\{[^}]*font-size:\s*12px[^}]*font-weight:\s*550/s);
  assert.match(preview, /nm-cart-preview__list/);
  assert.match(preview, /nm-cart-preview__products/);
  assert.match(preview, /data-expanded=\{panelExpanded \? "true" : "false"\}/);
  assert.match(preview, /onMouseEnter=\{onMouseEnter\}/);
  assert.match(preview, /scrollTo\(\{ top: 0 \}\)/);
  assert.match(preview, /is-scroll-ready/);
  assert.match(css, /\.nm-cart-preview\.is-expanded\.is-scroll-ready \.nm-cart-preview__products\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(css, /\.nm-cart-preview\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(css, /button\.nm-cart-preview__more/);
  assert.doesNotMatch(css, /\.nm-cart-access\[data-tooltip\]/);
});

test("Collapsed rail keeps labels in the DOM and exposes tooltips", async () => {
  const nav = await readFile(navUrl, "utf8");
  const css = await readFile(cssUrl, "utf8");

  assert.match(nav, /data-tooltip=\{collapsed && !compact \? label : undefined\}/);
  assert.match(css, /\.nm-spine\.is-collapsed \.nm-link__label/);
  assert.match(css, /content:\s*attr\(data-tooltip\)/);
  assert.doesNotMatch(css, /\.nm-spine\.is-collapsed \.nm-link__label\s*\{[^}]*display:\s*none/s);
});

test("Cart rail morph uses the same --nm-collapse timing as the sidebar", async () => {
  const css = await readFile(cssUrl, "utf8");

  assert.match(css, /--nm-collapse:\s*320ms var\(--nm-ease\)/);
  assert.match(css, /\.nm-spine\s*\{[^}]*transition:[^}]*width var\(--nm-collapse\)/s);
  assert.match(css, /\.nm-footer\s*\{[^}]*transition:\s*padding var\(--nm-collapse\)/s);
  /* Cart shares .nm-link row geometry; layout snaps with class (no width/grid morph → no left jump). */
  assert.match(css, /\.nm-cart-access\s*\{[^}]*grid-template-columns:\s*28px minmax\(0,\s*1fr\)/s);
  assert.match(css, /\.nm-cart-access\s*\{[^}]*padding:\s*0 12px/s);
  assert.match(css, /\.nm-cart-access\s*\{[^}]*transition-property:\s*color,\s*background/s);
  assert.doesNotMatch(css, /\.nm-cart-access\s*\{[^}]*transition:[^}]*grid-template-columns/s);
  assert.doesNotMatch(css, /\.nm-cart-access\s*\{[^}]*transition:[^}]*width var\(--nm-collapse\)/s);
  assert.match(css, /\.nm-spine\.is-collapsed \.nm-cart-access\s*\{[^}]*width:\s*44px/s);
  assert.match(css, /\.nm-spine\.is-collapsed \.nm-cart-access\s*\{[^}]*margin:\s*0 auto/s);
  assert.match(css, /\.nm-cart-access \.nm-link__label\s*\{[^}]*opacity 200ms var\(--nm-ease\) 100ms/s);
  assert.doesNotMatch(css, /\.nm-cart-access\s*\{[^}]*scaleX/s);
});
