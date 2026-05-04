import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";
import dotenv from "dotenv";

dotenv.config();

// get secret from env
const JWT_SECRET = process.env.JWT_SECRET;

// DB promise wrapper
const promiseDb = db.promise();

export const register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    const [existing] = await promiseDb.query(
      "SELECT * FROM Users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [maxIdResult] = await promiseDb.query(
      "SELECT MAX(user_id) as maxId FROM Users"
    );

    const user_id = (maxIdResult[0].maxId || 0) + 1;

    await promiseDb.query(
      "INSERT INTO Users (user_id, name, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?)",
      [user_id, name, email, hashedPassword, phone || null, role || "general"]
    );

    const token = jwt.sign(
      { user_id, email, role: role || "general" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      token,
      user: { user_id, name, email, role: role || "general" },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await promiseDb.query(
      "SELECT * FROM Users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};