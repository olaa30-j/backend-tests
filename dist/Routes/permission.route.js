"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const permission_controller_1 = __importDefault(require("../controller/permission.controller"));
const router = express_1.default.Router();
router
    .route("/check")
    .post(auth_1.authenticateUser, (0, auth_1.authorizePermissionFromBody)(), permission_controller_1.default.checkPermission);
router.route("/roles").get(auth_1.authenticateUser, permission_controller_1.default.getAllRoles);
router
    .route("/")
    .post(auth_1.authenticateUser, permission_controller_1.default.createPermission);
router
    .route("/")
    .get(auth_1.authenticateUser, permission_controller_1.default.getAllPermissions);
router
    .route("/:role")
    .delete(auth_1.authenticateUser, permission_controller_1.default.deleteRoleAndUpdateUsers);
router
    .route("/:role")
    .patch(auth_1.authenticateUser, permission_controller_1.default.updatePermissionForRole);
exports.default = router;
