import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const admin = new URL("./", import.meta.url);
const read = (name) => readFile(new URL(name, admin), "utf8");

test("all five Admin pages receive the Customer brand signature from one header", async () => {
  const [header, dashboard, categories, customers, products, statistics] = await Promise.all([
    read("AdminPageHeader.jsx"),
    read("AdminDashboard.jsx"),
    read("Categories.jsx"),
    read("Customers.jsx"),
    read("Products.jsx"),
    read("Statistics.jsx"),
  ]);

  assert.match(header, /import PageBrandSignature from '\.\.\/Shell\/PageBrandSignature'/);
  assert.match(header, /<PageBrandSignature \/>/);
  assert.match(header, /<h1 className="admin-page__title">\{title\}<\/h1>/);
  assert.match(header, /page-heading\.css/);
  for (const page of [dashboard, categories, customers, products, statistics]) {
    assert.match(page, /<AdminPageHeader\b/);
    assert.doesNotMatch(page, /AuthBrandMark|PageBrandSignature/);
  }
  assert.doesNotMatch(dashboard, /eyebrow="Dashboard"/);
});
