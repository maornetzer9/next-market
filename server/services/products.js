const Products = require('../models/products');
const { default: mongoose } = require('mongoose');

const EDITABLE_PRODUCT_FIELDS = [
    'title', 'description', 'price', 'rating', 'reviewsCount', 'stock', 'category', 'thumbnail'
];
const PUBLIC_PRODUCT_FIELDS = [
    '_id', 'id', 'title', 'description', 'price', 'rating', 'reviewsCount', 'stock', 'category', 'thumbnail'
];

const normalizeCategory = (category) => (
    typeof category === 'string' ? category.trim().toLowerCase() : ''
);

const loadProducts = async ({ includeAdminFields = false } = {}) => {
    try {
        const query = Products.find();
        const existingProducts = includeAdminFields
            ? await query
            : await query.select(PUBLIC_PRODUCT_FIELDS.join(' '));
        return { code: 200, products: existingProducts };
    }
    catch (err)
    {
        console.error('Error loading products:', err.message);
        return { code: 500, message: 'Internal server error' };
    }
};


const modifyProduct = async (req) => {
    try
    {
        const input = req.body?.product;
        if (!input || typeof input !== 'object' || Array.isArray(input)) {
            return { code: 400, message: 'Invalid product' };
        }

        const product = Object.fromEntries(
            EDITABLE_PRODUCT_FIELDS
                .filter((field) => input[field] !== undefined)
                .map((field) => [field, input[field]])
        );

        for (const field of ['title', 'description', 'thumbnail']) {
            if (product[field] !== undefined) {
                if (typeof product[field] !== 'string') return { code: 400, message: `Invalid ${field}` };
                product[field] = product[field].trim().slice(0, field === 'description' ? 2000 : 500);
            }
        }

        for (const field of ['price', 'rating', 'reviewsCount', 'stock']) {
            if (product[field] !== undefined) {
                const value = Number(product[field]);
                if (!Number.isFinite(value) || value < 0) return { code: 400, message: `Invalid ${field}` };
                product[field] = value;
            }
        }

        if (Object.hasOwn(product, 'category')) {
            product.category = normalizeCategory(product.category);
            if (!product.category) return { code: 400, message: 'Invalid category' };
        }

         // Check if `_id` or `id` is null and handle accordingly.
         let productId = input._id;
         if (!productId )
        {
            productId = new mongoose.Types.ObjectId();

        // Find the product with the highest `id` and increment it to be inhibited.
            const lastProduct = await Products.findOne().sort({ id: -1 }).exec();
            const nextId = lastProduct ? lastProduct.id + 1 : 1;
            product.id = nextId;
        }
        else if (!mongoose.isValidObjectId(productId)) {
            return { code: 400, message: 'Invalid product id' };
        }

        const modifyProduct = await Products.findOneAndUpdate(
            {_id: productId},
            { $set: product },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        if( !modifyProduct ) return { code: 404, message: 'Product Not Found' };

        return { code: 200, product: modifyProduct };
    }
    catch(err)
    {
        console.error('Internal Server Error', err.message);
        return { code: 500, message: 'Internal server error' };
    }
};


const updateCategories = async (req) => {
    try
    {
        const { categories } = req.body;
        const oldCategory = normalizeCategory(categories?.old);
        const newCategory = normalizeCategory(categories?.new);

        if (!oldCategory || !newCategory) {
            return { code: 400, message: 'Category Name Is Required' };
        }

        // Update the category of all products that match the old category
        const updateResult = await Products.updateMany(
            { category: oldCategory },
            { $set: { category: newCategory } }
        );

        if (updateResult.modifiedCount === 0) {
            return { code: 404, message: 'No products found with the specified category' };
        }

        const updatedProducts = await Products.find({ category: newCategory });

        // Send the updated products to the frontend
        return {
                code: 200,
                updatedProducts,
                oldCategory
        }
    }
    catch(err)
    {
        console.error('Internal Server Error', err.message);
        return { code: 500, message: 'Internal Server Error' };

    }
};


const deleteCategories = async (req) => {
    try
    {
        const category = normalizeCategory(req.body?.category);

        if (!category) return { code: 400, message: 'Category Name Is Required' };

        const deletedCategory = await Products.deleteMany({category});
        if (deletedCategory.deletedCount === 0) return { code: 404, message: 'Category Not Found' };

        return {
            code: 200,
            message: 'Category Deleted Successfully',
            deletedCategory: category
        };
    }
    catch(err)
    {
        console.error('Internal Server Error', err.message);
        return { code: 500, message: 'Internal Server Error' };

    }
};


const createCategories = async (req) => {
    try
    {
        const category = normalizeCategory(req.body?.category);

        if (!category) return { code: 400, message: 'Category Name Is Required' };

        return {
            code: 409,
            message: 'Categories are created by assigning a category to a valid Product'
        };
    }
    catch(err)
    {
        console.error('Internal Server Error', err.message);
        return { code: 500, message: 'Internal Server Error' };
    }
};



module.exports = {
    normalizeCategory,
    loadProducts,
    modifyProduct,
    updateCategories,
    deleteCategories,
    createCategories
};
