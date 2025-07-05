"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const album_controller_1 = __importDefault(require("../controller/album.controller"));
const auth_1 = require("../middlewares/auth");
const uploadImage_1 = require("../middlewares/uploadImage");
const router = express_1.default.Router();
router.route("/stats").get(auth_1.authenticateUser, album_controller_1.default.getAlbumStats);
router
    .route("/")
    .post(auth_1.authenticateUser, (0, auth_1.authorizePermission)("معرض الصور", "create"), album_controller_1.default.createAlbum);
router
    .route("/")
    .get(auth_1.authenticateUser, (0, auth_1.authorizePermission)("معرض الصور", "view"), album_controller_1.default.getAlbums);
router.route("/:id").get(auth_1.authenticateUser, album_controller_1.default.getAlbumById);
router
    .route("/:id")
    .delete(auth_1.authenticateUser, (0, auth_1.authorizePermission)("معرض الصور", "delete"), album_controller_1.default.deleteAlbum);
router.route("/:id").put(auth_1.authenticateUser, 
// authorizePermission("album", "update"),
uploadImage_1.upload.single("image"), album_controller_1.default.uploadImageAndAddToAlbum);
router
    .route("/:id")
    .patch(auth_1.authenticateUser, (0, auth_1.authorizePermission)("معرض الصور", "update"), album_controller_1.default.updateAlbumById);
router
    .route("/:id/images/:imageId")
    .delete(auth_1.authenticateUser, (0, auth_1.authorizePermission)("معرض الصور", "update"), album_controller_1.default.deleteImageFromAlbum);
exports.default = router;
