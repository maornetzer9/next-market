import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { resolveLoginRedirect } from "./auth/authRedirect.js";

test("auth redirect preserves admin and protected return paths", () => {
  assert.equal(resolveLoginRedirect("Admin", null), "/admin");
  assert.equal(resolveLoginRedirect("User", { pathname: "/customer/cart" }), "/customer/cart");
  assert.equal(resolveLoginRedirect("User", { pathname: "/login" }), "/");
  assert.equal(
    resolveLoginRedirect("User", { pathname: "/customer/products", search: "?category=beauty" }),
    "/customer/products?category=beauty"
  );
});

test("auth modal uses one shared form implementation", async () => {
  const [login, register, signIn, registerForm, modal] = await Promise.all([
    readFile(new URL("./components/Login.jsx", import.meta.url), "utf8"),
    readFile(new URL("./components/Register.jsx", import.meta.url), "utf8"),
    readFile(new URL("./auth/SignInForm.jsx", import.meta.url), "utf8"),
    readFile(new URL("./auth/RegisterForm.jsx", import.meta.url), "utf8"),
    readFile(new URL("./auth/AuthModal.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(login, /AuthRouteAdapter mode="sign-in"/);
  assert.match(register, /AuthRouteAdapter mode="register"/);
  assert.match(signIn, /loginAction/);
  assert.match(registerForm, /registerAction/);
  assert.doesNotMatch(modal, /loginAction|registerAction/);
  assert.match(modal, /SignInForm/);
  assert.match(modal, /RegisterForm/);
  assert.match(modal, /AuthBrandLockup/);
  assert.doesNotMatch(modal, /auth-modal__highlight/);
});

test("storefront opens auth modal instead of standalone auth navigation", async () => {
  const [customer, navbar, homepage, products, footer, context] = await Promise.all([
    readFile(new URL("./components/Customer.jsx", import.meta.url), "utf8"),
    readFile(new URL("./components/Navbar-Model/NavbarModel.jsx", import.meta.url), "utf8"),
    readFile(new URL("./components/Customer/Homepage.jsx", import.meta.url), "utf8"),
    readFile(new URL("./components/Customer/Products.jsx", import.meta.url), "utf8"),
    readFile(new URL("./components/Customer/StorefrontFooter.jsx", import.meta.url), "utf8"),
    readFile(new URL("./auth/AuthModalContext.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(customer, /AuthModalProvider/);
  assert.match(context, /authModal/);
  assert.match(navbar, /onOpenSignIn/);
  assert.match(navbar, /onOpenRegister/);
  assert.doesNotMatch(navbar, /to="\/login"/);
  assert.match(homepage, /openAuthModal\("sign-in"/);
  assert.match(products, /openAuthModal\("sign-in"/);
  assert.match(footer, /onOpenSignIn/);
  assert.doesNotMatch(homepage, /navigate\("\/login"/);
});

test("auth modal exposes accessible dialog semantics", async () => {
  const modal = await readFile(new URL("./auth/AuthModal.jsx", import.meta.url), "utf8");

  assert.match(modal, /role="dialog"/);
  assert.match(modal, /aria-modal="true"/);
  assert.match(modal, /Escape/);
  assert.match(modal, /lockBodyScroll/);
});

test("register form collects only account creation fields", async () => {
  const registerForm = await readFile(new URL("./auth/RegisterForm.jsx", import.meta.url), "utf8");

  for (const field of ["firstName", "lastName", "username", "password"]) {
    assert.match(registerForm, new RegExp(`name="${field}"`));
  }

  assert.doesNotMatch(registerForm, /Allow others to see my orders/);
  assert.doesNotMatch(registerForm, /name="checked"/);
  assert.doesNotMatch(registerForm, /checked:\s*false/);
});

test("register request does not send order sharing preference", async () => {
  const registerForm = await readFile(new URL("./auth/RegisterForm.jsx", import.meta.url), "utf8");

  assert.match(
    registerForm,
    /registerAction\(\{\s*firstName,\s*lastName,\s*username,\s*password\s*\}/
  );
  assert.doesNotMatch(registerForm, /registerAction\(form/);
});

test("auth modal dark mode uses B2.9 token overrides on modal root", async () => {
  const css = await readFile(new URL("./css/auth-modal.css", import.meta.url), "utf8");

  assert.match(css, /html\[data-b25-theme="dark"\] \.auth-modal-root/);
  assert.match(css, /--b25-text:\s*#f7f5f0/);
  assert.match(css, /--b25-text-secondary:\s*#c4c8c9/);
  assert.match(css, /\.auth-modal__header h2[\s\S]*color:\s*var\(--b25-text\)/);
  assert.match(css, /html\[data-b25-theme="dark"\] \.auth-modal__close/);
  assert.match(css, /html\[data-b25-theme="dark"\] \.auth-form__control:focus-within/);
  assert.match(css, /html\[data-b25-theme="dark"\] \.auth-form__switch/);
});

test("auth modal uses clean graphite material and branded N/M signature", async () => {
  const [css, brandCss, modal, lockup, brandMark, nav] = await Promise.all([
    readFile(new URL("./css/auth-modal.css", import.meta.url), "utf8"),
    readFile(new URL("./css/brand-mark.css", import.meta.url), "utf8"),
    readFile(new URL("./auth/AuthModal.jsx", import.meta.url), "utf8"),
    readFile(new URL("./auth/AuthBrandLockup.jsx", import.meta.url), "utf8"),
    readFile(new URL("./auth/AuthBrandMark.jsx", import.meta.url), "utf8"),
    readFile(new URL("./components/Customer/NeuralWaveNav.jsx", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(css, /\.auth-modal__highlight/);
  assert.match(css, /\.auth-modal::before/);
  assert.match(css, /html\[data-b25-theme="dark"\] \.auth-modal[\s\S]*background:\s*#272e33/);
  assert.match(css, /\.auth-modal__brand-row/);
  assert.match(brandCss, /\.auth-brand-mark/);
  assert.match(brandCss, /--auth-mark-size:\s*38px/);
  assert.match(brandCss, /\.auth-brand-mark--rail/);
  assert.match(brandCss, /\.auth-brand-mark--footer/);
  assert.match(brandCss, /\.auth-brand-mark\.is-paused/);
  assert.match(brandCss, /@keyframes auth-brand-strand-a/);
  assert.match(brandCss, /@keyframes auth-brand-flow-a/);
  assert.match(brandCss, /prefers-reduced-motion[\s\S]*auth-brand-mark__strand/);
  assert.match(modal, /AuthBrandLockup/);
  assert.match(lockup, /auth-modal__brand-row/);
  assert.match(lockup, /AuthBrandMark/);
  assert.match(brandMark, /brand-mark\.css/);
  assert.match(brandMark, /pauseOffscreen/);
  assert.match(nav, /AuthBrandMark/);
  assert.match(nav, /auth-brand-mark--rail/);
  assert.match(modal, /scale: 0\.985/);
});

test("account update still owns order sharing preference", async () => {
  const [account, service] = await Promise.all([
    readFile(new URL("./components/Customer/Account.jsx", import.meta.url), "utf8"),
    readFile(new URL("../../server/services/user.js", import.meta.url), "utf8"),
  ]);

  assert.match(account, /Order sharing/);
  assert.match(account, /name="checked"/);
  assert.match(service, /let updateFields = \{[\s\S]*firstName:[\s\S]*lastName:[\s\S]*username:[\s\S]*checked: Boolean\(checked\)/);
  assert.match(service, /\{ _id: req\.auth\.userId \}/);
});
