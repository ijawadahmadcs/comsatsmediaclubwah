// src/app/api/team-lead/events/[id]/route.ts
import { NextResponse } from "next/server";
import { requireTeamLead } from "@/lib/requireTeamLead";
import Event from "@/models/Event";
import Log from "@/models/Log";
import mongoose from "mongoose";
import { getTeamScope } from "@/lib/teamScope";
import { getApprovedTeamMemberIds } from "@/lib/teamleadMembers";

/** Helper to ensure the event belongs to the lead's team */
async function getOwnEvent(id: string, leadTeam: string) {
  if (!mongoose.isValidObjectId(id)) return null;
  return await Event.findOne({ _id: id, team: { $in: getTeamScope(leadTeam) } })
    .populate({ path: "assignedMembers", select: "name registrationNumber" })
    .lean();
}

/** GET single event */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const lead = await requireTeamLead();
  if (!lead) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const event = await getOwnEvent(id, lead.team);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return NextResponse.json({ event });
}

/** PUT update event */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const lead = await requireTeamLead();
  if (!lead) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const input = body as Record<string, unknown>;
  const updates: Record<string, unknown> = {};
  if (typeof input.title === "string" && input.title.trim()) updates.title = input.title.trim();
  if (typeof input.description === "string") updates.description = input.description.trim();
  if (typeof input.date === "string" && input.date) updates.date = input.date;
  if (input.assignedMemberIds !== undefined) {
    if (!Array.isArray(input.assignedMemberIds) || input.assignedMemberIds.some((id) => typeof id !== "string" || !mongoose.isValidObjectId(id))) return NextResponse.json({ error: "Invalid assigned member IDs" }, { status: 400 });
    const memberIds = Array.from(new Set(input.assignedMemberIds as string[]));
    const approvedMemberIds = await getApprovedTeamMemberIds(lead.team);
    if (memberIds.some((memberId) => !approvedMemberIds.includes(memberId))) return NextResponse.json({ error: "Only approved members from your team can be assigned" }, { status: 403 });
    updates.assignedMembers = memberIds;
  }
  if (!Object.keys(updates).length) return NextResponse.json({ error: "No valid updates" }, { status: 400 });

  const updated = await Event.findOneAndUpdate(
    { _id: id, team: { $in: getTeamScope(lead.team) } },
    updates,
    { new: true }
  )
    .populate({ path: "assignedMembers", select: "name registrationNumber" })
    .lean();

  if (!updated) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // Log update
  await Log.create({
    action: "event_updated",
    adminId: lead.id,
    details: { eventId: updated._id, updates },
  });

  return NextResponse.json({ event: updated });
}

/** DELETE event */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const lead = await requireTeamLead();
  if (!lead) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  const result = await Event.deleteOne({ _id: id, team: { $in: getTeamScope(lead.team) } });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Log deletion
  await Log.create({
    action: "event_deleted",
    adminId: lead.id,
    details: { eventId: id },
  });

  return NextResponse.json({ success: true });
}

/** POST actions – attendance or rating */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const lead = await requireTeamLead();
  if (!lead) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const event = await Event.findOne({ _id: id, team: { $in: getTeamScope(lead.team) } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  if (action === "attendance") {
    const body = await request.json().catch(() => null) as { memberIds?: unknown } | null;
    const memberIds = body?.memberIds;
    if (!Array.isArray(memberIds) || memberIds.some((id) => typeof id !== "string" || !mongoose.isValidObjectId(id))) {
      return NextResponse.json({ error: "memberIds must be an array" }, { status: 400 });
    }
    const uniqueMemberIds = Array.from(new Set(memberIds as string[]));
    const assignedIds = event.assignedMembers.map((member: unknown) => String(member));
    if (uniqueMemberIds.some((id) => !assignedIds.includes(id))) return NextResponse.json({ error: "Attendance must use assigned team members" }, { status: 403 });
    event.attendance = uniqueMemberIds as typeof event.attendance;
    await event.save();
    await Log.create({
      action: "attendance_marked",
      adminId: lead.id,
      details: { eventId: event._id, memberIds },
    });
    return NextResponse.json({ success: true, attendance: event.attendance });
  }

  if (action === "rating") {
    const body = await request.json().catch(() => null) as { memberId?: unknown; rating?: unknown; remark?: unknown } | null;
    const { memberId, rating, remark } = body ?? {};
    const assignedIds = event.assignedMembers.map((member: unknown) => String(member));
    if (typeof memberId !== "string" || !mongoose.isValidObjectId(memberId) || !assignedIds.includes(memberId) || typeof rating !== "number" || !Number.isInteger(rating)) {
      return NextResponse.json({ error: "memberId and rating required" }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating must be 1‑5" }, { status: 400 });
    }
    if (remark !== undefined && (typeof remark !== "string" || remark.length > 1000)) return NextResponse.json({ error: "Remark must be 1000 characters or fewer" }, { status: 400 });
    event.ratings.set(memberId, rating);
    if (typeof remark === "string") event.remarks.set(memberId, remark.trim());
    await event.save();
    await Log.create({
      action: "rating_submitted",
      adminId: lead.id,
      details: { eventId: event._id, memberId, rating, remark },
    });
    return NextResponse.json({ success: true, rating, remark });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
