import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shellCss = readFileSync(new URL("../../css/admin-shell.css", import.meta.url), "utf8");
const categoriesCss = readFileSync(new URL("../../css/admin-categories.css", import.meta.url), "utf8");
const customersCss = readFileSync(new URL("../../css/admin-customers.css", import.meta.url), "utf8");
const productsCss = readFileSync(new URL("../../css/admin-products.css", import.meta.url), "utf8");
const products = readFileSync(new URL("./Products.jsx", import.meta.url), "utf8");
const statistics = readFileSync(new URL("./Statistics.jsx", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("./AdminDashboard.jsx", import.meta.url), "utf8");
const customers = readFileSync(new URL("./AdminCustomersTable.jsx", import.meta.url), "utf8");
const category = readFileSync(new URL("./Category.jsx", import.meta.url), "utf8");

test("final Admin polish centralizes surface, control, radius, and motion tokens", () => {
  for (const token of [
    "--admin-control-height",
    "--admin-control-radius",
    "--admin-button-height",
    "--admin-motion-fast",
    "--admin-motion-ui",
    "--admin-motion-ease",
  ]) assert.match(shellCss, new RegExp(token));
  assert.match(shellCss, /\.admin-section-card \{[^}]*backdrop-filter: none/s);
  assert.match(categoriesCss, /min-height: var\(--admin-control-height\)/);
  assert.match(productsCss, /min-height: var\(--admin-control-height\)/);
});

test("final Admin polish uses one restrained page entrance with reduced-motion parity", () => {
  assert.match(shellCss, /@keyframes admin-page-enter/);
  assert.match(shellCss, /prefers-reduced-motion: reduce[\s\S]*\.admin-page \{ animation: none/);
  assert.doesNotMatch(products, /headContentAnimation/);
  assert.doesNotMatch(statistics, /headContentAnimation/);
});

test("Dashboard and Customers reuse shared chart and image presentation", () => {
  assert.match(dashboard, /getAdminChartTheme/);
  assert.match(dashboard, /AdminEntityImage/);
  assert.match(customers, /AdminEntityImage/);
  assert.equal((productsCss.match(/\.admin-shell \.admin-entity-image \{/g) || []).length, 0);
  assert.equal((shellCss.match(/\.admin-shell \.admin-entity-image \{/g) || []).length, 1);
});

test("Customers keeps bounded scrolling without stretching a short mobile directory", () => {
  assert.match(customersCss, /admin-customers__list-region \{[^}]*flex: 0 1 auto[^}]*max-height:/s);
  assert.match(customersCss, /admin-customers__directory \{[^}]*flex: 0 1 auto/s);
  assert.match(customersCss, /admin-customers__directory \{[^}]*overflow-y: auto/s);
  assert.match(customersCss, /admin-shell\.is-dark \.admin-customers__master \{ box-shadow: none; \}/);
});

test("mobile Category edit actions retain practical touch targets", () => {
  assert.doesNotMatch(category, /mobile-menu-popover admin-categories__mobile-edit-actions/);
  assert.match(category, /const normal = editPhase === 'idle'/);
  assert.match(category, /animate=\{normal \? \{ opacity: 1, scale: 1 \}/);
  assert.match(
    categoriesCss,
    /admin-categories__mobile-edit-actions button \{[^}]*min-height: 40px/s,
  );
  assert.match(categoriesCss, /admin-categories__mobile-edit-actions \{[^}]*display: flex[^}]*position: static/s);
  assert.match(categoriesCss, /admin-categories__mobile-edit-actions button:nth-child\(2\) \{ margin-left: auto; \}/);
  assert.match(categoriesCss, /grid-template-rows: minmax\(52px, 1fr\) 0fr[^}]*transition: min-height 220ms[^}]*grid-template-rows 220ms/s);
  assert.match(categoriesCss, /transition:[^;}]*grid-template-columns 220ms var\(--admin-motion-ease\)/);
  assert.match(categoriesCss, /admin-categories__row:has\(\.admin-categories__edit-field\[aria-hidden="false"\]\) \{[^}]*grid-template-columns: minmax\(0, 1fr\) 66px 0px/s);
  assert.match(categoriesCss, /admin-categories__action-slot \{ display: contents; \}/);
  assert.match(categoriesCss, /admin-categories__action-layer--normal \{[^}]*grid-column: 3[^}]*grid-row: 1/s);
  assert.match(categoriesCss, /admin-categories__action-layer--edit \{[^}]*grid-column: 1 \/ -1[^}]*grid-row: 2/s);
  assert.match(categoriesCss, /admin-categories__edit-field \{[^}]*font-size: 16px/s);
  assert.match(categoriesCss, /admin-categories__action-layer--normal\[aria-hidden="true"\],[\s\S]*admin-categories__action-layer--edit\[aria-hidden="true"\] \{ overflow: hidden; \}/);
  assert.match(categoriesCss, /admin-categories__action-layer--edit\[aria-hidden="false"\] \{[^}]*min-height: 40px/s);
});
