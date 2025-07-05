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
const member_model_1 = __importDefault(require("../models/member.model"));
const customError_1 = require("../errors/customError");
const user_model_1 = __importDefault(require("../models/user.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const notify_1 = require("../utils/notify");
const branch_model_1 = __importDefault(require("../models/branch.model"));
const DEFAULT_IMAGE_URL = "https://res.cloudinary.com/dmhvfuuke/image/upload/v1750092490/avatar_bdtadk.jpg";
class MemberController {
    constructor() {
        this.createMember = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { fname, lname, familyBranch, familyRelationship, gender, husband, wives, parents, children, } = req.body;
            if ((_a = req.file) === null || _a === void 0 ? void 0 : _a.path) {
                req.body.image = req.file.path.replace(/\\/g, "/");
            }
            else {
                req.body.image = DEFAULT_IMAGE_URL;
            }
            if (!fname || !lname || !gender || !familyBranch || !familyRelationship) {
                return next((0, customError_1.createCustomError)("First name, last name, gender, familyRelationship and family branch are required.", customError_1.HttpCode.BAD_REQUEST));
            }
            const existingFamilyBranch = yield branch_model_1.default.findOne({ _id: familyBranch });
            if (!existingFamilyBranch) {
                return next((0, customError_1.createCustomError)(`family branch: ${familyBranch} not found`, customError_1.HttpCode.NOT_FOUND));
            }
            //check full name is unique
            const fullName = `${fname} ${lname}`;
            req.body.fullName = fullName;
            const existingMember = yield member_model_1.default.findOne({ fullName });
            if (existingMember) {
                return next((0, customError_1.createCustomError)(`يوجد بالفعل عضو باسم '${fullName}'. يرجى اسم اضافى لتمييز فريد مثل '${fullName} 1'.`, customError_1.HttpCode.BAD_REQUEST));
            }
            // check for only one grandfather
            if (familyRelationship === "الجد الأعلى") {
                const existingHead = yield member_model_1.default.findOne({
                    familyRelationship: "الجد الأعلى",
                });
                if (existingHead) {
                    return next((0, customError_1.createCustomError)(`This family branch already has a male head (${existingHead.fname} ${existingHead.lname})`, customError_1.HttpCode.BAD_REQUEST));
                }
            }
            const memberData = Object.assign({}, req.body);
            delete memberData.husband;
            delete memberData.wives;
            delete memberData.parents;
            delete memberData.children;
            const member = yield member_model_1.default.create(memberData);
            //if member is husband
            if (wives && Array.isArray(wives) && wives.length > 0) {
                const wifeMembers = yield member_model_1.default.find({ _id: { $in: wives } });
                if (wifeMembers.length !== wives.length) {
                    yield member_model_1.default.findByIdAndDelete(member._id);
                    return next((0, customError_1.createCustomError)("One or more wives not found", customError_1.HttpCode.BAD_REQUEST));
                }
                const nonFemales = wifeMembers.filter((w) => w.gender !== "أنثى");
                if (nonFemales.length > 0) {
                    return next((0, customError_1.createCustomError)("All wives must be female", customError_1.HttpCode.BAD_REQUEST));
                }
                yield member_model_1.default.findByIdAndUpdate(member._id, { $set: { wives: wives } }, { new: true });
                for (const wifeId of wives) {
                    yield member_model_1.default.findByIdAndUpdate(wifeId, { $set: { husband: member._id } }, { new: true });
                }
            }
            //if member is wife
            if (familyRelationship === "زوجة" && husband) {
                const husbandMember = yield member_model_1.default.findById(husband);
                if (!husbandMember) {
                    yield member_model_1.default.findByIdAndDelete(member._id);
                    return next((0, customError_1.createCustomError)("Husband not found", customError_1.HttpCode.BAD_REQUEST));
                }
                if (husbandMember.gender !== "ذكر") {
                    yield member_model_1.default.findByIdAndDelete(member._id);
                    return next((0, customError_1.createCustomError)("Husband must be male", customError_1.HttpCode.BAD_REQUEST));
                }
                if (husbandMember.familyBranch.toString() !== familyBranch.toString()) {
                    yield member_model_1.default.findByIdAndDelete(member._id);
                    return next((0, customError_1.createCustomError)("Husband must be from the same family branch", customError_1.HttpCode.BAD_REQUEST));
                }
                yield member_model_1.default.findByIdAndUpdate(member._id, { $set: { husband: husband } }, { new: true });
                yield member_model_1.default.findByIdAndUpdate(husband, { $addToSet: { wives: member._id } }, { new: true });
            }
            if ((parents === null || parents === void 0 ? void 0 : parents.father) || (parents === null || parents === void 0 ? void 0 : parents.mother)) {
                const updates = {};
                if (parents.father && mongoose_1.default.Types.ObjectId.isValid(parents.father)) {
                    const father = yield member_model_1.default.findById(parents.father);
                    if (!father) {
                        yield member_model_1.default.findByIdAndDelete(member._id);
                        return next((0, customError_1.createCustomError)("Father not found", customError_1.HttpCode.BAD_REQUEST));
                    }
                    updates.parents = { father: parents.father };
                    yield member_model_1.default.findByIdAndUpdate(parents.father, { $addToSet: { children: member._id } }, { new: true });
                }
                if (parents.mother && mongoose_1.default.Types.ObjectId.isValid(parents.mother)) {
                    const mother = yield member_model_1.default.findById(parents.mother);
                    if (!mother) {
                        yield member_model_1.default.findByIdAndDelete(member._id);
                        return next((0, customError_1.createCustomError)("Mother not found", customError_1.HttpCode.BAD_REQUEST));
                    }
                    updates.parents = Object.assign(Object.assign({}, updates.parents), { mother: parents.mother });
                    yield member_model_1.default.findByIdAndUpdate(parents.mother, { $addToSet: { children: member._id } }, { new: true });
                }
                if (Object.keys(updates).length > 0) {
                    yield member_model_1.default.findByIdAndUpdate(member._id, updates, { new: true });
                }
            }
            if (children) {
                let childrenArray = Array.isArray(children) ? children : [children];
                childrenArray = childrenArray.filter((c) => mongoose_1.default.Types.ObjectId.isValid(c));
                if (childrenArray.length > 0) {
                    const childrenExist = yield member_model_1.default.countDocuments({
                        _id: { $in: childrenArray },
                    });
                    if (childrenExist !== childrenArray.length) {
                        yield member_model_1.default.findByIdAndDelete(member._id);
                        return next((0, customError_1.createCustomError)("One or more children not found", customError_1.HttpCode.BAD_REQUEST));
                    }
                    yield member_model_1.default.findByIdAndUpdate(member._id, { $set: { children: childrenArray } }, { new: true });
                    for (const childId of childrenArray) {
                        if (gender === "ذكر") {
                            yield member_model_1.default.findByIdAndUpdate(childId, { $set: { "parents.father": member._id } }, { new: true });
                        }
                        else {
                            yield member_model_1.default.findByIdAndUpdate(childId, { $set: { "parents.mother": member._id } }, { new: true });
                        }
                    }
                }
            }
            yield (0, notify_1.notifyUsersWithPermission)({ entity: "عضو", action: "create", value: true }, {
                sender: { id: req === null || req === void 0 ? void 0 : req.user.id },
                message: "تم إنشاءعضو جديد",
                action: "create",
                entity: { type: "عضو", id: member === null || member === void 0 ? void 0 : member._id },
                metadata: {
                    priority: "medium",
                },
                status: "sent",
                read: false,
                readAt: null,
            });
            res.status(customError_1.HttpCode.CREATED).json({
                success: true,
                message: "Member created successfully",
                data: member,
            });
        }));
        this.updateMember = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const { id } = req.params;
            const { fname, lname, familyBranch, familyRelationship, gender, husband, wives, parents, children, } = req.body;
            const member = yield member_model_1.default.findById(id);
            if (!member) {
                return next((0, customError_1.createCustomError)("Member not found", customError_1.HttpCode.NOT_FOUND));
            }
            const existingFamilyBranch = yield branch_model_1.default.findOne({ _id: familyBranch });
            if (!existingFamilyBranch) {
                return next((0, customError_1.createCustomError)(`family branch: ${familyBranch} not found`, customError_1.HttpCode.NOT_FOUND));
            }
            if ((_a = req.file) === null || _a === void 0 ? void 0 : _a.path) {
                req.body.image = req.file.path.replace(/\\/g, "/");
            }
            //check for unique fullname
            if (fname || lname) {
                const fullName = `${fname || member.fname} ${lname || member.lname}`;
                const existingMember = yield member_model_1.default.findOne({
                    fullName,
                    _id: { $ne: id },
                });
                if (existingMember) {
                    return next((0, customError_1.createCustomError)(`يوجد بالفعل عضو باسم '${fullName}'. يرجى اسم اضافى لتمييز فريد مثل '${fullName} 1'.`, customError_1.HttpCode.BAD_REQUEST));
                }
                req.body.fullName = fullName;
            }
            //check only one head for the family
            if (familyRelationship === "الجد الأعلى" &&
                member.familyRelationship !== "الجد الأعلى") {
                const existingHead = yield member_model_1.default.findOne({
                    familyRelationship: "الجد الأعلى",
                });
                if (existingHead) {
                    return next((0, customError_1.createCustomError)(`This family branch already has a male head (${existingHead.fname} ${existingHead.lname})`, customError_1.HttpCode.BAD_REQUEST));
                }
            }
            //handle wives update
            if (wives !== undefined && Array.isArray(wives) && wives.length > 0) {
                yield member_model_1.default.updateMany({ _id: { $in: member.wives } }, { $unset: { husband: "" } });
                if (wives.length > 0) {
                    const wifeMembers = yield member_model_1.default.find({ _id: { $in: wives } });
                    if (wifeMembers.length !== wives.length ||
                        wifeMembers.some((w) => w.gender !== "أنثى")) {
                        throw (0, customError_1.createCustomError)("All wives must be female and exist.", customError_1.HttpCode.BAD_REQUEST);
                    }
                    yield member_model_1.default.updateMany({ _id: { $in: wives } }, { $set: { husband: member._id } });
                }
            }
            // Handle husband update
            if (husband !== undefined) {
                const husbandMember = yield member_model_1.default.findById(husband);
                if (!husbandMember ||
                    husbandMember.gender !== "ذكر" ||
                    husbandMember.familyBranch.toString() !==
                        member.familyBranch.toString()) {
                    throw (0, customError_1.createCustomError)("Invalid husband relationship.", customError_1.HttpCode.BAD_REQUEST);
                }
                yield member_model_1.default.findByIdAndUpdate(husband, {
                    $addToSet: { wives: member._id },
                });
            }
            // Handle parents update
            if (parents !== undefined) {
                //update for father
                if (parents.father) {
                    // 1. Remove member as child from old father
                    const oldFather = (_b = member === null || member === void 0 ? void 0 : member.parents) === null || _b === void 0 ? void 0 : _b.father;
                    if (oldFather) {
                        yield member_model_1.default.findByIdAndUpdate(oldFather, {
                            $pull: { children: member._id },
                        });
                    }
                    // 2. Add member as child to new father
                    yield member_model_1.default.findByIdAndUpdate(parents.father, {
                        $addToSet: { children: member._id },
                    });
                }
                //update for mother
                if (parents.mother) {
                    // 1. Remove member as child from old mother
                    const oldMother = (_c = member === null || member === void 0 ? void 0 : member.parents) === null || _c === void 0 ? void 0 : _c.mother;
                    if (oldMother) {
                        yield member_model_1.default.findByIdAndUpdate(oldMother, {
                            $pull: { children: member._id },
                        });
                    }
                    // 2. Add member as child to new mother
                    yield member_model_1.default.findByIdAndUpdate(parents.mother, {
                        $addToSet: { children: member._id },
                    });
                }
            }
            // Handle children update
            if (children !== undefined) {
                for (const childId of children) {
                    yield member_model_1.default.findByIdAndUpdate(childId, {
                        $set: {
                            [`parents.${member.gender === "ذكر" ? "father" : "mother"}`]: member._id,
                        },
                    }, { new: true });
                }
            }
            const updatedMember = yield member_model_1.default.findByIdAndUpdate(id, req.body, {
                new: true,
                runValidators: true,
            })
                .populate("userId")
                .populate("husband")
                .populate("wives")
                .populate("parents.father")
                .populate("parents.mother")
                .populate("children")
                .populate("familyBranch");
            yield (0, notify_1.notifyUsersWithPermission)({ entity: "عضو", action: "create", value: true }, {
                sender: { id: req === null || req === void 0 ? void 0 : req.user.id },
                message: "تم تعديل عضو",
                action: "update",
                entity: { type: "عضو", id: updatedMember === null || updatedMember === void 0 ? void 0 : updatedMember._id },
                metadata: {
                    priority: "medium",
                },
                status: "sent",
                read: false,
                readAt: null,
            });
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: updatedMember,
                message: "Member updated successfully",
            });
        }));
        this.getAllMembers = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const { familyBranch, familyRelationship } = req.query;
            const filter = {};
            if (familyBranch) {
                filter.familyBranch = familyBranch;
                const existingFamilyBranch = yield branch_model_1.default.findOne({ _id: familyBranch });
                if (!existingFamilyBranch) {
                    return next((0, customError_1.createCustomError)(`family branch: ${familyBranch} not found`, customError_1.HttpCode.NOT_FOUND));
                }
            }
            if (familyRelationship) {
                filter.familyRelationship = familyRelationship;
            }
            const totalMembers = yield member_model_1.default.countDocuments(filter);
            const members = yield member_model_1.default.find(filter)
                .populate("userId")
                .populate("husband")
                .populate("wives")
                .populate("parents.father")
                .populate("parents.mother")
                .populate("parents")
                .populate("children")
                .populate("familyBranch")
                .skip(skip)
                .limit(limit);
            const totalPages = Math.ceil(totalMembers / limit);
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: members,
                pagination: {
                    totalMembers,
                    totalPages,
                    currentPage: page,
                    pageSize: members.length,
                },
                message: "Members retrieved successfully",
            });
        }));
        this.getMemberById = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const member = yield member_model_1.default.findById(id)
                .populate("userId")
                .populate("husband")
                .populate("wives")
                .populate("parents.father")
                .populate("parents.mother")
                .populate("parents")
                .populate("children")
                .populate("familyBranch");
            if (!member) {
                return next((0, customError_1.createCustomError)("Member not found", customError_1.HttpCode.NOT_FOUND));
            }
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: member,
                message: "Member retrieved successfully",
            });
        }));
        this.deleteMember = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            const member = yield member_model_1.default.findById(id).session(session);
            if (!member) {
                yield session.abortTransaction();
                session.endSession();
                throw (0, customError_1.createCustomError)("Member not found", customError_1.HttpCode.NOT_FOUND);
            }
            if (member.userId) {
                yield user_model_1.default.findByIdAndDelete(member.userId).session(session);
            }
            yield member_model_1.default.findByIdAndDelete(id).session(session);
            yield session.commitTransaction();
            session.endSession();
            yield (0, notify_1.notifyUsersWithPermission)({ entity: "عضو", action: "delete", value: true }, {
                sender: { id: req === null || req === void 0 ? void 0 : req.user.id },
                message: "تم حذف عضو",
                action: "delete",
                entity: { type: "عضو" },
                metadata: {
                    priority: "medium",
                },
                status: "sent",
                read: false,
                readAt: null,
            });
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                message: member.userId
                    ? "Member and user deleted successfully"
                    : "Member deleted successfully",
                data: null,
            });
        }));
    }
}
exports.default = new MemberController();
