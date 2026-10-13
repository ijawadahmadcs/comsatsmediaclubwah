import { jsonError } from "@/lib/api";
import { requireApiSession, type AuthAdmin, type AuthResult } from "@/lib/auth";

export type AuthTeamLead = AuthAdmin & { role: "teamlead"; team: string };

export async function requireTeamLead(): Promise<AuthResult<AuthTeamLead>> {
  const auth = await requireApiSession();
  if (!auth.ok) return auth;
  const { account } = auth;
  if (account.role !== "teamlead" || !account.team?.trim()) {
    return { ok: false, response: jsonError("Team Lead access is required.", 403) };
  }
  return { ok: true, account: { ...account, role: "teamlead", team: account.team.trim() } };
}
