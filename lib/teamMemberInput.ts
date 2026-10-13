import type { ITeamMember } from "@/models/TeamMember";

const STRING_FIELDS = {
  name: 100,
  role: 100,
  department: 100,
  registrationNumber: 40,
  contactNumber: 20,
  areaOfInterest: 50,
  bio: 1000,
  image: 500,
  instagram: 300,
  facebook: 300,
  linkedin: 300,
} as const;

const NUMBER_FIELDS = ["semester", "order"] as const;
const LINK_FIELDS = new Set(["instagram", "facebook", "linkedin"]);

type MemberField = keyof typeof STRING_FIELDS | (typeof NUMBER_FIELDS)[number];
export type MemberChanges = {
  set: Partial<Pick<ITeamMember, MemberField>>;
  // Fields the admin cleared. Sent as $unset, because Mongoose drops `undefined` values from updates.
  unset: Partial<Record<MemberField, "">>;
};

/**
 * Validates team member fields from the admin form. In "create" mode name and role are required;
 * in "update" mode only the fields present are changed, and empty optional fields are cleared.
 */
export function parseMemberInput(body: Record<string, unknown>, mode: "create" | "update"): MemberChanges | { error: string } {
  const set: Record<string, unknown> = {};
  const unset: Record<string, ""> = {};

  for (const [field, limit] of Object.entries(STRING_FIELDS)) {
    const value = body[field];
    if (value === undefined) continue;
    if (typeof value !== "string") return { error: "Invalid team member data." };
    const trimmed = value.trim();
    if (trimmed.length > limit) return { error: `The ${field} field must be ${limit} characters or fewer.` };
    if (LINK_FIELDS.has(field) && trimmed && !/^https?:\/\/\S+$/i.test(trimmed)) {
      return { error: "Social links must be full web addresses starting with https://." };
    }
    if (trimmed) set[field] = trimmed;
    else if (field === "name" || field === "role") return { error: "Name and role are required." };
    else if (mode === "update") unset[field] = "";
  }

  for (const field of NUMBER_FIELDS) {
    const value = body[field];
    if (value === undefined) continue;
    if (value === "" || value === null) {
      // A cleared display order goes back to the default (0) so sorting keeps working.
      if (mode === "update") {
        if (field === "order") set.order = 0;
        else unset[field] = "";
      }
      continue;
    }
    const number = Number(value);
    if (!Number.isInteger(number) || (field === "semester" && (number < 1 || number > 12))) {
      return { error: field === "semester" ? "Semester must be a whole number from 1 to 12." : "Display order must be a whole number." };
    }
    set[field] = number;
  }

  if (mode === "create" && (!set.name || !set.role)) return { error: "Name and role are required." };
  return { set, unset } as MemberChanges;
}
