"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const asynHandler_1 = __importDefault(require("../middlewares/asynHandler"));
const customError_1 = require("../errors/customError");
const permission_model_1 = __importStar(require("../models/permission.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const mongoose_1 = __importDefault(require("mongoose"));
class PermissionsController {
    constructor() {
        this.checkPermission = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            res.status(customError_1.HttpCode.CREATED).json({
                success: true,
                data: null,
                message: "you have permission for this action",
            });
        }));
        this.createPermission = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            let { role, permissions } = req.body;
            if (!role) {
                return next((0, customError_1.createCustomError)("Role is required", customError_1.HttpCode.BAD_REQUEST));
            }
            const roles = [
                "كبار الاسرة",
                "مدير اللجنه الاجتماعية",
                "مدير اللجنه الماليه",
                "مدير النظام",
            ];
            if (!roles.includes(role)) {
                permissions = permission_model_1.defaultPermissions;
            }
            const existingPermission = yield permission_model_1.default.findOne({ role });
            if (existingPermission) {
                return next((0, customError_1.createCustomError)("Permission for this role already exists", customError_1.HttpCode.CONFLICT));
            }
            const permission = yield permission_model_1.default.create({
                role,
                permissions,
            });
            res.status(customError_1.HttpCode.CREATED).json({
                success: true,
                data: permission,
                message: "Permission created successfully",
            });
        }));
        this.getAllPermissions = (0, asynHandler_1.default)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const totalPermissions = yield permission_model_1.default.countDocuments();
            const permissions = yield permission_model_1.default.find().skip(skip).limit(limit);
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                pagination: {
                    totalPermissions,
                    totalPages: Math.ceil(totalPermissions / limit),
                    currentPage: page,
                    pageSize: permissions.length,
                },
                data: permissions,
                message: "Permissions retrieved successfully",
            });
        }));
        this.getAllRoles = (0, asynHandler_1.default)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const roles = yield permission_model_1.default.distinct("role");
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: roles,
                message: "Roles retrieved successfully",
            });
        }));
        this.updatePermissionForRole = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { role } = req.params;
            const { entity, action, value } = req.body;
            if (role === "مدير النظام") {
                return next((0, customError_1.createCustomError)("غير مسموح بتحديث مدير النظام", customError_1.HttpCode.FORBIDDEN));
            }
            const allowedEntities = [
                "مناسبه",
                "عضو",
                "مستخدم",
                "معرض الصور",
                "ماليه",
                "اعلان",
            ];
            const allowedActions = ["view", "create", "update", "delete"];
            if (!allowedEntities.includes(entity)) {
                return next((0, customError_1.createCustomError)("Invalid entity", customError_1.HttpCode.BAD_REQUEST));
            }
            if (!allowedActions.includes(action)) {
                return next((0, customError_1.createCustomError)("Invalid action", customError_1.HttpCode.BAD_REQUEST));
            }
            if (typeof value !== "boolean") {
                return next((0, customError_1.createCustomError)("Value must be a boolean", customError_1.HttpCode.BAD_REQUEST));
            }
            const permission = yield permission_model_1.default.findOne({ role });
            if (!permission) {
                return next((0, customError_1.createCustomError)("Permission not found", customError_1.HttpCode.NOT_FOUND));
            }
            const entityPermission = permission.permissions.find((perm) => perm.entity === entity);
            if (entityPermission) {
                entityPermission[action] = value;
            }
            else {
                permission.permissions.push({ entity, [action]: value });
            }
            yield permission.save();
            const usersWithRole = yield user_model_1.default.find({ role });
            for (const user of usersWithRole) {
                const userEntityPermission = user.permissions.find((perm) => perm.entity === entity);
                if (userEntityPermission) {
                    userEntityPermission[action] = value;
                }
                else {
                    user.permissions.push({ entity, [action]: value });
                }
                yield user.save();
            }
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                message: `Permission '${action}' for '${entity}' updated successfully`,
                data: permission.permissions,
            });
        }));
        this.deleteRoleAndUpdateUsers = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { role } = req.params;
            if (role === "مدير النظام" || role === "مستخدم") {
                return next((0, customError_1.createCustomError)("غير مسموح بحذف مديرالنظام او مستخدم", customError_1.HttpCode.FORBIDDEN));
            }
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            const roleExists = yield permission_model_1.default.exists({ role }).session(session);
            if (!roleExists) {
                yield session.abortTransaction();
                return next((0, customError_1.createCustomError)("Role not found", customError_1.HttpCode.NOT_FOUND));
            }
            const defaultUserPermissions = ((_a = (yield permission_model_1.default.findOne({ role: "مستخدم" }).session(session))) === null || _a === void 0 ? void 0 : _a.permissions) || permission_model_1.defaultPermissions;
            const usersToUpdate = yield user_model_1.default.find({ role }).session(session);
            const bulkOps = usersToUpdate.map((user) => ({
                updateOne: {
                    filter: { _id: user._id },
                    update: {
                        $set: {
                            role: ["مستخدم"],
                            permissions: defaultUserPermissions,
                        },
                    },
                },
            }));
            if (bulkOps.length > 0) {
                yield user_model_1.default.bulkWrite(bulkOps, { session });
            }
            yield permission_model_1.default.deleteOne({ role }).session(session);
            yield session.commitTransaction();
            session.endSession();
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                message: `Role '${role}' deleted and ${usersToUpdate.length} users updated to 'مستخدم'`,
                data: {
                    updatedUsersCount: usersToUpdate.length,
                },
            });
        }));
    }
}
exports.default = new PermissionsController();
