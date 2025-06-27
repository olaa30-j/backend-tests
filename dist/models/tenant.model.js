"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const tenantSchema = new mongoose_1.Schema({
    familyName: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    subscriptionPlan: {
        type: String,
        enum: ["free", "pro", "enterprise"],
        default: "free",
    },
}, { timestamps: true, versionKey: false });
const Tenant = (0, mongoose_1.model)("tenant", tenantSchema);
exports.default = Tenant;
