import Admin, { type IAdmin } from "@/models/Admin";
import { normalizeRegistrationNumber } from "@/lib/auth";
import { normalizeTeamLeadTeam } from "@/lib/teamScope";

export class InvalidTeamError extends Error {
  constructor() {
    super("Invalid Team Lead team.");
    this.name = "InvalidTeamError";
  }
}

type TeamLeadRecord = Pick<IAdmin, "registrationNumber" | "name" | "team" | "isActive" | "createdAt" | "updatedAt"> & {
  _id: { toString(): string };
};

/** The fields of a Team Lead account that are safe to send to the admin UI. */
export function publicTeamLead(admin: TeamLeadRecord) {
  return {
    _id: admin._id.toString(),
    name: admin.name,
    registrationNumber: admin.registrationNumber,
    team: admin.team,
    isActive: admin.isActive,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };
}

export async function createTeamLead(data: {
  name: string;
  registrationNumber: string;
  password: string;
  team: string;
  isActive?: boolean;
}) {
  const { name, registrationNumber, password, team, isActive = true } = data;
  const normalizedTeam = normalizeTeamLeadTeam(team);
  if (!normalizedTeam) throw new InvalidTeamError();
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(password, 12);
  return Admin.create({
    name: name.trim(),
    registrationNumber: normalizeRegistrationNumber(registrationNumber),
    passwordHash,
    role: "teamlead",
    team: normalizedTeam,
    isActive,
  });
}

export async function updateTeamLead(id: string, updates: Partial<{
  name: string;
  registrationNumber: string;
  password: string;
  team: string;
  isActive: boolean;
}>) {
  const set: Partial<Pick<IAdmin, "name" | "registrationNumber" | "team" | "isActive" | "passwordHash">> = {};
  if (updates.name !== undefined) set.name = updates.name.trim();
  if (updates.team !== undefined) {
    const normalizedTeam = normalizeTeamLeadTeam(updates.team);
    if (!normalizedTeam) throw new InvalidTeamError();
    set.team = normalizedTeam;
  }
  if (updates.isActive !== undefined) set.isActive = updates.isActive;
  if (updates.password) {
    const bcrypt = await import("bcryptjs");
    set.passwordHash = await bcrypt.hash(updates.password, 12);
  }
  if (updates.registrationNumber) set.registrationNumber = normalizeRegistrationNumber(updates.registrationNumber);
  // A new password or a deactivation signs the Team Lead out everywhere.
  const revokeSessions = Boolean(updates.password) || updates.isActive === false;
  return Admin.findOneAndUpdate(
    { _id: id, role: "teamlead" },
    { $set: set, ...(revokeSessions ? { $inc: { sessionVersion: 1 } } : {}) },
    { returnDocument: "after", runValidators: true },
  ).lean();
}
