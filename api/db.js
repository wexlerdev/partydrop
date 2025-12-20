import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI missing in environment");

  // if we are in tests, refuse to connect unless it is the test database
  if (process.env.NODE_ENV === "test" && !uri.includes("partydrop_test")) {
	throw new Error("Refusing to connect to non-test database in test environment");
  }

  const conn = await mongoose.connect(uri);
  console.log(`Mongo connected: ${conn.connection.host}`);
}

export async function disconnectDB() {
	await mongoose.disconnect();
}

export async function clearDB() {
	const db = mongoose.connection.db;
	if (!db) throw new Error("No database connection");

	const collections = await db.collections();
	for (const collection of collections) {
		await collection.deleteMany({});
	}
}
