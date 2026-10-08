// src/app/api/team-lead/events/route.ts
import { NextResponse } from "next/server";
import { requireTeamLead } from "@/lib/requireTeamLead";
import Event from "@/models/Event";
import mongoose from "mongoose";
import { getTeamScope } from "@/lib/teamScope";
import { getApprovedTeamMemberIds } from "@/lib/teamleadMembers";

/**
 * GET  /api/team-lead/events
 * Returns all events belonging to the logged‑in Team‑Lead's team.
 */
export async function GET() {
  const lead = await requireTeamLead();
  if (!lead) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teamScope = getTeamScope(lead.team);
  const events = await Event.find({ team: { $in: teamScope } })
    .populate({ path: "assignedMembers", select: "name registrationNumber" })
    .sort({ date: -1 })
    .lean();

  return NextResponse.json({ events });
}

/**
 * POST /api/team-lead/events
 * Creates a new event. The team is derived from the session.
 * Expected body: { title, description?, date, assignedMemberIds?[] }
 */
export async function POST(req: Request) {
  const lead = await requireTeamLead();
  if (!lead) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { title, description, date, assignedMemberIds } = body as {
    title?: unknown; description?: unknown; date?: unknown; assignedMemberIds?: unknown;
  };
  if (typeof title !== "string" || !title.trim() || typeof date !== "string" || !date) {
    return NextResponse.json(
      { error: "title and date are required" },
      { status: 400 }
    );
  }
  if (description !== undefined && typeof description !== "string") return NextResponse.json({ error: "Invalid description" }, { status: 400 });
  if (assignedMemberIds !== undefined && (!Array.isArray(assignedMemberIds) || assignedMemberIds.some((id) => typeof id !== "string" || !mongoose.isValidObjectId(id)))) {
    return NextResponse.json({ error: "assignedMemberIds must contain valid member IDs" }, { status: 400 });
  }

  const team = lead.team;
  const memberIds = Array.from(new Set((assignedMemberIds as string[] | undefined) ?? []));
  const approvedMemberIds = await getApprovedTeamMemberIds(team);
  if (memberIds.some((memberId) => !approvedMemberIds.includes(memberId))) return NextResponse.json({ error: "Only approved members from your team can be assigned" }, { status: 403 });
  const event = await Event.create({
    title: title.trim(),
    description,
    date,
    team,
    teamLeadId: lead.id,
    assignedMembers: memberIds,
  });

  // Populate for response consistency
  const populated = await event
    .populate({ path: "assignedMembers", select: "name registrationNumber" })
    .execPopulate();

  return NextResponse.json({ event: populated }, { status: 201 });
}
