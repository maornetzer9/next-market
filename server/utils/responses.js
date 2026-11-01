const Responses = {
    success         : { code: 200, message: "Success" },
    badRequest      : { code: 400, message: "Bad Request" },
    unauthorized    : { code: 401, message: "Unauthorized" },
    forbidden       : { code: 403, message: "Forbidden" },
    notFound        : { code: 404, message: "Not Found" },
    internalError   : { code: 500, message: "Internal Server Error" },

    custom: (code, message) => {
        return {
            code,
            message
        };
    }
};

module.exports = Responses;