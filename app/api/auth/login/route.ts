import { NextResponse } from "next/server";
import {
  authenticateAdmin,
  setAdminSession,
  validateAuthRuntimeConfig,
} from "@/lib/auth";

export const runtime = "nodejs";

function isLoginBody(value: unknown): value is { registrationNumber: string; password: string } {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
    && typeof (value as { registrationNumber?: unknown }).registrationNumber === "string"
    && typeof (value as { password?: unknown }).password === "string";
}

export async function POST(request: Request) {
  console.info("[AUTH] Login request received");

  try {
    validateAuthRuntimeConfig();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid JSON request." }, { status: 400 });
    }
    if (!isLoginBody(body)) {
      return NextResponse.json({ success: false, message: "Registration number and password are required." }, { status: 400 });
    }

    const admin = await authenticateAdmin(body.registrationNumber, body.password);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Invalid credentials or inactive account." }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, admin });
    setAdminSession(response, admin);
    console.info("[AUTH] Cookie created");
    return response;
  } catch (error) {
    const safeError = error instanceof Error
      ? { name: error.name, message: error.message.replace(/(mongodb(?:\+srv)?:\/\/)[^\s]+/gi, "$1[redacted]") }
      : { name: "UnknownError", message: "Unknown authentication error" };
    console.error("[AUTH LOGIN ERROR]", safeError);
    return NextResponse.json({ success: false, message: "Unable to sign in." }, { status: 500 });
  }
}