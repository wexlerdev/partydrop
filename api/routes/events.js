import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { Event } from "../models/Event.js";
import mongoose from "mongoose";

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

// List my events (host-only)
router.get("/mine", requireAuth, async (req, res) => {
  const events = await Event.find({ createdBy: req.user.id })
    .sort({ createdAt: -1 })
    .lean();

  const webBase = process.env.WEB_BASE_URL || "http://localhost:3000";

  res.json(
    events.map((e) => ({
      id: e._id.toString(),
      name: e.name,
      uploadsOpen: e.uploadsOpen,
      createdAt: e.createdAt,
      shareUrl: `${webBase}/e/${e._id.toString()}`,
    }))
  );
});

// PATCH /api/events/:id/uploads { uploadsOpen: true/false } (host-only)
router.patch("/:id/uploads", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { uploadsOpen } = req.body;
    if (typeof uploadsOpen !== "boolean") {
      return res.status(400).json({ error: "uploadsOpen must be boolean" });
    }

    // Enforce ownership
    const event = await Event.findOneAndUpdate(
      { _id: id, createdBy: req.user.id }, // req.user from requireAuth
      { $set: { uploadsOpen } },
      { new: true }
    );
    
    if (!event) {
      return res.status(404).json({ error: "event not found" });
    }

    return res.json({
      id: event._id.toString(),
      uploadsOpen: event.uploadsOpen,
    })
  } catch (err) {
    console.error("uploadsOpen update error", err);
    return res.status(500).json({ error: "internal server error" });
  }
});

// Public: get event metadata (for /e/[eventId])
router.get("/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ error: "not found" });
  }

  const event = await Event.findById(req.params.id).lean();
  if (!event) {
    return res.status(404).json({ error: "not found" });
  }

  res.json({
    id: event._id.toString(),
    name: event.name,
    uploadsOpen: event.uploadsOpen,
    createdAt: event.createdAt,
  });
});

export default router;
