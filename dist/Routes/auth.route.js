"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = __importDefault(require("../controller/auth.controller"));
const uploadImage_1 = require("../middlewares/uploadImage");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router.route("/register").post(uploadImage_1.upload.single("image"), auth_controller_1.default.register);
router.route("/login").post(auth_controller_1.default.login);
router.route("/logout").post(auth_controller_1.default.logout);
router.route("/forgot-password").post(auth_controller_1.default.forgotPassword);
router.route("/reset-password/:token").post(auth_controller_1.default.resetPassword);
router.patch("/change-password", auth_1.authenticateUser, auth_controller_1.default.changePassword);
exports.default = router;
