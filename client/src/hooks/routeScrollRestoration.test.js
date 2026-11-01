import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  __clearRouteScrollPositionsForTests,
  easeOutCubic,
  getRouteDestinationKey,
  resolveRouteScrollBehavior,
  resolveRouteScrollDuration,
  resolveRouteScrollTop,
  saveScrollPosition,
} from "./routeScrollRestoration.js";

const navbarUrl = new URL("../components/Navbar-Model/NavbarModel.jsx", import.meta.url);
const restorationUrl = new URL("../UI/RouteScrollRestoration.jsx", import.meta.url);
const moduleUrl = new URL("./routeScrollRestoration.js", import.meta.url);
const productsUrl = new URL("../components/Customer/Products.jsx", import.meta.url);

test("route scroll restoration stays centralized outside pathname-keyed route exit", async () => {
  const navbar = await readFile(navbarUrl, "utf8");
  const restoration = await readFile(restorationUrl, "utf8");

  assert.match(
    navbar,
    /<RouteScrollRestoration \/>[\s\S]*<AnimatePresence mode="wait">[\s\S]*key=\{location\.pathname\}[\s\S]*<Outlet \/>/
  );
  assert.match(restoration, /useReducedMotion/);
  assert.match(restoration, /resolveRouteScrollBehavior/);
  assert.match(restoration, /applyRouteScroll/);
  assert.match(restoration, /animate: animate && scrollTop === 0/);
});

test("catalog filter dropdown replaces search params without resetting scroll", async () => {
  const products = await readFile(productsUrl, "utf8");

  assert.match(products, /writeCatalogParams\(category, 1, \{ replace: true \}\)/);
  assert.match(products, /buildCatalogSearchParams/);
  assert.match(products, /setSearchParams\(/);
});

test("catalog destination key tracks canonical category query only", () => {
  assert.equal(
    getRouteDestinationKey({ pathname: "/customer/products", search: "?category=furniture" }),
    "/customer/products?category=furniture"
  );
  assert.equal(
    getRouteDestinationKey({ pathname: "/customer/products", search: "?category=furniture&q=chair" }),
    "/customer/products?category=furniture"
  );
  assert.equal(getRouteDestinationKey({ pathname: "/customer/products", search: "" }), "/customer/products");
  assert.equal(getRouteDestinationKey({ pathname: "/", search: "" }), "/");
});

test("destination navigation animates to top but pop restore stays instant", () => {
  __clearRouteScrollPositionsForTests();

  const furnitureKey = "/customer/products?category=furniture";
  const beautyKey = "/customer/products?category=beauty";

  assert.deepEqual(
    resolveRouteScrollBehavior({
      navigationType: "PUSH",
      locationKey: "beauty-nav",
      destinationKey: beautyKey,
      previousDestinationKey: furnitureKey,
      location: { pathname: "/customer/products", search: "?category=beauty" },
    }),
    { shouldScroll: true, scrollTop: 0, animate: true }
  );

  assert.deepEqual(
    resolveRouteScrollBehavior({
      navigationType: "REPLACE",
      locationKey: "beauty-filter",
      destinationKey: beautyKey,
      previousDestinationKey: furnitureKey,
      location: { pathname: "/customer/products", search: "?category=beauty" },
    }),
    { shouldScroll: false, scrollTop: 0, animate: false }
  );

  saveScrollPosition("catalog-entry", 640);
  assert.deepEqual(
    resolveRouteScrollBehavior({
      navigationType: "POP",
      locationKey: "catalog-entry",
      destinationKey: furnitureKey,
      previousDestinationKey: beautyKey,
      location: { pathname: "/customer/products", search: "?category=furniture" },
    }),
    { shouldScroll: true, scrollTop: 640, animate: false }
  );
});

test("route scroll duration stays capped and short distances stay instant", () => {
  assert.equal(resolveRouteScrollDuration(20), 0);
  assert.equal(resolveRouteScrollDuration(120), 200);
  assert.equal(resolveRouteScrollDuration(300), 280);
  assert.equal(resolveRouteScrollDuration(1200), 320);
  assert.equal(resolveRouteScrollDuration(1200, true), 0);
});

test("route scroll easing uses restrained cubic ease-out", () => {
  assert.equal(easeOutCubic(0), 0);
  assert.equal(easeOutCubic(1), 1);
  assert.ok(easeOutCubic(0.5) > 0.5);
});

test("route scroll helper resets on push and restores on pop", () => {
  __clearRouteScrollPositionsForTests();

  assert.equal(resolveRouteScrollTop("PUSH", "home"), 0);
  assert.equal(resolveRouteScrollTop("REPLACE", "catalog"), 0);

  saveScrollPosition("catalog-entry", 640);
  assert.equal(resolveRouteScrollTop("POP", "catalog-entry"), 640);
  assert.equal(resolveRouteScrollTop("POP", "missing-entry"), 0);
});

test("route scroll module keeps scroll logic centralized", async () => {
  const source = await readFile(moduleUrl, "utf8");

  assert.match(source, /export function applyRouteScroll/);
  assert.match(source, /requestAnimationFrame/);
  assert.match(source, /resolveRouteScrollDuration/);
  assert.doesNotMatch(source, /behavior:\s*["']smooth["']/);
  assert.doesNotMatch(source, /useLocation|useEffect/);
});
