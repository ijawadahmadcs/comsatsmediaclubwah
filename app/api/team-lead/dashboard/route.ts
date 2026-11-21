import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { serverError } from "@/lib/api";
import connectToDatabase from "@/lib/mongodb";
import { requireTeamLead } from "@/lib/requireTeamLead";
import { getTeamScope } from "@/lib/teamScope";
import { getApprovedTeamMemberIds } from "@/lib/teamleadMembers";
import Event from "@/models/Event";
import TeamMember from "@/models/TeamMember";

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
    const [approvedMemberIds, teamScopedMembers] = await Promise.all([
      getApprovedTeamMemberIds(lead.team),
      TeamMember.find({ team: { $in: teams } }).select("_id").lean(),
    ]);
    const memberIds = Array.from(new Set([
      ...approvedMemberIds,
      ...teamScopedMembers.map((member) => member._id.toString()),
    ]));
    const memberObjectIds = memberIds.map((memberId) => new mongoose.Types.ObjectId(memberId));
    const [totalEvents, attendanceAgg, ratingAgg] = await Promise.all([
      Event.countDocuments({
        $or: [
          { team: { $in: teams } },
          ...(memberObjectIds.length ? [{ assignedMembers: { $in: memberObjectIds } }] : []),
        ],
      }),
      Event.aggregate<{ totalAttended: number; totalAssigned: number }>([
        {
          $match: {
            $and: [
              {
                $or: [
                  { team: { $in: teams } },
                  ...(memberObjectIds.length ? [{ assignedMembers: { $in: memberObjectIds } }] : []),
                ],
              },
              // Future events, and past events whose attendance were never taken, count as 0%.
              { date: { $lte: new Date() } },
              { $or: [{ attendanceRecordedAt: { $exists: true } }, { "attendance.0": { $exists: true } }] },
            ],
          },
        },
        {
          $project: {
            // Count attendance and assignments for this team, including cross-team events.
            attended: {
              $size: {
                $setIntersection: [
                  { $ifNull: ["$attendance", []] },
                  memberObjectIds,
                ],
              },
            },
            assigned: {
              $size: {
                $setIntersection: [
                  { $ifNull: ["$assignedMembers", []] },
                  memberObjectIds,
                ],
              },
            },
          },
        },
        { $match: { assigned: { $gt: 0 } } },
        { $group: { _id: null, totalAttended: { $sum: "$attended" }, totalAssigned: { $sum: "$assigned" } } },
      ]),
      Event.aggregate<{ total: number; count: number }>([
        {
          $match: {
            $or: [
              { team: { $in: teams } },
              ...(memberObjectIds.length ? [{ assignedMembers: { $in: memberObjectIds } }] : []),
            ],
          },
        },
        {
          $project: {
            ratingsArray: { $objectToArray: { $ifNull: ["$ratings", {}] } },
            assigned: memberIds,
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
