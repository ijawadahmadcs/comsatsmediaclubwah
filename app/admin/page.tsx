"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  ClipboardCheck,
  Download,
  RefreshCw,
  Star,
  UserPlus,
  Users,
} from "lucide-react";

type Stats = {
  totalTeamMembers: number;
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  totalEvents: number;
  crossTeamAssignments: number;
  teamCounts: { team: string; count: number }[];
  recentApplications: {
    _id: string;
    fullName: string;
    registrationNumber: string;
    areaOfInterest: string;
    status?: string;
    createdAt: string;
  }[];
};

type RecognitionWinner = {
  name: string;
  role: string;
  attendedEvents: number;
  averageRating: number;
};

type RecognitionState = {
  week: RecognitionWinner | null;
  month: RecognitionWinner | null;
  revealWeek: boolean;
  revealMonth: boolean;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recognition, setRecognition] = useState<RecognitionState | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadStats() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/stats");
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setStats(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const timer = window.setTimeout(() => void loadStats(), 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetch("/api/admin/recognition")
        .then((response) => response.json())
        .then((result) => setRecognition(result.success ? result : { week: null, month: null }))
        .catch(() => setRecognition({ week: null, month: null, revealWeek: false, revealMonth: false }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function setRecognitionVisibility(period: "week" | "month") {
    if (!recognition) return;
    const field = period === "week" ? "revealWeek" : "revealMonth";
    const response = await fetch("/api/admin/recognition", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !recognition[field] }),
    });
    const result = await response.json();
    if (response.ok) setRecognition({ ...recognition, revealWeek: result.revealWeek, revealMonth: result.revealMonth });
  }
  if (error)
    return (
      <main className="min-h-screen bg-[#08090b] px-5 py-16 text-white">
        <div className="mx-auto max-w-lg rounded-2xl border border-red-300/20 bg-red-300/[0.06] p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-red-200/60">Dashboard unavailable</p>
          <p className="mt-3 text-sm leading-6 text-red-100">{error}</p>
          <button type="button" onClick={() => void loadStats()} className="mt-5 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black">
            Try again
          </button>
        </div>
      </main>
    );
  const cards = stats
    ? [
        { label: "Team members", value: stats.totalTeamMembers, detail: "Active club roster", icon: Users, tone: "text-cyan-200", glow: "bg-cyan-300/10", href: "/admin/team" },
        { label: "Applications", value: stats.totalApplications, detail: `${stats.pendingApplications} pending review`, icon: ClipboardCheck, tone: "text-blue-200", glow: "bg-blue-300/10", href: "/admin/applications" },
        { label: "Accepted", value: stats.acceptedApplications, detail: "Approved members", icon: UserPlus, tone: "text-emerald-200", glow: "bg-emerald-300/10", href: "/admin/team" },
        { label: "Club events", value: stats.totalEvents, detail: "Across every team", icon: CalendarDays, tone: "text-amber-200", glow: "bg-amber-300/10", href: "/admin/team" },
        { label: "Cross-team work", value: stats.crossTeamAssignments, detail: "Temporary assignments", icon: ArrowUpRight, tone: "text-violet-200", glow: "bg-violet-300/10", href: "/admin/team" },
        { label: "Pending review", value: stats.pendingApplications, detail: "Needs admin action", icon: Star, tone: "text-orange-200", glow: "bg-orange-300/10", href: "/admin/applications" },
      ]
    : [];
  return (
    <main className="min-h-screen bg-[#08090b] px-4 py-16 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#10161a] p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:32px_32px]" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-blue-300/60">Club overview</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Admin Dashboard</h1>
            <p className="mt-3 text-sm text-white/40">People, applications, events and cross-team activity.</p>
          </div>
          <button type="button" onClick={() => void loadStats()} disabled={loading} className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/60 transition hover:border-white/25 hover:text-white disabled:opacity-50">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          </div>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.length ? (
            cards.map((card) => {
              const Icon = card.icon;
              return (
              <Link
                key={card.label}
                href={card.href}
                className="group rounded-2xl border border-white/[0.08] bg-[#0b0d10] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-blue-300/25 hover:bg-[#10161a]"
              >
                <div className="flex items-start justify-between">
                  <p className="text-xs uppercase tracking-[0.15em] text-white/35">{card.label}</p>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.glow}`}>
                    <Icon size={18} className={card.tone} />
                  </div>
                </div>
                <p className="mt-6 text-3xl font-semibold tracking-tight">{card.value}</p>
                <p className="mt-2 flex items-center justify-between text-xs text-white/35">
                  {card.detail}
                  <ArrowUpRight size={14} className="text-white/20 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                </p>
              </Link>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center text-sm text-white/40">
              Loading dashboard...
            </div>
          )}
        </div>
        {stats?.teamCounts.length ? (
          <section className="mt-7 rounded-2xl border border-white/[0.08] bg-[#0b0d10] p-5 sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-blue-300/60">Team distribution</p>
                <h2 className="mt-2 text-lg font-medium">Members by team</h2>
              </div>
              <Users size={20} className="text-white/25" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {stats.teamCounts.map((team) => {
                const largest = Math.max(...stats.teamCounts.map((item) => item.count), 1);
                const width = `${Math.max((team.count / largest) * 100, 8)}%`;
                return (
                <div key={team.team} className="rounded-xl border border-white/[0.08] bg-black/15 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm text-white/65">{team.team}</p>
                    <p className="text-lg font-semibold text-white">{team.count}</p>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-400/80 to-cyan-300/80" style={{ width }} />
                  </div>
                </div>
                );
              })}
            </div>
          </section>
        ) : null}
        <section className="mt-7 rounded-2xl border border-amber-200/15 bg-amber-200/[0.04] p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-xs uppercase tracking-[0.2em] text-amber-200/60">Recognition</p><h2 className="mt-2 text-xl font-medium">Current member highlights</h2></div><p className="text-xs text-white/35">Calculated from the latest 7 and 30 days</p></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2"><AdminRecognitionCard label="Member of the week" winner={recognition?.week} revealed={recognition?.revealWeek ?? false} onToggle={() => void setRecognitionVisibility("week")} /><AdminRecognitionCard label="Member of the month" winner={recognition?.month} revealed={recognition?.revealMonth ?? false} onToggle={() => void setRecognitionVisibility("month")} /></div>
        </section>
        <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_0.7fr]">
          <section className="rounded-2xl border border-white/[0.08] bg-[#0b0d10] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">Latest activity</p>
                <h2 className="mt-2 text-lg font-medium">Recent Applications</h2>
              </div>
              <Link href="/admin/applications" className="inline-flex items-center gap-1 text-sm text-blue-200 transition hover:text-blue-100">
                View all <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="mt-6 divide-y divide-white/[0.07]">
              {stats?.recentApplications.length ? (
                stats.recentApplications.map((application) => (
                  <div
                    key={application._id}
                    className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm text-white/80">
                        {application.fullName}
                      </p>
                      <p className="mt-1 text-xs text-white/35">
                        {application.registrationNumber} ·{" "}
                        {application.areaOfInterest}
                      </p>
                    </div>
                    <span className={`w-fit rounded-full border px-3 py-1 text-[11px] ${application.status === "Accepted" ? "border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-200" : application.status === "Rejected" ? "border-red-300/20 bg-red-300/[0.07] text-red-200" : "border-amber-300/20 bg-amber-300/[0.07] text-amber-200"}`}>
                      {application.status || "Pending"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="py-8 text-sm text-white/40">
                  No applications yet.
                </p>
              )}
            </div>
          </section>
          <section className="rounded-2xl border border-white/[0.08] bg-[#0b0d10] p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-white/35">Shortcuts</p>
            <h2 className="mt-2 text-lg font-medium">Quick Actions</h2>
            <div className="mt-5 grid gap-2">
              {[
                { label: "Add team member", href: "/admin/team", icon: UserPlus },
                { label: "View applications", href: "/admin/applications", icon: ClipboardCheck },
                { label: "Manage team", href: "/admin/team", icon: Users },
                { label: "Export applications", href: "/admin/applications", icon: Download },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} href={action.href} className="group flex items-center justify-between rounded-xl border border-white/[0.08] px-4 py-3 text-sm text-white/65 transition hover:border-blue-300/25 hover:bg-blue-300/[0.05] hover:text-white">
                    <span className="flex items-center gap-3"><Icon size={16} className="text-white/35" />{action.label}</span>
                    <ArrowUpRight size={15} className="text-white/20 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function AdminRecognitionCard({ label, winner, revealed, onToggle }: { label: string; winner: RecognitionWinner | null | undefined; revealed: boolean; onToggle: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b0d10] p-5">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-amber-300/[0.04] blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.16em] text-amber-100/55">{label}</p>
        <button type="button" onClick={onToggle} className={`rounded-full border px-3 py-1 text-[11px] transition ${revealed ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200" : "border-white/15 text-white/45 hover:bg-white/10"}`}>
          {revealed ? "Visible on home" : "Hidden from home"}
        </button>
      </div>
      {winner ? (
        <div className="relative mt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-200/20 bg-amber-200/[0.08] text-lg font-semibold text-amber-100">
              {winner.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-medium text-white/90">{winner.name}</p>
              <p className="mt-1 truncate text-xs text-white/40">{winner.role}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-white/[0.07] bg-black/15 px-3 py-2.5"><p className="text-[10px] uppercase tracking-wider text-white/30">Attendance</p><p className="mt-1 text-sm font-medium">{winner.attendedEvents} events</p></div>
            <div className="rounded-lg border border-white/[0.07] bg-black/15 px-3 py-2.5"><p className="text-[10px] uppercase tracking-wider text-white/30">Rating</p><p className="mt-1 text-sm font-medium">{winner.averageRating.toFixed(1)} / 5</p></div>
          </div>
        </div>
      ) : (
        <p className="relative mt-5 text-sm text-white/40">No qualifying member yet.</p>
      )}
    </div>
  );
}
