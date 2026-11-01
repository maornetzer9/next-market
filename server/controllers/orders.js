const { newOrder, loadOrders } = require('../services/orders');

const loadOrdersHandler = async (req, res, next) => {
    try
    {
        const response = await loadOrders(req);
        return res.status(200).json(response);
    }
    catch(err)
    {
        next(err);
    }
};

const newOrderHandler = async (req, res, next) => {
    try
    {
        const response = await newOrder(req);
        return res.status(200).json(response);
    }
    catch(err)
    {
        next(err);
    }
};

module.exports = {
    loadOrdersHandler,
    newOrderHandler
};
