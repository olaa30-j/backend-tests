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
const user_model_1 = __importDefault(require("../models/user.model"));
const asynHandler_1 = __importDefault(require("../middlewares/asynHandler"));
const customError_1 = require("../errors/customError");
const generateToken_1 = require("../utils/generateToken");
const email_service_1 = require("../services/email.service");
const cookie_1 = require("../utils/cookie");
const password_1 = require("../utils/password");
const tenant_model_1 = __importDefault(require("../models/tenant.model"));
const member_model_1 = __importDefault(require("../models/member.model"));
const crypto_1 = __importDefault(require("crypto"));
const email_service_2 = require("../services/email.service");
const notify_1 = require("../utils/notify");
const DEFAULT_IMAGE_URL = "https://res.cloudinary.com/dmhvfuuke/image/upload/v1750092490/avatar_bdtadk.jpg";
class AuthController {
    constructor() {
        this.register = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { email, password, phone, familyBranch, familyRelationship } = req.body;
            if (familyRelationship === "الجد الأعلى") {
                const existingHusband = yield member_model_1.default.findOne({
                    familyRelationship: "الجد الأعلى",
                });
                if (existingHusband) {
                    return next((0, customError_1.createCustomError)(`Branch ${familyBranch} already has an approved ${familyRelationship}`, customError_1.HttpCode.CONFLICT));
                }
            }
            let image;
            if ((_a = req.file) === null || _a === void 0 ? void 0 : _a.path) {
                image = req.file.path.replace(/\\/g, "/");
            }
            else {
                image = DEFAULT_IMAGE_URL;
            }
            console.log(image);
            const familyName = "Elsaqar";
            let tenant = yield tenant_model_1.default.findOne({ familyName });
            if (!tenant) {
                tenant = new tenant_model_1.default({
                    familyName,
                    slug: familyName.toLowerCase().replace(/\s+/g, "-"),
                });
                yield tenant.save();
            }
            const emailAlreadyExists = yield user_model_1.default.findOne({ email });
            if (emailAlreadyExists) {
                return next((0, customError_1.createCustomError)("Email already Exists", customError_1.HttpCode.BAD_REQUEST));
            }
            const sanitizedPhone = phone.replace(/\D/g, "");
            const phoneNumber = sanitizedPhone ? Number(sanitizedPhone) : null;
            const hashedPassword = yield (0, password_1.hashPassword)(password);
            const newUser = new user_model_1.default({
                tenantId: tenant._id,
                email,
                password: hashedPassword,
                phone: phoneNumber,
                image: DEFAULT_IMAGE_URL,
            });
            yield newUser.save();
            const femaleRelationships = new Set(["زوجة", "ابنة"]);
            const gender = femaleRelationships.has(familyRelationship)
                ? "أنثى"
                : "ذكر";
            const newMember = new member_model_1.default({
                userId: newUser._id,
                fname: email.split("@")[0],
                lname: "الدهمش",
                gender,
                familyBranch,
                familyRelationship,
                isUser: true,
                image,
            });
            yield newMember.save();
            yield (0, email_service_1.sendWelcomeEmail)(newUser);
            newUser.memberId = newMember._id;
            yield newUser.save();
            yield (0, notify_1.notifyUsersWithPermission)({ entity: "مستخدم", action: "view", value: true }, {
                sender: { id: newUser._id, name: `${email.split("@")[0]}` },
                message: "تم تسجيل مستخدم جديد",
                action: "create",
                entity: { type: "مستخدم", id: newUser._id },
                metadata: {
                    priority: "medium",
                },
                status: "sent",
                read: false,
                readAt: null,
            });
            yield (0, email_service_1.sendEmailToUsersWithPermission)({
                entity: "مستخدم",
                action: "view",
                subject: "تم تسجيل مستخدم جديد",
                content: `
          <h2 style="color: #2F80A2; text-align: center;">تم تسجيل مستخدم جديد</h2>
          <p style="margin: 10px 0;"> <strong>${email}</strong> : تم إنشاء تسجيل جديد بالبريد الالكتروني</p>
          <p style="margin: 10px 0;">يرجى تسجيل الدخول للاطلاع على التفاصيل أو مراجعة الحساب.</p>
        `,
            });
            res.status(customError_1.HttpCode.CREATED).json({
                sucess: true,
                data: { newUser, newMember },
                message: "User register sucessfully",
            });
        }));
        this.login = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { identifier, password } = req.body;
            const authUser = yield user_model_1.default.findOne({
                $or: [
                    { email: identifier },
                    { phone: isNaN(identifier) ? undefined : Number(identifier) },
                ],
            });
            if (!authUser) {
                return next((0, customError_1.createCustomError)(`Invalid Credentials email`, customError_1.HttpCode.UNAUTHORIZED));
            }
            if (authUser.status !== "مقبول") {
                return next((0, customError_1.createCustomError)("Account is still under review. Please wait for approval.", customError_1.HttpCode.FORBIDDEN));
            }
            const isPasswordCorrect = yield (0, password_1.comparePasswords)(password, authUser.password);
            if (!isPasswordCorrect) {
                return next((0, customError_1.createCustomError)(`Invalid Credentials password`, customError_1.HttpCode.UNAUTHORIZED));
            }
            const token = yield (0, generateToken_1.generateToken)({
                role: authUser.role,
                id: authUser._id,
            });
            (0, cookie_1.setCookie)(res, "accessToken", token);
            res.status(customError_1.HttpCode.OK).json({
                sucess: true,
                data: authUser,
                message: "user sucessfully login",
                token: token,
            });
        }));
        this.logout = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            (0, cookie_1.clearCookie)(res, "accessToken");
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                message: "User successfully logged out",
                data: null,
            });
        }));
        this.forgotPassword = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            const user = yield user_model_1.default.findOne({ email });
            if (!user) {
                return next((0, customError_1.createCustomError)("User not found", customError_1.HttpCode.NOT_FOUND));
            }
            const resetToken = crypto_1.default.randomBytes(32).toString("hex");
            const hashedToken = crypto_1.default
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");
            user.resetPasswordToken = hashedToken;
            user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
            yield user.save();
            const resetUrl = `${process.env.RESET_URL}/${resetToken}`;
            yield (0, email_service_2.sendPasswordResetEmail)(user.email, resetUrl);
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                message: "Password reset link has been sent if the email exists.",
                data: user,
            });
        }));
        this.resetPassword = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { token } = req.params;
            const { newPassword } = req.body;
            const hashedToken = crypto_1.default
                .createHash("sha256")
                .update(token)
                .digest("hex");
            const user = yield user_model_1.default.findOne({
                resetPasswordToken: hashedToken,
                resetPasswordExpires: { $gt: new Date() },
            });
            if (!user) {
                return next((0, customError_1.createCustomError)("Invalid or expired reset token", customError_1.HttpCode.BAD_REQUEST));
            }
            user.password = yield (0, password_1.hashPassword)(newPassword);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            yield user.save();
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                message: "Password has been reset successfully.",
            });
        }));
        this.changePassword = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const { oldPassword, newPassword } = req.body;
            if (!oldPassword || !newPassword) {
                return next((0, customError_1.createCustomError)("Both old and new passwords are required", customError_1.HttpCode.BAD_REQUEST));
            }
            const user = yield user_model_1.default.findById(userId);
            if (!user) {
                return next((0, customError_1.createCustomError)("User not found", customError_1.HttpCode.NOT_FOUND));
            }
            const isMatch = yield (0, password_1.comparePasswords)(oldPassword, user.password);
            if (!isMatch) {
                return next((0, customError_1.createCustomError)("Old password is incorrect", customError_1.HttpCode.UNAUTHORIZED));
            }
            user.password = yield (0, password_1.hashPassword)(newPassword);
            yield user.save();
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                message: "Password changed successfully",
            });
        }));
    }
}
exports.default = new AuthController();
