const assert = require('node:assert/strict');
const test = require('node:test');
const {
    PROTECTED_PRESERVE_IDS,
    fetchAllCanonicalProducts,
    planReconciliation,
    summarizeProducts,
    validateCanonicalProducts
} = require('./reconcile-products');

const canonicalProduct = (id, overrides = {}) => ({
    id,
    title: id === 20 ? 'Cooking Oil' : `Product ${id}`,
    description: `Description ${id}`,
    category: id <= 5 ? 'beauty'
        : id <= 10 ? 'fragrances'
            : id <= 15 ? 'furniture'
                : id <= 30 ? 'groceries'
                    : 'home-decoration',
    price: id === 20 ? 4.99 : id + 0.99,
    rating: 4,
    stock: id === 20 ? 10 : id,
    thumbnail: `https://example.test/${id}.webp`,
    ...overrides
});

const makeCanonical = (count) => Array.from({ length: count }, (_, index) => canonicalProduct(index + 1));

const validExisting = makeCanonical(15).map((product) => ({ ...product, _id: `mongo-${product.id}` }));
const placeholder16 = {
    _id: 'mongo-16',
    id: 16,
    title: '',
    description: 'Add Description',
    category: 'groceries',
    price: 0,
    rating: 0,
    stock: 0,
    thumbnail: 'Add Link To Product Image'
};

test('V51 canonical validation accepts any unique complete product set', () => {
    const full = makeCanonical(45);
    assert.deepEqual(validateCanonicalProducts(full).map(({ id }) => id), full.map(({ id }) => id));
    assert.throws(() => validateCanonicalProducts([]), /empty/);
    assert.throws(() => validateCanonicalProducts([...full, full[0]]), /Duplicate canonical IDs/);
});

test('V52 plan repairs placeholder ID 16 and inserts every missing canonical ID', () => {
    const canonical = makeCanonical(40);
    const plan = planReconciliation([...validExisting, placeholder16], canonical);

    assert.equal(plan.update16.id, 16);
    assert.deepEqual(plan.inserts.map(({ id }) => id), Array.from({ length: 24 }, (_, i) => i + 17));
    assert.deepEqual(plan.preservedIds, PROTECTED_PRESERVE_IDS);
});

test('V52 reconciliation plan is idempotent after the full catalog exists', () => {
    const canonical = makeCanonical(40);
    const reconciled = canonical.map((product) => ({ ...product, _id: `mongo-${product.id}` }));
    const plan = planReconciliation(reconciled, canonical);

    assert.equal(plan.update16, null);
    assert.deepEqual(plan.inserts, []);
});

test('V52 plan inserts newly published canonical IDs without rewriting valid existing rows', () => {
    const previous = makeCanonical(30).map((product) => ({ ...product, _id: `mongo-${product.id}` }));
    const expanded = makeCanonical(35);
    const plan = planReconciliation(previous, expanded);

    assert.equal(plan.update16, null);
    assert.deepEqual(plan.inserts.map(({ id }) => id), [31, 32, 33, 34, 35]);
});

test('V52 plan preserves Admin-created extras and rejects unrecoverable invalid rows', () => {
    const canonical = makeCanonical(30);
    const withExtra = [
        ...canonical.map((product) => ({ ...product, _id: `mongo-${product.id}` })),
        { ...canonicalProduct(900, { title: 'Admin Custom', category: 'beauty' }), _id: 'mongo-900' }
    ];
    const plan = planReconciliation(withExtra, canonical);
    assert.deepEqual(plan.preservedExtraIds, [900]);
    assert.deepEqual(plan.inserts, []);

    assert.throws(
        () => planReconciliation([...validExisting, { ...placeholder16, title: 'Admin Product' }], canonical),
        /no longer matches placeholder or canonical/
    );
});

test('V53 summary reports validity, categories, missing IDs, and duplicates', () => {
    const canonical = makeCanonical(30);
    const summary = summarizeProducts(canonical, canonical);

    assert.deepEqual(summary, {
        total: 30,
        valid: 30,
        invalid: 0,
        canonicalMissing: [],
        duplicateIds: [],
        categories: { beauty: 5, fragrances: 5, furniture: 5, groceries: 15 }
    });
});

test('V53 restored set includes available Cooking Oil and no zero-price or duplicate records', () => {
    const restored = validateCanonicalProducts(makeCanonical(30));
    const cookingOil = restored.find(({ title }) => title === 'Cooking Oil');

    assert.deepEqual(
        { id: cookingOil.id, category: cookingOil.category, price: cookingOil.price, stock: cookingOil.stock },
        { id: 20, category: 'groceries', price: 4.99, stock: 10 }
    );
    assert.ok(restored.every(({ price }) => price > 0));
    assert.equal(new Set(restored.map(({ id }) => id)).size, restored.length);
});

test('fetchAllCanonicalProducts paginates until total and dedupes repeated ids', async () => {
    const pagesBySkip = {
        0: {
            products: [canonicalProduct(1), canonicalProduct(2)],
            total: 5,
            skip: 0,
            limit: 2
        },
        2: {
            products: [canonicalProduct(2), canonicalProduct(3)],
            total: 5,
            skip: 2,
            limit: 2
        },
        4: {
            products: [canonicalProduct(4), canonicalProduct(5)],
            total: 5,
            skip: 4,
            limit: 2
        }
    };
    let calls = 0;
    const http = {
        get: async (_url, config) => {
            const skip = config.params.skip;
            calls += 1;
            assert.ok(pagesBySkip[skip], `unexpected skip ${skip}`);
            return { data: pagesBySkip[skip] };
        }
    };

    const products = await fetchAllCanonicalProducts(http, { pageLimit: 2 });
    assert.equal(products.length, 5);
    assert.deepEqual(products.map(({ id }) => id), [1, 2, 3, 4, 5]);
    assert.equal(calls, 3);
});

test('fetchAllCanonicalProducts fails cleanly when a page request errors', async () => {
    const http = {
        get: async () => {
            throw new Error('upstream timeout');
        }
    };

    await assert.rejects(
        () => fetchAllCanonicalProducts(http, { pageLimit: 50 }),
        /Canonical page fetch failed/
    );
});

test('fetchAllCanonicalProducts rejects an incomplete empty page before total', async () => {
    let calls = 0;
    const http = {
        get: async () => {
            calls += 1;
            if (calls === 1) {
                return {
                    data: {
                        products: [canonicalProduct(1), canonicalProduct(2)],
                        total: 4,
                        skip: 0,
                        limit: 2
                    }
                };
            }
            return { data: { products: [], total: 4, skip: 2, limit: 2 } };
        }
    };

    await assert.rejects(
        () => fetchAllCanonicalProducts(http, { pageLimit: 2 }),
        /empty page before completion/
    );
});
