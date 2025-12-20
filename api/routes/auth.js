import express from "express";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import { signToken, verifyToken } from "../lib/jwt.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { set } from "mongoose";

const router = express.Router();

function setAuthCookie(res, token) {
	res.cookie("token", token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
	});
}

// Register
router.post("/register", async (req, res) => {
	try {
		const { email, password } = req.body;
		if (typeof email !== "string" || typeof password !== "string") {
			return res.status(400).json({ message: "email and password required (and must be strings)" });
		}
		
		const normalizedEmail = email.toLowerCase().trim();
		const existingUser = await User.findOne({ email: normalizedEmail });
		if (existingUser) {
			return res.status(409).json({ message: "Email already in use" });
		}

		const passwordHash = await bcrypt.hash(password, 12);
		const user = await User.create({ email: normalizedEmail, passwordHash });

		const token = signToken({ id: user._id.toString(), email: user.email, role: user.role });
		setAuthCookie(res, token);

		return res.status(201).json({ id: user._id, email: user.email, role: user.role });
	} catch (err) {
		console.error("Registration error:", err);
		return res.status(500).json({ message: "Internal server error" });
	}
});

// Login
router.post("/login", async (req, res) => {
	try {

		const { email, password } = req.body;
		if (typeof email !== "string" || typeof password !== "string") {
			return res.status(400).json({ message: "email and password required (and must be strings)" });
		}

		const normalizedEmail = email.toLowerCase().trim();
		const user = await User.findOne({ email: normalizedEmail });
		if (!user) {
			return res.status(401).json({ message: "Invalid email or password" });
		}

		const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
		if (!isPasswordValid) {
			return res.status(401).json({ message: "Invalid email or password" });
		}

		const token = signToken({ id: user._id.toString(), email: user.email, role: user.role });
		setAuthCookie(res, token);

		return res.json({ id: user._id, email: user.email, role: user.role });
	} catch (err) {
		console.error("Login error:", err);
		return res.status(500).json({ message: "Internal server error" });
	}
});

//logout
router.post("/logout", (_req, res) => {
	res.clearCookie("token");
	return res.json({ message: "Logged out successfully" });
});

// /me - get current user
router.get("/me", requireAuth, async (req, res) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: "not authenticated" });
  }

  try {
    const payload = verifyToken(token);
    return res.json(payload);
  } catch {
    //important : clear bad cookie
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // true in prod
    });
    return res.status(401).json({ error: "invalid token" });
  };
});

export default router;