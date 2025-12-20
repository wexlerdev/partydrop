import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./db.js";

dotenv.config({ path: new URL("./.env.local", import.meta.url) });

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
	await connectDB();
	app.listen(PORT, () => {
	  console.log(`Server running on port ${PORT}`);
	});
  } catch (err) {
	console.error("Failed to start server", err);
	process.exit(1);
  }
}

startServer();