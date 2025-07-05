"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const NotificationSchema = new mongoose_1.Schema({
    message: {
        type: String,
        required: true,
        trim: true,
    },
    action: {
        type: String,
        required: true,
        enum: [
            "create",
            "update",
            "delete",
            "view",
            "approve",
            "reject",
            "reminder",
        ],
    },
    entity: {
        type: {
            type: String,
            required: true,
            enum: ["مناسبه", "عضو", "اعلان", "ماليه", "معرض الصور", "مستخدم"],
        },
        id: {
            type: mongoose_1.Schema.Types.ObjectId,
            required: true,
            refPath: "entity.type",
        },
    },
    sender: {
        id: {
            type: mongoose_1.Schema.Types.ObjectId,
            required: true,
            ref: "users",
        },
        name: {
            type: String,
        },
        avatar: {
            type: String,
        },
    },
    recipientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: "users",
        index: true,
    },
    readAt: {
        type: Date,
        default: null,
    },
    read: {
        type: Boolean,
        default: false,
    },
    metadata: {
        deepLink: { type: String },
        customData: { type: mongoose_1.Schema.Types.Mixed },
        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium",
        },
    },
    status: {
        type: String,
        enum: ["pending", "sent", "delivered", "failed"],
        default: "pending",
    },
    show: {
        type: Boolean,
        default: false,
    },
    isMobileDelivered: { type: Boolean, default: false },
    isEmailDelivered: { type: Boolean, default: false },
    isWebDelivered: { type: Boolean, default: false },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
NotificationSchema.index({ recipientId: 1, read: 1 });
NotificationSchema.index({ "entity.type": 1, "entity.id": 1 });
const Notification = (0, mongoose_1.model)("notification", NotificationSchema);
exports.default = Notification;
