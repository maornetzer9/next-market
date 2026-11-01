const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('node:fs/promises');
const mongoose = require('mongoose');
const path = require('node:path');
const Products = require('../models/products');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const CANONICAL_BASE_URL = 'https://dummyjson.com/products';
/** Page size for DummyJSON limit/skip pagination (not a catalog ceiling). */
const CANONICAL_PAGE_LIMIT = 50;
/** Existing Admin/Customer records that must remain valid and never be overwritten. */
const PROTECTED_PRESERVE_IDS = Array.from({ length: 15 }, (_, index) => index + 1);

const CANONICAL_FIELDS = [
    'id',
    'title',
    'description',
    'category',
    'price',
    'rating',
    'reviewsCount',
    'stock',
    'thumbnail'
];

const isFiniteNumber = (value) => Number.isFinite(Number(value));

const normalizeCanonicalProduct = (product) => {
    const reviewsCount = Array.isArray(product.reviews)
        ? product.reviews.length
        : Number(product.reviewsCount ?? product.reviewCount ?? 0);

    const normalized = {
        id: Number(product.id),
        title: typeof product.title === 'string' ? product.title.trim() : '',
        description: typeof product.description === 'string' ? product.description.trim() : '',
        category: typeof product.category === 'string' ? product.category.trim().toLowerCase() : '',
        price: Number(product.price),
        rating: Number(product.rating),
        reviewsCount: Number.isFinite(reviewsCount) && reviewsCount >= 0 ? reviewsCount : 0,
        stock: Number(product.stock),
        thumbnail: typeof product.thumbnail === 'string' ? product.thumbnail.trim() : ''
    };

    const valid = Number.isInteger(normalized.id)
        && normalized.id > 0
        && normalized.title
        && normalized.description
        && normalized.category
        && isFiniteNumber(normalized.price)
        && normalized.price > 0
        && isFiniteNumber(normalized.rating)
        && isFiniteNumber(normalized.reviewsCount)
        && normalized.reviewsCount >= 0
        && isFiniteNumber(normalized.stock)
        && normalized.stock >= 0
        && normalized.thumbnail;

    if (!valid) throw new Error(`Invalid canonical Product ID ${product?.id ?? 'unknown'}`);
    return normalized;
};

const duplicateIds = (products) => {
    const seen = new Set();
    const duplicates = new Set();

    for (const product of products) {
        const id = Number(product.id);
        if (seen.has(id)) duplicates.add(id);
        seen.add(id);
    }

    return [...duplicates].sort((a, b) => a - b);
};

/**
 * Normalize + validate a complete canonical catalog.
 * Does not assume a fixed size — only uniqueness and field validity.
 */
const validateCanonicalProducts = (products) => {
    if (!Array.isArray(products)) throw new Error('Canonical products payload is not an array');
    if (!products.length) throw new Error('Canonical products payload is empty');

    const normalized = products.map(normalizeCanonicalProduct);
    const duplicates = duplicateIds(normalized);
    if (duplicates.length) throw new Error(`Duplicate canonical IDs: ${duplicates.join(', ')}`);

    return normalized.sort((a, b) => a.id - b.id);
};

/**
 * Fetch every DummyJSON product via limit/skip until fetched >= total.
 * Fails hard on incomplete pages or mid-run total changes — never treats a
 * partial fetch as a complete catalog.
 */
const fetchAllCanonicalProducts = async (http = axios, options = {}) => {
    const pageLimit = Number(options.pageLimit) > 0 ? Number(options.pageLimit) : CANONICAL_PAGE_LIMIT;
    const timeout = Number(options.timeout) > 0 ? Number(options.timeout) : 30000;

    const collected = [];
    const seen = new Set();
    let skip = 0;
    let total = null;

    while (total === null || collected.length < total) {
        let data;
        try {
            const response = await http.get(CANONICAL_BASE_URL, {
                params: { limit: pageLimit, skip },
                timeout
            });
            data = response.data;
        } catch (error) {
            const detail = error?.message || 'unknown error';
            throw new Error(
                `Canonical page fetch failed at skip=${skip} (have ${collected.length}`
                + `${total === null ? '' : ` of ${total}`}): ${detail}`
            );
        }

        if (!data || !Array.isArray(data.products)) {
            throw new Error(`Canonical page at skip=${skip} missing products array`);
        }

        const pageTotal = Number(data.total);
        if (!Number.isFinite(pageTotal) || pageTotal < 0 || !Number.isInteger(pageTotal)) {
            throw new Error(`Canonical page at skip=${skip} missing valid total`);
        }

        if (total === null) {
            total = pageTotal;
            if (total === 0) throw new Error('Canonical catalog total is 0');
        } else if (pageTotal !== total) {
            throw new Error(`Canonical total changed mid-fetch: ${total} → ${pageTotal}`);
        }

        if (data.products.length === 0) {
            throw new Error(
                `Canonical pagination returned an empty page before completion `
                + `(fetched ${collected.length} of ${total} at skip=${skip})`
            );
        }

        for (const product of data.products) {
            const id = Number(product?.id);
            if (!Number.isInteger(id) || id <= 0) {
                throw new Error(`Canonical page at skip=${skip} contained an invalid product id`);
            }
            if (seen.has(id)) continue;
            seen.add(id);
            collected.push(product);
        }

        skip += data.products.length;

        if (skip > total + pageLimit) {
            throw new Error(`Canonical pagination overrun at skip=${skip} (total=${total})`);
        }
    }

    if (collected.length !== total) {
        throw new Error(`Incomplete canonical catalog: fetched ${collected.length}, expected ${total}`);
    }

    return validateCanonicalProducts(collected);
};

