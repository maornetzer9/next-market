import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const appUrl = new URL("./App.jsx", import.meta.url);

test("Vercel serves client-side routes through the Vite SPA entrypoint", async () => {
  const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  assert.deepEqual(config.rewrites, [{ source: "/(.*)", destination: "/index.html" }]);
});

test("Vite fails the build when the public API origin is missing", async () => {
  const config = await readFile(new URL("../vite.config.js", import.meta.url), "utf8");
  assert.match(config, /loadEnv\(mode, process\.cwd\(\), 'VITE_'\)/);
  assert.match(config, /if \(!env\.VITE_ORIGIN\) throw new Error\('Missing required environment variable: VITE_ORIGIN'\)/);
});

test("V34 page routes lazy-load without changing paths or guards", async () => {
  const source = await readFile(appUrl, "utf8");

  for (const path of ["/login", "/register", "/admin", "customer", "customer/products", "customer/orders", "customer/account", "customer/cart", "categories", "customers", "products", "statistics"]) {
    assert.ok(source.includes(`path="${path}"`) || source.includes(`path='${path}'`) || source.includes(`path=\"${path}\"`), `missing route: ${path}`);
  }

  assert.match(source, /lazy\(\(\) => import\('\.\/components\/Customer\/Homepage'\)\)/);
  assert.match(source, /lazy\(\(\) => import\('\.\/components\/Customer\/Products'\)\)/);
  assert.match(source, /lazy\(\(\) => import\('\.\/components\/Admin\/Statistics'\)\)/);
  assert.match(source, /lazy\(\(\) => import\('\.\/components\/Login'\)\)/);
  assert.match(source, /allowedRoles=\{\['User', 'Admin'\]\}/);
  assert.match(source, /allowedRoles=\{\['Admin'\]\}/);
  assert.match(source, /redirectTo="\/login"/);
  assert.match(source, /Navigate to="\/" replace/);
  assert.doesNotMatch(source, /ProtectedRoute allowedRoles=\{\['User', 'Admin'\]\}[\s\S]*path="\/customer" element=\{withRouteLoader\(<Customer/);
  assert.match(source, /Suspense fallback=\{<RouteWaitSignal \/>\}/);
  assert.doesNotMatch(source, /CustomerComponents|AdminComponents/);
});

test("V34 shared loader is stable, labelled, and immediately visible on boot", async () => {
  const source = await readFile(new URL("./UI/GlobalLoader.jsx", import.meta.url), "utf8");
  const css = await readFile(new URL("./css/global-loader.css", import.meta.url), "utf8");

  assert.match(source, /role="status"/);
  assert.match(source, /aria-live="polite"/);
  assert.match(css, /min-height:/);
  assert.doesNotMatch(source, /setTimeout|setInterval/);
  assert.doesNotMatch(source, /setTimeout|setInterval/);
  assert.doesNotMatch(css, /animation-delay|b292-loader-reveal/);
});

test("V69 global routing does not remount the persistent Customer shell", async () => {
  const app = await readFile(appUrl, "utf8");
  const protectedRoute = await readFile(new URL("./components/ProtectedRoute.jsx", import.meta.url), "utf8");

  assert.doesNotMatch(app, /<Routes[^>]*key=\{location\.pathname\}/);
  assert.doesNotMatch(app, /<AnimatePresence mode=['"]wait['"]>[\s\S]*<Routes/);
  assert.doesNotMatch(app, /useLocation/);
  assert.match(protectedRoute, /return isAuthorize[\s\S]*<Outlet \/>/);
  assert.match(protectedRoute, /state=\{\{ from: location \}\}/);
  assert.doesNotMatch(protectedRoute, /AnimatePresence|pageTransition/);
});

test("V77-V81 LoadingCoordinator is the sole GlobalLoader owner", async () => {
  const app = await readFile(appUrl, "utf8");
  const protectedRoute = await readFile(new URL("./components/ProtectedRoute.jsx", import.meta.url), "utf8");
  const products = await readFile(new URL("./components/Customer/Products.jsx", import.meta.url), "utf8");
  const adminProducts = await readFile(new URL("./components/Admin/Products.jsx", import.meta.url), "utf8");
  const adminCategories = await readFile(new URL("./components/Admin/Categories.jsx", import.meta.url), "utf8");
  const loader = await readFile(new URL("./UI/GlobalLoader.jsx", import.meta.url), "utf8");
  const coordinator = await readFile(new URL("./UI/LoadingCoordinator.jsx", import.meta.url), "utf8");
  const main = await readFile(new URL("./main.jsx", import.meta.url), "utf8");
  const css = await readFile(new URL("./css/global-loader.css", import.meta.url), "utf8");

  for (const source of [app, protectedRoute, products, adminProducts, adminCategories]) {
    assert.doesNotMatch(source, /GlobalLoader/);
  }
  assert.equal((coordinator.match(/<GlobalLoader/g) || []).length, 1);
  assert.match(app, /Suspense fallback=\{<RouteWaitSignal \/>\}/);
  assert.match(protectedRoute, /if \(loading\) return null/);
  assert.match(protectedRoute, /hasAllowedSession/);
  assert.match(protectedRoute, /isAuthenticatedUser\(reduxUser\)/);
  assert.match(products, /ReadyPageContent ready=\{!productLoad\.loading\}/);
  assert.match(main, /<LoadingCoordinator>/);
  assert.match(coordinator, /ROUTE_WAIT_THRESHOLD_MS = 110/);
  assert.match(coordinator, /REVEAL_DURATION_MS = 150/);
  assert.match(loader, /useDarkMode\(\)/);
  assert.match(loader, /role="status"/);
  assert.match(loader, /aria-live="polite"/);
  assert.match(loader, />N\/M</);
  assert.doesNotMatch(loader, /localStorage|useState/);
  assert.match(css, /\.b292-global-loader\.is-dark/);
  assert.doesNotMatch(css, /animation-delay/);
  assert.match(css, /900ms/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation:\s*none/s);
  await assert.rejects(access(new URL("./UI/Loader.jsx", import.meta.url)));
  await assert.rejects(access(new URL("./UI/RouteLoader.jsx", import.meta.url)));
  await assert.rejects(access(new URL("./css/loader.css", import.meta.url)));
  await assert.rejects(access(new URL("./css/route-loader.css", import.meta.url)));
});

test("V74 bootstrap establishes existing darkMode source before React", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const hook = await readFile(new URL("./hooks/darkMode.js", import.meta.url), "utf8");

  assert.match(html, /localStorage\.getItem\('darkMode'\)/);
  assert.match(html, /dataset\.b25Theme/);
  assert.ok(html.indexOf("dataset.b25Theme") < html.indexOf('src="/src/main.jsx"'));
  assert.match(hook, /document\.documentElement\.dataset\.b25Theme/);
});

test("V87 desktop reserves root scrollbar space without changing Loader ownership", async () => {
  const css = await readFile(new URL("./index.css", import.meta.url), "utf8");
  const loaderCss = await readFile(new URL("./css/global-loader.css", import.meta.url), "utf8");
  const filter = await readFile(new URL("./components/Filter-Model/FilterModel.jsx", import.meta.url), "utf8");

  assert.match(css, /@media \(min-width:\s*821px\)[\s\S]*html\s*\{[^}]*scrollbar-gutter:\s*stable[^}]*overflow-y:\s*auto/s);
  assert.doesNotMatch(css, /@media \(max-width:\s*820px\)[\s\S]*scrollbar-gutter:\s*stable/s);
  assert.doesNotMatch(loaderCss, /(?:html|body)[^{]*\{[^}]*overflow/s);
  assert.match(filter, /disableScrollLock:\s*true/);
});
