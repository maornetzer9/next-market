const { loadProducts, modifyProduct, updateCategories, deleteCategories, createCategories } = require('../services/products');


const loadProductsHandler = async (req, res, next) => {
    try
    {
        const response = await loadProducts(req);
        return res.status(200).json(response);
    }
    catch(err)
    {
        next(err);
    }
};

const loadAdminProductsHandler = async (req, res, next) => {
    try
    {
        const response = await loadProducts({ includeAdminFields: true });
        return res.status(200).json(response);
    }
    catch(err)
    {
        next(err);
    }
};

const modifyProductHandler = async (req, res, next) => {
    try
    {
        const response = await modifyProduct(req);
        return res.status(200).json(response);
    }
    catch(err)
    {
        next(err);
    }
};

const updateCategoriesHandler = async (req, res, next) => {
    try
    {
        const response = await updateCategories(req);
        return res.status(200).json(response);
    }
    catch(err)
    {
        next(err);
    }
};

const deleteCategoriesHandler = async (req, res, next) => {
    try
    {
        const response = await deleteCategories(req);
        return res.status(200).json(response);
    }
    catch(err)
    {
        next(err);
    }
};

const createCategoriesHandler = async (req, res, next) => {
    try
    {
        const response = await createCategories(req);
        return res.status(200).json(response);
    }
    catch(err)
    {
        next(err);
    }
};

module.exports = {
    loadProductsHandler,
    loadAdminProductsHandler,
    modifyProductHandler,
    updateCategoriesHandler,
    deleteCategoriesHandler,
    createCategoriesHandler
};
