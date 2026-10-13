import { NextResponse } from "next/server";
import { logServerError } from "@/lib/api";
import { clearAdminSession, readSessionPayload, revokeSessions } from "@/lib/auth";

export const runtime = "nodejs";

/** Signs the account out on every device: the cookie is cleared and all its sessions are revoked. */
export async function POST() {
  try {
    const session = await readSessionPayload();
    if (session) await revokeSessions(session.id);
  } catch (error) {
    logServerError("[AUTH] Unable to revoke sessions during logout", error);
  }
  const response = NextResponse.json({ success: true });
  clearAdminSession(response);
  return response;
}
