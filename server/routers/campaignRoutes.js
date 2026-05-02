import express from "express";
import { getActiveCampaigns } from "../controllers/campaignController.js";

const router = express.Router();

router.get("/active", getActiveCampaigns);

export default router;
