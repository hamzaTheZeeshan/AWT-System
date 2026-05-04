import express from "express";
import {
  applyForInternship,
  getMyApplications,
} from "../controllers/internController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/apply", protect, applyForInternship);
router.get("/my-applications", protect, getMyApplications);

export default router;
