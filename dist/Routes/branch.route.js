"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const branch_controller_1 = __importDefault(require("../controller/branch.controller"));
const router = express_1.default.Router();
router.route("/").post(auth_1.authenticateUser, branch_controller_1.default.createBranch);
router.route("/").get(branch_controller_1.default.getAllBranches);
router.route("/:id").delete(auth_1.authenticateUser, branch_controller_1.default.deleteBranch);
router.route("/:id").get(auth_1.authenticateUser, branch_controller_1.default.getBranchById);
router.route("/:id").patch(auth_1.authenticateUser, branch_controller_1.default.updateBranch);
router
    .route("/:id/toggle-visibility")
    .patch(auth_1.authenticateUser, branch_controller_1.default.toggleBranchVisibility);
exports.default = router;
