import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (file) => readFileSync(new URL(file, import.meta.url), "utf8");

test("page and navbar render the same NEXT / MARKET wordmark treatment", () => {
  const navbar = read("../Shell/MarketBrandLink.jsx");
  const page = read("../Shell/PageBrandSignature.jsx");
  const wordmark = read("../Shell/BrandWordmark.jsx");
  const navbarCss = read("../../css/customer-shell.css");
  const pageCss = read("../../css/page-heading.css");

  assert.match(navbar, /<BrandWordmark \/>/);
  assert.match(page, /<BrandWordmark \/>/);
  assert.match(wordmark, /<span>NEXT<\/span>[\s\S]*<span aria-hidden="true">\/<\/span>[\s\S]*<strong>MARKET<\/strong>/);
  assert.match(navbarCss, /\.b25-customer-command__brand,\s*\.b25-brand-wordmark\s*\{/);
  assert.match(navbarCss, /:is\(\.b25-customer-command__brand, \.b25-brand-wordmark\) > span:first-child/);
  assert.doesNotMatch(pageCss, /\.b25-page-heading__eyebrow\s*\{[^}]*color:/s);
});

test("Dashboard and Statistics consume one accepted AdminMetricCard stylesheet", () => {
  const card = read("./AdminMetricCard.jsx");
  const sharedCss = read("../../css/admin-metric-card.css");
  const dashboardCss = read("../../css/admin-dashboard.css");
  const statisticsCss = read("../../css/admin-statistics.css");

  assert.match(card, /admin-metric-card\.css/);
  assert.match(sharedCss, /\.admin-shell \.admin-metric-card\s*\{/);
  assert.match(sharedCss, /\.admin-shell\.is-dark \.admin-metric-card--orange/);
  assert.match(sharedCss, /@media \(max-width: 820px\)/);
  assert.doesNotMatch(dashboardCss, /\.admin-metric-card/);
  assert.doesNotMatch(statisticsCss, /\.admin-metric-card/);
});
