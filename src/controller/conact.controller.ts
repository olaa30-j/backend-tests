import { Request, Response, NextFunction } from "express";
import asyncWrapper from "../middlewares/asynHandler";
import { createCustomError, HttpCode } from "../errors/customError";
import {
  sendEmailToSystemAdmins,
  sendEmailToUserWhoContactUs,
} from "../services/email.service";

class ContactController {
  SendEmail = asyncWrapper(
    async (req: Request, res: Response, next: NextFunction) => {
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
      await sendEmailToSystemAdmins(req.body);
      await sendEmailToUserWhoContactUs(req.body);

      res.status(HttpCode.OK).json({
        success: true,
        message: "email send successfully",
      });
    }
  );
}

export default new ContactController();
