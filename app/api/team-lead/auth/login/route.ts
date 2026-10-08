// src/app/api/team-lead/auth/login/route.ts
import { NextResponse } from "next/server";
import { authenticateAdmin, setAdminSession } from "@/lib/auth";

/**
 * Team‑Lead login – reuses existing admin authentication.
 * Expects JSON body: { registrationNumber, password }.
 * On success, creates the shared admin session cookie and
 * redirects to /team-lead/dashboard.
 */
export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { registrationNumber, password } = body as { registrationNumber?: unknown; password?: unknown };

  if (typeof registrationNumber !== "string" || typeof password !== "string" || !registrationNumber || !password) {
    return NextResponse.json(
      { error: "registrationNumber and password required" },
      { status: 400 }
    );
  }

  // Use the existing admin authentication logic.
  const admin = await authenticateAdmin(registrationNumber, password);

  // admin may be null or error‑thrown; handle failures:
  if (!admin) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  // Ensure the authenticated user is a teamlead and active.
  if (admin.role !== "teamlead") {
    return NextResponse.json(
      { error: "Account is not a teamlead" },
      { status: 403 }
    );
  }
  if (!admin.team?.trim()) return NextResponse.json({ error: "Team Lead has no assigned team" }, { status: 403 });

  const response = NextResponse.json({ redirect: "/team-lead/dashboard" }, { status: 200 });
  setAdminSession(response, admin);
  return response;
}
