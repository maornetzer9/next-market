import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cssUrl = new URL("./page-heading.css", import.meta.url);
const pageHeaderUrl = new URL("../components/Customer/PageHeader.jsx", import.meta.url);
const brandUrl = new URL("../components/Shell/PageBrandSignature.jsx", import.meta.url);

test("PageHeader title-row uses pure flex center alignment", async () => {
  const [css, pageHeader, brand] = await Promise.all([
    readFile(cssUrl, "utf8"),
    readFile(pageHeaderUrl, "utf8"),
    readFile(brandUrl, "utf8"),
  ]);

  assert.match(pageHeader, /PageBrandSignature eyebrow=\{eyebrow\}/);
  assert.match(brand, /AuthBrandMark/);
  assert.match(brand, /auth-brand-mark--page-heading/);
  assert.match(brand, /b25-page-heading__brand/);
  assert.match(brand, /b25-page-heading__mark/);
  assert.match(brand, /b25-page-heading__eyebrow b25-brand-wordmark/);
  assert.match(brand, /<BrandWordmark \/>/);
  assert.match(pageHeader, /b25-page-heading__title-row/);
  assert.match(pageHeader, /b25-page-heading__icon-box/);
  assert.match(pageHeader, /b25-page-heading__icon/);
  assert.match(brand, /animateEnter=\{false\}/);

  assert.match(css, /--b25-page-heading-icon-size:/);
  assert.match(
    css,
    /\.b25-page-heading__brand\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*center/s,
  );
  assert.match(
    css,
    /\.b25-page-heading__title-row\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*center/s,
  );
  assert.match(
    css,
    /\.b25-page-heading__icon-box\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*center;[^}]*justify-content:\s*center/s,
  );
  assert.match(
    css,
    /\.b25-page-heading__icon,\s*\.b25-page-heading__icon-box svg\s*\{[^}]*display:\s*block/s,
  );
  assert.match(css, /\.b25-page-heading h1\s*\{[^}]*line-height:\s*1/s);

  // No baseline / optical / offset patches on the title-icon system.
  assert.doesNotMatch(css, /--b25-page-heading-cap-ratio/);
  assert.doesNotMatch(css, /--b25-page-heading-icon-optical-y/);
  assert.doesNotMatch(css, /align-items:\s*baseline/);
  assert.doesNotMatch(css, /align-items:\s*flex-start/);
  assert.doesNotMatch(
    css,
    /\.b25-page-heading__icon-box\s*\{[^}]*margin-top/s,
  );
  assert.doesNotMatch(
    css,
    /\.b25-page-heading__icon-box\s*\{[^}]*translateY/s,
  );
  assert.doesNotMatch(
    css,
    /\.b25-page-heading__icon-box\s*\{[^}]*\btop:/s,
  );
});
