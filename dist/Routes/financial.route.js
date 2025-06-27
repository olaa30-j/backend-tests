"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const financial_controller_1 = __importDefault(require("../controller/financial.controller"));
const auth_1 = require("../middlewares/auth");
const uploadImage_1 = require("../middlewares/uploadImage");
const router = express_1.default.Router();
router
    .route("/")
    .post(auth_1.authenticateUser, (0, auth_1.authorizePermission)("ماليه", "create"), uploadImage_1.upload.single("image"), financial_controller_1.default.createTransaction);
router
    .route("/")
    .get(auth_1.authenticateUser, (0, auth_1.authorizePermission)("ماليه", "view"), financial_controller_1.default.getAllTransactions);
router
    .route("/")
    .delete(auth_1.authenticateUser, (0, auth_1.authorizePermission)("ماليه", "delete"), financial_controller_1.default.deleteAllTransactions);
router
    .route("/:id")
    .get(auth_1.authenticateUser, financial_controller_1.default.getTransactionById);
router
    .route("/:id")
    .delete(auth_1.authenticateUser, (0, auth_1.authorizePermission)("ماليه", "delete"), financial_controller_1.default.deleteTransactionById);
router
    .route("/:id")
    .patch(auth_1.authenticateUser, (0, auth_1.authorizePermission)("ماليه", "update"), uploadImage_1.upload.single("image"), financial_controller_1.default.updateTransactionById);
exports.default = router;
