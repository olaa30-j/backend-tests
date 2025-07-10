"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const permission_model_1 = require("./permission.model");
const userSchema = new mongoose_1.Schema({
    tenantId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "tenant",
        required: true,
    },
    memberId: { type: mongoose_1.Schema.Types.ObjectId, ref: "members", index: true },
    email: {
        type: String,
        required: [true, "Email address is required"],
        unique: true,
        validate: {
            validator: (value) => {
                let pattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
                return pattern.test(value);
            },
            message: "Please fill a valid email address",
        },
    },
    password: {
        type: String,
        required: [true, "Please provide password"],
    },
    phone: {
        type: Number,
        required: [true, "Please provide phone number"],
    },
    role: {
        type: [String],
        default: ["مستخدم"],
        validate: {
            validator: function (roles) {
                return roles.length > 0;
            },
            message: "User must have at least one role",
        },
    },
    status: {
        type: String,
        enum: {
            values: ["قيد الانتظار", "مرفوض", "مقبول"],
            message: "{VALUE} غير مدعوم",
        },
        default: "قيد الانتظار",
    },
    address: {
        type: String,
    },
    permissions: {
        type: [permission_model_1.actionPermissionSchema],
        default: permission_model_1.defaultPermissions,
    },
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpires: {
        type: Date,
    },
    fcmToken: {
        type: String,
        default: null
    }
}, { timestamps: true, versionKey: false });
userSchema.methods = {
    addRole: function (role) {
        if (!this.role.includes(role)) {
            this.role.push(role);
            return true;
        }
        return false;
    },
    removeRole: function (role) {
        const initialLength = this.role.length;
        this.role = this.role.filter((r) => r !== role);
        if (this.role.length === 0) {
            this.role = ["user"];
            return false;
        }
        return this.role.length < initialLength;
    },
    hasRole: function (role) {
        return this.role.includes(role);
    },
    hasAnyRole: function (roles) {
        return this.role.some((userRole) => roles.includes(userRole));
    },
    getRoles: function () {
        return this.role;
    },
};
const User = (0, mongoose_1.model)("users", userSchema);
exports.default = User;
