"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const member_controller_1 = __importDefault(require("../controller/member.controller"));
const auth_1 = require("../middlewares/auth");
const uploadImage_1 = require("../middlewares/uploadImage");
const router = express_1.default.Router();
router
    .route("/")
    .post(auth_1.authenticateUser, (0, auth_1.authorizePermission)("عضو", "create"), uploadImage_1.upload.single("image"), member_controller_1.default.createMember);
router
    .route("/")
    .get(auth_1.authenticateUser, (0, auth_1.authorizePermission)("عضو", "view"), member_controller_1.default.getAllMembers);
router.route("/:id").get(auth_1.authenticateUser, member_controller_1.default.getMemberById);
router
    .route("/:id")
    .delete(auth_1.authenticateUser, (0, auth_1.authorizePermission)("عضو", "delete"), member_controller_1.default.deleteMember);
router
    .route("/:id")
    .patch(auth_1.authenticateUser, (0, auth_1.authorizePermission)("عضو", "update"), uploadImage_1.upload.single("image"), member_controller_1.default.updateMember);
exports.default = router;
