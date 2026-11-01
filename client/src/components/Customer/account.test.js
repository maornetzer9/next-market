import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const accountUrl = new URL("./Account.jsx", import.meta.url);
const cssUrl = new URL("../../css/account.css", import.meta.url);
const actionsUrl = new URL("../../actions/userActions.js", import.meta.url);
const routesUrl = new URL("../../routes/users.js", import.meta.url);
const serviceUrl = new URL("../../../../server/services/user.js", import.meta.url);
const tokensUrl = new URL("../../css/b25-tokens.css", import.meta.url);

test("Customer Account keeps the existing update contract and real user fields", async () => {
  const [source, actions, routes, service] = await Promise.all([
    readFile(accountUrl, "utf8"),
    readFile(actionsUrl, "utf8"),
    readFile(routesUrl, "utf8"),
    readFile(serviceUrl, "utf8"),
  ]);

  assert.match(source, /customerUpdateAction\(form,\s*`\$\{ORIGIN\}\/user\/update`\)/);
  assert.match(source, /state\.userReducer\.user/);
  assert.match(actions, /handleCustomerUpdate\(\s*form,\s*url\s*\)/);
  assert.match(routes, /axios\.put\(url,\s*\{\s*form\s*\},\s*withAuth\(\)\)/);
  assert.match(service, /const form = req\.body\?\.form/);
  assert.match(service, /if \(password !== undefined && password !== ''\)/);
  assert.match(service, /\{ _id: req\.auth\.userId \}/);
  assert.doesNotMatch(service, /form\._id|form\.id/);

  for (const field of ["firstName", "lastName", "username", "password", "checked"]) {
    assert.match(source, new RegExp(`name="${field}"`), `missing form field: ${field}`);
  }

  assert.doesNotMatch(source, /FormModel|@mui\/material|avatar|address|payment|notification/i);
});

test("Blank password is optional replacement and the current password is never shown", async () => {
  const [source, service] = await Promise.all([
    readFile(accountUrl, "utf8"),
    readFile(serviceUrl, "utf8"),
  ]);

  assert.match(source, /password:\s*""/);
  assert.match(source, /autoComplete="new-password"/);
  assert.match(source, /Leave blank to keep your current password/);
  assert.doesNotMatch(source, /user\?\.password|user\.password/);
  assert.match(service, /let updateFields = \{[\s\S]*firstName:[\s\S]*lastName:[\s\S]*username:[\s\S]*checked: Boolean\(checked\)/);
  assert.match(service, /updateFields\.password = password/);
});

test("Order sharing remains the existing checked opt-in, not a per-user ACL", async () => {
  const [source, ordersService] = await Promise.all([
    readFile(accountUrl, "utf8"),
    readFile(new URL("../../../../server/services/orders.js", import.meta.url), "utf8"),
  ]);

  assert.match(source, /checked:\s*Boolean\(user\?\.checked\)/);
  assert.match(source, /role="switch"/);
  assert.match(source, /name="checked"/);
  assert.match(source, /Allow other signed-in customers to view your historical order records/);
  assert.match(ordersService, /User\.find\(\{\s*checked:\s*true,\s*_id:\s*\{\s*\$ne:\s*userId\s*\}/);
  assert.doesNotMatch(source, /authorized users|invite|permission list|authorization-user/i);
});

test("Order sharing toggle uses a compact professional switch size", async () => {
  const css = await readFile(cssUrl, "utf8");

  assert.match(css, /\.account-sharing-control\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) 38px/s);
  assert.match(css, /\.account-sharing-control__track\s*\{[^}]*width:\s*38px[^}]*height:\s*22px/s);
  assert.match(css, /\.account-sharing-control__track > span\s*\{[^}]*width:\s*16px[^}]*height:\s*16px/s);
  assert.match(css, /input:checked \+ \.account-sharing-control__track > span\s*\{[^}]*translateX\(16px\)/s);
  assert.doesNotMatch(css, /\.account-sharing-control__track\s*\{[^}]*width:\s*48px/s);
});

test("View and edit stay on the same Account screen without a page loader", async () => {
  const source = await readFile(accountUrl, "utf8");

  assert.match(source, /const \[edit, setEdit\] = useState\(false\)/);
  assert.match(source, /Edit account/);
  assert.match(source, /Save changes/);
  assert.match(source, /Cancel/);
  assert.match(source, /setSubmitting\(true\)/);
  assert.doesNotMatch(source, /GlobalLoader|LoadingCoordinator|headContentAnimation/);
  assert.match(source, /ReadyPageContent ready=\{profileReady\}/);
  assert.match(source, /if \(!profileReady\)/);
});

