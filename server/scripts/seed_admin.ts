import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Load .env BEFORE any other imports that might use process.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function main() {
  // Use dynamic import to ensure dotenv.config() has run
  const { seedAdmin } = await import("../db.js");
  
  const email = process.env.OWNER_OPEN_ID || "tymmyjones616@gmail.com";
  const password = "Dracco237?"; // User provided password

  console.log(`Seeding admin: ${email}...`);
  try {
    const admin = await seedAdmin(email, password);
    console.log("Admin seeded successfully:", admin);
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed admin:", error);
    process.exit(1);
  }
}

main();
