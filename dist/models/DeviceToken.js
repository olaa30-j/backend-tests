"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceToken = void 0;
const mongoose_1 = require("mongoose");
const deviceTokenSchema = new mongoose_1.Schema({
    userId: { type: String, required: true },
    token: { type: String, required: true },
    platform: { type: String, default: 'android' }
});
exports.DeviceToken = (0, mongoose_1.model)('DeviceToken', deviceTokenSchema);
