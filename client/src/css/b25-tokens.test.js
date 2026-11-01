import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const tokensUrl = new URL("./b25-tokens.css", import.meta.url);

test("V6 exposes the approved B2.5 catalog token foundation", async () => {
  const css = await readFile(tokensUrl, "utf8");

  for (const token of [
    "--b25-canvas: #eeece7",
    "--b25-graphite: #171d22",
    "--b25-accent: #d64332",
    "--b25-success: #16816e",
    "--b25-warning: #a75b26",
    "--b25-border: #c9c6bf",
    "--b25-space-1: 4px",
    "--b25-radius-2: 4px",
    "--b25-interface: 180ms",
  ]) {
    assert.ok(css.includes(token), `missing token: ${token}`);
  }
});

test("V8 and V9 retain focus and reduced-motion handling", async () => {
  const css = await readFile(tokensUrl, "utf8");

  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test("V14 and V16 expose the restrained B2.6 shape and motion systems", async () => {
  const css = await readFile(tokensUrl, "utf8");

  for (const token of [
    "--b26-radius-xs: 3px",
    "--b26-radius-sm: 7px",
    "--b26-radius-md: 12px",
    "--b26-radius-lg: 20px",
    "--b26-radius-pill: 999px",
    "--b26-interface: 190ms",
    "--b26-spatial: 360ms",
  ]) {
    assert.ok(css.includes(token), `missing B2.6 token: ${token}`);
  }
});

test("V24-V26 expose B2.7 motion, theme, and focus foundations", async () => {
  const css = await readFile(tokensUrl, "utf8");

  for (const token of [
    "--b27-micro: 120ms",
    "--b27-interface: 200ms",
    "--b27-spatial: 320ms",
  ]) {
    assert.ok(css.includes(token), `missing B2.7 token: ${token}`);
  }

  assert.match(css, /:focus-visible[^}]*outline:\s*2px solid var\(--b25-accent\)/s);
  assert.match(css, /:focus-visible[^}]*outline-offset:\s*3px/s);
});

test("V27 exposes deliberate hover-intent and asymmetric trace timing", async () => {
  const css = await readFile(tokensUrl, "utf8");

  for (const token of [
    "--b271-hover-intent: 80ms",
    "--b271-trace-enter: 380ms",
    "--b271-trace-exit: 260ms",
  ]) {
    assert.ok(css.includes(token), `missing B2.7.1 token: ${token}`);
  }
});

test("V57-V59 B2.9 centralizes liquid material, depth, and luminous tokens", async () => {
  const css = await readFile(tokensUrl, "utf8");

  for (const token of [
    "--b29-glass-bg:",
    "--b29-glass-bg-hover:",
    "--b29-glass-border:",
    "--b29-glass-highlight:",
    "--b29-glass-shadow:",
    "--b29-glass-blur:",
    "--b29-glass-saturation:",
    "--b29-luminous-teal:",
    "--b29-accent-light:",
    "--b29-depth-0:",
    "--b29-depth-1:",
    "--b29-depth-2:",
    "--b29-depth-3:",
    "--b29-depth-4:",
  ]) {
    assert.ok(css.includes(token), `missing B2.9 token: ${token}`);
  }

  assert.match(css, /\.b25-customer-shell\.is-dark\s*\{[^}]*--b29-glass-bg:/s);
  assert.match(css, /\.b25-customer-shell\.is-dark\s*\{[^}]*--b29-luminous-teal:/s);
});

test("V58 and V63 glass has an intentional no-backdrop-filter fallback", async () => {
  const css = await readFile(tokensUrl, "utf8");

  assert.match(css, /@supports not \(\(backdrop-filter:\s*blur\(1px\)\)/);
  assert.match(css, /@supports not[\s\S]*--b29-glass-blur:\s*0px/);
  assert.match(css, /@supports not[\s\S]*--b29-glass-saturation:\s*1/);
});

test("V65-V67 B2.9.1 defines contextual regular and clear optical layers", async () => {
  const css = await readFile(tokensUrl, "utf8");

  for (const token of [
    "--b291-glass-regular-bg:",
    "--b291-glass-regular-hover-bg:",
    "--b291-glass-clear-bg:",
    "--b291-glass-on-dark:",
    "--b291-glass-on-dark-hover:",
    "--b291-specular-light:",
    "--b291-specular-dark:",
    "--b291-edge-deep:",
    "--b291-shadow-rest:",
    "--b291-shadow-hover:",
  ]) {
    assert.ok(css.includes(token), `missing B2.9.1 token: ${token}`);
  }

  assert.match(css, /\.b25-customer-shell\.is-dark\s*\{[^}]*--b291-glass-regular-bg:/s);
});

test("V86 Theme uses one bounded material-only morph with reduced-motion parity", async () => {
  const css = await readFile(tokensUrl, "utf8");
  const hook = await readFile(new URL("../hooks/darkMode.js", import.meta.url), "utf8");
  const morphBlock = css.match(/html\[data-b25-theme-transition="material"\][^{]*\{([^}]*)\}/s)?.[1] || "";

  assert.match(hook, /THEME_MORPH_MS\s*=\s*160/);
  assert.match(hook, /REDUCED_THEME_MORPH_MS\s*=\s*90/);
  assert.match(hook, /dataset\.b25ThemeTransition\s*=\s*'material'/);
  assert.match(hook, /clearTimeout\(themeMorphTimer\)/);
  assert.match(hook, /delete document\.documentElement\.dataset\.b25ThemeTransition/);
  assert.match(morphBlock, /transition-property:\s*background-color,\s*border-color,\s*box-shadow/);
  assert.match(morphBlock, /transition-duration:\s*160ms/);
  assert.doesNotMatch(morphBlock, /(?:opacity|width|height|position|transform|filter|backdrop-filter|margin|padding)\s*:/);
  assert.doesNotMatch(css, /transition:\s*all/);
  assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*data-b25-theme-transition="material"[\s\S]*transition-duration:\s*90ms/s);
});

test("Theme morph transitions surfaces while typography and imagery switch immediately", async () => {
  const css = await readFile(tokensUrl, "utf8");

  assert.match(css, /data-b25-theme-transition="material"\][\s\S]*\.b25-product-card__media[\s\S]*transition-property:\s*background-color,\s*border-color,\s*box-shadow !important/s);
  assert.match(css, /data-b25-theme-transition="material"\][\s\S]*\.catalog-heading h1,[\s\S]*\.b25-product-card h2,[\s\S]*\.b25-product-card__media img[\s\S]*transition-property:\s*none !important/s);
  assert.doesNotMatch(css, /data-b25-theme-transition="material"\][\s\S]*opacity:\s*1 !important/s);
  assert.doesNotMatch(css, /data-b25-theme-transition="material"\][\s\S]*\.b291-customer-route/s);
});
