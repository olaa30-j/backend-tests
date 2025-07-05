"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const memberSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "users",
        default: null,
    },
    fname: {
        type: String,
        required: [true, "Last name is required"],
    },
    lname: {
        type: String,
        required: [true, "First name is required"],
    },
    gender: {
        type: String,
        enum: ["ذكر", "أنثى"],
        required: [true, "Gender is required"],
    },
    familyBranch: { type: mongoose_1.Schema.Types.ObjectId, ref: "branch" },
    familyRelationship: {
        type: String,
        enum: {
            values: [
                "ابن",
                "ابنة",
                "زوجة",
                "زوج",
                "حفيد",
                "أخرى",
                "حفيدة",
                "الجد الأعلى",
            ],
            message: "{VALUE} غير مدعوم",
        },
        required: [true, "Family Relationship is required"],
    },
    birthday: {
        type: Date,
    },
    deathDate: {
        type: Date,
    },
    summary: {
        type: String,
    },
    husband: { type: mongoose_1.Schema.Types.ObjectId, ref: "members", default: null },
    wives: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "members" }],
    isUser: {
        type: Boolean,
        default: false,
    },
    image: {
        type: String,
        default: "avatar.jfif",
    },
    parents: {
        father: { type: mongoose_1.Schema.Types.ObjectId, ref: "members" },
        mother: { type: mongoose_1.Schema.Types.ObjectId, ref: "members" },
    },
    children: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "members" }],
}, { timestamps: true, versionKey: false });
const Member = (0, mongoose_1.model)("members", memberSchema);
exports.default = Member;
