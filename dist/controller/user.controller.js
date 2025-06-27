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
const asynHandler_1 = __importDefault(require("../middlewares/asynHandler"));
const user_model_1 = __importDefault(require("../models/user.model"));
const customError_1 = require("../errors/customError");
const password_1 = require("../utils/password");
const tenant_model_1 = __importDefault(require("../models/tenant.model"));
const permission_model_1 = __importDefault(require("../models/permission.model"));
const email_service_1 = require("../services/email.service");
const member_model_1 = __importDefault(require("../models/member.model"));
const notify_1 = require("../utils/notify");
const DEFAULT_IMAGE_URL = "https://res.cloudinary.com/dmhvfuuke/image/upload/v1750092490/avatar_bdtadk.jpg";
class UserController {
    constructor() {
        this.createUser = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const familyName = "Elsaqar";
                let tenant = yield tenant_model_1.default.findOne({ familyName });
                if (!tenant) {
                    tenant = new tenant_model_1.default({
                        familyName,
                        slug: familyName.toLowerCase().replace(/\s+/g, "-"),
                    });
                    yield tenant.save();
                }
                const { email, password, phone, role, status, address, familyBranch, familyRelationship } = req.body;
                if (role === "مدير النظام" || (Array.isArray(role) && role.includes("مدير النظام"))) {
                    const existingSuperAdmin = yield user_model_1.default.findOne({
                        $or: [
                            { role: "مدير النظام" },
                            { role: { $elemMatch: { $eq: "مدير النظام" } } },
                        ],
                    });
                    if (existingSuperAdmin) {
                        next((0, customError_1.createCustomError)("يوجد مدير نظام واحد فقط مسموح به في النظام", customError_1.HttpCode.CONFLICT));
                        return;
                    }
                }
                if (yield user_model_1.default.findOne({ email })) {
                    next((0, customError_1.createCustomError)("البريد الإلكتروني مسجل مسبقاً", customError_1.HttpCode.BAD_REQUEST));
                    return;
                }
                if (familyRelationship === "الجد الأعلى") {
                    if (yield member_model_1.default.findOne({ familyRelationship: "الجد الأعلى" })) {
                        next((0, customError_1.createCustomError)("يوجد جد أعلى مسجل مسبقاً في النظام", customError_1.HttpCode.CONFLICT));
                        return;
                    }
                }
                const userRole = role || "مستخدم";
                const permission = yield permission_model_1.default.findOne({ role: userRole });
                if (!permission) {
                    next((0, customError_1.createCustomError)("نوع المستخدم غير صحيح", customError_1.HttpCode.BAD_REQUEST));
                    return;
                }
                const hashedPwd = yield (0, password_1.hashPassword)(password);
                const user = new user_model_1.default({
                    tenantId: tenant._id,
                    email,
                    password: hashedPwd,
                    phone,
                    permissions: permission.permissions,
                    status: status || "قيد الانتظار",
                    address,
                    role: Array.isArray(req.body.role) ? req.body.role : [req.body.role || "مستخدم"],
                });
                yield user.save();
                const newMember = new member_model_1.default({
                    userId: user._id,
                    fname: email.split("@")[0],
                    lname: "الدهمش",
                    gender: "ذكر",
                    isUser: true,
                    image: DEFAULT_IMAGE_URL,
                    familyRelationship,
                    familyBranch,
                });
                yield newMember.save();
                user.memberId = newMember._id;
                yield user.save();
                try {
                    yield (0, notify_1.notifyUsersWithPermission)({ entity: "مستخدم", action: "create", value: true }, {
                        sender: { id: (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.id, name: email.split("@")[0] },
                        message: "تم إنشاء مستخدم جديد",
                        action: "create",
                        entity: { type: "مستخدم", id: user._id },
                        metadata: { priority: "medium" },
                        status: "sent",
                        read: false,
                        readAt: null,
                    });
                    yield (0, email_service_1.sendEmailToUsersWithPermission)({
                        entity: "مستخدم",
                        action: "view",
                        subject: "تم إنشاء مستخدم جديد",
                        content: `
          <h2 style="color: #2F80A2; text-align: center;">تم إضافة مستخدم جديد</h2>
          <p style="margin: 10px 0;"><strong>${email}</strong>: تم إنشاء حساب جديد بالبريد الإلكتروني</p>
          <p style="margin: 10px 0;">يرجى تسجيل الدخول للاطلاع على التفاصيل أو مراجعة الحساب.</p>
        `,
                    });
                }
                catch (notificationError) {
                    console.error("Error in notifications:", notificationError);
                }
                res.status(customError_1.HttpCode.CREATED).json({
                    success: true,
                    data: {
                        user: {
                            _id: user._id,
                            email: user.email,
                            role: user.role,
                            status: user.status,
                            memberId: user.memberId,
                        },
                        member: {
                            _id: newMember._id,
                            fname: newMember.fname,
                            lname: newMember.lname,
                        },
                    },
                    message: "تم إنشاء المستخدم بنجاح",
                });
            }
            catch (error) {
                console.error("Error in createUser:", error);
                next((0, customError_1.createCustomError)("حدث خطأ أثناء إنشاء المستخدم", customError_1.HttpCode.INTERNAL_SERVER_ERROR));
            }
        }));
        this.getAllUsers = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const familyName = "Elsaqar";
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            let tenant = yield tenant_model_1.default.findOne({ familyName });
            const totalUsers = yield user_model_1.default.countDocuments({ tenantId: tenant === null || tenant === void 0 ? void 0 : tenant._id });
            const users = yield user_model_1.default.find({ tenantId: tenant === null || tenant === void 0 ? void 0 : tenant._id })
                .select("-password")
                .skip(skip)
                .limit(limit);
            const totalPages = Math.ceil(totalUsers / limit);
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: users,
                pagination: {
                    totalUsers,
                    totalPages,
                    currentPage: page,
                    pageSize: users.length,
                },
                message: "users get sucessfully",
            });
        }));
        this.getUser = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const user = yield user_model_1.default.findById(id).select("-password");
            if (!user) {
                return next((0, customError_1.createCustomError)("User not found", customError_1.HttpCode.NOT_FOUND));
            }
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: user,
                message: "user get sucessfully",
            });
        }));
        this.getUserAuthuser = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const user = yield user_model_1.default.findById(id)
                .select("-password")
                .populate("memberId");
            if (!user) {
                return next((0, customError_1.createCustomError)("User not found", customError_1.HttpCode.NOT_FOUND));
            }
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: user,
                message: "Auth user get sucessfully",
            });
        }));
        this.deleteUser = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { id } = req.params;
            const userToDelete = yield user_model_1.default.findById(id);
            if (!userToDelete) {
                return next((0, customError_1.createCustomError)("User not found", customError_1.HttpCode.NOT_FOUND));
            }
            const isSuperAdmin = (_a = userToDelete === null || userToDelete === void 0 ? void 0 : userToDelete.role) === null || _a === void 0 ? void 0 : _a.includes("مدير النظام");
            if (isSuperAdmin) {
                return next((0, customError_1.createCustomError)("Super Admin accounts cannot be deleted.", customError_1.HttpCode.FORBIDDEN));
            }
            yield userToDelete.deleteOne();
            yield (0, notify_1.notifyUsersWithPermission)({ entity: "مستخدم", action: "delete", value: true }, {
                sender: { id: req === null || req === void 0 ? void 0 : req.user.id },
                message: "تم حذف مستخدم",
                action: "delete",
                entity: { type: "مستخدم" },
                metadata: {
                    priority: "medium",
                },
                status: "sent",
                read: false,
                readAt: null,
            });
            yield (0, email_service_1.sendEmailToUsersWithPermission)({
                entity: "مستخدم",
                action: "delete",
                subject: "تم حذف مستخدم",
                content: `
          <h2 style="color: #2F80A2; text-align: center;">تم حذف مستخدم</h2>
          <p style="margin: 10px 0;"> <strong>${userToDelete === null || userToDelete === void 0 ? void 0 : userToDelete.email} : تم حذف حساب بالبريد الالكتروني </strong></p>
          <p style="margin: 10px 0;">.يرجى تسجيل الدخول للاطلاع على التفاصيل</p>
        `,
            });
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: null,
                message: "User deleted successfully.",
            });
        }));
        this.updateUser = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const { id } = req.params;
            const loggedInUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            let updateData = Object.assign({}, req.body);
            const originalUser = yield user_model_1.default.findById(id);
            if (!originalUser) {
                return next((0, customError_1.createCustomError)("User not found", customError_1.HttpCode.NOT_FOUND));
            }
            if (Array.isArray(originalUser === null || originalUser === void 0 ? void 0 : originalUser.role) &&
                originalUser.role.includes("مدير النظام") &&
                loggedInUserId !== (originalUser === null || originalUser === void 0 ? void 0 : originalUser._id.toString())) {
                return next((0, customError_1.createCustomError)("غير مسموح بتعديل دور مدير النظام", customError_1.HttpCode.FORBIDDEN));
            }
            if (req.body.role === "مدير النظام") {
                return next((0, customError_1.createCustomError)("غير مسموح بتعديل دور مدير النظام", customError_1.HttpCode.FORBIDDEN));
            }
            if (req.body.role) {
                const roles = Array.isArray(req.body.role)
                    ? req.body.role
                    : [req.body.role];
                updateData.role = roles;
                const permission = (_b = (yield permission_model_1.default.findOne({
                    role: { $in: roles },
                }))) !== null && _b !== void 0 ? _b : (yield permission_model_1.default.findOne({ role: "مستخدم" }));
                updateData.permissions = permission === null || permission === void 0 ? void 0 : permission.permissions;
            }
            if (req.body.password) {
                updateData.password = yield (0, password_1.hashPassword)(req.body.password);
            }
            const updatedUser = yield user_model_1.default.findByIdAndUpdate(id, updateData, {
                new: true,
                runValidators: true,
            });
            if ((updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.status) !== originalUser.status) {
                if ((updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.status) === "مقبول" ||
                    (updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.status) === "مرفوض") {
                    (0, email_service_1.sendAccountStatusEmail)(updatedUser);
                }
            }
            yield (0, notify_1.notifyUsersWithPermission)({ entity: "مستخدم", action: "create", value: true }, {
                sender: { id: req === null || req === void 0 ? void 0 : req.user.id },
                message: "تم تعديل مستخدم",
                action: "create",
                entity: { type: "مستخدم", id: updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser._id },
                metadata: {
                    deepLink: `/users/${updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser._id}`,
                    priority: "medium",
                },
                status: "sent",
                read: false,
                readAt: null,
            });
            yield (0, email_service_1.sendEmailToUsersWithPermission)({
                entity: "مستخدم",
                action: "update",
                subject: "تم إنشاء تعديل مستخدم",
                content: `
          <h2 style="color: #2F80A2; text-align: center;">تم تعديل مستخدم</h2>
          <p style="margin: 10px 0;"> <strong>${updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.email} : تم تعديل حساب بالبريد الالكتروني </strong></p>
          <p style="margin: 10px 0;">.يرجى تسجيل الدخول للاطلاع على التفاصيل</p>
        `,
            });
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: updatedUser,
                message: "user updated sucessfully",
            });
        }));
        this.updatePermissions = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { entity, action, value } = req.body;
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
            const user = yield user_model_1.default.findById(id);
            if (!user)
                throw (0, customError_1.createCustomError)("User not found", customError_1.HttpCode.NOT_FOUND);
            const permission = user.permissions.find((perm) => perm.entity === entity);
            if (permission) {
                permission[action] = value;
            }
            yield user.save();
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                message: `Permission '${action}' for '${entity}' updated successfully`,
                data: user.permissions,
            });
        }));
        this.deleteRoleFromAllUsers = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            console.log("user");
            const { role } = req.body;
            if (!role || typeof role !== "string") {
                return next((0, customError_1.createCustomError)("Role name is required and must be a string", customError_1.HttpCode.BAD_REQUEST));
            }
            if (role === "مدير النظام" || role === "مستخدم") {
                return next((0, customError_1.createCustomError)("Cannot remove super admin and user role from the system", customError_1.HttpCode.FORBIDDEN));
            }
            const usersWithRole = yield user_model_1.default.find({ role: { $in: [role] } });
            if (usersWithRole.length === 0) {
                return next((0, customError_1.createCustomError)(`No users found with the role '${role}'`, customError_1.HttpCode.NOT_FOUND));
            }
            const updateResult = yield user_model_1.default.updateMany({ role: { $in: [role] } }, [
                {
                    $set: {
                        role: {
                            $filter: {
                                input: "$role",
                                as: "r",
                                cond: { $ne: ["$$r", role] },
                            },
                        },
                    },
                },
                {
                    $set: {
                        role: {
                            $cond: {
                                if: { $eq: [{ $size: "$role" }, 0] },
                                then: ["مستخدم"],
                                else: "$role",
                            },
                        },
                    },
                },
            ]);
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: {
                    matchedCount: updateResult.matchedCount,
                    modifiedCount: updateResult.modifiedCount,
                    roleRemoved: role,
                },
                message: `Role '${role}' removed from ${updateResult.modifiedCount} users successfully`,
            });
        }));
        this.getUsersStats = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const familyName = "Elsaqar";
            const tenant = yield tenant_model_1.default.findOne({ familyName });
            if (!tenant) {
                return next((0, customError_1.createCustomError)("Tenant not found", customError_1.HttpCode.NOT_FOUND));
            }
            const totalUsers = yield user_model_1.default.countDocuments({ tenantId: tenant._id });
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const newUsers = yield user_model_1.default.countDocuments({
                tenantId: tenant._id,
                createdAt: { $gte: sevenDaysAgo },
            });
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: {
                    totalUsers,
                    newUsers,
                    newUsersTimeframe: "last 7 days",
                },
                message: "Users count retrieved successfully",
            });
        }));
        this.swapMember = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { userId } = req.params;
            const { newMemberId } = req.body;
            try {
                const targetUser = yield user_model_1.default.findById(userId);
                if (!targetUser) {
                    return next((0, customError_1.createCustomError)("المستخدم غير موجود", customError_1.HttpCode.NOT_FOUND));
                }
                const newMember = yield member_model_1.default.findById(newMemberId);
                if (!newMember) {
                    return next((0, customError_1.createCustomError)("العضو غير موجود", customError_1.HttpCode.NOT_FOUND));
                }
                let oldMember = yield member_model_1.default.findById(targetUser.memberId);
                if (oldMember && oldMember.toString() !== newMember.toString()) {
                    yield member_model_1.default.findByIdAndDelete(targetUser.memberId);
                }
                newMember.userId = targetUser._id;
                newMember.isUser = true;
                yield newMember.save();
                targetUser.memberId = newMember._id;
                yield targetUser.save();
                res.status(customError_1.HttpCode.OK).json({
                    success: true,
                    data: {
                        user: targetUser,
                        newMember,
                        deletedOldMember: !!targetUser.memberId,
                        disassociatedPreviousUser: !!newMember.userId
                    },
                    message: "تم تبديل العضو بنجاح"
                });
            }
            catch (error) {
                next(error);
            }
        }));
    }
}
exports.default = new UserController();
