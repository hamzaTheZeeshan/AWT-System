import express from "express";
const router = express.Router();
import { sendContactMessage } from "../controllers/contactController.js";


router.post("/", sendContactMessage);

export default router;