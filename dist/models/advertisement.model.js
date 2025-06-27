"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const advertisementSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    title: {
        type: String,
        required: [true, "The title is required"],
    },
    type: {
        type: String,
        enum: {
            values: ["important", "general", "social"],
            message: "{VALUE} is not supported",
        },
    },
    content: {
        type: String,
        required: [true, "The advertisement content is required"],
    },
    image: {
        type: String,
    },
    status: {
        type: String,
        enum: {
            values: ["pending", "reject", "accept"],
            message: "{VALUE} is not supported",
        },
        default: "pending",
    },
}, { timestamps: true, versionKey: false });
const Advertisement = (0, mongoose_1.model)("advertisement", advertisementSchema);
exports.default = Advertisement;