test("Account presentation uses solid B2.9 content surfaces and native controls", async () => {
  const css = await readFile(cssUrl, "utf8");
  const tokens = await readFile(tokensUrl, "utf8");

  assert.match(css, /\.account-page\s*\{[^}]*width:\s*min\(100%, var\(--b25-content-max\)\)/s);
  assert.match(css, /\.account-identity,\s*\.account-surface\s*\{[^}]*background:\s*var\(--b25-surface\)[^}]*box-shadow:\s*var\(--b29-depth-1\)/s);
  assert.match(css, /\.account-supporting\s*\{[^}]*grid-template-columns:\s*1fr 1fr/s);
  assert.match(css, /@media \(max-width:\s*1024px\)\s*\{[^}]*\.account-supporting\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s);
  assert.match(css, /\.account-action--primary\s*\{[^}]*background:\s*var\(--b25-accent\)/s);
  assert.match(css, /\.account-edit-action\.is-active\s*\{/s);
  assert.match(css, /\.account-edit-action\s*\{[^}]*width:\s*9\.25rem[^}]*font-size:\s*11px[^}]*font-weight:\s*500/s);
  assert.match(css, /\.b25-customer-shell \.account-edit-action\s*\{[^}]*font-size:\s*11px[^}]*font-weight:\s*500/s);
  assert.match(css, /@media \(max-width:\s*820px\)/);
  assert.match(css, /@media \(max-width:\s*390px\)|@media \(max-width:\s*360px\)/);
  assert.doesNotMatch(css, /transition:\s*all|MuiTextField|outlined|backdrop-filter/);
  assert.match(tokens, /\.account-identity,/);
  assert.match(tokens, /\.account-heading h1,/);
});

test("Account keeps PROFILE full-width above equal ACCESS and SECURITY columns", async () => {
  const source = await readFile(accountUrl, "utf8");

  assert.match(source, /className="account-surface account-profile"/);
  assert.match(source, /className="account-supporting"/);
  assert.match(source, /className="account-surface account-access"/);
  assert.match(source, /className="account-surface account-security"/);
  assert.match(source, /aria-pressed=\{edit\}/);
  assert.match(source, /useReducedMotion/);
  assert.match(source, /\{\.\.\.\(!edit \? \{ inert: "" \} : \{\}\)\}/);
});

test("Account details share an icon-label-value item for desktop columns and mobile rows", async () => {
  const [source, css] = await Promise.all([
    readFile(accountUrl, "utf8"),
    readFile(cssUrl, "utf8"),
  ]);

  assert.match(source, /function AccountField\(/);
  assert.match(source, /className="account-field__icon"/);
  assert.match(source, /icon=\{MdPersonOutline\}/);
  assert.match(source, /icon=\{MdOutlineBadge\}/);
  assert.match(source, /icon=\{MdAlternateEmail\}/);
  assert.match(css, /\.account-fields\s*\{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/s);
  assert.match(css, /\.account-field\s*\{[^}]*display:\s*flex[^}]*gap:\s*10px/s);
  assert.match(css, /\.account-field__icon\s*\{[^}]*width:\s*34px[^}]*height:\s*34px/s);
  assert.match(css, /@media \(max-width:\s*820px\)[\s\S]*?\.account-fields\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(css, /@media \(max-width:\s*820px\)[\s\S]*?\.account-field\s*\{[^}]*min-height:\s*60px/);
});

test("Security password copy stays top-aligned without stretched min-height", async () => {
  const css = await readFile(cssUrl, "utf8");

  assert.match(css, /\.account-access \.account-section-heading,\s*\.account-security \.account-section-heading\s*\{[^}]*margin-bottom:\s*8px/s);
  assert.match(css, /\.account-password-panel\s*\{[^}]*display:\s*block/s);
  assert.match(css, /\.account-password-panel \.account-section-copy\s*\{[^}]*margin:\s*0/s);
  assert.match(css, /\.account-panel-body\s*\{[^}]*justify-content:\s*flex-start/s);
  assert.doesNotMatch(css, /\.account-password-panel \.account-section-copy\s*\{[^}]*min-height:\s*104px/s);
  assert.doesNotMatch(css, /\.account-panel-body\s*\{[^}]*min-height:\s*104px/s);
  assert.doesNotMatch(css, /\.account-security[^{]*\{[^}]*margin-top:\s*-/s);
  assert.doesNotMatch(css, /\.account-password-panel[^{]*\{[^}]*justify-content:\s*space-between/s);
});
