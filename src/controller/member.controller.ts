import { Request, Response, NextFunction } from "express";
import asyncWrapper from "../middlewares/asynHandler";
import Member from "../models/member.model";
import { HttpCode, createCustomError } from "../errors/customError";
import User from "../models/user.model";
import mongoose from "mongoose";
import { notifyUsersWithPermission } from "../utils/notify";
import Branch from "../models/branch.model";

const DEFAULT_IMAGE_URL =
  "https://res.cloudinary.com/dmhvfuuke/image/upload/v1750092490/avatar_bdtadk.jpg";

class MemberController {
  createMember = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
      const {
        fname,
        lname,
        familyBranch,
        familyRelationship,
        gender,
        husband,
        wives,
        parents,
        children,
      } = req.body;

      if (req.file?.path) {
        req.body.image = req.file.path.replace(/\\/g, "/");
      } else {
        req.body.image = DEFAULT_IMAGE_URL;
      }

      if (!fname || !lname || !gender || !familyBranch || !familyRelationship) {
        return next(
          createCustomError(
            "First name, last name, gender, familyRelationship and family branch are required.",
            HttpCode.BAD_REQUEST
          )
        );
      }

      const existingFamilyBranch = await Branch.findOne({ _id: familyBranch });
      if (!existingFamilyBranch) {
        return next(
          createCustomError(
            `family branch: ${familyBranch} not found`,
            HttpCode.NOT_FOUND
          )
        );
      }

      //check full name is unique
      const fullName = `${fname} ${lname}`;
      req.body.fullName = fullName;

      const existingMember = await Member.findOne({ fullName });
      if (existingMember) {
        return next(
          createCustomError(
            `يوجد بالفعل عضو باسم '${fullName}'. يرجى اسم اضافى لتمييز فريد مثل '${fullName} 1'.`,
            HttpCode.BAD_REQUEST
          )
        );
      }

      // check for only one grandfather
      if (familyRelationship === "الجد الأعلى") {
        const existingHead = await Member.findOne({
          familyRelationship: "الجد الأعلى",
        });

        if (existingHead) {
          return next(
            createCustomError(
              `This family branch already has a male head (${existingHead.fname} ${existingHead.lname})`,
              HttpCode.BAD_REQUEST
            )
          );
        }
      }

      const memberData = { ...req.body };
      delete memberData.husband;
      delete memberData.wives;
      delete memberData.parents;
      delete memberData.children;

      const member = await Member.create(memberData);
      //if member is husband
      if (wives && Array.isArray(wives) && wives.length > 0) {
        const wifeMembers = await Member.find({ _id: { $in: wives } });

        if (wifeMembers.length !== wives.length) {
          await Member.findByIdAndDelete(member._id);
          return next(
            createCustomError(
              "One or more wives not found",
              HttpCode.BAD_REQUEST
            )
          );
        }

        const nonFemales = wifeMembers.filter((w) => w.gender !== "أنثى");

        if (nonFemales.length > 0) {
          return next(
            createCustomError("All wives must be female", HttpCode.BAD_REQUEST)
          );
        }

        await Member.findByIdAndUpdate(
          member._id,
          { $set: { wives: wives } },
          { new: true }
        );

        for (const wifeId of wives) {
          await Member.findByIdAndUpdate(
            wifeId,
            { $set: { husband: member._id } },
            { new: true }
          );
        }
      }

      //if member is wife
      if (familyRelationship === "زوجة" && husband) {
        const husbandMember = await Member.findById(husband);
        if (!husbandMember) {
          await Member.findByIdAndDelete(member._id);
          return next(
            createCustomError("Husband not found", HttpCode.BAD_REQUEST)
          );
        }
        if (husbandMember.gender !== "ذكر") {
          await Member.findByIdAndDelete(member._id);
          return next(
            createCustomError("Husband must be male", HttpCode.BAD_REQUEST)
          );
        }
       if (husbandMember.familyBranch.toString() !== familyBranch.toString()) {
  await Member.findByIdAndDelete(member._id);
  return next(
    createCustomError(
      "Husband must be from the same family branch",
      HttpCode.BAD_REQUEST
    )
  );
}

        await Member.findByIdAndUpdate(
          member._id,
          { $set: { husband: husband } },
          { new: true }
        );

        await Member.findByIdAndUpdate(
          husband,
          { $addToSet: { wives: member._id } },
          { new: true }
        );
      }

