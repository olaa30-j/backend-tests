"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultPermissions = exports.permissionSchema = exports.actionPermissionSchema = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.actionPermissionSchema = new mongoose_1.Schema({
    entity: {
        type: String,
        required: true,
        enum: ["مناسبه", "عضو", "مستخدم", "معرض الصور", "ماليه", "اعلان"],
    },
    view: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
}, { _id: false });
exports.permissionSchema = new mongoose_1.Schema({
    role: { type: String },
    permissions: [exports.actionPermissionSchema],
}, { timestamps: true });
const Permission = mongoose_1.default.model("permission", exports.permissionSchema);
exports.default = Permission;
exports.defaultPermissions = [
    {
        entity: "مناسبه",
        view: false,
        update: false,
        delete: false,
        create: false,
    },
    {
        entity: "عضو",
        view: false,
        update: false,
        delete: false,
        create: false,
    },
    {
        entity: "مستخدم",
        view: false,
        update: false,
        delete: false,
        create: false,
    },
    {
        entity: "معرض الصور",
        view: false,
        update: false,
        delete: false,
        create: false,
    },
    {
        entity: "ماليه",
        view: false,
        update: false,
        delete: false,
        create: false,
    },
    {
        entity: "اعلان",
        view: false,
        update: false,
        delete: false,
        create: false,
    },
];
