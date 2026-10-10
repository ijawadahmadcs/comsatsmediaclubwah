"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type EventRecord = {
  _id: string;
  title: string;
  description?: string;
  date: string;
  assignedMembers: Array<{
    _id: string;
    name: string;
    registrationNumber?: string;
  }>;
};

type TeamMember = {
  _id: string;
  name: string;
  registrationNumber?: string;
  department?: string;
  role?: string;
};
type FormState = {
  title: string;
  description: string;
  date: string;
  assignedMemberIds: string[];
};

const emptyForm: FormState = {
  title: "",
  description: "",
  date: "",
  assignedMemberIds: [],
};

export default function TeamLeadEvents() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);

  async function loadPage() {
    setError("");
    try {
      const [eventsResponse, membersResponse] = await Promise.all([
        fetch("/api/team-lead/events"),
        fetch("/api/team-lead/members"),
      ]);
      const eventsResult = await eventsResponse.json();
      const membersResult = await membersResponse.json();
      if (!eventsResponse.ok)
        throw new Error(eventsResult.error || "Unable to load events.");
      setEvents(eventsResult.events ?? []);
      if (membersResponse.ok) setMembers(membersResult.members ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load events.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPage(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(editingEvent ? `/api/team-lead/events/${editingEvent._id}` : "/api/team-lead/events", {
        method: editingEvent ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || (editingEvent ? "Unable to update event." : "Unable to create event."));
      setEvents((current) => editingEvent
        ? current.map((currentEvent) => currentEvent._id === editingEvent._id ? result.event : currentEvent)
        : [result.event, ...current]);
      setForm(emptyForm);
      setShowCreate(false);
      setEditingEvent(null);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create event.",
      );
    } finally {
      setSaving(false);
    }
  }

  function openCreate() {
    setEditingEvent(null);
    setForm(emptyForm);
    setShowCreate(true);
  }

  function openEdit(event: EventRecord) {
    setEditingEvent(event);
    setForm({
      title: event.title,
      description: event.description || "",
      date: new Date(event.date).toISOString().slice(0, 16),
      assignedMemberIds: event.assignedMembers.map((member) => member._id),
    });
    setShowCreate(true);
  }

  async function deleteEvent(event: EventRecord) {
    if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`)) return;
    const response = await fetch(`/api/team-lead/events/${event._id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || "Unable to delete event.");
      return;
    }
    setEvents((current) => current.filter((currentEvent) => currentEvent._id !== event._id));
  }

  function toggleMember(id: string) {
    setForm((current) => ({
      ...current,
      assignedMemberIds: current.assignedMemberIds.includes(id)
        ? current.assignedMemberIds.filter((memberId) => memberId !== id)
        : [...current.assignedMemberIds, id],
    }));
  }

  return (
    <main className="mt-20 min-h-screen bg-[#08090b] px-4 py-10 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-grey-300/70">
              <span className="h-2 w-2 rounded-full bg-grey-300" />
              Team Lead Portal
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Events & assignments
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/45">
              Create events, assign members from your team, and keep attendance
              in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-grey-100"
          >
            <Plus size={17} /> New event
          </button>
        </header>

        {error && (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-red-300/20 bg-red-300/10 px-4 py-3 text-sm text-red-100">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void loadPage()}
              className="shrink-0 underline underline-offset-4"
            >
              Retry
            </button>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/35">
              Workspace
            </p>
            <h2 className="mt-2 text-xl font-medium">
              Upcoming and recent events
            </h2>
          </div>
          <p className="text-sm text-white/40">
            {loading
              ? "Loading..."
              : `${events.length} event${events.length === 1 ? "" : "s"}`}
          </p>
        </div>

        {loading ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <EventSkeleton />
            <EventSkeleton />
          </div>
        ) : events.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-[#0d1114] px-6 py-16 text-center">
            <CalendarDays className="mx-auto text-white/25" size={28} />
            <p className="mt-4 font-medium">No events yet</p>
            <p className="mt-2 text-sm text-white/40">
              Create your first event to start tracking your team.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-6 rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/75 transition hover:bg-white/10"
            >
              Create event
            </button>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {events.map((event) => (
              <EventCard key={event._id} event={event} onEdit={openEdit} onDelete={deleteEvent} />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#11161a] p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-grey-300/70">
                  New record
                </p>
                <h2 className="mt-2 text-2xl font-semibold">{editingEvent ? "Edit event" : "Create an event"}</h2>
              </div>
              <button
                type="button"
                onClick={() => { setShowCreate(false); setEditingEvent(null); }}
                aria-label="Close create event dialog"
                className="rounded-lg p-2 text-white/45 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="mt-7 space-y-5">
              <label className="block text-sm text-white/70">
                Title
                <input
                  required
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-grey-300/50"
                />
              </label>
              <label className="block text-sm text-white/70">
                Description
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  rows={3}
                  className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-grey-300/50"
                />
              </label>
              <label className="block text-sm text-white/70">
                Date and time
                <input
                  required
                  type="datetime-local"
                  value={form.date}
                  onChange={(event) =>
                    setForm({ ...form, date: event.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-grey-300/50"
                />
              </label>
              <fieldset>
                <legend className="text-sm text-white/70">
                  Assign members{" "}
                  <span className="text-white/35">
                    ({form.assignedMemberIds.length} selected)
                  </span>
                </legend>
                <div className="mt-2 max-h-52 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-2">
                  {members.length ? (
                    members.map((member) => (
                      <label
                        key={member._id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/10"
                      >
                        <input
                          type="checkbox"
                          checked={form.assignedMemberIds.includes(member._id)}
                          onChange={() => toggleMember(member._id)}
                          className="h-4 w-4 accent-grey-300"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-white/85">
                            {member.name}
                          </span>
                          <span className="block truncate text-xs text-white/35">
                            {member.registrationNumber ||
                              member.department ||
                              "Team member"}
                          </span>
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="p-4 text-sm text-white/40">
                      No members are available in your team.
                    </p>
                  )}
                </div>
              </fieldset>
              <div className="flex justify-end gap-3 border-t border-white/10 pt-5">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setEditingEvent(null); }}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingEvent ? "Save changes" : "Create event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function EventCard({ event, onEdit, onDelete }: { event: EventRecord; onEdit: (event: EventRecord) => void; onDelete: (event: EventRecord) => void }) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-[#0d1114] p-5 transition hover:border-grey-300/30 hover:bg-[#11191d] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-grey-300/10 text-grey-200">
          <CalendarDays size={20} />
        </div>
        <div className="flex items-center gap-2"><button type="button" onClick={() => onEdit(event)} aria-label={`Edit ${event.title}`} className="rounded-lg border border-white/10 p-2 text-white/45 transition hover:border-white/25 hover:text-white"><Pencil size={15} /></button><button type="button" onClick={() => void onDelete(event)} aria-label={`Delete ${event.title}`} className="rounded-lg border border-red-300/15 p-2 text-red-200/60 transition hover:border-red-300/40 hover:text-red-100"><Trash2 size={15} /></button></div>
      </div>
      <Link href={`/team-lead/events/${event._id}`} className="block"><h3 className="mt-6 text-xl font-medium text-white/90">{event.title}</h3>{event.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/40">{event.description}</p>}<div className="mt-6 flex flex-wrap gap-4 border-t border-white/[0.08] pt-4 text-xs text-white/45"><span className="inline-flex items-center gap-2"><Clock3 size={14} />{new Date(event.date).toLocaleString()}</span><span className="inline-flex items-center gap-2"><Users size={14} />{event.assignedMembers?.length ?? 0} assigned</span></div><div className="mt-5 flex items-center gap-2 text-sm text-grey-200">Open event <CheckCircle2 size={15} className="transition group-hover:translate-x-1" /></div></Link>
    </div>
  );
}

function EventSkeleton() {
  return (
    <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-[#0d1114]" />
  );
}
