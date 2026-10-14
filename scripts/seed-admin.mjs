// Creates the superadmin account, or resets its password. Run with `npm run seed:admin` (uses tsx).
import { config } from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { getPasswordError } from "../lib/password.ts";

// Next.js reads .env.local, so check it first.
config({ path: [".env.local", ".env"], quiet: true });

const uri = process.env.MONGODB_URI;
const registrationNumber = process.env.INITIAL_ADMIN_REGISTRATION_NUMBER?.trim().toUpperCase();
const password = process.env.INITIAL_ADMIN_PASSWORD;

if (!uri || !registrationNumber || !password) {
  throw new Error("MONGODB_URI, INITIAL_ADMIN_REGISTRATION_NUMBER, and INITIAL_ADMIN_PASSWORD are required");
}

const passwordError = getPasswordError(password);
if (passwordError) {
  throw new Error(`INITIAL_ADMIN_PASSWORD is not acceptable: ${passwordError}`);
}

await mongoose.connect(uri);
const admins = mongoose.connection.collection("admins");
const passwordHash = await bcrypt.hash(password, 12);
await admins.updateOne(
  { registrationNumber },
  {
    $set: { passwordHash, role: "superadmin", isActive: true, updatedAt: new Date() },
    // Signs out any existing sessions for this account.
    $inc: { sessionVersion: 1 },
    $setOnInsert: { registrationNumber, createdAt: new Date() },
  },
  { upsert: true },
);
console.log(`Seeded superadmin ${registrationNumber}`);
await mongoose.disconnect();
