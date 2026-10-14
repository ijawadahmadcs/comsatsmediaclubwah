import mongoose from "mongoose";
import { EVENT_DESCRIPTION_MAX_LENGTH, EVENT_TITLE_MAX_LENGTH } from "@/models/Event";

const MAX_MEMBER_IDS = 500;

/**
 * Parses an event date. Requires a full timestamp with a time zone (e.g. from Date#toISOString()),
 * because a bare "2026-10-20T15:00" would be read in the server's time zone (UTC on Vercel).
 */
export function parseEventDate(value: unknown): Date | null {
  if (typeof value !== "string" || value.length > 40 || !/(Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  return year >= 2000 && year <= 2100 ? date : null;
}

/** Validates a list of member ids and removes duplicates. Returns null if invalid. */
export function parseMemberIds(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > MAX_MEMBER_IDS) return null;
  if (value.some((id) => typeof id !== "string" || !mongoose.isValidObjectId(id))) return null;
  return Array.from(new Set(value as string[]));
}

export type EventInput = { title?: string; description?: string; date?: Date; memberIds?: string[] };

/** Validates the Team Lead event form. In "create" mode title and date are required. */
export function parseEventInput(body: Record<string, unknown>, mode: "create" | "update"): EventInput | { error: string } {
  const input: EventInput = {};
  if (body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) return { error: "Title is required." };
    if (body.title.trim().length > EVENT_TITLE_MAX_LENGTH) return { error: `Title must be ${EVENT_TITLE_MAX_LENGTH} characters or fewer.` };
    input.title = body.title.trim();
  }
  if (body.description !== undefined) {
    if (typeof body.description !== "string") return { error: "Invalid description." };
    if (body.description.trim().length > EVENT_DESCRIPTION_MAX_LENGTH) {
      return { error: `Description must be ${EVENT_DESCRIPTION_MAX_LENGTH} characters or fewer.` };
    }
    input.description = body.description.trim();
  }
  if (body.date !== undefined) {
    const date = parseEventDate(body.date);
    if (!date) return { error: "Please choose a valid date and time." };
    input.date = date;
  }
  if (body.assignedMemberIds !== undefined) {
    const memberIds = parseMemberIds(body.assignedMemberIds);
    if (!memberIds) return { error: "assignedMemberIds must contain valid member IDs." };
    input.memberIds = memberIds;
  }
  if (mode === "create" && (!input.title || !input.date)) return { error: "Title and date are required." };
  return input;
}
