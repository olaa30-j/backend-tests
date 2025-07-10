"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = __importDefault(require("../controller/user.controller"));
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router
    .route("/role")
    .delete(auth_1.authenticateUser, user_controller_1.default.deleteRoleFromAllUsers);
router.route("/stats").get(auth_1.authenticateUser, user_controller_1.default.getUsersStats);
router
    .route("/authUser")
    .post(auth_1.authenticateUser, user_controller_1.default.getUserAuthuser);
router
    .route("/")
    .post(auth_1.authenticateUser, (0, auth_1.authorizePermission)("مستخدم", "create"), user_controller_1.default.createUser);
router
    .route("/")
    .get(auth_1.authenticateUser, (0, auth_1.authorizePermission)("مستخدم", "view"), user_controller_1.default.getAllUsers);
router.route("/:id").get(auth_1.authenticateUser, user_controller_1.default.getUser);
router
    .route("/:id")
    .delete(auth_1.authenticateUser, (0, auth_1.authorizePermission)("مستخدم", "delete"), user_controller_1.default.deleteUser);
router.route("/:id").patch(auth_1.authenticateUser, user_controller_1.default.updateUser);
router
    .route("/:id/permissions")
    .patch(auth_1.authenticateUser, user_controller_1.default.updatePermissions);
router
    .route("/:id/fcm-token")
    .patch(auth_1.authenticateUser, user_controller_1.default.updateFcmToken);
router
    .route("/swap-member/:userId")
    .patch(auth_1.authenticateUser, (0, auth_1.authorizePermission)("مستخدم", "update"), user_controller_1.default.swapMember);
exports.default = router;
