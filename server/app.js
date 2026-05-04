import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import cors from "cors";
import "./db.js";
import authRoutes from "./routers/authRoutes.js";
import donationRoutes from "./routers/donationRoutes.js";
import adminRoutes from "./routers/adminRoutes.js";
import campaignRoutes from "./routers/campaignRoutes.js";
import orphanageRoutes from "./routers/orphanageRoutes.js";
import contactRoutes from "./routers/contactRoutes.js";
import internRoutes from "./routers/internRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AWT Backend API is running");
});

app.post("/test", (req, res) => {
  res.json({ message: "Server is working!" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/orphanages", orphanageRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/interns", internRoutes);
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
