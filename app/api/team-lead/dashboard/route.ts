// src/app/api/team-lead/dashboard/route.ts
import { NextResponse } from "next/server";
import { requireTeamLead } from "@/lib/requireTeamLead";
import Event from "@/models/Event";
import { getTeamScope } from "@/lib/teamScope";

/**
 * GET /api/team-lead/dashboard
 * Returns aggregated statistics for the logged‑in Team Lead's team:
 *  - totalEvents
 *  - avgAttendancePct (percentage of assigned members who attended across all events)
 *  - avgRating (average of all member ratings across all events)
 */
export async function GET() {
  const lead = await requireTeamLead();
  if (!lead) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teams = getTeamScope(lead.team);

  // Total number of events for this team
  const totalEventsPromise = Event.countDocuments({ team: { $in: teams } });

  // Average attendance percentage
  const attendanceAggPromise = Event.aggregate([
    { $match: { team: { $in: teams } } },
    {
      $project: {
        attendanceCount: { $size: { $ifNull: ["$attendance", []] } },
        assignedCount: { $size: { $ifNull: ["$assignedMembers", []] } },
      },
    },
    {
      $group: {
        _id: null,
        totalAttended: { $sum: "$attendanceCount" },
        totalAssigned: { $sum: "$assignedCount" },
      },
    },
    {
      $project: {
        _id: 0,
        avgAttendancePct: {
          $cond: [
            { $eq: ["$totalAssigned", 0] },
            0,
            { $multiply: [{ $divide: ["$totalAttended", "$totalAssigned"] }, 100] },
          ],
        },
      },
    },
  ]);

  // Average rating across all members/events
  const ratingAggPromise = Event.aggregate([
    { $match: { team: { $in: teams } } },
    { $project: { ratingsArray: { $objectToArray: "$ratings" } } },
    { $unwind: "$ratingsArray" },
    {
      $group: {
        _id: null,
        totalRating: { $sum: "$ratingsArray.v" },
        count: { $sum: 1 },
      },
    },
    { $project: { _id: 0, avgRating: { $divide: ["$totalRating", "$count"] } } },
  ]);

  const [totalEvents, attendanceAgg, ratingAgg] = await Promise.all([
    totalEventsPromise,
    attendanceAggPromise,
    ratingAggPromise,
  ]);

  const avgAttendancePct = attendanceAgg[0]?.avgAttendancePct ?? 0;
  const avgRating = ratingAgg[0]?.avgRating ?? 0;

  return NextResponse.json({
    totalEvents,
    avgAttendancePct: Number(avgAttendancePct.toFixed(2)),
    avgRating: Number(avgRating.toFixed(2)),
  });
}
