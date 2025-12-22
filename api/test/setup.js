import dotenv from "dotenv";
import { clearDB, disconnectDB } from "../db.js";
import mongoose, { connect } from "mongoose";

dotenv.config({ path: new URL("../.env.test", import.meta.url) });

let currentDbName = null;

function buildDbUri(dbName) {
  const base = process.env.MONGO_URI_BASE;
  if (!base) throw new Error("MONGO_URI_BASE missing in .env.test");

  // Safety: keep test DBs clearly test-only
  if (!dbName.startsWith("partydrop_test_")) {
    throw new Error(
      `Refusing to connect: dbName "${dbName}" must start with "partydrop_test_"`
    );
  }

  const sep = base.endsWith("/") ? "" : "/";
  return `${base}${sep}${dbName}`;
}

export async function setupDB(dbName) {
	currentDbName = dbName;
	const uri = buildDbUri(dbName);

	// If already connected, (e.g. in watch mode with hot reload), disconnect first
	if (mongoose.connection.readyState === 1) {
		console.log("Disconnecting existing DB connection in setupDB");
		await mongoose.disconnect();
	}
	await mongoose.connect(uri);
	console.log(`Mongo connected: ${mongoose.connection.host} / ${dbName}`);
}

/**
 * Remove all documents from all collections in the current database.
 * CAll in `beforeEach` to ensure a clean state for each test. 
 */
export async function resetDB() {
	if (mongoose.connection.readyState !== 1) {
		throw new Error("Database not connected in resetDB");
	}
	if (!currentDbName) {
		throw new Error("currentDbName not set in resetDB");
	}
	const collections = await mongoose.connection.db.collections();
	for (const collection of collections) {
		await collection.deleteMany({});
	}
}

/**
 * Disconnect from the database.
 * Call in `afterAll` to clean up after tests complete.
 */

export async function teardownDB() {
	try {
		if (mongoose.connection.readyState !== 1) {
			throw new Error("Database not connected in teardownDB");
		}
		const dbName = mongoose.connection.db.databaseName;

		if (!currentDbName) {
			throw new Error("currentDbName not set in teardownDB");
		}

		if (dbName !== currentDbName) {
			throw new Error(
				`teardownDB connected to wrong database: expected ${currentDbName}, got ${dbName}`
			);
		}

		if (!dbName.startsWith("partydrop_test_")) {
			throw new Error(
				`Refusing to disconnect from what looks like a non-test database: ${dbName}`
			);
		}
		await mongoose.connection.db.dropDatabase();

	} finally {
		//always disconnect even if drop failed
		if (mongoose.connection.readyState === 1) {
			await mongoose.disconnect();
			console.log("Mongo disconnected");
		}
		currentDbName = null;
	}
}

