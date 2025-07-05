"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCookie = exports.setCookie = void 0;
const setCookie = (res, name, value, options = {}, req) => {
    var _a, _b;
    const isProduction = process.env.NODE_ENV === "production";
    const isCapacitor = (_b = (_a = req === null || req === void 0 ? void 0 : req.headers) === null || _a === void 0 ? void 0 : _a.origin) === null || _b === void 0 ? void 0 : _b.startsWith("capacitor://");
    const defaultOptions = {
        httpOnly: true,
        secure: isProduction || isCapacitor,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 90 * 24 * 60 * 60 * 1000,
        path: "/",
        domain: isProduction ? ".yourdomain.com" : undefined
    };
    res.cookie(name, value, Object.assign(Object.assign({}, defaultOptions), options));
};
exports.setCookie = setCookie;
const clearCookie = (res, name, req) => {
    var _a, _b;
    const isProduction = process.env.NODE_ENV === "production";
    const isCapacitor = (_b = (_a = req === null || req === void 0 ? void 0 : req.headers) === null || _a === void 0 ? void 0 : _a.origin) === null || _b === void 0 ? void 0 : _b.startsWith("capacitor://");
    res.clearCookie(name, {
        httpOnly: true,
        secure: isProduction || isCapacitor,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
        domain: isProduction ? ".yourdomain.com" : undefined
    });
};
exports.clearCookie = clearCookie;
