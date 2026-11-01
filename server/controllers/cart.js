const { addToCart, loadCart, deleteFromCart, removeFromCart } = require('../services/cart');

const loadCartHandler = async (req, res, next) => {
    try
    {
        const response = await loadCart(req);
        return res.status(200).json(response);
    }
    catch(err)
    {
        next(err);
    }
};

const addToCartHandler = async (req, res, next) => {
    try
    {
        const response = await addToCart(req);
        return res.status(200).json(response);
    }
    catch(err)
    {
        next(err);
    }
};

const removeFromCartHandler = async (req, res, next) => {
    try
    {
        const response = await removeFromCart(req);
        return res.status(200).json(response);
    }
    catch(err)
    {
        next(err);
    }
};

const deleteFromCartHandler = async (req, res, next) => {
    try
    {
        const response = await deleteFromCart(req);
        return res.status(200).json(response);
    }
    catch(err)
    {
        next(err);
    }
};

module.exports = {
    loadCartHandler,
    addToCartHandler,
    removeFromCartHandler,
    deleteFromCartHandler
};