      if (parents?.father || parents?.mother) {
        const updates: any = {};

        if (parents.father && mongoose.Types.ObjectId.isValid(parents.father)) {
          const father = await Member.findById(parents.father);
          if (!father) {
            await Member.findByIdAndDelete(member._id);
            return next(
              createCustomError("Father not found", HttpCode.BAD_REQUEST)
            );
          }
          updates.parents = { father: parents.father };
          await Member.findByIdAndUpdate(
            parents.father,
            { $addToSet: { children: member._id } },
            { new: true }
          );
        }

        if (parents.mother && mongoose.Types.ObjectId.isValid(parents.mother)) {
          const mother = await Member.findById(parents.mother);
          if (!mother) {
            await Member.findByIdAndDelete(member._id);
            return next(
              createCustomError("Mother not found", HttpCode.BAD_REQUEST)
            );
          }
          updates.parents = { ...updates.parents, mother: parents.mother };
          await Member.findByIdAndUpdate(
            parents.mother,
            { $addToSet: { children: member._id } },
            { new: true }
          );
        }

        if (Object.keys(updates).length > 0) {
          await Member.findByIdAndUpdate(member._id, updates, { new: true });
        }
      }

      if (children) {
        let childrenArray = Array.isArray(children) ? children : [children];
        childrenArray = childrenArray.filter((c) =>
          mongoose.Types.ObjectId.isValid(c)
        );

        if (childrenArray.length > 0) {
          const childrenExist = await Member.countDocuments({
            _id: { $in: childrenArray },
          });
          if (childrenExist !== childrenArray.length) {
            await Member.findByIdAndDelete(member._id);
            return next(
              createCustomError(
                "One or more children not found",
                HttpCode.BAD_REQUEST
              )
            );
          }

          await Member.findByIdAndUpdate(
            member._id,
            { $set: { children: childrenArray } },
            { new: true }
          );

          for (const childId of childrenArray) {
            if (gender === "ذكر") {
              await Member.findByIdAndUpdate(
                childId,
                { $set: { "parents.father": member._id } },
                { new: true }
              );
            } else {
              await Member.findByIdAndUpdate(
                childId,
                { $set: { "parents.mother": member._id } },
                { new: true }
              );
            }
          }
        }
      }

      await notifyUsersWithPermission(
        { entity: "عضو", action: "view", value: true },
        {
          sender: { id: req?.user.id },
          message: "تم إنشاءعضو جديد",
          action: "create",
          entity: { type: "عضو", id: member?._id },
          metadata: {
            priority: "medium",
          },
          status: "sent",
          read: false,
          readAt: null,
        }
      );

