import { findVisibleMembers } from "@/lib/teamMembers";
import { isOwnCloudinaryImageUrl } from "@/lib/cloudinary";
import Event from "@/models/Event";

export type RecognitionWinner = {
  memberId: string;
  name: string;
  role: string;
  image?: string;
  attendedEvents: number;
  assignedEvents: number;
  averageRating: number;
  ratingCount: number;
  score: number;
  periodStart: string;
  periodEnd: string;
};

type MemberStats = {
  memberId: string;
  attendedEvents: number;
  assignedEvents: number;
  ratingTotal: number;
  ratingCount: number;
};

function mapValue(value: unknown, key: string) {
  if (value instanceof Map) return value.get(key);
  if (value && typeof value === "object")
    return (value as Record<string, unknown>)[key];
  return undefined;
}

export async function findMemberOfPeriod(
  days: 7 | 30,
): Promise<RecognitionWinner | null> {
  const periodEnd = new Date();
  const periodStart = new Date(
    periodEnd.getTime() - days * 24 * 60 * 60 * 1000,
  );
  const [events, visibleMembers] = await Promise.all([
    Event.find({ date: { $gte: periodStart, $lte: periodEnd } })
      .select("assignedMembers attendance ratings date")
      .lean(),
    findVisibleMembers(),
  ]);

  const visibleById = new Map(
    visibleMembers.map((member) => [member._id.toString(), member]),
  );
  const stats = new Map<string, MemberStats>();

  for (const event of events) {
    const assignedIds = event.assignedMembers.map((member) =>
      member.toString(),
    );
    const attendanceIds = new Set(
      event.attendance.map((member) => member.toString()),
    );
    for (const memberId of assignedIds) {
      if (!visibleById.has(memberId)) continue;
      const current = stats.get(memberId) ?? {
        memberId,
        attendedEvents: 0,
        assignedEvents: 0,
        ratingTotal: 0,
        ratingCount: 0,
      };
      current.assignedEvents += 1;
      if (attendanceIds.has(memberId)) current.attendedEvents += 1;
      const rating = mapValue(event.ratings, memberId);
      if (typeof rating === "number" && rating >= 1 && rating <= 5) {
        current.ratingTotal += rating;
        current.ratingCount += 1;
      }
      stats.set(memberId, current);
    }
  }

  const candidates = [...stats.values()].filter(
    (candidate) => candidate.attendedEvents > 0,
  );
  if (!candidates.length) return null;
  const maxAttendance = Math.max(
    ...candidates.map((candidate) => candidate.attendedEvents),
  );
  candidates.sort((left, right) => {
    const leftAverage = left.ratingCount
      ? left.ratingTotal / left.ratingCount
      : 0;
    const rightAverage = right.ratingCount
      ? right.ratingTotal / right.ratingCount
      : 0;
    const leftScore =
      (left.attendedEvents / maxAttendance) * 60 + (leftAverage / 5) * 40;
    const rightScore =
      (right.attendedEvents / maxAttendance) * 60 + (rightAverage / 5) * 40;
    return (
      rightScore - leftScore ||
      right.attendedEvents - left.attendedEvents ||
      rightAverage - leftAverage ||
      right.ratingCount - left.ratingCount ||
      (visibleById.get(left.memberId)?.name ?? "").localeCompare(
        visibleById.get(right.memberId)?.name ?? "",
      )
    );
  });

  const winner = candidates[0];
  const member = visibleById.get(winner.memberId);
  if (!member) return null;
  const averageRating = winner.ratingCount
    ? winner.ratingTotal / winner.ratingCount
    : 0;
  return {
    memberId: member._id.toString(),
    name: member.name,
    role: member.role,
    image: isOwnCloudinaryImageUrl(member.image) ? member.image : undefined,
    attendedEvents: winner.attendedEvents,
    assignedEvents: winner.assignedEvents,
    averageRating: Number(averageRating.toFixed(2)),
    ratingCount: winner.ratingCount,
    score: Number(
      (
        (winner.attendedEvents / maxAttendance) * 60 +
        (averageRating / 5) * 40
      ).toFixed(2),
    ),
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
  };
}
