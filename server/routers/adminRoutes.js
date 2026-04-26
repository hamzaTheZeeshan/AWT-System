import express from "express";
import {
  getAllDonations,
  approveDonation,
  rejectDonation,
  getAllUsers,
  deleteUser,
  getStats,
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";

const router = express.Router();

// All admin routes require authentication AND admin role
router.use(protect, admin);

// Donation management
router.get("/donations", getAllDonations);
router.put("/donations/:id/approve", approveDonation);
router.put("/donations/:id/reject", rejectDonation);

// User management
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);

// Reports & statistics
router.get("/reports/stats", getStats);

export default router;
