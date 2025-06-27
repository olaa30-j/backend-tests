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
function notifyUsersWithPermission(permissionFilter, notificationData) {
    return __awaiter(this, void 0, void 0, function* () {
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
                .select("_id")
                .session(session);
            console.log("Found users:", usersWithPermission);
            if (usersWithPermission.length === 0) {
                console.log("No users found with permission:", permissionFilter);
                yield session.commitTransaction();
                return [];
            }
            const existingNotifications = yield notification_model_1.default.find({
                "entity.type": notificationData.entity.type,
            })
                .select("show")
                .session(session);
            console.log(existingNotifications);
            let firstShowStatus = false;
            if (existingNotifications.length !== 0) {
                firstShowStatus = existingNotifications[0].show;
            }
            // Create notifications
            const notifications = yield notification_model_1.default.insertMany(usersWithPermission.map((user) => (Object.assign(Object.assign({}, notificationData), { recipientId: user._id, status: "sent", isWebDelivered: true, show: firstShowStatus !== undefined ? firstShowStatus : false }))), { session });
            console.log(notifications);
            yield session.commitTransaction();
            return notifications;
        }
        catch (error) {
            console.log(error);
            yield session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    });
}
