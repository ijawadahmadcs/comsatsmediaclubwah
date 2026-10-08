// src/app/api/admin/team-leads/create/route.ts
import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth";
import { createTeamLead } from "@/lib/teamlead";

export async function POST(req: Request) {
  if (!(await requireApiSuperAdmin())) return NextResponse.json({ error: "Superadmin access required." }, { status: 403 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { name, registrationNumber, password, team, isActive } = body as Record<string, unknown>;
  if (typeof name !== "string" || typeof registrationNumber !== "string" || typeof password !== "string" || typeof team !== "string" || !name.trim() || !registrationNumber.trim() || password.length < 8 || !team.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  try {
    const admin = await createTeamLead({ name, registrationNumber, password, team, isActive: isActive !== false });
    const rest = admin.toObject();
    delete rest.passwordHash;
    delete rest.__v;
    return NextResponse.json({ teamLead: rest }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("duplicate key")) return NextResponse.json({ error: "Registration number already exists." }, { status: 409 });
    if (error instanceof Error && error.message.includes("Invalid Team Lead team")) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "Unable to create Team Lead." }, { status: 500 });
  }
}
