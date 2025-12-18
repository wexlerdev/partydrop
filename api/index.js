import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db.js";

dotenv.config({ path: new URL("./.env.local", import.meta.url) });


const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

await connectDB();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
