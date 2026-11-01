const Responses = require('../utils/responses');

const errorHandler = (err, req, res, next) => {
    console.error('Unhandled request error:', err?.message || 'Unknown error');
    const status = Number.isInteger(err?.status) && err.status >= 400 && err.status < 500
        ? err.status
        : 500;
    const response = status === 403 ? Responses.forbidden : Responses.internalError;
    return res.status(status).json(response);
};

module.exports = { errorHandler };
