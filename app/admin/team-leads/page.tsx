"use client";

import { FormEvent, useEffect, useState } from "react";
import { TEAM_LEAD_TEAMS } from "@/lib/teamScope";

type TeamLead = {
  _id: string;
  name?: string;
  registrationNumber: string;
  team?: string;
  isActive: boolean;
};

type TeamLeadForm = { name: string; registrationNumber: string; password: string; team: string };
type ApiResult = { error?: string; teamLeads?: TeamLead[] };

const emptyForm: TeamLeadForm = { name: "", registrationNumber: "", password: "", team: TEAM_LEAD_TEAMS[0] };

async function readApiResponse(response: Response): Promise<ApiResult> {
  const text = await response.text();
  try {
    const result: unknown = JSON.parse(text);
    if (!result || typeof result !== "object" || Array.isArray(result)) throw new Error();
    return result as ApiResult;
  } catch {
    throw new Error(response.status === 401 || response.status === 403
      ? "Superadmin access is required. Please sign in again."
      : "The server returned an invalid response. Please refresh and try again.");
  }
}

export default function TeamLeadsPage() {
  const [teamLeads, setTeamLeads] = useState<TeamLead[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadTeamLeads() {
    try {
      const response = await fetch("/api/admin/team-leads");
      const result = await readApiResponse(response);
      if (!response.ok) throw new Error(result.error || "Unable to load Team Leads.");
      setTeamLeads(result.teamLeads || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load Team Leads.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTeamLeads();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function createTeamLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/team-leads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await readApiResponse(response);
      if (!response.ok) throw new Error(result.error || "Unable to create Team Lead.");
      setForm(emptyForm);
      setMessage("Team Lead created. They can now sign in at /team-lead/login.");
      await loadTeamLeads();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create Team Lead.");
    } finally {
      setSaving(false);
    }
  }

  async function updateTeamLead(id: string, updates: Record<string, unknown>, successMessage: string) {
    const response = await fetch(`/api/admin/team-leads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const result = await readApiResponse(response);
    setMessage(response.ok ? successMessage : result.error || "Unable to update Team Lead.");
    if (response.ok) void loadTeamLeads();
  }

  async function deleteTeamLead(lead: TeamLead) {
    if (!window.confirm(`Delete credentials for ${lead.registrationNumber}?`)) return;
    const response = await fetch(`/api/admin/team-leads/${lead._id}`, { method: "DELETE" });
    const result = await readApiResponse(response);
    setMessage(response.ok ? "Team Lead credentials deleted." : result.error || "Unable to delete Team Lead.");
    if (response.ok) void loadTeamLeads();
  }

  function resetPassword(lead: TeamLead) {
    const password = window.prompt("New password (8+ characters):");
    if (password) void updateTeamLead(lead._id, { password }, "Password reset.");
  }

  return (
    <main className="min-h-screen bg-[#08090b] px-5 py-16 text-white sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-300/60">Superadmin · Access</p>
        <h1 className="mt-4 text-4xl font-semibold">Team Lead Management</h1>
        <p className="mt-3 text-sm text-white/40">Create credentials and assign each Team Lead to one team.</p>
        {message && <p className="mt-5 text-sm text-blue-200">{message}</p>}

        <form onSubmit={createTeamLead} className="mt-8 grid gap-4 rounded-2xl border border-white/10 bg-[#0b0d10] p-6 sm:grid-cols-2 lg:grid-cols-4">
          <input required placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none" />
          <input required placeholder="Registration Number" value={form.registrationNumber} onChange={(event) => setForm({ ...form, registrationNumber: event.target.value })} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none" />
          <input required minLength={8} type="password" placeholder="Password (8+ characters)" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none" />
          <select required value={form.team} onChange={(event) => setForm({ ...form, team: event.target.value })} className="rounded-xl border border-white/10 bg-[#15191d] px-4 py-3 text-sm outline-none">
            {TEAM_LEAD_TEAMS.map((team) => <option key={team} value={team}>{team}</option>)}
          </select>
          <button disabled={saving} className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-black disabled:opacity-50 sm:col-span-2 lg:col-span-4">{saving ? "Creating..." : "Create Team Lead"}</button>
        </form>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10 bg-[#0b0d10]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-[0.15em] text-white/30">
              <tr><th className="p-4">Name</th><th className="p-4">Registration</th><th className="p-4">Team</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="p-12 text-center text-white/40">Loading Team Leads...</td></tr> : teamLeads.map((lead) => (
                <tr key={lead._id} className="border-b border-white/[0.06]"><td className="p-4">{lead.name || "-"}</td><td className="p-4 text-white/60">{lead.registrationNumber}</td><td className="p-4 text-white/60">{lead.team || "-"}</td><td className="p-4 text-white/60">{lead.isActive ? "Active" : "Inactive"}</td><td className="p-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void updateTeamLead(lead._id, { isActive: !lead.isActive }, lead.isActive ? "Team Lead deactivated." : "Team Lead activated.")} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70">{lead.isActive ? "Deactivate" : "Activate"}</button><button type="button" onClick={() => resetPassword(lead)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70">Reset password</button><button type="button" onClick={() => void deleteTeamLead(lead)} className="rounded-lg border border-red-400/20 px-3 py-2 text-xs text-red-200">Delete</button></div></td></tr>
              ))}
              {!loading && teamLeads.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-white/40">No Team Leads created yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
