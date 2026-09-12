import { config } from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

config();

const uri = process.env.MONGODB_URI;
const registrationNumber = process.env.INITIAL_ADMIN_REGISTRATION_NUMBER;
const password = process.env.INITIAL_ADMIN_PASSWORD;

if (!uri || !registrationNumber || !password) {
  throw new Error("MONGODB_URI, INITIAL_ADMIN_REGISTRATION_NUMBER, and INITIAL_ADMIN_PASSWORD are required");
}

await mongoose.connect(uri);
const admins = mongoose.connection.collection("admins");
const passwordHash = await bcrypt.hash(password, 12);
await admins.updateOne(
  { registrationNumber: registrationNumber.trim().toUpperCase() },
  {
    $set: { passwordHash, role: "superadmin", isActive: true, updatedAt: new Date() },
    $setOnInsert: { registrationNumber: registrationNumber.trim().toUpperCase(), createdAt: new Date() },
  },
  { upsert: true },
);
console.log(`Seeded superadmin ${registrationNumber.trim().toUpperCase()}`);
await mongoose.disconnect();