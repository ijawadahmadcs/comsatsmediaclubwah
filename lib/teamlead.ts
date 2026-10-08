// lib/teamlead.ts
import Admin from "@/models/Admin";
import { normalizeTeamLeadTeam } from "@/lib/teamScope";

export async function createTeamLead(data: {
  name: string;
  registrationNumber: string;
  password: string;
  team: string;
  isActive?: boolean;
}) {
  const { name, registrationNumber, password, team, isActive = true } = data;
  const normalizedTeam = normalizeTeamLeadTeam(team);
  if (!normalizedTeam) throw new Error("Invalid Team Lead team.");
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await Admin.create({
    name,
    registrationNumber: registrationNumber.trim().toUpperCase(),
    passwordHash,
    role: "teamlead",
    team: normalizedTeam,
    isActive,
  });
  return admin;
}

export async function updateTeamLead(id: string, updates: Partial<{
  name: string;
  registrationNumber: string;
  password: string;
  team: string;
  isActive: boolean;
}>) {
  const updateData: Partial<typeof updates> & { passwordHash?: string } = {};
  if (updates.name !== undefined) updateData.name = updates.name.trim();
  if (updates.team !== undefined) {
    const normalizedTeam = normalizeTeamLeadTeam(updates.team);
    if (!normalizedTeam) throw new Error("Invalid Team Lead team.");
    updateData.team = normalizedTeam;
  }
  if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
  if (updates.password) {
    const bcrypt = await import("bcryptjs");
    updateData.passwordHash = await bcrypt.hash(updates.password, 12);
    delete updateData.password;
  }
  if (updates.registrationNumber) {
    updateData.registrationNumber = updates.registrationNumber.trim().toUpperCase();
  }
  const admin = await Admin.findOneAndUpdate(
    { _id: id, role: "teamlead" },
    updateData,
    { new: true, runValidators: true },
  ).lean();
  return admin;
}
