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
import {
  createCampaign,
  updateCampaign,
  deleteCampaign,
} from "../controllers/adminController.js";
import { getAllCampaigns } from "../controllers/adminController.js";

import {
  getAllReceivers,
  createReceiver,
  deleteReceiver,
  createOrphanage
} from "../controllers/adminController.js";

import {
  // ... existing imports ...
  getAllInterns,
  createIntern,
  updateIntern,
  deleteIntern,
} from "../controllers/adminController.js";
const router = express.Router();

import {
  getAllOrphanages,
  updateOrphanage,
  deleteOrphanage
} from "../controllers/adminController.js";

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

router.post("/campaigns", createCampaign);
router.put("/campaigns/:id", updateCampaign);
router.delete("/campaigns/:id", deleteCampaign);
router.get("/campaigns", getAllCampaigns);

router.get("/receivers", getAllReceivers);
router.post("/receivers", createReceiver);
router.delete("/receivers/:id", deleteReceiver);

router.post("/orphanages", createOrphanage);
router.get("/orphanages", getAllOrphanages);
router.put("/orphanages/:id", updateOrphanage);
router.delete("/orphanages/:id", deleteOrphanage);

router.get("/interns", getAllInterns);
router.post("/interns", createIntern);
router.put("/interns/:id", updateIntern);
router.delete("/interns/:id", deleteIntern);

export default router;
