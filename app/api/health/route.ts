import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectToDatabase();
    return NextResponse.json({ success: true, database: "connected" });
  } catch (error) {
    console.error("[HEALTH DB ERROR]", error instanceof Error ? { name: error.name, message: error.message.replace(/(mongodb(?:\+srv)?:\/\/)[^\s]+/gi, "$1[redacted]") } : { name: "UnknownError" });
    return NextResponse.json({ success: false, database: "unavailable" }, { status: 503 });
  }
}
