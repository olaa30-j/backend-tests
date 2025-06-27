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
const advertisement_model_1 = __importDefault(require("../models/advertisement.model"));
const asynHandler_1 = __importDefault(require("../middlewares/asynHandler"));
const customError_1 = require("../errors/customError");
const mongoose_1 = __importDefault(require("mongoose"));
const notify_1 = require("../utils/notify");
class AdvertisementController {
    constructor() {
        this.createAdvertisement = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const { title, type, content, status } = req.body;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return next((0, customError_1.createCustomError)("Unauthorized", customError_1.HttpCode.UNAUTHORIZED));
            }
            if (!title || !type || !content) {
                return next((0, customError_1.createCustomError)("Missing required fields", customError_1.HttpCode.BAD_REQUEST));
            }
            let image;
            if ((_b = req.file) === null || _b === void 0 ? void 0 : _b.path) {
                image = req.file.path.replace(/\\/g, "/");
            }
            const advertisement = yield advertisement_model_1.default.create({
                userId,
                title,
                type,
                content,
                status,
                image,
            });
            yield (0, notify_1.notifyUsersWithPermission)({ entity: "اعلان", action: "view", value: true }, {
                sender: { id: req === null || req === void 0 ? void 0 : req.user.id },
                message: "تم إنشاء إعلان جديد",
                action: "create",
                entity: { type: "اعلان", id: advertisement._id },
                metadata: {
                    priority: "medium",
                },
                status: "sent",
                read: false,
                readAt: null,
            });
            res.status(customError_1.HttpCode.CREATED).json({
                success: true,
                data: advertisement,
                message: "Advertisement created successfully",
            });
        }));
        this.getAllAdvertisements = (0, asynHandler_1.default)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const totalAdvertisements = yield advertisement_model_1.default.countDocuments();
            const advertisements = yield advertisement_model_1.default.find()
                .populate({
                path: "userId",
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
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                pagination: {
                    totalAdvertisements,
                    totalPages: Math.ceil(totalAdvertisements / limit),
                    currentPage: page,
                    pageSize: advertisements.length,
                },
                data: advertisements,
                message: "Fetched all advertisements successfully",
            });
        }));
        this.getAdvertisementById = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                return next((0, customError_1.createCustomError)("Invalid advertisement ID", customError_1.HttpCode.BAD_REQUEST));
            }
            const advertisement = yield advertisement_model_1.default.findById(id).populate({
                path: "userId",
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
            if (!advertisement) {
                return next((0, customError_1.createCustomError)("Advertisement not found", customError_1.HttpCode.NOT_FOUND));
            }
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: advertisement,
                message: "Fetched advertisement successfully",
            });
        }));
        this.updateAdvertisementById = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { id } = req.params;
            let updateData = req.body;
            if ((_a = req.file) === null || _a === void 0 ? void 0 : _a.path) {
                updateData.image = req.file.path.replace(/\\/g, "/");
            }
            const cleanObject = (obj) => Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== null && value !== undefined && value !== ""));
            updateData = cleanObject(updateData);
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                return next((0, customError_1.createCustomError)("Invalid advertisement ID", customError_1.HttpCode.BAD_REQUEST));
            }
            const advertisement = yield advertisement_model_1.default.findById(id);
            if (!advertisement) {
                return next((0, customError_1.createCustomError)("Advertisement not found", customError_1.HttpCode.NOT_FOUND));
            }
            const updatedAdvertisement = yield advertisement_model_1.default.findByIdAndUpdate(id, updateData, { new: true }).populate({
                path: "userId",
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
            yield (0, notify_1.notifyUsersWithPermission)({ entity: "اعلان", action: "update", value: true }, {
                sender: { id: req === null || req === void 0 ? void 0 : req.user.id },
                message: "تم تعديل إعلان  ",
                action: "update",
                entity: { type: "اعلان", id: advertisement._id },
                metadata: {
                    priority: "medium",
                },
                status: "sent",
                read: false,
                readAt: null,
            });
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: updatedAdvertisement,
                message: "Advertisement updated successfully",
            });
        }));
        this.deleteAdvertisementById = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                return next((0, customError_1.createCustomError)("Invalid advertisement ID", customError_1.HttpCode.BAD_REQUEST));
            }
            const advertisement = yield advertisement_model_1.default.findById(id);
            if (!advertisement) {
                return next((0, customError_1.createCustomError)("Advertisement not found", customError_1.HttpCode.NOT_FOUND));
            }
            yield advertisement.deleteOne();
            yield (0, notify_1.notifyUsersWithPermission)({ entity: "اعلان", action: "delete", value: true }, {
                sender: { id: req === null || req === void 0 ? void 0 : req.user.id },
                message: "تم حذف إعلان",
                action: "delete",
                entity: { type: "اعلان", id: advertisement._id },
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
                message: "Advertisement deleted successfully",
            });
        }));
        this.deleteAllAdvertisements = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { confirm } = req.body;
            if (confirm !== "true") {
                return next((0, customError_1.createCustomError)("Confirmation required. Send confirm=true in request body to delete all advertisements", customError_1.HttpCode.BAD_REQUEST));
            }
            const result = yield advertisement_model_1.default.deleteMany();
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: { deletedCount: result.deletedCount },
                message: "All advertisements deleted successfully",
            });
        }));
        this.getAdvertisementStats = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const totalAdvertisements = yield advertisement_model_1.default.countDocuments();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const newAdvertisementsLast7Days = yield advertisement_model_1.default.countDocuments({
                createdAt: { $gte: sevenDaysAgo },
            });
            const newAdvertisements = yield advertisement_model_1.default.find({
                createdAt: { $gte: sevenDaysAgo },
            })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate("userId");
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: {
                    totalAdvertisements,
                    newAdvertisementsLast7Days,
                    newAdvertisements,
                    last7DaysStart: sevenDaysAgo,
                    last7DaysEnd: new Date(),
                },
                message: "Advertisement statistics retrieved successfully",
            });
        }));
    }
}
exports.default = new AdvertisementController();
