import mongoose from "mongoose";
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectToDatabase();
    // connectToDatabase() returns the cached connection, so check that it is up right now.
    if (mongoose.connection.readyState !== 1) throw new Error("MongoDB is not connected");
    return NextResponse.json({ success: true, database: "connected" });
  } catch (error) {
    console.error("[HEALTH DB ERROR]", error instanceof Error ? { name: error.name, message: error.message.replace(/(mongodb(?:\+srv)?:\/\/)[^\s]+/gi, "$1[redacted]") } : { name: "UnknownError" });
    return NextResponse.json({ success: false, database: "unavailable" }, { status: 503 });
  }
}
