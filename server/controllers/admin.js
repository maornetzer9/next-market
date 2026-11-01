const { loadUsersOrders } = require('../services/admin');

const loadUsersOrdersHandler = async (req, res, next) => {
    try
    {
        const response = await loadUsersOrders(req);
        return res.status(200).json(response);
    }
    catch(err)
    {
        next(err);
    }
};

module.exports = { loadUsersOrdersHandler };