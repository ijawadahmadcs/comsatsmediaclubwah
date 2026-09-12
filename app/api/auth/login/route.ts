import { NextResponse } from "next/server";
import { authenticateAdmin, setAdminSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body?.registrationNumber !== "string" || typeof body?.password !== "string") {
      return NextResponse.json({ success: false, message: "Registration number and password are required." }, { status: 400 });
    }

    const admin = await authenticateAdmin(body.registrationNumber, body.password);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Invalid credentials or inactive account." }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, admin });
    setAdminSession(response, admin);
    return response;
  } catch {
    return NextResponse.json({ success: false, message: "Unable to sign in." }, { status: 500 });
  }
}