import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI missing in environment");

  const conn = await mongoose.connect(uri);
  console.log(`Mongo connected: ${conn.connection.host}`);
}

export async function disconnectDB() {
	await mongoose.disconnect();
}

export async function clearDB() {
	if (mongoose.connection.readyState !== 1) {
		throw new Error("Database not connected");
	}

	const db = mongoose.connection.db;
	if (!db) throw new Error("No database connection");

	const collections = await db.collections();
	for (const collection of collections) {
		await collection.deleteMany({});
	}
}
