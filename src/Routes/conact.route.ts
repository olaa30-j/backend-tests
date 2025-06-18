import express from "express";
import ContactController from "../controller/conact.controller";

const router = express.Router();

router.route("/").post(ContactController.SendEmail);

export default router;
