import { NextResponse } from "next/server";
import { serverError } from "@/lib/api";
import { requireApiStaff } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { findVisibleMembers } from "@/lib/teamMembers";
import Application from "@/models/Application";
import Event from "@/models/Event";
import TeamMember from "@/models/TeamMember";

export async function GET() {
  const auth = await requireApiStaff();
  if (!auth.ok) return auth.response;
  try {
    await connectToDatabase();
    const [members, totalApplications, pendingApplications, acceptedApplications, recentApplications, totalEvents, teamCounts, crossTeamEvents] = await Promise.all([
      findVisibleMembers(),
      Application.countDocuments(),
      Application.countDocuments({ status: { $in: ["Pending", null] } }),
      Application.countDocuments({ status: "Accepted" }),
      Application.find().sort({ createdAt: -1 }).limit(5).select("fullName registrationNumber areaOfInterest status createdAt").lean(),
      Event.countDocuments(),
      TeamMember.aggregate<{ team: string; count: number }>([
        { $match: { team: { $nin: [null, "", undefined] } } },
        { $group: { _id: "$team", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $project: { _id: 0, team: "$_id", count: 1 } },
      ]),
      Event.find().select("team assignedMembers").populate({ path: "assignedMembers", select: "team" }).lean(),
    ]);
    let crossTeamAssignments = 0;
    for (const event of crossTeamEvents) {
      for (const member of event.assignedMembers as Array<{ team?: string }>) {
        if (member.team && member.team !== event.team) crossTeamAssignments += 1;
      }
    }
    return NextResponse.json({
      success: true,
      totalTeamMembers: members.length,
      totalApplications,
      pendingApplications,
      acceptedApplications,
      totalEvents,
      crossTeamAssignments,
      teamCounts,
      recentApplications: recentApplications.map((application) => ({ ...application, status: application.status || "Pending" })),
    });
  } catch (error) {
    return serverError("[ADMIN STATS ERROR]", error, "Unable to load dashboard statistics.");
  }
}
