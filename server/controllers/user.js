const { auth, login, register, update, disconnect } = require('../services/user');


const authHandler = async (req, res, next) => {
    try
    {
        const response = await auth(req, next);
        return res.status(200).json(response);
    }
    catch(err)
    {
       next(err);
    }
};

const loginHandler = async (req, res, next) => {
    try
    {
        const response = await login(req, next);
        res.locals.serviceCode = response?.code;
        return res.status(200).json( response );
    } catch(err)
    {
       next(err);
    }
};

const registerHandler = async (req, res, next) => {
    try
    {
        const response = await register(req, next);
        return res.status(200).json( response );
    } catch(err)
    {
        next(err);
    }
};

const updateHandler = async (req, res, next) => {
    try
    {
        const response = await update(req, next);
        return res.status(200).json(response);
    }
    catch(err)
    {
       next(err);
    }
};

const disconnectHandler = async (req, res, next) => {
    try
    {
        const response = await disconnect(req, next);
        return res.status(200).json(response);
    }
    catch(err)
    {
       next(err)
    }
};


module.exports = {
    authHandler,
    loginHandler,
    registerHandler,
    updateHandler,
    disconnectHandler
};
