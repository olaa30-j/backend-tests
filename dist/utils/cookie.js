"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCookie = exports.setCookie = void 0;
const setCookie = (res, name, value, options = {}) => {
    const defaultOptions = {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        maxAge: 90 * 24 * 60 * 60 * 1000,
        path: "/",
    };
    res.cookie(name, value, Object.assign(Object.assign({}, defaultOptions), options));
};
exports.setCookie = setCookie;
const clearCookie = (res, name) => {
    res.clearCookie(name, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
    });
};
exports.clearCookie = clearCookie;
