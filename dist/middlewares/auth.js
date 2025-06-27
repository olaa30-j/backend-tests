"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizePermissionFromBody = exports.authorizePermission = exports.authorizeRoles = exports.authenticateUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user.model"));
const customError_1 = require("../errors/customError");
const authenticateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization || req.headers.cookie;
    let token;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    }
    else if (authHeader && authHeader.startsWith("accessToken=")) {
        token = authHeader.split("=")[1];
    }
    if (!token) {
        return next((0, customError_1.createCustomError)(`Authorization token not found`, customError_1.HttpCode.UNAUTHORIZED));
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        return next((0, customError_1.createCustomError)(`Not authorized to access this route`, customError_1.HttpCode.UNAUTHORIZED));
    }
});
exports.authenticateUser = authenticateUser;
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        var _a;
        const userRoles = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        const hasAccess = userRoles.some((role) => allowedRoles.includes(role));
        console.log(userRoles);
        if (!hasAccess) {
            return next((0, customError_1.createCustomError)(`Unauthorized to access this route`, customError_1.HttpCode.UNAUTHORIZED));
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
const authorizePermission = (entity, action) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const userId = req.user.id;
        if (!userId) {
            return next((0, customError_1.createCustomError)("Unauthorized", customError_1.HttpCode.UNAUTHORIZED));
        }
        const user = yield user_model_1.default.findById({ _id: userId });
        if (!user) {
            return next((0, customError_1.createCustomError)("User not found", customError_1.HttpCode.NOT_FOUND));
        }
        const permission = user.permissions.find((p) => p.entity === entity);
        if (!permission || !permission[action]) {
            return next((0, customError_1.createCustomError)(`You do not have permission to ${action} ${entity}`, customError_1.HttpCode.FORBIDDEN));
        }
        console.log("user have permission");
        next();
    });
};
exports.authorizePermission = authorizePermission;
const authorizePermissionFromBody = () => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return next((0, customError_1.createCustomError)("Unauthorized", customError_1.HttpCode.UNAUTHORIZED));
        }
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            return next((0, customError_1.createCustomError)("User  not found", customError_1.HttpCode.NOT_FOUND));
        }
        const { entity, action } = req.body;
        if (!entity || !action) {
            return next((0, customError_1.createCustomError)("Entity and action are required", customError_1.HttpCode.BAD_REQUEST));
        }
        const permission = user.permissions.find((p) => p.entity === entity);
        if (!permission || !permission[action]) {
            return next((0, customError_1.createCustomError)(`You do not have permission to ${action} ${entity}`, customError_1.HttpCode.FORBIDDEN));
        }
        console.log("User has permission");
        next();
    });
};
exports.authorizePermissionFromBody = authorizePermissionFromBody;
