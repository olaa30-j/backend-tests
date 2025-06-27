"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const errorHandler_1 = __importDefault(require("./middlewares/errorHandler"));
const swagger_1 = __importDefault(require("./utils/swagger"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const auth_route_1 = __importDefault(require("./Routes/auth.route"));
const user_route_1 = __importDefault(require("./Routes/user.route"));
const permission_route_1 = __importDefault(require("./Routes/permission.route"));
const member_route_1 = __importDefault(require("./Routes/member.route"));
const album_route_1 = __importDefault(require("./Routes/album.route"));
const financial_route_1 = __importDefault(require("./Routes/financial.route"));
const event_route_1 = __importDefault(require("./Routes/event.route"));
const advertisement_route_1 = __importDefault(require("./Routes/advertisement.route"));
const notification_route_1 = __importDefault(require("./Routes/notification.route"));
const conact_route_1 = __importDefault(require("./Routes/conact.route"));
const branch_route_1 = __importDefault(require("./Routes/branch.route"));
const allowedOrigins = process.env.NODE_ENV === "production"
    ? [
        "https://elsaqr-family-saas-web-app-56kk.vercel.app",
        "https://*.vercel.app",
        "https://web.postman.co",
        "http://localhost:5173",
        "capacitor://localhost",
        "https://dahmash-family",
        "http://localhost"
    ]
    : [
        "http://localhost:5173",
        "https://www.getpostman.com",
        "http://localhost:3001",
        "http://localhost:8080",
        "capacitor://localhost",
        "https://dahmash-family",
        "http://localhost",
        undefined
    ];
const vercelOriginRegex = /^https:\/\/.*\.vercel\.app$/;
// CORS configuration (تم تعديله لدعم الموبايل)
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        const isAllowed = allowedOrigins.includes(origin) ||
            (process.env.NODE_ENV === "production" &&
                vercelOriginRegex.test(origin)) ||
            origin.startsWith("capacitor://");
        if (isAllowed) {
            callback(null, true);
        }
        else {
            console.log("Blocked by CORS:", origin);
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "x-vercel-project-id",
    ],
    exposedHeaders: ["set-cookie"],
}));
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
if (process.env.NODE_ENV === "development") {
    app.use((0, morgan_1.default)("dev"));
}
// API Documentation
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default));
app.use("/api/v1/auth", auth_route_1.default);
app.use("/api/v1/user", user_route_1.default);
app.use("/api/v1/permission", permission_route_1.default);
app.use("/api/v1/member", member_route_1.default);
app.use("/api/v1/album", album_route_1.default);
app.use("/api/v1/financial", financial_route_1.default);
app.use("/api/v1/event", event_route_1.default);
app.use("/api/v1/advertisement", advertisement_route_1.default);
app.use("/api/v1/notification", notification_route_1.default);
app.use("/api/v1/contact", conact_route_1.default);
app.use("/api/v1/branch", branch_route_1.default);
// check endpoint
app.get("/", (req, res) => {
    res.status(200).json({
        status: "success",
        message: "API is running",
        documentation: "/api-docs",
    });
});
// Error handler
app.use(errorHandler_1.default);
exports.default = app;
