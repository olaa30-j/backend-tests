"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const advertisement_controller_1 = __importDefault(require("../controller/advertisement.controller"));
const auth_1 = require("../middlewares/auth");
const uploadImage_1 = require("../middlewares/uploadImage");
const router = express_1.default.Router();
router
    .route("/stats")
    .get(auth_1.authenticateUser, advertisement_controller_1.default.getAdvertisementStats);
router
    .route("/")
    .post(auth_1.authenticateUser, (0, auth_1.authorizePermission)("اعلان", "create"), uploadImage_1.upload.single("image"), advertisement_controller_1.default.createAdvertisement);
router
    .route("/")
    .get(auth_1.authenticateUser, (0, auth_1.authorizePermission)("اعلان", "view"), advertisement_controller_1.default.getAllAdvertisements);
router
    .route("/")
    .delete(auth_1.authenticateUser, (0, auth_1.authorizePermission)("اعلان", "delete"), advertisement_controller_1.default.deleteAllAdvertisements);
router
    .route("/:id")
    .get(auth_1.authenticateUser, advertisement_controller_1.default.getAdvertisementById);
router
    .route("/:id")
    .delete(auth_1.authenticateUser, (0, auth_1.authorizePermission)("اعلان", "delete"), advertisement_controller_1.default.deleteAdvertisementById);
router
    .route("/:id")
    .patch(auth_1.authenticateUser, (0, auth_1.authorizePermission)("اعلان", "update"), uploadImage_1.upload.single("image"), advertisement_controller_1.default.updateAdvertisementById);
exports.default = router;
