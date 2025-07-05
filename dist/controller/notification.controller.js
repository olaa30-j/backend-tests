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
const customError_1 = require("../errors/customError");
const notification_model_1 = __importDefault(require("../models/notification.model"));
class NotificationController {
    constructor() {
        this.getNotifications = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            let baseQuery = {};
            if (req.user.role[0] === "مدير النظام") {
                baseQuery = {
                    recipientId: req.user.id,
                };
            }
            else {
                baseQuery = {
                    recipientId: req.user.id,
                    show: true,
                };
            }
            const [notifications, total] = yield Promise.all([
                notification_model_1.default.find(baseQuery)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate("sender.id", "email")
                    .lean(),
                notification_model_1.default.countDocuments({ recipientId: req.user._id }),
            ]);
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: notifications,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
                message: "Get all notifications successfuly",
            });
        }));
        this.markAsRead = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const notification = yield notification_model_1.default.findOneAndUpdate({ _id: req.params.id, recipientId: req.user.id }, { read: true, readAt: new Date(), status: "delivered" }, { new: true });
            if (!notification) {
                return next((0, customError_1.createCustomError)("Notification not found", customError_1.HttpCode.NOT_FOUND));
            }
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: notification,
                message: "make notification mark as read",
            });
        }));
        this.markAllAsRead = (0, asynHandler_1.default)((req, res) => __awaiter(this, void 0, void 0, function* () {
            yield notification_model_1.default.updateMany({ recipientId: req.user.id, read: false }, { read: true, readAt: new Date(), status: "delivered" });
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                message: "تم تعليم جميع الإشعارات كمقروءة",
                data: null,
            });
        }));
        this.getUnreadCount = (0, asynHandler_1.default)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const count = yield notification_model_1.default.countDocuments({
                recipientId: req.user.id,
                read: false,
            });
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: { count },
                message: "get the count of unread notification",
            });
        }));
        this.deleteNotification = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const notification = yield notification_model_1.default.findOneAndDelete({
                _id: req.params.id,
                recipientId: req.user.id,
            });
            if (!notification) {
                return next((0, customError_1.createCustomError)("Notification not found", customError_1.HttpCode.NOT_FOUND));
            }
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                message: "تم حذف الإشعار بنجاح",
                data: null,
            });
        }));
        this.updateShowByEntityType = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { show, entityType } = req.body;
            const validEntityTypes = [
                "مناسبه",
                "عضو",
                "اعلان",
                "ماليه",
                "معرض الصور",
                "مستخدم",
            ];
            if (!validEntityTypes.includes(entityType)) {
                return next((0, customError_1.createCustomError)("Invalid entity type", customError_1.HttpCode.BAD_REQUEST));
            }
            const result = yield notification_model_1.default.updateMany({
                "entity.type": entityType,
            }, { $set: { show: show } });
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                message: `Updated show status for ${entityType} notifications`,
                data: {
                    entityType,
                    show,
                    matchedCount: result.matchedCount,
                    modifiedCount: result.modifiedCount,
                },
            });
        }));
        this.getShowStatusByEntityType = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { entityType } = req.params;
            if (!entityType) {
                return next((0, customError_1.createCustomError)("Entity type is required", customError_1.HttpCode.BAD_REQUEST));
            }
            const notifications = yield notification_model_1.default.find({
                "entity.type": entityType,
            }).select("show");
            let firstShowStatus = false;
            let consistent;
            if (notifications.length !== 0) {
                firstShowStatus = notifications[0].show;
                consistent = notifications.every((n) => n.show === firstShowStatus);
            }
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: {
                    entityType,
                    show: firstShowStatus,
                    consistent,
                },
            });
        }));
    }
}
exports.default = new NotificationController();
