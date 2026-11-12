import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { jsonError, readJsonObject, serverError } from "@/lib/api";
import { parseEventRequestInput } from "@/lib/eventRequestInput";
import connectToDatabase from "@/lib/mongodb";
import { RATE_LIMITS, consumeRateLimit, getClientIp } from "@/lib/rateLimit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { getTeamScope } from "@/lib/teamScope";
import Admin from "@/models/Admin";
import Event from "@/models/Event";

const TEAMS = ["Photography", "Videography"] as const;

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  if (!body) return jsonError("Invalid request data.", 400);
  const parsed = parseEventRequestInput(body);
  if ("error" in parsed) return jsonError(parsed.error, 400);

  const ip = getClientIp(request);
  try {
    const rateLimit = await consumeRateLimit(RATE_LIMITS.applicationPerIp, ip);
    if (rateLimit.limited) {
      return jsonError("Too many requests from this network. Please try again later.", 429, {
        "Retry-After": String(rateLimit.retryAfterSeconds),
      });
    }
    if (!(await verifyTurnstileToken(body.turnstileToken, ip))) {
      return jsonError("Please complete the security check and try again.", 400);
    }

    await connectToDatabase();
    const teams = parsed.requestedTeam === "Photography" ? ["Photography"] : parsed.requestedTeam === "Videography" ? ["Videography"] : [...TEAMS];
    const leads = await Admin.find({
      role: "teamlead",
      isActive: true,
      team: { $in: teams.flatMap((team) => getTeamScope(team)) },
    }).select("_id team").lean();
    const leadByTeam = new Map(teams.map((team) => [
      team,
      leads.find((lead) => Boolean(lead.team && getTeamScope(team).includes(lead.team))),
    ]));
    const missingTeam = teams.find((team) => !leadByTeam.get(team));
    if (missingTeam) return jsonError(`The ${missingTeam} team is not currently available. Please try again later.`, 503);

    const requestId = crypto.randomUUID();
    const eventData = teams.map((team) => {
      const lead = leadByTeam.get(team);
      return {
        title: parsed.eventName,
        team,
        teamLeadId: lead?._id,
        date: parsed.startsAt,
        endsAt: parsed.endsAt,
        location: parsed.location,
        society: parsed.society,
        studentLeadName: parsed.studentLeadName,
        studentLeadContact: parsed.studentLeadContact,
        facultyLeadName: parsed.facultyLeadName,
        requestedTeam: parsed.requestedTeam,
        requestedPersons: parsed.requestedPersons,
        requestId,
        assignedMembers: [],
        attendance: [],
      };
    });
    const events = await Promise.all(eventData.map((data) => Event.create(data)));

    return NextResponse.json({ success: true, message: "Your coverage request has been sent to the relevant team leads.", requestId, eventIds: events.map((event) => event._id) }, { status: 201 });
  } catch (error) {
    return serverError("[EVENT REQUEST POST ERROR]", error, "Unable to submit the coverage request.");
  }
}
