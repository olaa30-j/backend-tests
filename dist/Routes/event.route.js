"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const event_controller_1 = __importDefault(require("../controller/event.controller"));
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
router.route("/stats").get(event_controller_1.default.getEventOverview);
router
    .route("/")
    .post(auth_1.authenticateUser, (0, auth_1.authorizePermission)("مناسبه", "create"), event_controller_1.default.createEvent);
router
    .route("/")
    .get(auth_1.authenticateUser, (0, auth_1.authorizePermission)("مناسبه", "view"), event_controller_1.default.getAllEvents);
router.route("/:id").get(auth_1.authenticateUser, event_controller_1.default.getEventById);
router
    .route("/:id")
    .delete(auth_1.authenticateUser, (0, auth_1.authorizePermission)("مناسبه", "delete"), event_controller_1.default.deleteEventById);
router
    .route("/:id")
    .patch(auth_1.authenticateUser, (0, auth_1.authorizePermission)("مناسبه", "update"), event_controller_1.default.updateEventById);
exports.default = router;
