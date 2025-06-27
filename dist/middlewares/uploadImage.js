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
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const express_1 = __importDefault(require("express"));
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const cloudinary_service_1 = __importDefault(require("../services/cloudinary.service"));
const route = express_1.default.Router();
route.use(express_1.default.static("public/uploads"));
// Test the configuration
cloudinary_service_1.default.api
    .ping()
    .then(() => {
    console.log("Cloudinary is configured correctly");
})
    .catch((err) => {
    console.error("Error configuring Cloudinary:", err);
});
// Create store from Cloudinary
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_service_1.default,
    params: (req, file) => __awaiter(void 0, void 0, void 0, function* () {
        return {
            folder: "uploads",
            allowed_formats: ["jpg", "jpeg", "png", "gif"],
            public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
            transformation: [{ width: 500, height: 500, crop: "limit" }],
        };
    }),
});
const multerFilter = function (req, file, cb) {
    const acceptedMimetypes = ["image/jpeg", "image/png", "image/gif"];
    if (acceptedMimetypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(null, false);
        throw new Error("Not an accepted image format");
    }
};
exports.upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: multerFilter,
});
