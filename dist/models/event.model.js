"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const eventSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    address: {
        type: String,
        required: [true, "The address is required"],
    },
    description: {
        type: String,
        required: [true, "The description is required"],
    },
    location: {
        type: String,
        required: [true, "The event Location is required"],
    },
    startDate: {
        type: Date,
        required: [true, "The start Date is required"],
    },
    endDate: {
        type: Date,
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
const Event = (0, mongoose_1.model)("events", eventSchema);
exports.default = Event;
