import express from "express";
import {
  createDonation,
  getMyDonations,
  getTotalDonations,
  getDonationById,
} from "../controllers/donationController.js";
import { protect } from "../middleware/authMiddleware.js"; // ✅ only protect, NOT admin

const router = express.Router();

// Public route
router.get("/total", getTotalDonations);

// Protected routes (require login, any role)
router.post("/create", protect, createDonation); // ✅ not admin
router.get("/my-donations", protect, getMyDonations);
router.get("/:id", protect, getDonationById);

export default router;
