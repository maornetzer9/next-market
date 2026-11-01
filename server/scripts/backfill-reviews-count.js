/**
 * One-shot: stamp real DummyJSON review counts onto existing Mongo products.
 * Does not invent counts — uses reviews.length from the canonical catalog.
 */
const axios = require('axios');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('node:path');
const Products = require('../models/products');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const CANONICAL_BASE_URL = 'https://dummyjson.com/products';
const PAGE_LIMIT = 50;

const fetchAll = async () => {
  const products = [];
  let skip = 0;
  let total = Infinity;

  while (skip < total) {
    const { data } = await axios.get(CANONICAL_BASE_URL, {
      params: { limit: PAGE_LIMIT, skip },
      timeout: 20000,
    });
    const page = Array.isArray(data?.products) ? data.products : [];
    total = Number(data?.total) || products.length + page.length;
    products.push(...page);
    if (!page.length) break;
    skip += page.length;
  }

  return products;
};

const run = async () => {
  if (!process.env.MONGOOSE_URI) throw new Error('MONGOOSE_URI is required');

  const canonical = await fetchAll();
  const counts = new Map(
    canonical.map((product) => [
      Number(product.id),
      Array.isArray(product.reviews) ? product.reviews.length : 0,
    ])
  );

  await mongoose.connect(process.env.MONGOOSE_URI);
  try {
    let updated = 0;
    for (const [id, reviewsCount] of counts) {
      const result = await Products.updateOne({ id }, { $set: { reviewsCount } });
      if (result.matchedCount) updated += 1;
    }
    console.log(JSON.stringify({ canonical: canonical.length, updated }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
