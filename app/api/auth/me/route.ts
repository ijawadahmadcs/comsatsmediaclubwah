import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await requireApiAdmin();
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  return NextResponse.json({ success: true, admin });
}