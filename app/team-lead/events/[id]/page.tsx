"use client";

import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Save,
  Star,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Member {
  _id: string;
  name: string;
  registrationNumber?: string;
}

interface EventRecord {
  _id: string;
  title: string;
  description?: string;
  date: string;
  assignedMembers: Member[];
  attendance?: string[];
  ratings?: Record<string, number>;
  remarks?: Record<string, string>;
}

export default function EventDetail() {
  const { id } = useParams() as { id: string };
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attendanceSet, setAttendanceSet] = useState<Set<string>>(new Set());
  const [ratingData, setRatingData] = useState<{ memberId: string; rating: number; remark?: string } | null>(null);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [savingRating, setSavingRating] = useState(false);

  async function loadEvent() {
    setError("");
    try {
      const response = await fetch(`/api/team-lead/events/${id}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load event.");
      setEvent(result.event);
      setAttendanceSet(new Set(result.event?.attendance ?? []));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load event.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadEvent(), 0);
    return () => window.clearTimeout(timer);
    // loadEvent is intentionally recreated with the page state it updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function toggleAttendance(memberId: string) {
    setAttendanceSet((current) => {
      const next = new Set(current);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  }

  async function submitAttendance() {
    setSavingAttendance(true);
    setError("");
    try {
      const response = await fetch(`/api/team-lead/events/${id}?action=attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds: Array.from(attendanceSet) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save attendance.");
      setEvent((current) => current ? { ...current, attendance: result.attendance } : current);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save attendance.");
    } finally {
      setSavingAttendance(false);
    }
  }

  async function submitRating() {
    if (!ratingData) return;
    setSavingRating(true);
    setError("");
    try {
      const response = await fetch(`/api/team-lead/events/${id}?action=rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ratingData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save rating.");
      await loadEvent();
      setRatingData(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save rating.");
    } finally {
      setSavingRating(false);
    }
  }

  if (loading) return <main className="mt-20 min-h-screen bg-[#08090b] px-4 py-12 text-white sm:px-8"><div className="mx-auto max-w-5xl animate-pulse"><div className="h-5 w-32 rounded bg-white/10" /><div className="mt-8 h-12 w-2/3 rounded bg-white/10" /><div className="mt-4 h-5 w-1/2 rounded bg-white/10" /><div className="mt-10 h-72 rounded-2xl bg-white/[0.05]" /></div></main>;

  if (error && !event) return <main className="mt-20 min-h-screen bg-[#08090b] px-4 py-12 text-white sm:px-8"><div className="mx-auto max-w-5xl rounded-2xl border border-red-300/20 bg-red-300/10 p-6 text-red-100"><p>{error}</p><button type="button" onClick={() => void loadEvent()} className="mt-4 underline underline-offset-4">Try again</button></div></main>;
  if (!event) return null;

  const attendanceCount = attendanceSet.size;
  const totalMembers = event.assignedMembers.length;
  const attendancePercent = totalMembers ? Math.round((attendanceCount / totalMembers) * 100) : 0;

  return (
    <main className="mt-20 min-h-screen bg-[#08090b] px-4 py-10 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <Link href="/team-lead/events" className="inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white"><ArrowLeft size={16} /> Back to events</Link>

        <header className="relative mt-6 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#10161a] p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:32px_32px]" />
          <div className="relative">
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-cyan-300/70"><span className="h-2 w-2 rounded-full bg-cyan-300" />Event workspace</p>
            <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div><h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">{event.title}</h1>{event.description && <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">{event.description}</p>}</div>
              <div className="flex flex-wrap gap-3 text-xs text-white/55"><span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2"><CalendarDays size={14} />{new Date(event.date).toLocaleDateString()}</span><span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2"><Clock3 size={14} />{new Date(event.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div>
            </div>
          </div>
        </header>

        {error && <div className="mt-5 rounded-xl border border-red-300/20 bg-red-300/10 px-4 py-3 text-sm text-red-100">{error}</div>}

        <section className="mt-6 grid gap-3 sm:grid-cols-3"><SummaryCard icon={Users} label="Assigned members" value={totalMembers} accent="text-cyan-300" /><SummaryCard icon={CheckCircle2} label="Present" value={`${attendanceCount} / ${totalMembers}`} accent="text-emerald-300" /><SummaryCard icon={CalendarDays} label="Attendance" value={`${attendancePercent}%`} accent="text-amber-300" /></section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-[#0d1114] p-5 sm:p-7">
          <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-white/35">Live checklist</p><h2 className="mt-2 text-xl font-medium">Member attendance and ratings</h2></div><button type="button" onClick={() => void submitAttendance()} disabled={savingAttendance} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black disabled:opacity-50"><Save size={16} />{savingAttendance ? "Saving..." : "Save attendance"}</button></div>
          {event.assignedMembers.length ? <div className="mt-5 divide-y divide-white/[0.07]">{event.assignedMembers.map((member) => { const present = attendanceSet.has(member._id); const rating = event.ratings?.[member._id]; return <div key={member._id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-300/10 font-semibold text-cyan-200">{member.name.charAt(0).toUpperCase()}</div><div><p className="text-sm text-white/85">{member.name}</p><p className="mt-1 text-xs text-white/35">{member.registrationNumber || "Team member"}</p></div></div><div className="flex items-center gap-3"><button type="button" onClick={() => toggleAttendance(member._id)} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${present ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200" : "border-white/10 text-white/50 hover:bg-white/10"}`}><span className={`flex h-4 w-4 items-center justify-center rounded border ${present ? "border-emerald-300 bg-emerald-300 text-black" : "border-white/25"}`}>{present && <Check size={11} />}</span>{present ? "Present" : "Not marked"}</button><button type="button" onClick={() => setRatingData({ memberId: member._id, rating: rating || 1, remark: event.remarks?.[member._id] || "" })} className="inline-flex items-center gap-2 rounded-xl border border-amber-300/20 px-3 py-2 text-xs text-amber-200/80 transition hover:bg-amber-300/10"><Star size={14} />{rating ? `${rating}/5` : "Rate"}</button></div></div>; })}</div> : <p className="py-10 text-center text-sm text-white/40">No members are assigned to this event.</p>}
        </section>
      </div>

      {ratingData && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#11161a] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-amber-300/70">Performance note</p><h2 className="mt-2 text-xl font-semibold">Rate member</h2></div><button type="button" onClick={() => setRatingData(null)} aria-label="Close rating dialog" className="rounded-lg p-2 text-white/45 hover:bg-white/10 hover:text-white"><X size={18} /></button></div><div className="mt-6"><label className="text-sm text-white/65">Rating</label><div className="mt-3 flex gap-2">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => setRatingData({ ...ratingData, rating: value })} aria-label={`Rate ${value} out of 5`} className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${ratingData.rating >= value ? "border-amber-300/40 bg-amber-300/15 text-amber-200" : "border-white/10 text-white/30 hover:bg-white/10"}`}><Star size={17} fill={ratingData.rating >= value ? "currentColor" : "none"} /></button>)}</div></div><label className="mt-6 block text-sm text-white/65">Remarks<textarea value={ratingData.remark || ""} onChange={(input) => setRatingData({ ...ratingData, remark: input.target.value })} maxLength={1000} rows={4} className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-amber-300/40" /></label><div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-5"><button type="button" onClick={() => setRatingData(null)} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 hover:bg-white/10">Cancel</button><button type="button" disabled={savingRating} onClick={() => void submitRating()} className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black disabled:opacity-50">{savingRating ? "Saving..." : "Save rating"}</button></div></div></div>}
    </main>
  );
}

function SummaryCard({ icon: Icon, label, value, accent }: { icon: typeof Users; label: string; value: string | number; accent: string }) {
  return <div className="rounded-2xl border border-white/10 bg-[#0d1114] p-5"><div className="flex items-center justify-between"><p className="text-xs uppercase tracking-[0.16em] text-white/35">{label}</p><Icon size={18} className={accent} /></div><p className="mt-6 text-2xl font-semibold">{value}</p></div>;
}
