import request from "supertest";
import app from "../app.js";
import { setupDB, teardownDB, resetDB } from "./setup.js";
import { beforeEach, beforeAll, afterAll } from "vitest";

describe ("Health Check API", () => {
  beforeAll(async () => {
	await setupDB();
  });

  beforeEach(async () => {
	await resetDB();
  });

  afterAll(async () => {
	await teardownDB();
  });

  it("GET /api/health should return ok: true", async () => {
	const res = await request(app).get("/api/health");
	expect(res.status).toBe(200);
	expect(res.body).toEqual({ ok: true });
  });
});