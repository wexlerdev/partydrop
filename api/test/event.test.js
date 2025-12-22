import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { resetDB, setupDB, teardownDB } from "./setup";
import request from "supertest";
import app from "../app.js";

const DB_NAME = "partydrop_test_events";

describe("Events API", () => {
	beforeAll(async () => {
		await setupDB(DB_NAME);
	});

	beforeEach(async () => {
		await resetDB();
	});

	afterAll(async () => {
		await teardownDB();
	});

	describe("POST /api/events", () => {
		let agent;
		beforeEach( async () => {
			// register a user to use in tests
			agent = request.agent(app);
			const regRes = await agent
				.post("/api/auth/register")
				.send({
					email: "tester@mail.com",
					password: "password123",
				});
			expect(regRes.status).toBe(201);
		});

		it("401 when not authenticated", async () => {
			// not using agent, so no cookie
			const res = await request(app)
				.post("/api/events")
				.send({
					name: "My Event",
				});
			expect(res.status).toBe(401);
		});

		it("400 when name is missing", async () => {
			const res = await agent
				.post("/api/events")
				.send({}); // no name
			expect(res.status).toBe(400);
		});

		it("201 creates event and returns eventId and shareUrl", async () => {
			const res = await agent
				.post("/api/events")
				.send({
					name: "My Event 123",
				});
			expect(res.status).toBe(201);
			expect(res.body).toHaveProperty("eventId");
			expect(res.body).toHaveProperty("shareUrl");

		});
	});

	describe("GET /api/events/mine", () => {
		let agent;
		beforeEach( async () => {
			// register a user to use in tests
			agent = request.agent(app);
			const regRes = await agent
				.post("/api/auth/register")
				.send({
					email: "test@mail.com",
					password: "password123",
				});
			expect(regRes.status).toBe(201);
		});

		it("401 when not authenticated", async () => {
			const res = await request(app).get("/api/events/mine");
			expect(res.status).toBe(401);
		});

		it("returns empty array when no events", async () => {
			const res = await agent.get("/api/events/mine");
			expect(res.status).toBe(200);
			expect(Array.isArray(res.body)).toBe(true);
			expect(res.body).toEqual([]);	
		});

		it("returns only my events, not other users' events", async () => {
			// create an event with this user
			const createRes = await agent
				.post("/api/events")
				.send({ name: "My Event" });
			expect(createRes.status).toBe(201);

			// register a second user and create an event
			const agent2 = request.agent(app);
			const regRes2 = await agent2
				.post("/api/auth/register")
				.send({
					email: "user2test@mail.com",
					password: "passpassword123",
				});
			expect(regRes2.status).toBe(201);

			const createRes2 = await agent2
				.post("/api/events")
				.send({ name: "User2's Event" });
			expect(createRes2.status).toBe(201);

			// now get /mine with first user
			const res = await agent.get("/api/events/mine");
			expect(res.status).toBe(200);
			expect(res.body.length).toBe(1);
			expect(res.body[0].name).toBe("My Event");
		});


		it("returns newest events first", async () => {
			// create first event
			const createRes1 = await agent
				.post("/api/events")
				.send({ name: "First Event" });
			expect(createRes1.status).toBe(201);

			// create second event
			const createRes2 = await agent
				.post("/api/events")
				.send({ name: "Second Event" });
			expect(createRes2.status).toBe(201);

			// now get /mine
			const res = await agent.get("/api/events/mine");
			expect(res.status).toBe(200);
			expect(res.body.length).toBe(2);
			expect(res.body[0].name).toBe("Second Event");
			expect(res.body[1].name).toBe("First Event");
		});
	});
	
	describe("PATCH /api/events/:id/uploads", () => {
		let agent;
		let myEventId;
		beforeEach( async () => {
			// register a user to use in tests
			agent = request.agent(app);
			const regRes = await agent
				.post("/api/auth/register")
				.send({
					email: "test@mail.com",
					password: "password123",
				});
			expect(regRes.status).toBe(201);

			// create an event
			const createRes = await agent
				.post("/api/events")
				.send({ name: "My Event" });
			expect(createRes.status).toBe(201);
			myEventId = createRes.body.eventId;
		});

		it("401 when not authenticated", async () => {
			const res = await request(app)
				.patch(`/api/events/${myEventId}/uploads`)
				.send({ uploadsOpen: false });
			expect(res.status).toBe(401);
		});

		it("400 when uploadsOpen is not boolean", async () => {
			const res = await agent
				.patch(`/api/events/${myEventId}/uploads`)
				.send({ uploadsOpen: "notaboolean" });
			expect(res.status).toBe(400);
		});

		it("404 when trying to modify another user's event", async () => {
			// register a second user
			const agent2 = request.agent(app);
			const regRes2 = await agent2
				.post("/api/auth/register")
				.send({
					email: "user2test@mail.com",
					password: "passpassword123",
				});
			expect(regRes2.status).toBe(201);

			// try to modify first user's event
			const res = await agent2
				.patch(`/api/events/${myEventId}/uploads`)
				.send({ uploadsOpen: false });
			expect(res.status).toBe(404); // not found since they don't own it
		});

		it("404 when event ID is invalid", async () => {
			const res = await agent
				.patch(`/api/events/invalid-event-id-friends/uploads`)
				.send({ uploadsOpen: false });
			expect(res.status).toBe(404);
		});

		it("successfully updates uploadsOpen for my event", async () => {
			const res = await agent
				.patch(`/api/events/${myEventId}/uploads`)
				.send({ uploadsOpen: false });
			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty("id", myEventId);
			expect(res.body).toHaveProperty("uploadsOpen", false);
		});
	});

	describe("GET /api/events/:id (public metadata)", () => {
		let eventId;
		beforeEach( async () => {
			// register a user to create an event
			const agent = request.agent(app);
			const regRes = await agent
				.post("/api/auth/register")
				.send({
					email: "tester@mail.com",
					password: "password123",
				});
			expect(regRes.status).toBe(201);

			// create an event
			const createRes = await agent
				.post("/api/events")
				.send({ name: "Public Event" });
			expect(createRes.status).toBe(201);
			eventId = createRes.body.eventId;
		});

		it("404 for non-existent event", async () => {
			const res = await request(app).get("/api/events/64b64c4f4f4f4f4f4f4f4f4f"); // random ObjectId
			expect(res.status).toBe(404);
		});

		it("returns event metadata without sensitive info", async () => {
			const res = await request(app).get(`/api/events/${eventId}`);
			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty("id", eventId);
			expect(res.body).toHaveProperty("name", "Public Event");
			expect(res.body).toHaveProperty("uploadsOpen");
			expect(res.body).not.toHaveProperty("createdBy");
		});

		it("handles invalid ObjectId gracefully", async () => {
			const res = await request(app).get("/api/events/invalid-id");
			console.log(res.status);
			expect(res.status).toBe(404);
		});
	});



	// Authentication gates
	//POST /api/events
	//GET /api/events/mine
	//PATCH /api/events/:id/uploads


	// Validation and input shape
	// "i passed auth but request was wrong"
	// POST /api/events with missing name
	// PATCH /api/events/:id/uploads with non-boolean uploadsOpen

	// Ownership enforcement
	// Host A cannot modify Host B's event
	// GET /api/events/mine only returns events for that host

	// State behavior
	// test create starts with uploadsOpen true
	// PATCH /api/events/:id/uploads successfully changes uploadsOpen
	// Then what happens if you GET /api/events/mine after changing uploadsOpen?

});