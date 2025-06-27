"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notification_controller_1 = __importDefault(require("../controller/notification.controller"));
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router
    .route("/show-by-entity")
    .patch(auth_1.authenticateUser, (0, auth_1.authorizeRoles)("مدير النظام"), notification_controller_1.default.updateShowByEntityType);
router
    .route("/read-all")
    .patch(auth_1.authenticateUser, notification_controller_1.default.markAllAsRead);
router
    .route("/unread-count")
    .get(auth_1.authenticateUser, notification_controller_1.default.getUnreadCount);
router
    .route("/")
    .get(auth_1.authenticateUser, notification_controller_1.default.getNotifications);
router
    .route("/:entityType")
    .get(auth_1.authenticateUser, notification_controller_1.default.getShowStatusByEntityType);
router
    .route("/:id/read")
    .patch(auth_1.authenticateUser, notification_controller_1.default.markAsRead);
router
    .route("/:id")
    .delete(auth_1.authenticateUser, notification_controller_1.default.deleteNotification);
exports.default = router;
