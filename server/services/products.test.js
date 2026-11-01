const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const test = require('node:test');
const axios = require('axios');
const Products = require('../models/products');
const productService = require('./products');

test('V44 GET product service returns an empty DB without canonical network seeding', async () => {
    const originalFind = Products.find;
    const originalGet = axios.get;
    let canonicalCalls = 0;

    Products.find = () => ({ select: async () => [] });
    axios.get = async () => {
        canonicalCalls += 1;
        throw new Error('canonical fetch must not run');
    };

    try {
        const response = await productService.loadProducts();
        assert.equal(response.code, 200);
        assert.deepEqual(response.products, []);
        assert.equal(canonicalCalls, 0);
    } finally {
        Products.find = originalFind;
        axios.get = originalGet;
    }
});

test('V44 GET product service returns partial DB state unchanged', async () => {
    const originalFind = Products.find;
    const partial = [{ id: 1, title: 'Existing Admin Product' }];

    Products.find = () => ({ select: async () => partial });

    try {
        const response = await productService.loadProducts();
        assert.equal(response.code, 200);
        assert.strictEqual(response.products, partial);
    } finally {
        Products.find = originalFind;
    }
});

test('V93 public product load excludes private purchase metadata', async () => {
    const originalFind = Products.find;
    let selection = '';
    Products.find = () => ({
        select: async (fields) => {
            selection = fields;
            return [];
        },
    });

    try {
        await productService.loadProducts();
        assert.doesNotMatch(selection, /purchases|bought|total/);
    } finally {
        Products.find = originalFind;
    }
});

test('V48 category normalization is trim plus lowercase', () => {
    assert.equal(productService.normalizeCategory('  Groceries  '), 'groceries');
    assert.equal(productService.normalizeCategory('BEAUTY'), 'beauty');
    assert.equal(productService.normalizeCategory(''), '');
    assert.equal(productService.normalizeCategory(null), '');
});

test('V49 standalone category endpoint cannot construct a category-only Product', async () => {
    const originalFindOne = Products.findOne;
    Products.findOne = async () => ({ id: 16, category: 'groceries' });

    try {
        const response = await productService.createCategories({ body: { category: 'groceries' } });
        assert.equal(response.code, 409);
    } finally {
        Products.findOne = originalFindOne;
    }

    const source = await readFile(path.join(__dirname, 'products.js'), 'utf8');
    assert.doesNotMatch(source, /new Products\(\{\s*category\s*\}\)/);
});
