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
exports.notifyUsersWithPermission = notifyUsersWithPermission;
const user_model_1 = __importDefault(require("../models/user.model"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const firebase_service_1 = require("../services/firebase.service");
function notifyUsersWithPermission(permissionFilter, notificationData) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const usersWithPermission = yield user_model_1.default.find({
                permissions: {
                    $elemMatch: {
                        entity: permissionFilter.entity,
                        [permissionFilter.action]: permissionFilter.value,
                    },
                },
                _id: { $ne: notificationData.sender.id },
            })
                .select("_id fcmToken")
                .session(session);
            console.log("Found users:", usersWithPermission);
            if (usersWithPermission.length === 0) {
                console.log("No users found with permission:", permissionFilter);
                yield session.commitTransaction();
                return [];
            }
            const usersWithTokens = usersWithPermission.filter((user) => user.fcmToken);
            const tokens = usersWithTokens.map((user) => user.fcmToken);
            const existingNotifications = yield notification_model_1.default.find({
                "entity.type": notificationData.entity.type,
            })
                .select("show")
                .session(session);
            console.log("Existing notifications:", existingNotifications);
            const notifications = yield notification_model_1.default.insertMany(usersWithPermission.map((user) => (Object.assign(Object.assign({}, notificationData), { recipientId: user._id, status: "sent", isWebDelivered: true, show: false }))), { session });
            // Send push notifications if tokens exist
            if (!((_a = notificationData.entity) === null || _a === void 0 ? void 0 : _a.id) || !((_b = notificationData.entity) === null || _b === void 0 ? void 0 : _b.type)) {
                throw new Error("Notification entity must have both id and type defined");
            }
            if (tokens.length > 0) {
                const message = {
                    tokens,
                    notification: {
                        title: notificationData.action || "New Notification",
                        body: notificationData.message,
                    },
                    data: {
                        type: notificationData.entity.type,
                        id: notificationData.entity.id.toString(),
                        click_action: "FLUTTER_NOTIFICATION_CLICK",
                    },
                    apns: {
                        payload: {
                            aps: {
                                sound: "default",
                            },
                        },
                    },
                };
                yield (0, firebase_service_1.sendMulticastNotification)(tokens, message);
            }
            yield session.commitTransaction();
            return notifications;
        }
        catch (error) {
            console.error("Error in notifyUsersWithPermission:", error);
            yield session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    });
}
