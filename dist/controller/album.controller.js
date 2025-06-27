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
const album_model_1 = __importDefault(require("../models/album.model"));
const asynHandler_1 = __importDefault(require("../middlewares/asynHandler"));
const customError_1 = require("../errors/customError");
const mongoose_1 = __importDefault(require("mongoose"));
const image_model_1 = __importDefault(require("../models/image.model"));
const notify_1 = require("../utils/notify");
class AlbumController {
    constructor() {
        this.createAlbum = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { name, description } = req.body;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!name) {
                return next((0, customError_1.createCustomError)("Album name is required", customError_1.HttpCode.BAD_REQUEST));
            }
            if (!userId) {
                return next((0, customError_1.createCustomError)("Unauthorized", customError_1.HttpCode.UNAUTHORIZED));
            }
            const album = yield album_model_1.default.create({
                name,
                description,
                createdBy: userId,
            });
            yield (0, notify_1.notifyUsersWithPermission)({ entity: "معرض الصور", action: "view", value: true }, {
                sender: { id: req === null || req === void 0 ? void 0 : req.user.id },
                message: "تم إنشاءالبوم جديد",
                action: "create",
                entity: { type: "معرض الصور", id: album._id },
                metadata: {
                    priority: "medium",
                },
                status: "sent",
                read: false,
                readAt: null,
            });
            res.status(customError_1.HttpCode.CREATED).json({
                success: true,
                data: album,
                message: "Album created successfully",
            });
        }));
        this.getAlbums = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const totalAlbums = yield album_model_1.default.countDocuments();
            const albums = yield album_model_1.default.find()
                .populate("images")
                .populate({
                path: "createdBy",
                select: "-password -permissions -_id ",
                populate: {
                    path: "memberId",
                    select: "-password -permissions -_id",
                    populate: {
                        path: "familyBranch",
                        select: "-__v -createdAt -updatedAt",
                    },
                },
            })
                .skip(skip)
                .limit(limit);
            const totalPages = Math.ceil(totalAlbums / limit);
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                pagination: {
                    totalAlbums,
                    totalPages,
                    currentPage: page,
                    pageSize: albums.length,
                },
                data: albums,
                message: "Get all albums successfully",
            });
        }));
        this.deleteAlbum = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const albumId = req.params.id;
            const album = yield album_model_1.default.findById(albumId);
            if (!album) {
                return next((0, customError_1.createCustomError)("Album not found", customError_1.HttpCode.NOT_FOUND));
            }
            yield album.deleteOne();
            yield (0, notify_1.notifyUsersWithPermission)({ entity: "معرض الصور", action: "delete", value: true }, {
                sender: { id: req === null || req === void 0 ? void 0 : req.user.id },
                message: `تم حذف البوم `,
                action: "delete",
                entity: { type: "معرض الصور" },
                metadata: {
                    priority: "medium",
                },
                status: "sent",
                read: false,
                readAt: null,
            });
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: null,
                message: "Album deleted successfully",
            });
        }));
        this.getAlbumById = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const albumId = req.params.id;
            if (!mongoose_1.default.Types.ObjectId.isValid(albumId)) {
                return next((0, customError_1.createCustomError)("Invalid album ID", customError_1.HttpCode.BAD_REQUEST));
            }
            const album = yield album_model_1.default.findById(albumId)
                .populate("images")
                .populate({
                path: "createdBy",
                select: "-password -permissions -_id ",
                populate: {
                    path: "memberId",
                    select: "-password -permissions -_id",
                    populate: {
                        path: "familyBranch",
                        select: "-__v -createdAt -updatedAt",
                    },
                },
            });
            if (!album) {
                return next((0, customError_1.createCustomError)("Album not found", customError_1.HttpCode.NOT_FOUND));
            }
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: album,
                message: "Fetched album successfully",
            });
        }));
        this.uploadImageAndAddToAlbum = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const albumId = req.params.id;
            let { image, description } = req.body;
            if (!((_a = req.file) === null || _a === void 0 ? void 0 : _a.path) || !albumId) {
                return next((0, customError_1.createCustomError)("Image URL and album ID are required", customError_1.HttpCode.BAD_REQUEST));
            }
            if ((_b = req.file) === null || _b === void 0 ? void 0 : _b.path) {
                image = req.file.path.replace(/\\/g, "/");
            }
            const newImage = yield image_model_1.default.create({ image, description });
            yield newImage.save();
            const updatedAlbum = yield album_model_1.default.findByIdAndUpdate(albumId, { $push: { images: newImage._id } }, { new: true })
                .populate("images")
                .populate({
                path: "createdBy",
                select: "-password -permissions -_id ",
                populate: {
                    path: "memberId",
                    select: "-password -permissions -_id",
                    populate: {
                        path: "familyBranch",
                        select: "-__v -createdAt -updatedAt",
                    },
                },
            });
            if (!updatedAlbum) {
                return next((0, customError_1.createCustomError)("Album not found", customError_1.HttpCode.NOT_FOUND));
            }
            yield (0, notify_1.notifyUsersWithPermission)({ entity: "معرض الصور", action: "update", value: true }, {
                sender: { id: req === null || req === void 0 ? void 0 : req.user.id },
                message: `${updatedAlbum.name} تم اضافة صورة الى البوم `,
                action: "update",
                entity: { type: "معرض الصور", id: updatedAlbum._id },
                metadata: {
                    priority: "medium",
                },
                status: "sent",
                read: false,
                readAt: null,
            });
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                message: "Image uploaded and added to album",
                data: updatedAlbum,
            });
        }));
        this.updateAlbumById = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const albumId = req.params.id;
            if (!mongoose_1.default.Types.ObjectId.isValid(albumId)) {
                return next((0, customError_1.createCustomError)("Invalid album ID", customError_1.HttpCode.BAD_REQUEST));
            }
            const album = yield album_model_1.default.findById(albumId);
            if (!album) {
                return next((0, customError_1.createCustomError)("Album not found", customError_1.HttpCode.NOT_FOUND));
            }
            const updatedAlbum = yield album_model_1.default.findByIdAndUpdate(albumId, req.body, {
                new: true,
                runValidators: true,
            })
                .populate("images")
                .populate({
                path: "createdBy",
                select: "-password -permissions -_id ",
                populate: {
                    path: "memberId",
                    select: "-password -permissions -_id",
                    populate: {
                        path: "familyBranch",
                        select: "-__v -createdAt -updatedAt",
                    },
                },
            });
            yield (0, notify_1.notifyUsersWithPermission)({ entity: "معرض الصور", action: "update", value: true }, {
                sender: { id: req === null || req === void 0 ? void 0 : req.user.id },
                message: `${updatedAlbum === null || updatedAlbum === void 0 ? void 0 : updatedAlbum.name} تم تعديل البوم `,
                action: "update",
                entity: { type: "معرض الصور", id: updatedAlbum === null || updatedAlbum === void 0 ? void 0 : updatedAlbum._id },
                metadata: {
                    priority: "medium",
                },
                status: "sent",
                read: false,
                readAt: null,
            });
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: updatedAlbum,
                message: "Album updated successfully",
            });
        }));
        this.deleteImageFromAlbum = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { id: albumId, imageId } = req.params;
            if (!albumId || !imageId) {
                return next((0, customError_1.createCustomError)("Album ID and Image ID are required", customError_1.HttpCode.BAD_REQUEST));
            }
            const updatedAlbum = yield album_model_1.default.findByIdAndUpdate(albumId, { $pull: { images: imageId } }, { new: true })
                .populate("images")
                .populate({
                path: "createdBy",
                select: "-password -permissions -_id ",
                populate: {
                    path: "memberId",
                    select: "-password -permissions -_id",
                    populate: {
                        path: "familyBranch",
                        select: "-__v -createdAt -updatedAt",
                    },
                },
            });
            if (!updatedAlbum) {
                return next((0, customError_1.createCustomError)("Album not found", customError_1.HttpCode.NOT_FOUND));
            }
            const deletedImage = yield image_model_1.default.findByIdAndDelete(imageId);
            if (!deletedImage) {
                return next((0, customError_1.createCustomError)("Image not found", customError_1.HttpCode.NOT_FOUND));
            }
            yield (0, notify_1.notifyUsersWithPermission)({ entity: "معرض الصور", action: "delete", value: true }, {
                sender: { id: req === null || req === void 0 ? void 0 : req.user.id },
                message: `${updatedAlbum === null || updatedAlbum === void 0 ? void 0 : updatedAlbum.name} تم حذف صورة من البوم `,
                action: "delete",
                entity: { type: "معرض الصور", id: updatedAlbum._id },
                metadata: {
                    priority: "medium",
                },
                status: "sent",
                read: false,
                readAt: null,
            });
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                message: "Image deleted from album",
                data: updatedAlbum,
            });
        }));
        this.getAlbumStats = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const totalAlbums = yield album_model_1.default.countDocuments();
            const totalImages = yield image_model_1.default.countDocuments();
            const days = parseInt(req.query.days) || 7;
            const recentDate = new Date();
            recentDate.setDate(recentDate.getDate() - days);
            const newAlbums = yield album_model_1.default.find({
                createdAt: { $gte: recentDate },
            })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate("images")
                .populate({
                path: "createdBy",
                select: "-password -permissions -_id ",
                populate: {
                    path: "memberId",
                    select: "-password -permissions -_id",
                    populate: {
                        path: "familyBranch",
                        select: "-__v -createdAt -updatedAt",
                    },
                },
            });
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: {
                    counts: {
                        totalAlbums,
                        totalImages,
                        newAlbums: newAlbums.length,
                    },
                    recentAlbums: newAlbums,
                    timeframe: `last ${days} days`,
                },
                message: "Album statistics retrieved successfully",
            });
        }));
    }
}
exports.default = new AlbumController();
