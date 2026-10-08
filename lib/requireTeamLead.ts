import { requireApiAdmin, type AuthAdmin } from "@/lib/auth";

export type AuthTeamLead = AuthAdmin & { role: "teamlead"; team: string };

export async function requireTeamLead(): Promise<AuthTeamLead | null> {
  const admin = await requireApiAdmin();
  if (admin?.role !== "teamlead" || !admin.team?.trim()) return null;
  return { ...admin, role: "teamlead", team: admin.team.trim() };
}