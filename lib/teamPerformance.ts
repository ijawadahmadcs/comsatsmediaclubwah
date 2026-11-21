import Event from "@/models/Event";
import TeamMember from "@/models/TeamMember";
import { getTeamScope } from "@/lib/teamScope";
import { getApprovedTeamMemberIds } from "@/lib/teamleadMembers";

export type TeamPerformanceRow = {
  memberId: string;
  name: string;
  registrationNumber: string;
  department: string;
  role: string;
  assignedEvents: number;
  attendedEvents: number;
  attendancePercent: number;
  averageRating: number;
  ratingCount: number;
  score: number;
};

function mapValue(value: unknown, key: string) {
  if (value instanceof Map) return value.get(key);
  if (value && typeof value === "object") return (value as Record<string, unknown>)[key];
  return undefined;
}

export function buildTeamPerformanceRows(
  members: Array<{
    _id: { toString(): string };
    name: string;
    registrationNumber?: string;
    department?: string;
    role: string;
  }>,
  events: Array<{
    assignedMembers: Array<{ toString(): string }>;
    attendance: Array<{ toString(): string }>;
    ratings: unknown;
  }>,
) {
  const stats = new Map<string, { assignedEvents: number; attendedEvents: number; ratingTotal: number; ratingCount: number }>();

  for (const member of members) {
    stats.set(member._id.toString(), { assignedEvents: 0, attendedEvents: 0, ratingTotal: 0, ratingCount: 0 });
  }

  for (const event of events) {
    const assignedIds = new Set(event.assignedMembers.map((member) => member.toString()));
    const attendedIds = new Set(event.attendance.map((member) => member.toString()));

    for (const memberId of assignedIds) {
      const current = stats.get(memberId);
      if (!current) continue;
      current.assignedEvents += 1;
      if (attendedIds.has(memberId)) current.attendedEvents += 1;

      const rating = mapValue(event.ratings, memberId);
      if (typeof rating === "number" && Number.isInteger(rating) && rating >= 1 && rating <= 5) {
        current.ratingTotal += rating;
        current.ratingCount += 1;
      }
    }
  }

  const rows: TeamPerformanceRow[] = members.map((member) => {
    const memberId = member._id.toString();
    const current = stats.get(memberId)!;
    const attendancePercent = current.assignedEvents
      ? (current.attendedEvents / current.assignedEvents) * 100
      : 0;
    const averageRating = current.ratingCount
      ? current.ratingTotal / current.ratingCount
      : 0;
    const score = attendancePercent * 0.6 + (averageRating / 5) * 40;

    return {
      memberId,
      name: member.name,
      registrationNumber: member.registrationNumber || "-",
      department: member.department || "-",
      role: member.role,
      assignedEvents: current.assignedEvents,
      attendedEvents: current.attendedEvents,
      attendancePercent: Number(attendancePercent.toFixed(1)),
      averageRating: Number(averageRating.toFixed(2)),
      ratingCount: current.ratingCount,
      score: Number(score.toFixed(2)),
    };
  });

  return rows.sort((left, right) =>
    right.score - left.score ||
    right.attendancePercent - left.attendancePercent ||
    right.averageRating - left.averageRating ||
    right.attendedEvents - left.attendedEvents ||
    left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
  );
}

export async function getTeamPerformance(team: string): Promise<TeamPerformanceRow[]> {
  const approvedMemberIds = await getApprovedTeamMemberIds(team);
  const teamScopedMembers = await TeamMember.find({
    team: { $in: getTeamScope(team) },
  }).select("_id").lean();
  const memberIds = Array.from(new Set([
    ...approvedMemberIds,
    ...teamScopedMembers.map((member) => member._id.toString()),
  ]));
  if (!memberIds.length) return [];

  const [members, events] = await Promise.all([
    TeamMember.find({ _id: { $in: memberIds } })
      .select("name registrationNumber department role")
      .lean(),
    Event.find({
      assignedMembers: { $in: memberIds },
    })
      .select("assignedMembers attendance ratings")
      .lean(),
  ]);

  return buildTeamPerformanceRows(members, events);
}
