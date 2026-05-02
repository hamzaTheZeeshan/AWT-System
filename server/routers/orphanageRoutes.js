import express from "express";
import { getOrphanages } from "../controllers/orphanageController.js";

const router = express.Router();

router.get("/", getOrphanages);

export default router;
