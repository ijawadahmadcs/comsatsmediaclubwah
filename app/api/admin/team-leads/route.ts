// src/app/api/admin/team-leads/route.ts
import { NextResponse } from "next/server";
import Admin from "@/models/Admin";
import { requireApiSuperAdmin } from "@/lib/auth";

export async function GET() {
  if (!(await requireApiSuperAdmin())) return NextResponse.json({ error: "Superadmin access required." }, { status: 403 });
  const teamLeads = await Admin.find({ role: "teamlead" }).select("-passwordHash").lean();
  return NextResponse.json({ teamLeads });
}
