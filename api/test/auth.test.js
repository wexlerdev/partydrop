import { afterAll, beforeAll, beforeEach, expect } from "vitest";
import { resetDB, setupDB, teardownDB } from "./setup";
import request from "supertest";
import createApp from "../app.js";

const DB_NAME = "partydrop_test_auth";

function expectSetCookieHasToken(setCookieHeaders) {
	expect(setCookieHeaders).toBeDefined();
	expect(Array.isArray(setCookieHeaders)).toBe(true);

	const joined = setCookieHeaders.join(" | ");
	expect(joined).toMatch(/(^|;\s*)token=/);
	expect(joined).toMatch(/HttpOnly/i);
	expect(joined).toMatch(/SameSite=Lax/i);
}

function expectSetCookieClearsToken(setCookieHeaders) {
	expect(setCookieHeaders).toBeDefined();
	expect(Array.isArray(setCookieHeaders)).toBe(true);

	const joined = setCookieHeaders.join(" | ");
	expect(joined).toMatch(/(^|;\s*)token=;/);
	// common clear patterns
	expect(joined).toMatch(/Max-Age=0|Expires=/i);

}

describe("Authentication", () => {
	let app;
	beforeAll( async () => {
		await setupDB(DB_NAME);
		app = createApp();
	});

	beforeEach( async () => {
		await resetDB();
	});

	afterAll( async () => {
		await teardownDB();
	});

	it("GET /api/auth/me should return 401 when not authenticated", async () => {
		const res = await request(app).get("/api/auth/me");
		expect(res.status).toBe(401);
	});

	it("POST /api/auth/register sets the token cookie on successful registration", async () => {
		const res = await request(app)
			.post("/api/auth/register")
			.send({
				email: "tester@mail.com",
				password: "password123",
			});
		expect(res.status).toBe(201);
		expectSetCookieHasToken(res.headers["set-cookie"]);

		// expect body to have user info
		expect(res.body).toHaveProperty("id");
		expect(res.body.email).toBe("tester@mail.com");
		expect(res.body.role).toBe("user");
	});

	it("GET /api/auth/me works when you include the cookie", async () => {
		// first register
		const regRes = await request(app)
			.post("/api/auth/register")
			.send({
				email: "tester@mail.com",
				password: "password123",
			});
		expect(regRes.status).toBe(201);

		const cookies = regRes.headers["set-cookie"];
		expectSetCookieHasToken(cookies);

		// now call /me with the cookie
		const meRes = await request(app)
			.get("/api/auth/me")
			.set("Cookie", cookies);
		
		expect(meRes.status).toBe(200);
		expect(meRes.body).toHaveProperty("id");
		expect(meRes.body.email).toBe("tester@mail.com");
	});

	it("POST /api/auth/login fails with wrong password", async () => {
		// first register
		const regRes = await request(app)
			.post("/api/auth/register")
			.send({
				email: "testerface@mail.com",
				password: "password123",
			});
		expect(regRes.status).toBe(201);

		// now try to login with wrong password
		const loginRes = await request(app)
			.post("/api/auth/login")
			.send({
				email: "testerface@mail.com",
				password: "wrongpassword",
			});
		expect(loginRes.status).toBe(401);
		expect(loginRes.headers["set-cookie"]).toBeUndefined();
	});

	it("POST /api/auth/login works with correct password and sets cookie", async () => {
		// first register
		const regRes = await request(app)
			.post("/api/auth/register")
			.send({
				email: "tester@mail.com",
				password: "password123",
			});
		expect(regRes.status).toBe(201);

		// now login with correct password
		const loginRes = await request(app)
			.post("/api/auth/login")
			.send({
				email: "tester@mail.com",
				password: "password123",
			});
		expect(loginRes.status).toBe(200);
		expect(loginRes.headers["set-cookie"]).toBeDefined();
		const cookies = loginRes.headers["set-cookie"];
		expectSetCookieHasToken(cookies);
	});

	it("POST /api/auth/logout clears the token cookie", async () => {
		// first register
		const regRes = await request(app)
			.post("/api/auth/register")
			.send({
				email: "tester@mail.com",
				password: "password123",
			});
		expect(regRes.status).toBe(201);

		const cookies = regRes.headers["set-cookie"];

		// now logout
		const logoutRes = await request(app)
			.post("/api/auth/logout")
			.set("Cookie", cookies);
		expect(logoutRes.status).toBe(200);

		const logoutCookies = logoutRes.headers["set-cookie"];
		expectSetCookieClearsToken(logoutCookies);
	});

	it("GET /api/auth/me returns 401 with invalid token", async () => {
		const res = await request(app)
			.get("/api/auth/me")
			.set("Cookie", "token=invalidtokenmybruv");
		expect(res.status).toBe(401);

		const cleared = res.headers["set-cookie"];
		if (cleared) {
			expectSetCookieClearsToken(cleared);
		}
	});
});