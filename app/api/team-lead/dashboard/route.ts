import { NextResponse } from "next/server";
import { serverError } from "@/lib/api";
import connectToDatabase from "@/lib/mongodb";
import { requireTeamLead } from "@/lib/requireTeamLead";
import { getTeamScope } from "@/lib/teamScope";
import Event from "@/models/Event";

/**
 * GET /api/team-lead/dashboard
 * Statistics for the signed-in Team Lead's team:
 *  - totalEvents
 *  - avgAttendancePct: share of assigned members who attended, over past events whose attendance was taken
 *  - avgRating: average rating given to members while they were assigned to an event
 */
export async function GET() {
  const auth = await requireTeamLead();
  if (!auth.ok) return auth.response;
  const lead = auth.account;
  const teams = getTeamScope(lead.team);

  try {
    await connectToDatabase();
    const [totalEvents, attendanceAgg, ratingAgg] = await Promise.all([
      Event.countDocuments({ team: { $in: teams } }),
      Event.aggregate<{ totalAttended: number; totalAssigned: number }>([
        {
          $match: {
            team: { $in: teams },
            // Future events, and past events whose attendance was never taken, would count as 0%.
            date: { $lte: new Date() },
            $or: [{ attendanceRecordedAt: { $exists: true } }, { "attendance.0": { $exists: true } }],
          },
        },
        {
          $project: {
            // Only count attendance of members who are still assigned to the event.
            attended: { $size: { $setIntersection: [{ $ifNull: ["$attendance", []] }, { $ifNull: ["$assignedMembers", []] }] } },
            assigned: { $size: { $ifNull: ["$assignedMembers", []] } },
          },
        },
        { $match: { assigned: { $gt: 0 } } },
        { $group: { _id: null, totalAttended: { $sum: "$attended" }, totalAssigned: { $sum: "$assigned" } } },
      ]),
      Event.aggregate<{ total: number; count: number }>([
        { $match: { team: { $in: teams } } },
        {
          $project: {
            ratingsArray: { $objectToArray: { $ifNull: ["$ratings", {}] } },
            assigned: { $map: { input: { $ifNull: ["$assignedMembers", []] }, as: "member", in: { $toString: "$$member" } } },
          },
        },
        { $unwind: "$ratingsArray" },
        { $match: { $expr: { $in: ["$ratingsArray.k", "$assigned"] } } },
        { $group: { _id: null, total: { $sum: "$ratingsArray.v" }, count: { $sum: 1 } } },
      ]),
    ]);

    const attendance = attendanceAgg[0];
    const ratings = ratingAgg[0];
    const avgAttendancePct = attendance?.totalAssigned ? (attendance.totalAttended / attendance.totalAssigned) * 100 : 0;
    const avgRating = ratings?.count ? ratings.total / ratings.count : 0;

    return NextResponse.json({
      totalEvents,
      avgAttendancePct: Number(avgAttendancePct.toFixed(2)),
      avgRating: Number(avgRating.toFixed(2)),
    });
  } catch (error) {
    return serverError("[TEAM LEAD DASHBOARD ERROR]", error, "Unable to load dashboard.");
  }
}
