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
exports.sendEmailToUserWhoContactUs = exports.sendEmailToSystemAdmins = exports.sendEmailToUsersWithPermission = exports.sendPasswordResetEmail = exports.sendAccountStatusEmail = exports.sendWelcomeEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const user_model_1 = __importDefault(require("../models/user.model"));
const customError_1 = require("../errors/customError");
const transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false,
    },
    connectionTimeout: 30000,
});
const primaryColor = "#2F80A2";
const secondaryColor = "#f5f5f5";
const emailTemplate = (content) => `
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; border: 2px solid ${primaryColor}; border-radius: 8px; overflow: hidden;">
    <div style="padding: 20px; text-align: center;">
      <img src="cid:logo" alt="Family Logo" style="max-width:150px; height:auto; display:block; margin:0 auto;">
    </div>
    
    <div style="padding: 30px; background-color: white; text-align: right;">
      ${content}
    </div>
    
    <div style="background-color: ${secondaryColor}; padding: 20px; text-align: center; font-size: 14px; color: #666;">
      <p>© ${new Date().getFullYear()} جميع الحقوق محفوظة</p>
      <p>هذه رسالة تلقائية، يرجى عدم الرد عليها</p>
    </div>
  </div>
</body>
</html>
`;
const sendWelcomeEmail = (user) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const content = `
      <h2 style="color: ${primaryColor}; text-align: center;">!مرحباً بك في منصتنا</h2>
      <p style="margin: 10px 0;">،عزيزي/عزيزتي ${"المستخدم"}</p>
      <p style="margin: 10px 0;">.شكراً لتسجيلك معنا. لقد تم استلام طلب إنشاء حسابك وهو الآن قيد المراجعة</p>
      <p style="margin: 10px 0;">.سوف تتلقى إشعاراً بالبريد الإلكتروني بمجرد اكتمال مراجعة حسابك</p>
      
      <div style="border-top: 1px solid #eee; margin: 20px 0;"></div>
      
      <p style="margin: 10px 0;">:إذا كان لديك أي استفسارات، لا تتردد في التواصل معنا</p>
      ${process.env.SUPPORT_EMAIL
            ? `<p style="margin: 10px 0;"><strong>:البريد الإلكتروني للدعم</strong> 
              <a href="mailto:${process.env.SUPPORT_EMAIL}" style="color: ${primaryColor}; text-decoration: none;">
                ${process.env.SUPPORT_EMAIL}
              </a>
            </p>`
            : ""}
    `;
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: "مرحبًا بكم في منصتنا - الحساب قيد المراجعة",
            html: emailTemplate(content),
            attachments: [
                {
                    filename: "logo.png",
                    path: "https://res.cloudinary.com/dmhvfuuke/image/upload/v1748029147/family-logo_z54fug.png",
                    cid: "logo",
                },
            ],
        };
        yield transporter.sendMail(mailOptions);
    }
    catch (error) {
        throw (0, customError_1.createCustomError)("Error sending welcome email:", customError_1.HttpCode.BAD_REQUEST);
    }
});
exports.sendWelcomeEmail = sendWelcomeEmail;
const sendAccountStatusEmail = (user) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(user === null || user === void 0 ? void 0 : user.email) || !(user === null || user === void 0 ? void 0 : user.status)) {
        console.error("Invalid user object - missing email or status");
        return;
    }
    if (!["مقبول", "مرفوض"].includes(user.status)) {
        console.log(`Skipping email for status: ${user.status}`);
        return;
    }
    try {
        const { subject, content } = user.status === "مقبول"
            ? {
                subject: "تم تفعيل حسابك بنجاح",
                content: `
            <h2 style="color: ${primaryColor}; text-align: center; margin-bottom: 20px;">!تم تفعيل حسابك بنجاح</h2>
            <p style="margin: 10px 0; font-size: 16px;">،عزيزي/عزيزتي ${"المستخدم"}</p>
            <p style="margin: 10px 0; font-size: 16px;">.يسرنا إعلامك بأنه تم الموافقة على حسابك بنجاح في منصتنا </p>
            <p style="margin: 10px 0; font-size: 16px;">.يمكنك الآن تسجيل الدخول والاستفادة من جميع الخدمات المقدمة</p>
            
            ${process.env.FRONTEND_LOGIN_URL
                    ? `
            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.FRONTEND_LOGIN_URL}" style="display: inline-block; padding: 12px 24px; background-color: ${primaryColor}; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
                تسجيل الدخول الآن
              </a>
            </div>
            `
                    : ""}
            
            <div style="border-top: 1px solid #eee; margin: 20px 0;"></div>
            
            <p style="margin: 10px 0; font-size: 16px;">:في حال واجهتك أي صعوبات، لا تتردد في التواصل مع فريق الدعم </p>
            ${process.env.SUPPORT_EMAIL
                    ? `
            <p style="margin: 10px 0; font-size: 16px;"><strong>البريد الإلكتروني:</strong> <a href="mailto:${process.env.SUPPORT_EMAIL}" style="color: ${primaryColor}; text-decoration: none;">${process.env.SUPPORT_EMAIL}</a></p>
            `
                    : ""}
          `,
            }
            : {
                subject: "حالة طلب التسجيل",
                content: `
            <h2 style="color: ${primaryColor}; text-align: center; margin-bottom: 20px;">حالة طلب التسجيل</h2>
            <p style="margin: 10px 0; font-size: 16px;">،عزيزي/عزيزتي ${"المستخدم"}</p>
            <p style="margin: 10px 0; font-size: 16px;">.نأسف لإعلامك بأنه لا يمكننا الموافقة على طلب التسجيل الخاص بك في هذا الوقت</p>
            <p style="margin: 10px 0; font-size: 16px;">.إذا كنت تعتقد أن هناك خطأ أو لديك أي استفسارات، يرجى التواصل مع فريق الدعم</p>
            
            <div style="border-top: 1px solid #eee; margin: 20px 0;"></div>
            
            ${process.env.SUPPORT_EMAIL
                    ? `
            <p style="margin: 10px 0; font-size: 16px;"><strong>:للاتصال بفريق الدعم</strong></p>
            <p style="margin: 10px 0; font-size: 16px;"><a href="mailto:${process.env.SUPPORT_EMAIL}" style="color: ${primaryColor}; text-decoration: none;">${process.env.SUPPORT_EMAIL}</a></p>
            `
                    : ""}
          `,
            };
        const mailOptions = {
            from: process.env.EMAIL_FROM || "no-reply@example.com",
            to: user.email,
            subject,
            html: emailTemplate(content),
            attachments: [
                {
                    filename: "logo.png",
                    path: "https://res.cloudinary.com/dmhvfuuke/image/upload/v1748029147/family-logo_z54fug.png",
                    cid: "logo",
                },
            ],
        };
        const info = yield transporter.sendMail(mailOptions);
        console.log(`Account status email sent to ${user.email}: ${info.messageId}`);
    }
    catch (error) {
        throw (0, customError_1.createCustomError)("Error sending account status email:", customError_1.HttpCode.BAD_REQUEST);
    }
});
exports.sendAccountStatusEmail = sendAccountStatusEmail;
const sendPasswordResetEmail = (email, resetUrl) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subject = "إعادة تعيين كلمة المرور الخاصة بك";
        const content = `
      <h2 style="color: ${primaryColor}; text-align: center; margin-bottom: 20px;">إعادة تعيين كلمة المرور</h2>
      <p style="margin: 10px 0; font-size: 16px;">،عزيزي المستخدم</p>
      <p style="margin: 10px 0; font-size: 16px;">.لقد تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بحسابك </p>
      <p style="margin: 10px 0; font-size: 16px;">:لإكمال عملية إعادة التعيين، يرجى الضغط على الزر أدناه</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: ${primaryColor}; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
          إعادة تعيين كلمة المرور
        </a>
      </div>
      
      <p style="margin: 10px 0; font-size: 16px;">:أو يمكنك نسخ الرابط التالي ولصقه في متصفحك</p>
      <p style="margin: 10px 0; font-size: 16px; word-break: break-all;">
        <a href="${resetUrl}" style="color: ${primaryColor}; text-decoration: none;">${resetUrl}</a>
      </p>
      
      <div style="border-top: 1px solid #eee; margin: 20px 0;"></div>
      
      <p style="margin: 10px 0; font-size: 16px;">.إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة بأمان</p>
      <p style="margin: 10px 0; font-size: 16px;">.لحماية حسابك، لا تشارك هذا الرابط مع أي شخص</p>
      <p style="margin: 10px 0; font-size: 16px;">.ينتهي صلاحية هذا الرابط بعد 24 ساعة</p>
      
      ${process.env.SUPPORT_EMAIL
            ? `
      <div style="border-top: 1px solid #eee; margin: 20px 0;"></div>
      <p style="margin: 10px 0; font-size: 16px;">:إذا واجهتك أي مشكلة، يرجى التواصل مع فريق الدعم</p>
      <p style="margin: 10px 0; font-size: 16px;">
        <a href="mailto:${process.env.SUPPORT_EMAIL}" style="color: ${primaryColor}; text-decoration: none;">${process.env.SUPPORT_EMAIL}</a>
      </p>
      `
            : ""}
    `;
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject,
            html: emailTemplate(content),
            attachments: [
                {
                    filename: "logo.png",
                    path: "https://res.cloudinary.com/dmhvfuuke/image/upload/v1748029147/family-logo_z54fug.png",
                    cid: "logo",
                },
            ],
        };
        yield transporter.sendMail(mailOptions);
    }
    catch (error) {
        throw (0, customError_1.createCustomError)("Error sending password reset email:", customError_1.HttpCode.BAD_REQUEST);
    }
});
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const sendEmailToUsersWithPermission = (_a) => __awaiter(void 0, [_a], void 0, function* ({ entity, action, subject, content, }) {
    try {
        const users = yield user_model_1.default.find({
            permissions: {
                $elemMatch: {
                    entity,
                    [action]: true,
                },
            },
        });
        const emails = users.map((u) => u.email).filter(Boolean);
        if (emails.length === 0) {
            console.log(`No users found with permission to ${action} ${entity}`);
            return;
        }
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: emails, // Can be an array
            subject,
            html: emailTemplate(content),
            attachments: [
                {
                    filename: "logo.png",
                    path: "https://res.cloudinary.com/dmhvfuuke/image/upload/v1748029147/family-logo_z54fug.png",
                    cid: "logo",
                },
            ],
        };
        const info = yield transporter.sendMail(mailOptions);
        console.log(`Email sent to users with '${action}' access on '${entity}':`, info.messageId);
    }
    catch (error) {
        throw (0, customError_1.createCustomError)("Error sending email to permitted users:", customError_1.HttpCode.BAD_REQUEST);
    }
});
exports.sendEmailToUsersWithPermission = sendEmailToUsersWithPermission;
const sendEmailToSystemAdmins = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Find all users with role "مدير النظام"
        const systemAdmins = yield user_model_1.default.find({ role: "مدير النظام" });
        const subject = "الشكاوى الرسمية و الاستفسارات العائلية";
        if (systemAdmins.length === 0) {
            console.log("No system admins found to send email to");
            return;
        }
        const emails = systemAdmins.map((admin) => admin.email).filter(Boolean);
        const content = `
        <h2 style="color: ${primaryColor}; text-align: center;">الشكاوى الرسمية و الاستفسارات العائلية</h2>
        <p style="margin: 10px 0;"> <strong>الاسم:</strong> ${data === null || data === void 0 ? void 0 : data.name}</p>
        <p style="margin: 10px 0;"> ${data === null || data === void 0 ? void 0 : data.email} <strong>:البريد الإلكتروني </strong></p>
        <p style="margin: 10px 0;"> ${data === null || data === void 0 ? void 0 : data.phone} <strong>:الهاتف</strong></p>
        <p style="margin: 10px 0;"> <strong>القسم:</strong> ${data === null || data === void 0 ? void 0 : data.department} </p>
        <div style="border-top: 1px solid #eee; margin: 20px 0;"></div>
        <p style="margin: 10px 0;"><strong>:الرسالة</strong></p>
        <p style="margin: 10px 0; padding: 10px; background-color: #f9f9f9; border-radius: 4px;">${data === null || data === void 0 ? void 0 : data.message}</p>
    `;
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: emails,
            subject,
            html: emailTemplate(content),
            attachments: [
                {
                    filename: "logo.png",
                    path: "https://res.cloudinary.com/dmhvfuuke/image/upload/v1748029147/family-logo_z54fug.png",
                    cid: "logo",
                },
            ],
        };
        const info = yield transporter.sendMail(mailOptions);
        console.log(`Email sent to system admins: ${info.messageId}`);
        return info;
    }
    catch (error) {
        console.error("Error sending email to system admins:", error);
        throw (0, customError_1.createCustomError)("Error sending email to system admins:", customError_1.HttpCode.INTERNAL_SERVER_ERROR);
    }
});
exports.sendEmailToSystemAdmins = sendEmailToSystemAdmins;
const sendEmailToUserWhoContactUs = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subject = "تأكيد استلام رسالتك - عائلة الدهمش";
        const content = `
      <h2 style="color: ${primaryColor}; text-align: center;">شكراً لتواصلك معنا</h2>
      <p style="margin: 10px 0;"> ,عزيزي/عزيزتي ${data === null || data === void 0 ? void 0 : data.name}</p>
      <p style="margin: 10px 0;">.لقد تلقينا رسالتك و سوف نقوم بالرد عليك في أقرب وقت ممكن</p>

      <div style="border-top: 1px solid #eee; margin: 20px 0;"></div>

      <p style="margin: 10px 0;"><strong>:ملخص رسالتك</strong></p>
      <p style="margin: 10px 0; padding: 10px; background-color: #f9f9f9; border-radius: 4px;">${data === null || data === void 0 ? void 0 : data.message}</p>
    `;
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: data === null || data === void 0 ? void 0 : data.email,
            subject,
            html: emailTemplate(content),
            attachments: [
                {
                    filename: "logo.png",
                    path: "https://res.cloudinary.com/dmhvfuuke/image/upload/v1748029147/family-logo_z54fug.png",
                    cid: "logo",
                },
            ],
        };
        const info = yield transporter.sendMail(mailOptions);
        console.log(`Email sent to system user: ${info.messageId}`);
        return info;
    }
    catch (error) {
        console.error("Error sending email to user:", error);
        throw (0, customError_1.createCustomError)("Error sending email to user:", customError_1.HttpCode.INTERNAL_SERVER_ERROR);
    }
});
exports.sendEmailToUserWhoContactUs = sendEmailToUserWhoContactUs;
