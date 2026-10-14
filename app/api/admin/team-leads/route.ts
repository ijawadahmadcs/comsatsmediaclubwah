import { NextResponse } from "next/server";
import { serverError } from "@/lib/api";
import { requireApiSuperAdmin } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { publicTeamLead } from "@/lib/teamlead";
import Admin from "@/models/Admin";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (!auth.ok) return auth.response;
  try {
    await connectToDatabase();
    const teamLeads = await Admin.find({ role: "teamlead" }).sort({ createdAt: 1 }).lean();
    return NextResponse.json({ success: true, teamLeads: teamLeads.map(publicTeamLead) });
  } catch (error) {
    return serverError("[TEAM LEADS GET ERROR]", error, "Unable to load Team Leads.");
  }
}
