import dotenv from "dotenv";
import { clearDB, connectDB, disconnectDB } from "../db.js";

dotenv.config({ path: new URL("../.env.test", import.meta.url) });

export async function setupDB() {
  await connectDB();
}

export async function teardownDB() {
	await disconnectDB();
}

export async function resetDB() {
	await clearDB();
}
