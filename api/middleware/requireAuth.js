import { verifyToken } from "../lib/jwt.js";

export function requireAuth(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
	return res.status(401).json({ message: "Authentication required" });
  }

  try {
	req.user = verifyToken(token); // {id, email ...}
  	next();
  } catch (err) {
	return res.status(401).json({ message: "Invalid or expired token" });
  }
}