"use client";

import {
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  CheckCircle2,
  LogOut,
  RefreshCw,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type DashboardData = {
  totalEvents: number;
  avgAttendancePct: number;
  avgRating: number;
};

type Profile = {
  name?: string;
  registrationNumber: string;
  team?: string;
};

type TeamMember = {
  _id: string;
  name: string;
  registrationNumber?: string;
  department?: string;
  role?: string;
  team?: string;
};

export default function TeamLeadDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setError("");
    try {
      const [dashboardResponse, profileResponse, membersResponse] = await Promise.all([
        fetch("/api/team-lead/dashboard"),
        fetch("/api/auth/me"),
        fetch("/api/team-lead/members"),
      ]);
      const dashboard = await dashboardResponse.json();
      const profileResult = await profileResponse.json();
      if (!dashboardResponse.ok) throw new Error(dashboard.error || "Unable to load dashboard.");
      setData(dashboard);
      if (profileResponse.ok) setProfile(profileResult.admin);
      if (membersResponse.ok) {
        const membersResult = await membersResponse.json();
        setMembers(membersResult.members ?? []);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/team-lead/login");
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const firstName = profile?.name?.split(" ")[0] || "Team Lead";
  const attendance = Math.min(Math.max(data?.avgAttendancePct ?? 0, 0), 100);
  const rating = Math.min(Math.max(data?.avgRating ?? 0, 0), 5);

  return (
    <main className="min-h-screen bg-[#08090b] px-4 py-10 text-white sm:px-8 lg:px-12 mt-20">
      <div className="mx-auto max-w-7xl">
        <header className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#10161a] p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:32px_32px]" />
          <div className="relative flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-cyan-300/70">
                <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,.8)]" />
                Team Lead Portal
              </div>
              <h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
                Good to see you, {firstName}.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/50">
                Keep your team moving, review event performance, and stay close to the work that matters.
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-white/55">
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">Assigned team</p>
                <p className="mt-1 font-medium text-white">{profile?.team || "Your team"}</p>
              </div>
              <button type="button" onClick={() => void loadDashboard()} aria-label="Refresh dashboard" className="rounded-xl border border-white/10 p-3 text-white/55 transition hover:border-white/25 hover:text-white">
                <RefreshCw size={17} />
              </button>
              <button type="button" onClick={() => void logout()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-3 text-xs text-white/55 transition hover:border-red-300/30 hover:text-red-100">
                <LogOut size={16} />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          </div>
        </header>

        {error ? (
          <section className="mt-6 rounded-2xl border border-red-300/20 bg-red-300/10 p-5 text-sm text-red-100">
            <p>{error}</p>
            <button type="button" onClick={() => void loadDashboard()} className="mt-3 font-medium underline underline-offset-4">Try again</button>
          </section>
        ) : (
          <>
            <section className="mt-6 grid gap-3 sm:grid-cols-3">
              <MetricCard label="Events on record" value={loading ? "--" : data?.totalEvents ?? 0} detail="Across your assigned team" icon={CalendarDays} accent="text-cyan-300" />
              <MetricCard label="Average attendance" value={loading ? "--" : `${attendance.toFixed(1)}%`} detail="Presence across events" icon={CheckCircle2} accent="text-emerald-300" />
              <MetricCard label="Average rating" value={loading ? "--" : `${rating.toFixed(1)} / 5`} detail="Member performance score" icon={Star} accent="text-amber-300" />
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
              <div className="rounded-2xl border border-white/10 bg-[#0d1114] p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/35">Team pulse</p>
                    <h2 className="mt-2 text-xl font-medium">Performance at a glance</h2>
                  </div>
                  <ChartNoAxesCombined className="text-white/30" size={22} />
                </div>
                <div className="mt-8 space-y-7">
                  <ProgressRow label="Attendance" value={attendance} display={`${attendance.toFixed(1)}%`} color="bg-emerald-300" />
                  <ProgressRow label="Rating quality" value={(rating / 5) * 100} display={`${rating.toFixed(1)} / 5`} color="bg-amber-300" />
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0d1114] p-6 sm:p-7">
                <p className="text-xs uppercase tracking-[0.2em] text-white/35">Workspace</p>
                <h2 className="mt-2 text-xl font-medium">Next move</h2>
                <p className="mt-3 text-sm leading-6 text-white/45">Open your events to assign members, mark attendance, and record ratings.</p>
                <Link href="/team-lead/events" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-cyan-100">
                  Manage events <ArrowUpRight size={16} />
                </Link>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-white/10 bg-[#0d1114] p-6 sm:p-7">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">Your roster</p>
                  <h2 className="mt-2 text-xl font-medium">Members in your scope</h2>
                </div>
                <p className="text-sm text-white/40">{loading ? "Loading..." : `${members.length} member${members.length === 1 ? "" : "s"}`}</p>
              </div>
              {members.length ? (
                <div className="mt-6 grid max-h-80 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
                  {members.map((member) => (
                    <div key={member._id} className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/15 px-4 py-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-300/10 text-sm font-semibold text-cyan-200">{member.name.charAt(0).toUpperCase()}</div>
                      <div className="min-w-0"><p className="truncate text-sm text-white/85">{member.name}</p><p className="truncate text-xs text-white/35">{member.registrationNumber || member.role || "Team member"}</p><p className="truncate text-[10px] uppercase tracking-[0.12em] text-cyan-200/50">{member.team || "Assigned member"}</p></div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-6 rounded-xl border border-dashed border-white/10 p-6 text-sm text-white/40">No members are assigned to this team yet.</p>
              )}
            </section>

            <section className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link href="/team-lead/events" className="group rounded-2xl border border-white/10 bg-[#0d1114] p-5 transition hover:border-cyan-300/30 hover:bg-[#11191d]">
                <CalendarDays size={20} className="text-cyan-300" />
                <p className="mt-5 font-medium">Review events</p>
                <p className="mt-1 text-sm text-white/40">See schedules and assigned members.</p>
                <ArrowUpRight size={16} className="mt-5 text-white/30 transition group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-white" />
              </Link>
              <Link href="/team-lead/events" className="group rounded-2xl border border-white/10 bg-[#0d1114] p-5 transition hover:border-amber-300/30 hover:bg-[#11191d]">
                <Users size={20} className="text-amber-300" />
                <p className="mt-5 font-medium">Support your team</p>
                <p className="mt-1 text-sm text-white/40">Track participation and celebrate progress.</p>
                <ArrowUpRight size={16} className="mt-5 text-white/30 transition group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-white" />
              </Link>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function MetricCard({ label, value, detail, icon: Icon, accent }: { label: string; value: string | number; detail: string; icon: typeof CalendarDays; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1114] p-5">
      <div className="flex items-center justify-between"><p className="text-xs uppercase tracking-[0.16em] text-white/35">{label}</p><Icon size={18} className={accent} /></div>
      <p className="mt-7 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-xs text-white/35">{detail}</p>
    </div>
  );
}

function ProgressRow({ label, value, display, color }: { label: string; value: number; display: string; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm"><span className="text-white/60">{label}</span><span className="font-medium text-white">{display}</span></div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${value}%` }} /></div>
    </div>
  );
}
