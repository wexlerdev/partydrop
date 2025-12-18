import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { Event } from "../models/Event.js";

const router = express.Router();

// Create event (host-only)
router.post("/", requireAuth, async (req, res) => {
	//user inputs name
  	const { name } = req.body;
  	if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "name is required" });
  }

  const event = await Event.create({
    name: name.trim(),
    createdBy: req.user.id,
  });

  // Share URL points to Next app route
  const shareUrl = `http://localhost:3000/e/${event._id.toString()}`;

  res.status(201).json({
    eventId: event._id.toString(),
    shareUrl,
  });
});

// Public: get event metadata (for /e/[eventId])
router.get("/:id", async (req, res) => {
  const event = await Event.findById(req.params.id).lean();
  if (!event) return res.status(404).json({ error: "not found" });

  res.json({
    id: event._id.toString(),
    name: event.name,
    uploadsOpen: event.uploadsOpen,
    createdAt: event.createdAt,
  });
});

export default router;
