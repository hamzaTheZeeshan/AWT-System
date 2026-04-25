import express from "express";
import {
  createDonation,
  getMyDonations,
  getTotalDonations,
  getDonationById,
} from "../controllers/donationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route
router.get("/total", getTotalDonations);

// Protected routes (require JWT token)
router.post("/create", protect, createDonation);
router.get("/my-donations", protect, getMyDonations);
router.get("/:id", protect, getDonationById);

export default router;