const isValidStoredProduct = (product) => {
    try {
        normalizeCanonicalProduct(product);
        return true;
    } catch {
        return false;
    }
};

const isInvalidId16Placeholder = (product) => Boolean(product)
    && Number(product.id) === 16
    && !String(product.title || '').trim()
    && String(product.category || '').trim().toLowerCase() === 'groceries'
    && Number(product.price) === 0
    && Number(product.stock) === 0
    && String(product.thumbnail || '').trim() === 'Add Link To Product Image';

const canonicalFieldsMatch = (stored, canonical) => CANONICAL_FIELDS.every((field) => {
    if (['id', 'price', 'rating', 'reviewsCount', 'stock'].includes(field)) {
        return Number(stored[field]) === Number(canonical[field]);
    }
    return String(stored[field] ?? '') === String(canonical[field] ?? '');
});

/**
 * Plan inserts for every canonical product missing from MongoDB.
 * Preserves valid existing rows (including Admin-created extras).
 * Only mutates ID 16 when it still matches the reviewed invalid placeholder.
 */
const planReconciliation = (existingProducts, canonicalProducts) => {
    const canonical = validateCanonicalProducts(canonicalProducts);
    const canonicalIds = new Set(canonical.map(({ id }) => id));
    const existingDuplicates = duplicateIds(existingProducts);
    if (existingDuplicates.length) throw new Error(`Duplicate database IDs: ${existingDuplicates.join(', ')}`);

    const existingById = new Map(existingProducts.map((product) => [Number(product.id), product]));

    for (const id of PROTECTED_PRESERVE_IDS) {
        if (!existingById.has(id)) throw new Error(`Protected Product ID ${id} is missing`);
        if (!isValidStoredProduct(existingById.get(id))) throw new Error(`Protected Product ID ${id} is invalid`);
    }

    const canonical16 = canonical.find(({ id }) => id === 16);
    const stored16 = existingById.get(16);
    let update16 = null;

    if (canonical16) {
        if (!stored16) {
            // ID 16 absent entirely — insert with the rest of the missing set.
        } else if (canonicalFieldsMatch(stored16, canonical16)) {
            update16 = null;
        } else if (isInvalidId16Placeholder(stored16)) {
            update16 = canonical16;
        } else if (!isValidStoredProduct(stored16)) {
            throw new Error('Product ID 16 no longer matches placeholder or canonical precondition');
        }
        // Valid Admin-edited ID 16: preserve as-is.
    }

    const inserts = [];
    for (const canonicalProduct of canonical) {
        const stored = existingById.get(canonicalProduct.id);
        if (!stored) {
            inserts.push(canonicalProduct);
            continue;
        }
        if (canonicalProduct.id === 16 && update16) continue;
        if (!isValidStoredProduct(stored) && !isInvalidId16Placeholder(stored)) {
            throw new Error(`Existing Product ID ${canonicalProduct.id} is invalid; automatic overwrite forbidden`);
        }
    }

    const preservedExtras = [...existingById.keys()]
        .filter((id) => !canonicalIds.has(id))
        .sort((a, b) => a - b);

    return {
        update16,
        inserts,
        preservedIds: [...PROTECTED_PRESERVE_IDS],
        preservedExtraIds: preservedExtras,
        canonical
    };
};

