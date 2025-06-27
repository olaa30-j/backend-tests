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
const asynHandler_1 = __importDefault(require("../middlewares/asynHandler"));
const customError_1 = require("../errors/customError");
const email_service_1 = require("../services/email.service");
class ContactController {
    constructor() {
        this.SendEmail = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            let { name, email, phone, department, message } = req.body;
            switch (department) {
                case "finance":
                    req.body.department = "القسم المالي";
                    break;
                case "social":
                    req.body.department = "القسم الاجتماعي";
                    break;
                case "administration":
                    req.body.department = "إدارة العامة";
                    break;
                case "technical":
                    req.body.department = "الدعم الفني";
                    break;
                default:
                    req.body.department;
            }
            yield (0, email_service_1.sendEmailToSystemAdmins)(req.body);
            yield (0, email_service_1.sendEmailToUserWhoContactUs)(req.body);
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                message: "email send successfully",
            });
        }));
    }
}
exports.default = new ContactController();
