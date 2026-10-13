import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";

// Used by both portals; the client checks `admin.role` to decide which portal the account belongs to.
export async function GET() {
  const auth = await requireApiSession();
  if (!auth.ok) return auth.response;
  return NextResponse.json({ success: true, admin: auth.account });
}