const summarizeProducts = (products, canonicalProducts) => {
    const canonicalIds = new Set(canonicalProducts.map(({ id }) => Number(id)));
    const ids = products.map(({ id }) => Number(id));

    return {
        total: products.length,
        valid: products.filter(isValidStoredProduct).length,
        invalid: products.filter((product) => !isValidStoredProduct(product)).length,
        canonicalMissing: [...canonicalIds].filter((id) => !ids.includes(id)).sort((a, b) => a - b),
        duplicateIds: duplicateIds(products),
        categories: Object.fromEntries(
            [...new Set(products.filter(isValidStoredProduct).map(({ category }) => String(category).toLowerCase()))]
                .sort()
                .map((category) => [category, products.filter(
                    (product) => isValidStoredProduct(product)
                        && String(product.category).toLowerCase() === category
                ).length])
        )
    };
};

const timestamp = () => new Date().toISOString().replace(/[:.]/g, '-');

const writeBackup = async (products, outputDirectory) => {
    await fs.mkdir(outputDirectory, { recursive: true });
    const backupPath = path.join(outputDirectory, `products-before-${timestamp()}.json`);
    await fs.writeFile(backupPath, JSON.stringify({
        createdAt: new Date().toISOString(),
        collection: Products.collection.collectionName,
        count: products.length,
        documents: products
    }, null, 2));
    return backupPath;
};

const run = async ({ apply = false } = {}) => {
    if (!process.env.MONGOOSE_URI) throw new Error('MONGOOSE_URI is required');

    const canonical = await fetchAllCanonicalProducts();
    await mongoose.connect(process.env.MONGOOSE_URI);

    try {
        const before = await Products.find().sort({ id: 1 }).lean();
        const plan = planReconciliation(before, canonical);
        const outputDirectory = path.resolve(__dirname, '..', '..', 'implementation-results', 'b2-8-3', 'audit');
        const backupPath = await writeBackup(before, outputDirectory);
        const writes = { updatedIds: [], insertedIds: [] };

        if (apply && (plan.update16 || plan.inserts.length)) {
            const session = await mongoose.startSession();
            try {
                await session.withTransaction(async () => {
                    if (plan.update16) {
                        const existing16 = before.find(({ id }) => Number(id) === 16);
                        if (!existing16?._id) throw new Error('Product ID 16 document _id missing for update');
                        const result = await Products.updateOne(
                            { id: 16, _id: existing16._id },
                            { $set: plan.update16 },
                            { session }
                        );
                        if (result.matchedCount !== 1 || result.modifiedCount !== 1) {
                            throw new Error('Product ID 16 in-place update precondition failed');
                        }
                        writes.updatedIds.push(16);
                    }

                    if (plan.inserts.length) {
                        await Products.insertMany(plan.inserts, { ordered: true, session });
                        writes.insertedIds.push(...plan.inserts.map(({ id }) => id));
                    }
                });
            } finally {
                await session.endSession();
            }
        }

        const after = await Products.find().sort({ id: 1 }).lean();
        const result = {
            mode: apply ? 'apply' : 'dry-run',
            canonicalUrl: CANONICAL_BASE_URL,
            canonicalPageLimit: CANONICAL_PAGE_LIMIT,
            canonicalCount: canonical.length,
            backupPath,
            before: summarizeProducts(before, canonical),
            planned: {
                updateIds: plan.update16 ? [16] : [],
                insertIds: plan.inserts.map(({ id }) => id),
                preserveIds: plan.preservedIds,
                preserveExtraIds: plan.preservedExtraIds
            },
            writes,
            after: summarizeProducts(after, canonical)
        };

        const auditPath = path.join(outputDirectory, `reconciliation-${timestamp()}.json`);
        await fs.writeFile(auditPath, JSON.stringify(result, null, 2));
        return { ...result, auditPath };
    } finally {
        await mongoose.disconnect();
    }
};

if (require.main === module) {
    run({ apply: process.argv.includes('--apply') })
        .then((result) => console.log(JSON.stringify(result, null, 2)))
        .catch((error) => {
            console.error(error.message);
            process.exitCode = 1;
        });
}

module.exports = {
    CANONICAL_BASE_URL,
    CANONICAL_FIELDS,
    CANONICAL_PAGE_LIMIT,
    PROTECTED_PRESERVE_IDS,
    canonicalFieldsMatch,
    duplicateIds,
    fetchAllCanonicalProducts,
    isInvalidId16Placeholder,
    isValidStoredProduct,
    normalizeCanonicalProduct,
    planReconciliation,
    summarizeProducts,
    validateCanonicalProducts
};
