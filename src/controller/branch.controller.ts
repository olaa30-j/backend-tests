import { Request, Response, NextFunction } from "express";
import asyncWrapper from "../middlewares/asynHandler";
import { createCustomError, HttpCode } from "../errors/customError";
import Branch from "../models/branch.model";
import mongoose from "mongoose";
import Member from "../models/member.model";
import User from "../models/user.model";

class BranchController {
  createBranch = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
      const { name, branchOwner } = req.body;

      if (!name) {
        return next(
          createCustomError("Branch name is required", HttpCode.BAD_REQUEST)
        );
      }

      const existingBranch = await Branch.findOne({ name });
      if (existingBranch) {
        return next(
          createCustomError(
            "Branch with this name already exists",
            HttpCode.CONFLICT
          )
        );
      }

      const branch = await Branch.create({
        name,
        branchOwner,
        show: true, // Default to visible
      });

      res.status(HttpCode.CREATED).json({
        success: true,
        data: branch,
        message: "Branch created successfully",
      });
    }
  );

  getAllBranches = asyncWrapper(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const skip = (page - 1) * limit;

    const totalBranches = await Branch.countDocuments();
    const branches = await Branch.find()
      .select("-__v -createdAt -updatedAt")
      .skip(skip)
      .limit(limit);

    res.status(HttpCode.OK).json({
      success: true,
      pagination: {
        totalBranches,
        totalPages: Math.ceil(totalBranches / limit),
        currentPage: page,
        pageSize: branches.length,
      },
      data: branches,
      message: "Branches retrieved successfully",
    });
  });

  getBranchById = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(
          createCustomError("Invalid branch ID", HttpCode.BAD_REQUEST)
        );
      }

      const branch = await Branch.findById(id);
      if (!branch) {
        return next(createCustomError("Branch not found", HttpCode.NOT_FOUND));
      }

      res.status(HttpCode.OK).json({
        success: true,
        data: branch,
        message: "Branch retrieved successfully",
      });
    }
  );

  updateBranch = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { name, show, branchOwner } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(
          createCustomError("Invalid branch ID", HttpCode.BAD_REQUEST)
        );
      }

      const branch = await Branch.findById(id);
      if (!branch) {
        return next(createCustomError("Branch not found", HttpCode.NOT_FOUND));
      }

      if (name) {
        const existingBranch = await Branch.findOne({ name, _id: { $ne: id } });
        if (existingBranch) {
          return next(
            createCustomError(
              "Another branch with this name already exists",
              HttpCode.CONFLICT
            )
          );
        }
        branch.name = name;
      }

      if (typeof show === "boolean") {
        branch.show = show;
      }

      if (branchOwner !== undefined) {
        branch.branchOwner = branchOwner;
      }

      await branch.save();

      res.status(HttpCode.OK).json({
        success: true,
        data: branch,
        message: "Branch updated successfully",
      });
    }
  );

  toggleBranchVisibility = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(
          createCustomError("Invalid branch ID", HttpCode.BAD_REQUEST)
        );
      }

      const branch = await Branch.findById(id);
      if (!branch) {
        return next(createCustomError("Branch not found", HttpCode.NOT_FOUND));
      }

      branch.show = !branch.show;
      await branch.save();

      res.status(HttpCode.OK).json({
        success: true,
        data: branch,
        message: `Branch visibility ${branch.show ? "enabled" : "disabled"}`,
      });
    }
  );

  deleteBranch = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(
          createCustomError("Invalid branch ID", HttpCode.BAD_REQUEST)
        );
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      const branch = await Branch.findByIdAndDelete(id);
      if (!branch) {
        await session.abortTransaction();
        return next(createCustomError("Branch not found", HttpCode.NOT_FOUND));
      }

      const members = await Member.find({ familyBranch: id })
        .select("_id userId")
        .session(session);

      const memberIds = members.map((m) => m._id);

      await Promise.all([
        Member.deleteMany({ familyBranch: id }).session(session),
        User.deleteMany({ memberId: { $in: memberIds } }).session(session),
        Branch.findByIdAndDelete(id).session(session),
      ]);

      await session.commitTransaction();
      session.endSession();

      res.status(HttpCode.OK).json({
        success: true,
        data: null,
        message: "Branch deleted successfully",
      });
    }
  );
}

export default new BranchController();
