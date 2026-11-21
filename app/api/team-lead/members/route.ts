import { NextResponse } from "next/server";
import { serverError } from "@/lib/api";
import connectToDatabase from "@/lib/mongodb";
import { requireTeamLead } from "@/lib/requireTeamLead";
import { getApprovedTeamMemberIds } from "@/lib/teamleadMembers";
import TeamMember from "@/models/TeamMember";
import { compareClubMemberIds } from "@/lib/teamMembers";

export async function GET() {
  const auth = await requireTeamLead();
  if (!auth.ok) return auth.response;
  const lead = auth.account;

  try {
    await connectToDatabase();
    const approvedMemberIds = await getApprovedTeamMemberIds(lead.team);
    const members = await TeamMember.find({ _id: { $in: approvedMemberIds } })
      .select("name registrationNumber clubMemberId department semester areaOfInterest role team")
      .lean();
    return NextResponse.json({
      members: [...members]
        .sort((left, right) => compareClubMemberIds(left.clubMemberId, right.clubMemberId))
        .map((member) => ({ ...member, team: member.team || member.areaOfInterest })),
    });
  } catch (error) {
    return serverError("[TEAM LEAD MEMBERS ERROR]", error, "Unable to load team members.");
  }
}
