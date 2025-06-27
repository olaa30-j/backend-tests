"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDateRange = exports.validateFutureDate = exports.validateDate = void 0;
const customError_1 = require("../errors/customError");
const validateDate = (dateString, fieldName) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        throw (0, customError_1.createCustomError)(`Invalid ${fieldName} format`, customError_1.HttpCode.BAD_REQUEST);
    }
    return date;
};
exports.validateDate = validateDate;
const validateFutureDate = (date, fieldName) => {
    if (date < new Date()) {
        throw (0, customError_1.createCustomError)(`${fieldName} cannot be in the past`, customError_1.HttpCode.BAD_REQUEST);
    }
};
exports.validateFutureDate = validateFutureDate;
const validateDateRange = (startDate, endDate) => {
    if (endDate && startDate >= endDate) {
        throw (0, customError_1.createCustomError)("End date must be after start date", customError_1.HttpCode.BAD_REQUEST);
    }
};
exports.validateDateRange = validateDateRange;
