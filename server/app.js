import express from "express";
import cors from "cors";
import "./db.js";
import authRoutes from "./routers/authRoutes.js";
import donationRoutes from "./routers/donationRoutes.js";
import adminRoutes from "./routers/adminRoutes.js";

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

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
