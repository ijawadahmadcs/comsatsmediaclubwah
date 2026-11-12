import { EVENT_REQUESTED_TEAMS } from "@/models/Event";
import { parseEventDate } from "@/lib/eventInput";

const LIMITS = {
  eventName: 150,
  location: 150,
  society: 150,
  leadName: 100,
  contact: 30,
  facultyLeadName: 100,
} as const;

export type EventRequestInput = {
  eventName: string;
  location: string;
  startsAt: Date;
  endsAt: Date;
  society: string;
  studentLeadName: string;
  studentLeadContact: string;
  facultyLeadName?: string;
  requestedTeam: (typeof EVENT_REQUESTED_TEAMS)[number];
  requestedPersons: number;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function requiredText(value: unknown, label: string, limit: number): { value: string } | { error: string } {
  const result = text(value);
  if (!result) return { error: `${label} is required.` };
  if (result.length > limit) return { error: `${label} must be ${limit} characters or fewer.` };
  return { value: result };
}

export function parseEventRequestInput(body: Record<string, unknown>): EventRequestInput | { error: string } {
  const fields = [
    ["eventName", "Event name", LIMITS.eventName],
    ["location", "Location / room number", LIMITS.location],
    ["society", "Society", LIMITS.society],
    ["studentLeadName", "Student lead name", LIMITS.leadName],
    ["studentLeadContact", "Student lead contact", LIMITS.contact],
  ] as const;
  const values: Record<string, string> = {};
  for (const [key, label, limit] of fields) {
    const result = requiredText(body[key], label, limit);
    if ("error" in result) return result;
    values[key] = result.value;
  }
  if (!/^\+?[\d\s()-]{10,30}$/.test(values.studentLeadContact)) {
    return { error: "Please provide a valid student lead contact number." };
  }

  const facultyLeadName = text(body.facultyLeadName);
  if (facultyLeadName.length > LIMITS.facultyLeadName) {
    return { error: `Faculty lead name must be ${LIMITS.facultyLeadName} characters or fewer.` };
  }
  const startsAt = parseEventDate(body.startsAt);
  const endsAt = parseEventDate(body.endsAt);
  if (!startsAt || !endsAt) return { error: "Please choose valid start and end date and times." };
  if (endsAt <= startsAt) return { error: "The ending time must be after the starting time." };

  if (!(EVENT_REQUESTED_TEAMS as readonly string[]).includes(body.requestedTeam as string)) {
    return { error: "Please choose photography, videography, or both." };
  }
  const requestedPersons = typeof body.requestedPersons === "number"
    ? body.requestedPersons
    : Number(body.requestedPersons);
  if (!Number.isInteger(requestedPersons) || requestedPersons < 1 || requestedPersons > 100) {
    return { error: "The number of persons must be between 1 and 100." };
  }

  return {
    eventName: values.eventName,
    location: values.location,
    startsAt,
    endsAt,
    society: values.society,
    studentLeadName: values.studentLeadName,
    studentLeadContact: values.studentLeadContact,
    facultyLeadName: facultyLeadName || undefined,
    requestedTeam: body.requestedTeam as (typeof EVENT_REQUESTED_TEAMS)[number],
    requestedPersons,
  };
}
