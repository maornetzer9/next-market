import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const entranceUrl = new URL("../UI/PageContentEntrance.jsx", import.meta.url);
const homepageUrl = new URL("../components/Customer/Homepage.jsx", import.meta.url);
const productsUrl = new URL("../components/Customer/Products.jsx", import.meta.url);
const navbarUrl = new URL("../components/Navbar-Model/NavbarModel.jsx", import.meta.url);

test("PageContentEntrance defines one shared content entrance law", async () => {
  const source = await readFile(entranceUrl, "utf8");

  assert.match(source, /PAGE_CONTENT_DURATION = 0\.38/);
  assert.match(source, /PAGE_CONTENT_OFFSET_Y = 8/);
  assert.match(source, /PAGE_CONTENT_EASE = \[0\.22, 0\.61, 0\.36, 1\]/);
  assert.match(source, /initial: \{ opacity: 0, y: PAGE_CONTENT_OFFSET_Y \}/);
  assert.match(source, /initial: \{ opacity: 1, y: 0 \}/);
});

test("ReadyPageContent gates on LoadingCoordinator before entrance", async () => {
  const source = await readFile(entranceUrl, "utf8");

  assert.match(source, /useInitialViewReady\(ready\)/);
  assert.match(source, /if \(phase !== READY\) return null/);
  assert.match(source, /<PageContentEntrance/);
});

test("Customer pages reuse ReadyPageContent instead of bespoke page fades", async () => {
  const homepage = await readFile(homepageUrl, "utf8");
  const products = await readFile(productsUrl, "utf8");
  const navbar = await readFile(navbarUrl, "utf8");
  const account = await readFile(new URL("../components/Customer/Account.jsx", import.meta.url), "utf8");
  const orders = await readFile(new URL("../components/Customer/Orders.jsx", import.meta.url), "utf8");
  const cart = await readFile(new URL("../components/Customer/CartPage.jsx", import.meta.url), "utf8");

  assert.match(homepage, /ReadyPageContent/);
  assert.match(products, /ReadyPageContent/);
  assert.match(account, /ReadyPageContent ready=\{profileReady\}/);
  assert.match(orders, /ReadyPageContent ready=\{!loading\}/);
  assert.match(cart, /ReadyPageContent ready=\{cartReady\}/);
  assert.match(navbar, /initial=\{false\}/);
  assert.doesNotMatch(homepage, /motion\.section/);
  assert.doesNotMatch(account, /motion\.section/);
  assert.doesNotMatch(orders, /motion\.section/);
  assert.doesNotMatch(cart, /motion\.section/);
});
