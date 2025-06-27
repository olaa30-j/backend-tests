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
const financial_model_1 = __importDefault(require("../models/financial.model"));
const asynHandler_1 = __importDefault(require("../middlewares/asynHandler"));
const customError_1 = require("../errors/customError");
const mongoose_1 = __importDefault(require("mongoose"));
const notify_1 = require("../utils/notify");
class TransactionController {
    constructor() {
        this.createTransaction = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const { name, amount, type, date, description, category } = req.body;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return next((0, customError_1.createCustomError)("Unauthorized", customError_1.HttpCode.UNAUTHORIZED));
            }
            if (!name || !amount || !type || !category || !date) {
                return next((0, customError_1.createCustomError)("Missing required fields", customError_1.HttpCode.BAD_REQUEST));
            }
            let image;
            if ((_b = req.file) === null || _b === void 0 ? void 0 : _b.path) {
                image = req.file.path.replace(/\\/g, "/");
            }
            const transaction = yield financial_model_1.default.create({
                name,
                amount: parseFloat(amount),
                type,
                date,
                image,
                description,
                category,
                createdBy: userId,
            });
            yield (0, notify_1.notifyUsersWithPermission)({ entity: "ماليه", action: "create", value: true }, {
                sender: { id: req === null || req === void 0 ? void 0 : req.user.id },
                message: "تم إنشاء تقرير مالي جديد",
                action: "create",
                entity: { type: "ماليه", id: transaction === null || transaction === void 0 ? void 0 : transaction._id },
                metadata: {
                    priority: "medium",
                },
                status: "sent",
                read: false,
                readAt: null,
            });
            res.status(customError_1.HttpCode.CREATED).json({
                success: true,
                data: transaction,
                message: "Transaction created successfully",
            });
        }));
        this.getAllTransactions = (0, asynHandler_1.default)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const totalTransactions = yield financial_model_1.default.countDocuments();
            const transactions = yield financial_model_1.default.find()
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
            const totalPages = Math.ceil(totalTransactions / limit);
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                pagination: {
                    totalTransactions,
                    totalPages,
                    currentPage: page,
                    pageSize: transactions.length,
                },
                data: transactions,
                message: "Fetched all transactions successfully",
            });
        }));
        this.getTransactionById = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const transactionId = req.params.id;
            if (!mongoose_1.default.Types.ObjectId.isValid(transactionId)) {
                return next((0, customError_1.createCustomError)("Invalid transaction ID", customError_1.HttpCode.BAD_REQUEST));
            }
            const transaction = yield financial_model_1.default.findById(transactionId).populate({
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
            if (!transaction) {
                return next((0, customError_1.createCustomError)("Transaction not found", customError_1.HttpCode.NOT_FOUND));
            }
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: transaction,
                message: "Fetched transaction successfully",
            });
        }));
        this.deleteTransactionById = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const transactionId = req.params.id;
            if (!mongoose_1.default.Types.ObjectId.isValid(transactionId)) {
                return next((0, customError_1.createCustomError)("Invalid transaction ID", customError_1.HttpCode.BAD_REQUEST));
            }
            const transaction = yield financial_model_1.default.findById(transactionId);
            if (!transaction) {
                return next((0, customError_1.createCustomError)("Transaction not found", customError_1.HttpCode.NOT_FOUND));
            }
            yield transaction.deleteOne();
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: null,
                message: "Transaction deleted successfully",
            });
        }));
        this.updateTransactionById = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const transactionId = req.params.id;
            let updateData = req.body;
            if ((_a = req.file) === null || _a === void 0 ? void 0 : _a.path) {
                updateData.image = req.file.path.replace(/\\/g, "/");
            }
            if (updateData.amount) {
                updateData.amount = parseFloat(updateData.amount);
            }
            const cleanObject = (obj) => {
                return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== null && value !== undefined && value !== ""));
            };
            updateData = cleanObject(updateData);
            if (!mongoose_1.default.Types.ObjectId.isValid(transactionId)) {
                return next((0, customError_1.createCustomError)("Invalid transaction ID", customError_1.HttpCode.BAD_REQUEST));
            }
            const transaction = yield financial_model_1.default.findById(transactionId);
            if (!transaction) {
                return next((0, customError_1.createCustomError)("Transaction not found", customError_1.HttpCode.NOT_FOUND));
            }
            const updatedTransaction = yield financial_model_1.default.findByIdAndUpdate({ _id: transactionId }, updateData, { new: true }).populate({
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
            yield (0, notify_1.notifyUsersWithPermission)({ entity: "ماليه", action: "create", value: true }, {
                sender: { id: req === null || req === void 0 ? void 0 : req.user.id },
                message: "تم تعديل تقرير مالي",
                action: "update",
                entity: { type: "ماليه", id: updatedTransaction === null || updatedTransaction === void 0 ? void 0 : updatedTransaction._id },
                metadata: {
                    priority: "medium",
                },
                status: "sent",
                read: false,
                readAt: null,
            });
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: updatedTransaction,
                message: "Transaction updated successfully",
            });
        }));
        this.deleteAllTransactions = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { confirm } = req.body;
            if (confirm !== "true") {
                return next((0, customError_1.createCustomError)("Confirmation required. Send confirm=true in request body to delete all transactions", customError_1.HttpCode.BAD_REQUEST));
            }
            const result = yield financial_model_1.default.deleteMany();
            yield (0, notify_1.notifyUsersWithPermission)({ entity: "ماليه", action: "delete", value: true }, {
                sender: { id: req === null || req === void 0 ? void 0 : req.user.id },
                message: "تم حذف تقرير مالي",
                action: "delete",
                entity: { type: "ماليه" },
                metadata: {
                    priority: "medium",
                },
                status: "sent",
                read: false,
                readAt: null,
            });
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: { deletedCount: result.deletedCount },
                message: `All transactions deleted successfully`,
            });
        }));
    }
}
exports.default = new TransactionController();
