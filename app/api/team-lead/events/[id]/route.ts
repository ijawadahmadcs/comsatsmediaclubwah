import mongoose, { type UpdateQuery } from "mongoose";
import { NextResponse } from "next/server";
import { jsonError, readJsonObject, serverError } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { parseEventInput, parseMemberIds } from "@/lib/eventInput";
import connectToDatabase from "@/lib/mongodb";
import { requireTeamLead } from "@/lib/requireTeamLead";
import { getTeamScope } from "@/lib/teamScope";
import { getApprovedTeamMemberIds } from "@/lib/teamleadMembers";
import Event, { type IEvent } from "@/models/Event";

type Context = { params: Promise<{ id: string }> };

const notFound = () => jsonError("Event not found.", 404);
const MEMBER_FIELDS = { path: "assignedMembers", select: "name registrationNumber" };

/** GET single event */
export async function GET(_request: Request, { params }: Context) {
  const auth = await requireTeamLead();
  if (!auth.ok) return auth.response;
  const lead = auth.account;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return notFound();
  try {
    await connectToDatabase();
    const event = await Event.findOne({ _id: id, team: { $in: getTeamScope(lead.team) } }).populate(MEMBER_FIELDS).lean();
    if (!event) return notFound();
    return NextResponse.json({ event });
  } catch (error) {
    return serverError("[TEAM LEAD EVENT GET ERROR]", error, "Unable to load event.");
  }
}

/** PUT update event */
export async function PUT(request: Request, { params }: Context) {
  const auth = await requireTeamLead();
  if (!auth.ok) return auth.response;
  const lead = auth.account;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return notFound();

  const body = await readJsonObject(request);
  if (!body) return jsonError("Invalid request data.", 400);
  const input = parseEventInput(body, "update");
  if ("error" in input) return jsonError(input.error, 400);

  try {
    await connectToDatabase();
    const teamFilter = { _id: id, team: { $in: getTeamScope(lead.team) } };
    const existing = await Event.findOne(teamFilter).select("assignedMembers").lean();
    if (!existing) return notFound();

    const set: Partial<IEvent> = {};
    if (input.title !== undefined) set.title = input.title;
    if (input.description !== undefined) set.description = input.description;
    if (input.date !== undefined) set.date = input.date;
    const update: UpdateQuery<IEvent> = {};

    if (input.memberIds) {
      const approvedMemberIds = await getApprovedTeamMemberIds(lead.team);
      if (input.memberIds.some((memberId) => !approvedMemberIds.includes(memberId))) {
        return jsonError("Only approved members from your team can be assigned.", 403);
      }
      set.assignedMembers = input.memberIds.map((memberId) => new mongoose.Types.ObjectId(memberId));
      // Unassigned members must not keep attendance, ratings or remarks, or the statistics go wrong.
      const kept = new Set(input.memberIds);
      const removed = existing.assignedMembers.map(String).filter((memberId) => !kept.has(memberId));
      if (removed.length) {
        update.$pull = { attendance: { $in: removed } };
        update.$unset = Object.fromEntries(removed.flatMap((memberId) => [[`ratings.${memberId}`, ""], [`remarks.${memberId}`, ""]]));
      }
    }
    if (!Object.keys(set).length) return jsonError("No valid updates.", 400);
    update.$set = set;

    const updated = await Event.findOneAndUpdate(teamFilter, update, { returnDocument: "after", runValidators: true })
      .populate(MEMBER_FIELDS)
      .lean();
    if (!updated) return notFound();

    await recordAudit(lead, {
      action: "event_updated",
      targetType: "event",
      targetId: id,
      details: { title: updated.title, fields: Object.keys(set) },
    });
    return NextResponse.json({ event: updated });
  } catch (error) {
    return serverError("[TEAM LEAD EVENT PUT ERROR]", error, "Unable to update event.");
  }
}

/** DELETE event */
export async function DELETE(_request: Request, { params }: Context) {
  const auth = await requireTeamLead();
  if (!auth.ok) return auth.response;
  const lead = auth.account;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return notFound();
  try {
    await connectToDatabase();
    const deleted = await Event.findOneAndDelete({ _id: id, team: { $in: getTeamScope(lead.team) } }).lean();
    if (!deleted) return notFound();
    await recordAudit(lead, { action: "event_deleted", targetType: "event", targetId: id, details: { title: deleted.title } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError("[TEAM LEAD EVENT DELETE ERROR]", error, "Unable to delete event.");
  }
}

/** POST actions – ?action=attendance or ?action=rating */
export async function POST(request: Request, { params }: Context) {
  const auth = await requireTeamLead();
  if (!auth.ok) return auth.response;
  const lead = auth.account;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return notFound();
  const action = new URL(request.url).searchParams.get("action");
  if (action !== "attendance" && action !== "rating") return jsonError("Invalid action.", 400);
  const body = await readJsonObject(request);
  if (!body) return jsonError("Invalid request data.", 400);

  try {
    await connectToDatabase();
    const event = await Event.findOne({ _id: id, team: { $in: getTeamScope(lead.team) } });
    if (!event) return notFound();
    const assignedIds = event.assignedMembers.map(String);

    if (action === "attendance") {
      const memberIds = parseMemberIds(body.memberIds);
      if (!memberIds) return jsonError("memberIds must be an array of member IDs.", 400);
      if (memberIds.some((memberId) => !assignedIds.includes(memberId))) {
        return jsonError("Attendance can only include members assigned to this event.", 403);
      }
      event.attendance = memberIds.map((memberId) => new mongoose.Types.ObjectId(memberId));
      event.attendanceRecordedAt = new Date();
      await event.save();
      await recordAudit(lead, { action: "attendance_marked", targetType: "event", targetId: id, details: { present: memberIds.length, assigned: assignedIds.length } });
      return NextResponse.json({ success: true, attendance: event.attendance });
    }

    const { memberId, rating, remark } = body;
    if (typeof memberId !== "string" || !mongoose.isValidObjectId(memberId) || !assignedIds.includes(memberId) || typeof rating !== "number" || !Number.isInteger(rating)) {
      return jsonError("memberId and rating are required.", 400);
    }
    if (rating < 1 || rating > 5) return jsonError("Rating must be between 1 and 5.", 400);
    if (remark !== undefined && (typeof remark !== "string" || remark.length > 1000)) return jsonError("Remarks must be 1000 characters or fewer.", 400);
    event.ratings.set(memberId, rating);
    if (typeof remark === "string") event.remarks.set(memberId, remark.trim());
    await event.save();
    await recordAudit(lead, { action: "rating_submitted", targetType: "event", targetId: id, details: { memberId, rating } });
    return NextResponse.json({ success: true, rating, remark });
  } catch (error) {
    return serverError("[TEAM LEAD EVENT ACTION ERROR]", error, "Unable to save changes.");
  }
}
