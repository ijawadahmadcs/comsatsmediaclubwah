// src/app/api/admin/team-leads/[id]/route.ts
import { NextResponse } from "next/server";
import Admin from "@/models/Admin";
import { requireApiSuperAdmin } from "@/lib/auth";
import { updateTeamLead } from "@/lib/teamlead";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireApiSuperAdmin())) return NextResponse.json({ error: "Superadmin access required." }, { status: 403 });
  const { id } = await params;
  const admin = await Admin.findOne({ _id: id, role: "teamlead" }).select("-passwordHash").lean();
  if (!admin) return NextResponse.json({ error: "TeamLead not found" }, { status: 404 });
  return NextResponse.json({ teamLead: admin });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireApiSuperAdmin())) return NextResponse.json({ error: "Superadmin access required." }, { status: 403 });
  const { id } = await params;
  let updates: Record<string, unknown>;
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid request");
    updates = body as Record<string, unknown>;
  } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  if (updates.password !== undefined && (typeof updates.password !== "string" || updates.password.length < 8)) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  try {
    const updated = await updateTeamLead(id, updates);
    if (!updated) return NextResponse.json({ error: "TeamLead not found" }, { status: 404 });
    const rest = { ...updated };
    delete rest.passwordHash;
    delete rest.__v;
    return NextResponse.json({ teamLead: rest });
  } catch (error) {
    if (error instanceof Error && error.message.includes("duplicate key")) return NextResponse.json({ error: "Registration number already exists." }, { status: 409 });
    if (error instanceof Error && error.message.includes("Invalid Team Lead team")) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "Unable to update Team Lead." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireApiSuperAdmin())) return NextResponse.json({ error: "Superadmin access required." }, { status: 403 });
  const { id } = await params;
  const result = await Admin.deleteOne({ _id: id, role: "teamlead" });
  if (result.deletedCount === 0) return NextResponse.json({ error: "TeamLead not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
