import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI missing in environment");

  const conn = await mongoose.connect(uri);
  console.log(`Mongo connected: ${conn.connection.host}`);
}
