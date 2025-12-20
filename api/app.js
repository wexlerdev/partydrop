import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRouter from "./routes/auth.js";
import eventRouter from "./routes/events.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/events", eventRouter);

export default app;
