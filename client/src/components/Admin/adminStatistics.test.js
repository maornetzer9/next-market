import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const statistics = readFileSync(new URL("./Statistics.jsx", import.meta.url), "utf8");
const pie = readFileSync(new URL("./PieGraph.jsx", import.meta.url), "utf8");
const quantity = readFileSync(new URL("./QtyGraph.jsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../../css/admin-statistics.css", import.meta.url), "utf8");
const dashboardCss = readFileSync(new URL("../../css/admin-dashboard.css", import.meta.url), "utf8");

test("Statistics preserves the real Admin orders API and centralizes aggregation", () => {
  assert.match(statistics, /loadUsersOrders\(LOAD_ADMIN_ORDERS_URL\)/);
  assert.match(statistics, /state\.ordersReducer/);
  assert.match(statistics, /buildAdminStatisticsData\(users\)/);
  assert.doesNotMatch(statistics, /This Month|last month|conversion|forecast|visitor/i);
});

test("Statistics reuses Admin cards and exposes intentional states", () => {
  assert.match(statistics, /AdminMetricCard/);
  assert.match(statistics, /AdminSectionCard/);
  assert.match(statistics, /Loading recorded statistics/);
  assert.match(statistics, /No statistical data available/);
  assert.match(statistics, /role="alert"/);
});

test("Statistics charts share deterministic series data and accessible legends", () => {
  assert.match(pie, /const \{ categories \} = statistics/);
  assert.match(pie, /visibleCategories\.map/);
  assert.match(quantity, /categories, customers/);
  assert.match(pie, /getAdminChartTheme/);
  assert.match(quantity, /getAdminChartTheme/);
  assert.match(pie, /aria-label="Category totals"/);
  assert.match(quantity, /aria-label="Chart categories"/);
  assert.match(quantity, /stack: "recorded-quantity"/);
});

test("Statistics responsive layout protects mobile and uses natural page flow", () => {
  assert.match(css, /@media \(max-width: 820px\)[\s\S]*admin-statistics__metrics \{[^}]*gap: 10px/s);
  assert.match(css, /admin-statistics__donut-plot \{[^}]*display: grid[^}]*aspect-ratio: 1/s);
  assert.match(css, /admin-statistics__bar-scroll\.is-wide \{ overflow-x: auto/s);
  assert.doesNotMatch(css, /position:\s*fixed|height:\s*100dvh/);
});

test("Statistics KPI treatment cannot change after Dashboard's lazy CSS loads", () => {
  const cardCss = readFileSync(new URL("../../css/admin-metric-card.css", import.meta.url), "utf8");
  assert.match(cardCss, /\.admin-shell \.admin-metric-card\s*\{/);
  assert.doesNotMatch(dashboardCss, /\.admin-metric-card/);
  assert.doesNotMatch(css, /\.admin-metric-card/);
});

test("Statistics owns one category visibility state for both charts, not KPIs or insights", () => {
  assert.match(statistics, /hiddenCategoryNames/);
  assert.match(statistics, /visibleCategories=\{visibleCategories\}/g);
  assert.match(statistics, /onToggleCategory=\{toggleCategory\}/g);
  assert.match(statistics, /value: integer\.format\(statistics\.metrics\.units\)/);
  assert.match(statistics, /statistics\.insights\.map/);
  assert.doesNotMatch(statistics, /buildAdminStatisticsData\(visibleCategories\)/);
});

test("both chart legends expose the same accessible category toggle", () => {
  assert.match(pie, /StatisticsCategoryToggle/);
  assert.match(quantity, /StatisticsCategoryToggle/);
  assert.match(pie, /visibleUnits/);
  assert.match(quantity, /visibleCategories\.map/);
  const toggle = readFileSync(new URL("./StatisticsCategoryToggle.jsx", import.meta.url), "utf8");
  assert.match(toggle, /<button/);
  assert.match(toggle, /aria-pressed=\{active\}/);
  assert.match(toggle, /Hide.*category|Show.*category/s);
});
