import { NextResponse } from "next/server";
import { jsonError, readJsonObject, serverError } from "@/lib/api";
import { recordAudit } from "@/lib/audit";
import { parseEventInput } from "@/lib/eventInput";
import connectToDatabase from "@/lib/mongodb";
import { requireTeamLead } from "@/lib/requireTeamLead";
import { getTeamScope } from "@/lib/teamScope";
import { getApprovedTeamMemberIds } from "@/lib/teamleadMembers";
import Event from "@/models/Event";

/**
 * GET  /api/team-lead/events
 * Returns all events belonging to the logged‑in Team‑Lead's team.
 */
export async function GET() {
  const auth = await requireTeamLead();
  if (!auth.ok) return auth.response;
  const lead = auth.account;

  try {
    await connectToDatabase();
    const events = await Event.find({ team: { $in: getTeamScope(lead.team) } })
      .populate({ path: "assignedMembers", select: "name registrationNumber" })
      .sort({ date: -1 })
      .lean();
    return NextResponse.json({ events });
  } catch (error) {
    return serverError("[TEAM LEAD EVENTS GET ERROR]", error, "Unable to load events.");
  }
}

/**
 * POST /api/team-lead/events
 * Creates a new event. The team is derived from the session.
 * Expected body: { title, description?, date (ISO 8601 with time zone), assignedMemberIds?[] }
 */
export async function POST(request: Request) {
  const auth = await requireTeamLead();
  if (!auth.ok) return auth.response;
  const lead = auth.account;

  const body = await readJsonObject(request);
  if (!body) return jsonError("Invalid request data.", 400);
  const input = parseEventInput(body, "create");
  if ("error" in input) return jsonError(input.error, 400);

  try {
    await connectToDatabase();
    const memberIds = input.memberIds ?? [];
    const approvedMemberIds = await getApprovedTeamMemberIds(lead.team);
    if (memberIds.some((memberId) => !approvedMemberIds.includes(memberId))) {
      return jsonError("Only approved members from your team can be assigned.", 403);
    }
    const event = await Event.create({
      title: input.title,
      description: input.description,
      date: input.date,
      team: lead.team,
      teamLeadId: lead.id,
      assignedMembers: memberIds,
    });
    // Mongoose 9: populate() returns a promise; execPopulate() no longer exists.
    await event.populate({ path: "assignedMembers", select: "name registrationNumber" });
    await recordAudit(lead, { action: "event_created", targetType: "event", targetId: event._id.toString(), details: { title: event.title, team: lead.team } });
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    return serverError("[TEAM LEAD EVENTS POST ERROR]", error, "Unable to create event.");
  }
}
