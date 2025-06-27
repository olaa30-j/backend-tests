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
const asynHandler_1 = __importDefault(require("../middlewares/asynHandler"));
const customError_1 = require("../errors/customError");
const branch_model_1 = __importDefault(require("../models/branch.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const member_model_1 = __importDefault(require("../models/member.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
class BranchController {
    constructor() {
        this.createBranch = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { name, branchOwner } = req.body;
            if (!name) {
                return next((0, customError_1.createCustomError)("Branch name is required", customError_1.HttpCode.BAD_REQUEST));
            }
            const existingBranch = yield branch_model_1.default.findOne({ name });
            if (existingBranch) {
                return next((0, customError_1.createCustomError)("Branch with this name already exists", customError_1.HttpCode.CONFLICT));
            }
            const branch = yield branch_model_1.default.create({
                name,
                branchOwner,
                show: true, // Default to visible
            });
            res.status(customError_1.HttpCode.CREATED).json({
                success: true,
                data: branch,
                message: "Branch created successfully",
            });
        }));
        this.getAllBranches = (0, asynHandler_1.default)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 15;
            const skip = (page - 1) * limit;
            const totalBranches = yield branch_model_1.default.countDocuments();
            const branches = yield branch_model_1.default.find()
                .select("-__v -createdAt -updatedAt")
                .populate({
                path: 'branchOwner',
                select: 'fname lname familyRelationship gender image',
                options: { sort: { createdAt: -1 } }
            })
                .skip(skip)
                .limit(limit);
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                pagination: {
                    totalBranches,
                    totalPages: Math.ceil(totalBranches / limit),
                    currentPage: page,
                    pageSize: branches.length,
                },
                data: branches,
                message: "Branches retrieved successfully",
            });
        }));
        this.getBranchById = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                return next((0, customError_1.createCustomError)("Invalid branch ID", customError_1.HttpCode.BAD_REQUEST));
            }
            const branch = yield branch_model_1.default.findById(id).populate({
                path: 'branchOwner',
                select: 'fname lname familyRelationship gender image',
                options: { sort: { createdAt: -1 } }
            });
            if (!branch) {
                return next((0, customError_1.createCustomError)("Branch not found", customError_1.HttpCode.NOT_FOUND));
            }
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: branch,
                message: "Branch retrieved successfully",
            });
        }));
        this.updateBranch = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { name, show, branchOwner } = req.body;
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                return next((0, customError_1.createCustomError)("Invalid branch ID", customError_1.HttpCode.BAD_REQUEST));
            }
            const branch = yield branch_model_1.default.findById(id);
            if (!branch) {
                return next((0, customError_1.createCustomError)("Branch not found", customError_1.HttpCode.NOT_FOUND));
            }
            if (name) {
                const existingBranch = yield branch_model_1.default.findOne({ name, _id: { $ne: id } });
                if (existingBranch) {
                    return next((0, customError_1.createCustomError)("Another branch with this name already exists", customError_1.HttpCode.CONFLICT));
                }
                branch.name = name;
            }
            if (typeof show === "boolean") {
                branch.show = show;
            }
            if (branchOwner !== undefined) {
                branch.branchOwner = branchOwner;
            }
            yield branch.save();
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: branch,
                message: "Branch updated successfully",
            });
        }));
        this.toggleBranchVisibility = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                return next((0, customError_1.createCustomError)("Invalid branch ID", customError_1.HttpCode.BAD_REQUEST));
            }
            const branch = yield branch_model_1.default.findById(id);
            if (!branch) {
                return next((0, customError_1.createCustomError)("Branch not found", customError_1.HttpCode.NOT_FOUND));
            }
            branch.show = !branch.show;
            yield branch.save();
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: branch,
                message: `Branch visibility ${branch.show ? "enabled" : "disabled"}`,
            });
        }));
        this.deleteBranch = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                return next((0, customError_1.createCustomError)("Invalid branch ID", customError_1.HttpCode.BAD_REQUEST));
            }
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            const branch = yield branch_model_1.default.findByIdAndDelete(id);
            if (!branch) {
                yield session.abortTransaction();
                return next((0, customError_1.createCustomError)("Branch not found", customError_1.HttpCode.NOT_FOUND));
            }
            const members = yield member_model_1.default.find({ familyBranch: id })
                .select("_id userId")
                .session(session);
            const memberIds = members.map((m) => m._id);
            yield Promise.all([
                member_model_1.default.deleteMany({ familyBranch: id }).session(session),
                user_model_1.default.deleteMany({ memberId: { $in: memberIds } }).session(session),
                branch_model_1.default.findByIdAndDelete(id).session(session),
            ]);
            yield session.commitTransaction();
            session.endSession();
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: null,
                message: "Branch deleted successfully",
            });
        }));
    }
}
exports.default = new BranchController();
