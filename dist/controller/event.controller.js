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
const event_model_1 = __importDefault(require("../models/event.model"));
const asynHandler_1 = __importDefault(require("../middlewares/asynHandler"));
const customError_1 = require("../errors/customError");
const mongoose_1 = __importDefault(require("mongoose"));
const dateValidator_1 = require("../utils/dateValidator");
const notify_1 = require("../utils/notify");
class EventController {
    constructor() {
        this.createEvent = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { address, description, location, startDate, endDate } = req.body;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!userId) {
                return next((0, customError_1.createCustomError)("Unauthorized", customError_1.HttpCode.UNAUTHORIZED));
            }
            if (!address || !description || !location || !startDate) {
                return next((0, customError_1.createCustomError)("Missing required fields", customError_1.HttpCode.BAD_REQUEST));
            }
            const startDateObj = (0, dateValidator_1.validateDate)(startDate, "startDate");
            (0, dateValidator_1.validateFutureDate)(startDateObj, "startDate");
            const endDateObj = endDate ? (0, dateValidator_1.validateDate)(endDate, "endDate") : null;
            (0, dateValidator_1.validateDateRange)(startDateObj, endDateObj);
            const event = yield event_model_1.default.create({
                userId,
                address,
                description,
                location,
                startDate: startDateObj,
                endDate: endDateObj,
            });
            yield (0, notify_1.notifyUsersWithPermission)({ entity: "مناسبه", action: "view", value: true }, {
                sender: { id: req === null || req === void 0 ? void 0 : req.user.id },
                message: "تم إنشاء مناسبه جديد",
                action: "create",
                entity: { type: "مناسبه", id: event === null || event === void 0 ? void 0 : event._id },
                metadata: {
                    priority: "medium",
                },
                status: "sent",
                read: false,
                readAt: null,
            });
            res.status(customError_1.HttpCode.CREATED).json({
                success: true,
                data: event,
                message: "Event created successfully",
            });
        }));
        this.getAllEvents = (0, asynHandler_1.default)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const totalEvents = yield event_model_1.default.countDocuments();
            const events = yield event_model_1.default.find()
                .populate({
                path: "userId",
                select: "-password -permissions -_id ",
                populate: {
                    path: "memberId",
                    select: "-password -permissions -_id",
                    populate: {
                        path: "familyBranch",
                        select: "-__v -createdAt -updatedAt",
                    },
                },
            })
                .skip(skip)
                .limit(limit);
            const totalPages = Math.ceil(totalEvents / limit);
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                pagination: {
                    totalEvents,
                    totalPages,
                    currentPage: page,
                    pageSize: events.length,
                },
                data: events,
                message: "Fetched all events successfully",
            });
        }));
        this.getEventById = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const eventId = req.params.id;
            if (!mongoose_1.default.Types.ObjectId.isValid(eventId)) {
                return next((0, customError_1.createCustomError)("Invalid event ID", customError_1.HttpCode.BAD_REQUEST));
            }
            const event = yield event_model_1.default.findById(eventId).populate({
                path: "userId",
                select: "-password -permissions -_id ",
                populate: {
                    path: "memberId",
                    select: "-password -permissions -_id",
                    populate: {
                        path: "familyBranch",
                        select: "-__v -createdAt -updatedAt",
                    },
                },
            });
            if (!event) {
                return next((0, customError_1.createCustomError)("Event not found", customError_1.HttpCode.NOT_FOUND));
            }
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: event,
                message: "Fetched event successfully",
            });
        }));
        this.deleteEventById = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const eventId = req.params.id;
            if (!mongoose_1.default.Types.ObjectId.isValid(eventId)) {
                return next((0, customError_1.createCustomError)("Invalid event ID", customError_1.HttpCode.BAD_REQUEST));
            }
            const event = yield event_model_1.default.findById(eventId);
            if (!event) {
                return next((0, customError_1.createCustomError)("Event not found", customError_1.HttpCode.NOT_FOUND));
            }
            yield event.deleteOne();
            yield (0, notify_1.notifyUsersWithPermission)({ entity: "مناسبه", action: "delete", value: true }, {
                sender: { id: req === null || req === void 0 ? void 0 : req.user.id },
                message: "تم حذف مناسبه",
                action: "delete",
                entity: { type: "مناسبه", id: event._id },
                metadata: {
                    priority: "medium",
                },
                status: "sent",
                read: false,
                readAt: null,
            });
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: null,
                message: "Event deleted successfully",
            });
        }));
        this.updateEventById = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const eventId = req.params.id;
            let updateData = req.body;
            const existingEvent = yield event_model_1.default.findById(eventId);
            if (!existingEvent) {
                return next((0, customError_1.createCustomError)("Event not found", customError_1.HttpCode.NOT_FOUND));
            }
            const cleanObject = (obj) => {
                return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== null && value !== undefined && value !== ""));
            };
            updateData = cleanObject(updateData);
            let startDate = updateData.startDate
                ? (0, dateValidator_1.validateDate)(updateData.startDate, "startDate")
                : existingEvent.startDate;
            (0, dateValidator_1.validateFutureDate)(startDate, "startDate");
            let endDate = updateData.endDate
                ? (0, dateValidator_1.validateDate)(updateData.endDate, "endDate")
                : existingEvent.endDate;
            if (updateData.startDate || updateData.endDate) {
                (0, dateValidator_1.validateDateRange)(startDate, endDate);
            }
            if (updateData.startDate)
                updateData.startDate = startDate;
            if (updateData.endDate)
                updateData.endDate = endDate;
            const updatedEvent = yield event_model_1.default.findByIdAndUpdate({ _id: eventId }, updateData, { new: true }).populate({
                path: "userId",
                select: "-password -permissions -_id ",
                populate: {
                    path: "memberId",
                    select: "-password -permissions -_id",
                    populate: {
                        path: "familyBranch",
                        select: "-__v -createdAt -updatedAt",
                    },
                },
            });
            yield (0, notify_1.notifyUsersWithPermission)({ entity: "مناسبه", action: "update", value: true }, {
                sender: { id: req === null || req === void 0 ? void 0 : req.user.id },
                message: "تم تعديل مناسبه  ",
                action: "update",
                entity: { type: "مناسبه", id: updatedEvent === null || updatedEvent === void 0 ? void 0 : updatedEvent._id },
                metadata: {
                    priority: "medium",
                },
                status: "sent",
                read: false,
                readAt: null,
            });
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: updatedEvent,
                message: "Event updated successfully",
            });
        }));
        this.getEventOverview = (0, asynHandler_1.default)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const currentDate = new Date();
            const totalEvents = yield event_model_1.default.countDocuments();
            const endedEvents = yield event_model_1.default.countDocuments({
                $or: [
                    { endDate: { $lt: currentDate } },
                    {
                        startDate: { $lte: currentDate },
                        endDate: null,
                    },
                ],
            });
            const upcomingEvent = yield event_model_1.default.findOne({
                startDate: { $gt: currentDate },
            })
                .sort({ startDate: 1 })
                .populate("userId")
                .lean();
            res.status(customError_1.HttpCode.OK).json({
                success: true,
                data: {
                    counts: {
                        total: totalEvents,
                        ended: endedEvents,
                        upcoming: totalEvents - endedEvents,
                    },
                    nextEvent: upcomingEvent || null,
                    asOf: currentDate.toISOString(),
                },
                message: "Event overview retrieved successfully",
            });
        }));
    }
}
exports.default = new EventController();
