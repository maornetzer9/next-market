import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ordersUrl = new URL("./Orders.jsx", import.meta.url);
const cssUrl = new URL("../../css/orders.css", import.meta.url);
const ordersServiceUrl = new URL("../../../../server/services/orders.js", import.meta.url);
const accountUrl = new URL("./Account.jsx", import.meta.url);

test("Customer Orders preserves the existing API and embedded snapshot source", async () => {
  const source = await readFile(ordersUrl, "utf8");

  assert.match(source, /loadOrdersAction\(userId,\s*`\$\{ORIGIN\}\/orders`,\s*\{\s*signal:\s*controller\.signal\s*\}\)/);
  assert.match(source, /state\.ordersReducer/);
  assert.match(source, /orderUser\?\.orders/);
  assert.match(source, /users:\s*sharedOrderUsers/);
  assert.match(source, /sharedOrderUsers[\s\S]*owner\.orders/);
  assert.doesNotMatch(source, /productsReducer|\$\{ORIGIN\}\/products/);
  assert.doesNotMatch(source, /tracking|shipping ETA|payment method|(?<![a-z])View order/i);
});

test("Customer Orders reuses the existing checked-user permission response", async () => {
  const [source, service, account] = await Promise.all([
    readFile(ordersUrl, "utf8"),
    readFile(ordersServiceUrl, "utf8"),
    readFile(accountUrl, "utf8"),
  ]);

  assert.match(service, /const userId = req\.auth\.userId/);
  assert.match(service, /User\.find\(\{\s*checked:\s*true,\s*_id:\s*\{\s*\$ne:\s*userId\s*\}/);
  assert.match(service, /users:\s*users\.map\(\(entry\) => toSafeUser/);
  assert.match(account, /name="checked"/);
  assert.match(account, /form\.checked/);
  assert.doesNotMatch(account, /FormModel|@mui\/material|checkboxName=/);
  assert.match(source, /filter\(\(owner\) => Array\.isArray\(owner\?\.orders\) && owner\.orders\.length > 0\)/);
  assert.doesNotMatch(source, /checked\s*=|checked:\s*true/);
});

test("Customer Orders renders only real historical snapshot fields", async () => {
  const source = await readFile(ordersUrl, "utf8");

  for (const field of ["title", "thumbnail", "category", "status", "quantity", "price", "total", "createAt"]) {
    assert.match(source, new RegExp(`order\\.${field}`), `missing historical field: ${field}`);
  }

  assert.match(source, /loading=\{index < 2 \? "eager" : "lazy"\}/);
  assert.match(source, /decoding="async"/);
  assert.match(source, /className=\{`orders-list b25-internal-scroll/);
  assert.match(source, /order-record__product/);
  assert.match(source, /order-record__meta/);
  assert.match(source, /order-record__status-value/);
  assert.match(source, /<dt>Status<\/dt>/);
  assert.doesNotMatch(source, /order-record__status--inline/);
  assert.match(source, /MdAccessTime/);
  assert.match(source, /<dl className="order-record__facts">/);
  assert.match(source, /formatRecordedParts\(order\.createAt\)/);
  assert.match(source, /order-record__recorded-date/);
  assert.match(source, /order-record__recorded-time/);
  assert.doesNotMatch(source, /TableModel|@mui\/material/);
});

test("Owner groups are independent semantic accordions with restrained motion", async () => {
  const [source, css] = await Promise.all([
    readFile(ordersUrl, "utf8"),
    readFile(cssUrl, "utf8"),
  ]);

  assert.match(source, /new Set\(\["self"\]\)/);
  assert.match(source, /aria-expanded=\{expanded\}/);
  assert.match(source, /aria-controls=\{panelId\}/);
  assert.match(source, /\{\.\.\.\(!expanded && !isClosing \? \{ inert: "" \} : \{\}\)\}/);
  assert.match(source, /className="orders-owner-group__clip"/);
  assert.match(source, /const next = new Set\(current\)/);
  assert.match(source, /is-closing/);
  assert.match(source, /onTransitionEnd=\{handlePanelTransitionEnd\}/);
  assert.match(source, /style=\{\{\s*height: isPanelOpen \? `\$\{panelHeight\}px` : "0px"/);
  assert.doesNotMatch(source, /AnimatePresence|height:\s*["']?auto/);
  assert.match(css, /\.orders-owner-group__panel\s*\{[^}]*height:\s*0/s);
  assert.match(css, /\.orders-owner-group\.is-expanded \.orders-owner-group__panel[^}]*transition-duration:\s*260ms/s);
  assert.match(css, /\.orders-owner-group__panel\s*\{[^}]*transition:[^}]*200ms cubic-bezier\(0\.4, 0, 0\.2, 1\)/s);
  assert.match(css, /\.orders-owner-group\.is-expanded \.orders-owner-group__clip[^}]*opacity:\s*1/s);
  assert.match(source, /is-instant/);
  assert.match(source, /heightMotionReady/);
  assert.match(css, /\.orders-owner-group\.is-instant \.orders-owner-group__panel/s);
});

test("Customer Orders uses solid B2.9 surfaces and native responsive reflow", async () => {
  const css = await readFile(cssUrl, "utf8");

  assert.match(css, /\.order-record\s*\{[^}]*background:\s*var\(--b25-surface\)[^}]*box-shadow:\s*var\(--b29-depth-1\)/s);
  assert.match(css, /@media \(max-width:\s*820px\)/);
  assert.match(css, /@media \(max-width:\s*600px\)/);
  assert.match(css, /\.order-record__facts\s*\{[^}]*grid-template-columns:/s);
  assert.match(css, /\.order-record__metrics\s*\{/);
  assert.match(css, /\.order-record:hover\s*\{[^}]*translateY\(-2px\)[^}]*transition-delay:\s*80ms/s);
  assert.match(css, /\.order-record:hover::before\s*\{[^}]*scaleY\(1\)/s);
  assert.match(css, /grid-template-areas:\s*"metrics meta"/);
  assert.match(css, /\.order-record__meta\s*\{[^}]*flex-direction:\s*column/s);
  assert.match(css, /\.order-record__facts \.is-status\s*\{[^}]*flex-direction:\s*row/s);
  assert.match(css, /\.order-record__status-value\.is-pending/);
  assert.match(css, /\.order-record\s*\{[^}]*cursor:\s*default/s);
  assert.doesNotMatch(css, /backdrop-filter|overflow-x:\s*auto|transition:\s*all/);
});

test("Expanded owner groups use two-row internal scroll when records exceed two", async () => {
  const [source, css] = await Promise.all([
    readFile(ordersUrl, "utf8"),
    readFile(cssUrl, "utf8"),
  ]);

  assert.match(source, /measureViewport/);
  assert.match(source, /getBoundingClientRect\(\)\.height/);
  assert.match(source, /is-scrollable/);
  assert.match(css, /\.orders-owner-group\.is-expanded \.orders-list\.is-scrollable,\s*\.orders-owner-group\.is-closing \.orders-list\.is-scrollable\s*\{[^}]*overflow-y:\s*auto/s);
  assert.doesNotMatch(source, /overflow-y:\s*scroll/);
});

test("Orders reuses the Catalog Back to Top control for page scroll", async () => {
  const [source, scrollTop, products] = await Promise.all([
    readFile(ordersUrl, "utf8"),
    readFile(new URL("./ScrollToTop.jsx", import.meta.url), "utf8"),
    readFile(new URL("./Products.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(source, /import ScrollToTop from "\.\/ScrollToTop"/);
  assert.match(source, /<ScrollToTop \/>/);
  assert.match(products, /import ScrollToTop from "\.\/ScrollToTop"/);
  assert.match(products, /<ScrollToTop \/>/);
  assert.match(scrollTop, /className="catalog-scroll-top"/);
  assert.match(scrollTop, /window\.scrollY > 420/);
  assert.match(scrollTop, /window\.scrollTo\(\{ top: 0, behavior: "smooth" \}\)/);
  assert.match(scrollTop, /addEventListener\("scroll", handleScroll, \{ passive: true \}\)/);
  assert.doesNotMatch(source, /querySelector\("\.orders-owner-group__body"\)/);
});

test("B3.0.2 mobile cards prioritize product and total without changing desktop rules", async () => {
  const css = await readFile(cssUrl, "utf8");
  const mobile = css.slice(css.indexOf("@media (max-width: 600px)"), css.indexOf("@media (max-width: 360px)"));
  const narrow = css.slice(css.indexOf("@media (max-width: 360px)"));

  assert.match(mobile, /\.order-record\s*\{[^}]*display:\s*flex[^}]*flex-direction:\s*column[^}]*padding:\s*15px/s);
  assert.match(mobile, /\.order-record__product\s*\{[^}]*grid-template-columns:\s*78px minmax\(0, 1fr\)/s);
  assert.match(mobile, /\.order-record__identity h3\s*\{[^}]*font-size:\s*18px[^}]*font-weight:\s*580/s);
  assert.match(mobile, /\.order-record__facts\s*\{[^}]*min-height:\s*0/s);
  assert.match(mobile, /\.order-record__metrics\s*\{[^}]*background:\s*transparent/s);
  assert.match(mobile, /\.order-record__meta\s*\{[^}]*background:\s*transparent/s);
  assert.match(mobile, /\.order-record__meta\s*\{[^}]*min-height:\s*0/s);
  assert.match(mobile, /\.order-record__meta\s*\{[^}]*grid-template-areas:\s*"date status"/s);
  assert.match(mobile, /\.order-record__facts \.is-status::before\s*\{[^}]*width:\s*1px/s);
  assert.doesNotMatch(mobile, /justify-content:\s*space-(?:around|evenly)/);
  assert.match(mobile, /\.order-record__facts \.is-date dt::after\s*\{[^}]*content:\s*":"/s);
  assert.match(mobile, /\.order-record__recorded-time::before\s*\{[^}]*content:\s*" · "/s);
  assert.match(mobile, /\.order-record__facts \.is-total dd\s*\{[^}]*font-size:\s*22px[^}]*font-weight:\s*700/s);
  assert.doesNotMatch(mobile, /order-record__status--inline/);
  assert.doesNotMatch(mobile, /\.order-record__metrics\s*\{[^}]*background:\s*color-mix/s);
  assert.match(narrow, /body:has\(\.orders-page\)\s*\{[^}]*min-width:\s*0/s);
  assert.match(narrow, /\.order-record__product\s*\{[^}]*grid-template-columns:\s*72px minmax\(0, 1fr\)/s);
});

test("Orders load uses abortable fetch and clears cache on logout/login", async () => {
  const [source, actions, routes, reducer, userActions, footer, shell] = await Promise.all([
    readFile(ordersUrl, "utf8"),
    readFile(new URL("../../actions/orderActions.js", import.meta.url), "utf8"),
    readFile(new URL("../../routes/orders.js", import.meta.url), "utf8"),
    readFile(new URL("../../reducers/orders.js", import.meta.url), "utf8"),
    readFile(new URL("../../actions/userActions.js", import.meta.url), "utf8"),
    readFile(new URL("../../css/storefront-footer.css", import.meta.url), "utf8"),
    readFile(new URL("../../css/customer-shell.css", import.meta.url), "utf8"),
  ]);

  assert.match(source, /AbortController/);
  assert.match(source, /signal:\s*controller\.signal/);
  assert.match(source, /controller\.abort\(\)/);
  assert.match(actions, /CLEAR_ORDERS/);
  assert.match(actions, /options\.signal/);
  assert.match(routes, /signal:\s*options\.signal/);
  assert.match(reducer, /case CLEAR_ORDERS:/);
  assert.match(reducer, /case USER_DISCONNECT:/);
  assert.match(userActions, /USER_DISCONNECT = 'USER_DISCONNECT'/);
  assert.doesNotMatch(userActions, /USER_DISCONNECT = 'USER_DETAILS_UPDATE'/);
  assert.match(footer, /margin:\s*auto auto 0/);
  assert.match(shell, /\.b25-customer-main__body\s*\{[^}]*flex:\s*1 1 auto/s);
  assert.doesNotMatch(source, /html,\s*body\s*\{[^}]*overflow:\s*hidden/);
});
