"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const customError_1 = require("../errors/customError");
const mongoose_1 = require("mongoose");
const errorHandler = (err, req, res, next) => {
    let customError = {
        statusCode: customError_1.HttpCode.INTERNAL_SERVER_ERROR,
        message: "Something went wrong try again later",
    };
    if (err instanceof customError_1.CustomError) {
        customError.message = err.message;
        customError.statusCode = err.statusCode;
    }
    if (err instanceof mongoose_1.Error.ValidationError) {
        customError.message = Object.values(err.errors)
            .map((item) => item.message)
            .join(",");
        customError.statusCode = 400;
    }
    if (req.url.startsWith("/api/v1/") && !req.route) {
        customError.statusCode = 404;
        customError.message = "Not Found";
    }
    return res.status(customError.statusCode).json({
        sucess: false,
        message: customError.message,
        statusCode: customError.statusCode,
        data: null,
    });
};
exports.default = errorHandler;
