"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const TransactionSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "The name is required"],
        maxlength: [200, "Address cannot exceed 200 characters"],
    },
    amount: {
        type: Number,
        required: [true, "Amount is required"],
        min: [0, "Amount cannot be negative"],
    },
    type: {
        type: String,
        enum: ["income", "expense"],
        required: [true, "Type is required"],
    },
    image: {
        type: String,
        default: "default-transaction.png",
    },
    date: {
        type: Date,
        required: [true, "Date is required"],
        default: Date.now,
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, "Description cannot exceed 500 characters"],
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    category: {
        type: String,
        enum: ["subscriptions", "donations", "investments", "other"],
        required: [true, "The category is required"],
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
const Transaction = (0, mongoose_1.model)("transaction", TransactionSchema);
exports.default = Transaction;
