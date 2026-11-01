import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cartPageUrl = new URL("./CartPage.jsx", import.meta.url);
const cartAccessUrl = new URL("./Cart.jsx", import.meta.url);
const cssUrl = new URL("../../css/cart.css", import.meta.url);
const appUrl = new URL("../../App.jsx", import.meta.url);
const tokensUrl = new URL("../../css/b25-tokens.css", import.meta.url);
const cartServiceUrl = new URL("../../../../server/services/cart.js", import.meta.url);
const cartActionsUrl = new URL("../../actions/cartActions.js", import.meta.url);
const orderActionsUrl = new URL("../../actions/orderActions.js", import.meta.url);
const orderRoutesUrl = new URL("../../routes/orders.js", import.meta.url);

test("Customer Cart is a routed page and keeps Neural Wave Cart access", async () => {
  const [page, access, app, nav] = await Promise.all([
    readFile(cartPageUrl, "utf8"),
    readFile(cartAccessUrl, "utf8"),
    readFile(appUrl, "utf8"),
    readFile(new URL("./NeuralWaveNav.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(app, /lazy\(\(\) => import\('\.\/components\/Customer\/CartPage'\)\)/);
  assert.match(app, /path="customer\/cart"/);
  assert.match(app, /withInitialReady\(<CustomerCart \/>\)/);
  assert.match(access, /to="\/customer\/cart"/);
  assert.match(access, /b272-cart-access/);
  assert.match(access, /aria-expanded=\{compact \? onCartPage : previewOpen \|\| onCartPage\}/);
  assert.match(nav, /<Cart\s+user=\{user\}/);
  assert.doesNotMatch(page, /Drawer|@mui\/material|alert\(/);
  assert.doesNotMatch(access, /Drawer|@mui\/material/);
});

test("Customer Cart preserves existing cart APIs, totals, and checkout", async () => {
  const [page, actions, orders, orderRoutes, service] = await Promise.all([
    readFile(cartPageUrl, "utf8"),
    readFile(cartActionsUrl, "utf8"),
    readFile(orderActionsUrl, "utf8"),
    readFile(orderRoutesUrl, "utf8"),
    readFile(cartServiceUrl, "utf8"),
  ]);

  assert.match(page, /useCartOperations\(\)/);
  assert.match(page, /PageHeader/);
  assert.match(page, /MdOutlineShoppingBag/);
  assert.match(page, /Review your items and complete your order when you're ready\./);
  assert.match(page, /addToCart\(item, 1\)/);
  assert.match(page, /removeFromCart\(item\)/);
  assert.match(page, /deleteFromCartAction\(id, user\._id, CART_URL_DELETE\)/);
  assert.match(page, /newOrderAction\(user\._id, NEW_ORDER_URL, checkoutKeyRef\.current\)/);
  assert.match(page, /checkoutKeyRef\.current \|\|= createCheckoutKey\(\)/);
  assert.match(page, /ORIGIN\}\/cart\/delete/);
  assert.match(page, /ORIGIN\}\/orders\/add/);
  assert.match(page, /cart\?\.total/);
  assert.match(page, /navigate\("\/customer\/orders"\)/);
  assert.match(actions, /handleAddToCart|handleRemoveFromCart|handleDeleteFromCart|handleLoadCart/);
  assert.match(orders, /dispatch\(\{ type: UPDATE_CART,\s*payload: cart \}\)/);
  assert.match(orderRoutes, /'Idempotency-Key': idempotencyKey/);
  assert.match(service, /user\.cart\.items\[index\]\.quantity\s*=\s*nextQuantity/);
  assert.match(service, /user\.cart\.items\.splice\(index, 1\)/);
  assert.match(page, /checkoutKeyRef\.current = null/);
  assert.doesNotMatch(page, /stripe|paypal\.com|paymentIntent|createPayment/i);
  assert.doesNotMatch(page, /dispatch\(.*(?:shipping|tax|coupon|promo)/i);
});

test("Customer Cart renders real line fields with a premium stepper and empty state", async () => {
  const [page, payments] = await Promise.all([
    readFile(cartPageUrl, "utf8"),
    readFile(new URL("./PaymentMethodTile.jsx", import.meta.url), "utf8"),
  ]);

  for (const field of ["thumbnail", "title", "category", "price", "quantity", "stock"]) {
    assert.match(page, new RegExp(`item\\.${field}`), `missing cart field: ${field}`);
  }

  assert.match(page, /loading=\{index < 2 \? "eager" : "lazy"\}/);
  assert.match(page, /decoding="async"/);
  assert.match(page, /role="group"/);
  assert.match(page, /aria-label=\{`Quantity for \$\{item\.title\}`\}/);
  assert.match(page, /aria-label=\{`Remove one \$\{item\.title\}`\}/);
  assert.match(page, /aria-label=\{`Add one \$\{item\.title\}`\}/);
  assert.match(page, /aria-label=\{`Delete \$\{item\.title\} from Cart`\}/);
  assert.match(page, /MdDeleteOutline/);
  assert.match(page, /atStockLimit/);
  assert.match(page, /b25-product-tag/);
  assert.match(page, /Secure checkout/);
  assert.match(page, /Discount code/);
  assert.match(page, /Enter discount code/);
  assert.match(payments, /Payment methods/);
  assert.match(page, /PaymentMethodStrip/);
  assert.match(page, /notifyInfo/);
  assert.doesNotMatch(page, /cart-payment-icons|VisaMark|ApplePayMark/);
  assert.match(page, /import ScrollToTop from "\.\/ScrollToTop"/);
  assert.match(page, /useReducedMotion/);
  assert.match(page, /hydrated/);
  assert.match(page, /cartReady/);
  assert.match(page, /initial=\{false\}/);
  assert.match(page, /className="cart-list"/);
  assert.match(page, /aria-label="Cart items"/);
});

test("Customer Cart uses a two-column sticky summary and native mobile reflow", async () => {
  const css = await readFile(cssUrl, "utf8");
  const tokens = await readFile(tokensUrl, "utf8");

  assert.match(css, /\.cart-page\s*\{[^}]*width:\s*min\(100%, var\(--b25-content-max\)\)/s);
  assert.doesNotMatch(css, /\.cart-page\s*\{[^}]*overflow:\s*clip/s);
  assert.doesNotMatch(css, /\.cart-page\s*\{[^}]*overflow-x:\s*clip/s);
  assert.match(css, /\.cart-layout\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1\.65fr\) minmax\(280px, 0\.88fr\)/s);
  assert.match(css, /\.cart-summary\s*\{[^}]*position:\s*sticky[^}]*top:\s*calc\(var\(--b25-command-height\) \+ var\(--b25-space-5\)\)/s);
  assert.match(css, /@media \(min-width:\s*821px\)[\s\S]*\.cart-list\s*\{[^}]*max-height:\s*calc\([\s\S]*100dvh[\s\S]*overflow-y:\s*auto/s);
  assert.match(css, /@media \(max-width:\s*820px\)[\s\S]*\.cart-list\s*\{[^}]*max-height:\s*none[^}]*overflow-y:\s*visible/s);
  assert.match(css, /@media \(max-width:\s*820px\)[\s\S]*\.cart-summary\s*\{[^}]*position:\s*static/s);
  assert.match(css, /@media \(max-width:\s*1120px\)/);
  assert.match(css, /@media \(max-width:\s*768px\)|@media \(max-width:\s*820px\)/);
  assert.match(css, /@media \(max-width:\s*390px\)/);
  assert.match(css, /\.cart-item__action-row\s*\{[^}]*display:\s*contents/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*\.cart-item__action-row\s*\{[^}]*grid-template-columns:\s*auto 1fr auto/s);
  assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*\.cart-item__actions\s*\{[^}]*display:\s*contents/s);
  assert.match(css, /\.cart-item,\s*\.cart-empty\s*\{[^}]*background:\s*var\(--b25-surface\)[^}]*box-shadow:\s*var\(--b29-depth-1\)/s);
  assert.match(css, /\.cart-summary\s*\{[^}]*position:\s*sticky/s);
  assert.match(css, /\.b25-customer-shell \.cart-checkout\s*\{[^}]*background:\s*var\(--b25-accent\)/s);
  assert.match(css, /\.b25-customer-shell \.cart-item__remove\s*\{[^}]*font-size:\s*11px/s);
  assert.match(css, /\.cart-summary__payments-label/);
  assert.match(css, /\.cart-discount/);
  assert.match(css, /\.payment-method-tile/);
  assert.doesNotMatch(css, /cart-pay-logo|translateX\(|translateY\(0\.5px\)/);
  assert.doesNotMatch(css, /transition:\s*all|backdrop-filter|position:\s*fixed/);
  assert.match(tokens, /\.cart-item,/);
  assert.match(tokens, /\.cart-heading h1,/);
});

test("Customer Cart payment marks use one official Shopify badge set", async () => {
  const [config, component] = await Promise.all([
    readFile(new URL("./payment-methods.js", import.meta.url), "utf8"),
    readFile(new URL("./PaymentMethodTile.jsx", import.meta.url), "utf8"),
  ]);

  for (const method of ["visa", "mastercard", "paypal", "apple-pay", "google-pay"]) {
    assert.match(config, new RegExp(`id: "${method}"`));
  }

  assert.match(config, /assets\/payments\/visa\.svg/);
  assert.match(config, /assets\/payments\/master\.svg/);
  assert.match(config, /assets\/payments\/paypal\.svg/);
  assert.match(config, /assets\/payments\/apple_pay\.svg/);
  assert.match(config, /assets\/payments\/google_pay\.svg/);
  assert.match(config, /activemerchant\/payment_icons/);
  assert.match(component, /PAYMENT_METHODS\.map/);
  assert.match(component, /function PaymentMethodTile/);
  assert.match(component, /export function PaymentMethodStrip/);
  assert.doesNotMatch(component, /<svg|path fill/);
});
