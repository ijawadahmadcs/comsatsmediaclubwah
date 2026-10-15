"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Stats = {
  totalTeamMembers: number;
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
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
  useEffect(() => {
    fetch("/api/admin/stats")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        setStats(result);
      })
      .catch((loadError) =>
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load dashboard.",
        ),
      );
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
      <main className="min-h-screen bg-[#08090b] p-8 text-red-200">
        {error}
      </main>
    );
  const cards = stats
    ? [
        ["Total Team Members", stats.totalTeamMembers],
        ["Total Applications", stats.totalApplications],
        ["Pending Applications", stats.pendingApplications],
        ["Accepted Applications", stats.acceptedApplications],
      ]
    : [];
  return (
    <main className="min-h-screen bg-[#08090b] px-4 py-16 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-300/60">
          Overview
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="mt-3 text-sm text-white/40">
          A quiet view of the club behind the scenes.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.length ? (
            cards.map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-[#0b0d10] p-5"
              >
                <p className="text-xs uppercase tracking-[0.15em] text-white/35">
                  {label}
                </p>
                <p className="mt-4 text-3xl font-semibold">{value}</p>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-sm text-white/40">
              Loading dashboard...
            </div>
          )}
        </div>
        <section className="mt-7 rounded-2xl border border-amber-200/15 bg-amber-200/[0.04] p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-xs uppercase tracking-[0.2em] text-amber-200/60">Recognition</p><h2 className="mt-2 text-xl font-medium">Current member highlights</h2></div><p className="text-xs text-white/35">Calculated from the latest 7 and 30 days</p></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2"><AdminRecognitionCard label="Member of the week" winner={recognition?.week} revealed={recognition?.revealWeek ?? false} onToggle={() => void setRecognitionVisibility("week")} /><AdminRecognitionCard label="Member of the month" winner={recognition?.month} revealed={recognition?.revealMonth ?? false} onToggle={() => void setRecognitionVisibility("month")} /></div>
        </section>
        <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_0.7fr]">
          <section className="rounded-2xl border border-white/10 bg-[#0b0d10] p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Recent Applications</h2>
              <Link
                href="/admin/applications"
                className="text-sm text-blue-200"
              >
                View all
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
                    <span className="text-xs text-white/45">
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
          <section className="rounded-2xl border border-white/10 bg-[#0b0d10] p-5">
            <h2 className="text-lg font-medium">Quick Actions</h2>
            <div className="mt-6 grid gap-3">
              <Link
                href="/admin/team"
                className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/70 transition hover:bg-white/10"
              >
                Add Team Member
              </Link>
              <Link
                href="/admin/applications"
                className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/70 transition hover:bg-white/10"
              >
                View Applications
              </Link>
              <Link
                href="/admin/team"
                className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/70 transition hover:bg-white/10"
              >
                Manage Team
              </Link>
              <Link
                href="/admin/applications"
                className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/70 transition hover:bg-white/10"
              >
                Export Applications
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function AdminRecognitionCard({ label, winner, revealed, onToggle }: { label: string; winner: RecognitionWinner | null | undefined; revealed: boolean; onToggle: () => void }) {
  return <div className="rounded-xl border border-white/10 bg-[#0b0d10] p-4"><div className="flex items-start justify-between gap-3"><p className="text-xs uppercase tracking-[0.16em] text-white/35">{label}</p><button type="button" onClick={onToggle} className={`rounded-full border px-3 py-1 text-[11px] transition ${revealed ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200" : "border-white/15 text-white/45 hover:bg-white/10"}`}>{revealed ? "Visible on home" : "Hidden from home"}</button></div>{winner ? <><p className="mt-4 text-lg font-medium text-white/85">{winner.name}</p><p className="mt-1 text-xs text-white/40">{winner.role}</p><p className="mt-4 text-sm text-white/60">{winner.attendedEvents} events attended · {winner.averageRating.toFixed(1)} / 5</p></> : <p className="mt-4 text-sm text-white/40">No qualifying member yet.</p>}</div>;
}
