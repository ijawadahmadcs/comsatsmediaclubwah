import { NextResponse } from "next/server";
import { requireTeamLead } from "@/lib/requireTeamLead";
import { getApprovedTeamMemberIds } from "@/lib/teamleadMembers";
import TeamMember from "@/models/TeamMember";

export async function GET() {
  const lead = await requireTeamLead();
  if (!lead) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const approvedMemberIds = await getApprovedTeamMemberIds(lead.team);
  const members = await TeamMember.find({ _id: { $in: approvedMemberIds } })
    .select("name registrationNumber department semester areaOfInterest role team")
    .sort({ name: 1 })
    .lean();

  return NextResponse.json({ members: members.map((member) => ({ ...member, team: member.team || member.areaOfInterest })) });
}
