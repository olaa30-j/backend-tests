import express from "express";
import { authenticateUser } from "../middlewares/auth";
import BranchController from "../controller/branch.controller";
const router = express.Router();

router.route("/").post(authenticateUser, BranchController.createBranch);

router.route("/").get(authenticateUser, BranchController.getAllBranches);

router.route("/:id").delete(authenticateUser, BranchController.deleteBranch);

router.route("/:id").get(authenticateUser, BranchController.getBranchById);

router.route("/:id").patch(authenticateUser, BranchController.updateBranch);

router
  .route("/:id/toggle-visibility")
  .patch(authenticateUser, BranchController.toggleBranchVisibility);

export default router;