      res.status(HttpCode.CREATED).json({
        success: true,
        message: "Member created successfully",
        data: member,
      });
    }
  );

  updateMember = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const {
        fname,
        lname,
        familyBranch,
        familyRelationship,
        gender,
        husband,
        wives,
        parents,
        children,
      } = req.body;

      const member = await Member.findById(id);
      if (!member) {
        return next(createCustomError("Member not found", HttpCode.NOT_FOUND));
      }

      const existingFamilyBranch = await Branch.findOne({ _id: familyBranch });
      if (!existingFamilyBranch) {
        return next(
          createCustomError(
            `family branch: ${familyBranch} not found`,
            HttpCode.NOT_FOUND
          )
        );
      }

      if (req.file?.path) {
        req.body.image = req.file.path.replace(/\\/g, "/");
      }

      //check for unique fullname
      if (fname || lname) {
        const fullName = `${fname || member.fname} ${lname || member.lname}`;
        const existingMember = await Member.findOne({
          fullName,
          _id: { $ne: id },
        });
        if (existingMember) {
          return next(
            createCustomError(
              `يوجد بالفعل عضو باسم '${fullName}'. يرجى اسم اضافى لتمييز فريد مثل '${fullName} 1'.`,
              HttpCode.BAD_REQUEST
            )
          );
        }
        req.body.fullName = fullName;
      }

      //check only one head for the family
      if (
        familyRelationship === "الجد الأعلى" &&
        member.familyRelationship !== "الجد الأعلى"
      ) {
        const existingHead = await Member.findOne({
          familyRelationship: "الجد الأعلى",
        });

        if (existingHead) {
          return next(
            createCustomError(
              `This family branch already has a male head (${existingHead.fname} ${existingHead.lname})`,
              HttpCode.BAD_REQUEST
            )
          );
        }
      }

      //handle wives update
      if (wives !== undefined && Array.isArray(wives) && wives.length > 0) {
        await Member.updateMany(
          { _id: { $in: member.wives } },
          { $unset: { husband: "" } }
        );
        if (wives.length > 0) {
          const wifeMembers = await Member.find({ _id: { $in: wives } });
          if (
            wifeMembers.length !== wives.length ||
            wifeMembers.some((w) => w.gender !== "أنثى")
          ) {
            throw createCustomError(
              "All wives must be female and exist.",
              HttpCode.BAD_REQUEST
            );
          }
          await Member.updateMany(
            { _id: { $in: wives } },
            { $set: { husband: member._id } }
          );
        }
      }

      // Handle husband update
      if (husband !== undefined) {
        const husbandMember = await Member.findById(husband);
        if (
          !husbandMember ||
          husbandMember.gender !== "ذكر" ||
          husbandMember.familyBranch !== member.familyBranch
        ) {
          throw createCustomError(
            "Invalid husband relationship.",
            HttpCode.BAD_REQUEST
          );
        }
        await Member.findByIdAndUpdate(husband, {
          $addToSet: { wives: member._id },
        });
      }

      // Handle parents update
      if (parents !== undefined) {
        if (parents.father) {
          await Member.findByIdAndUpdate(parents.father, {
            $addToSet: { children: member._id },
          });
        }
        if (parents.mother) {
          await Member.findByIdAndUpdate(parents.mother, {
            $addToSet: { children: member._id },
          });
        }
      }

      // Handle children update
      if (children !== undefined) {
        await Member.updateMany(
          { _id: { $in: member.children } },
          { $unset: { "parents.father": "", "parents.mother": "" } }
        );
        for (const childId of children) {
          await Member.findByIdAndUpdate(
            childId,
            {
              $set: {
                [`parents.${member.gender === "ذكر" ? "father" : "mother"}`]:
                  member._id,
              },
            },
            { new: true }
          );
        }
      }

      const updatedMember = await Member.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      })
        .populate("userId")
        .populate("husband")
        .populate("wives")
        .populate("parents.father")
        .populate("parents.mother")
        .populate("children")
        .populate("familyBranch");

      await notifyUsersWithPermission(
        { entity: "عضو", action: "update", value: true },
        {
          sender: { id: req?.user.id },
          message: "تم تعديل عضو",
          action: "update",
          entity: { type: "عضو", id: updatedMember?._id },
          metadata: {
            priority: "medium",
          },
          status: "sent",
          read: false,
          readAt: null,
        }
      );

      res.status(HttpCode.OK).json({
        success: true,
        data: updatedMember,
        message: "Member updated successfully",
      });
    }
  );

  getAllMembers = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const { familyBranch, familyRelationship } = req.query;
      const filter: Record<string, any> = {};

      if (familyBranch) {
        filter.familyBranch = familyBranch;
      const existingFamilyBranch = await Branch.findOne({ _id: familyBranch });
      if (!existingFamilyBranch) {
        return next(
          createCustomError(
            `family branch: ${familyBranch} not found`,
            HttpCode.NOT_FOUND
          )
        );
      }

      }

      if (familyRelationship) {
        filter.familyRelationship = familyRelationship;
      }

      const totalMembers = await Member.countDocuments(filter);

      const members = await Member.find(filter)
        .populate("userId")
        .populate("husband")
        .populate("wives")
        .populate("parents.father")
        .populate("parents.mother")
        .populate("parents")
        .populate("children")
        .populate("familyBranch")
        .skip(skip)
        .limit(limit);

      const totalPages = Math.ceil(totalMembers / limit);

      res.status(HttpCode.OK).json({
        success: true,
        data: members,
        pagination: {
          totalMembers,
          totalPages,
          currentPage: page,
          pageSize: members.length,
        },
        message: "Members retrieved successfully",
      });
    }
  );

  getMemberById = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      const member = await Member.findById(id)
        .populate("userId")
        .populate("husband")
        .populate("wives")
        .populate("parents.father")
        .populate("parents.mother")
        .populate("parents")
        .populate("children")
        .populate("familyBranch");

      if (!member) {
        return next(createCustomError("Member not found", HttpCode.NOT_FOUND));
      }
      res.status(HttpCode.OK).json({
        success: true,
        data: member,
        message: "Member retrieved successfully",
      });
    }
  );

  deleteMember = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;

      const session = await mongoose.startSession();
      session.startTransaction();

      const member = await Member.findById(id).session(session);
      if (!member) {
        await session.abortTransaction();
        session.endSession();
        throw createCustomError("Member not found", HttpCode.NOT_FOUND);
      }

      if (member.userId) {
        await User.findByIdAndDelete(member.userId).session(session);
      }

      await Member.findByIdAndDelete(id).session(session);

      await session.commitTransaction();
      session.endSession();

      await notifyUsersWithPermission(
        { entity: "عضو", action: "delete", value: true },
        {
          sender: { id: req?.user.id },
          message: "تم حذف عضو",
          action: "delete",
          entity: { type: "عضو" },
          metadata: {
            priority: "medium",
          },
          status: "sent",
          read: false,
          readAt: null,
        }
      );

      res.status(HttpCode.OK).json({
        success: true,
        message: member.userId
          ? "Member and user deleted successfully"
          : "Member deleted successfully",
        data: null,
      });
    }
  );
}

export default new MemberController();
