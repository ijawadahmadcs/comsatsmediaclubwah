// src/app/team-lead/events/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

interface Member {
  _id: string;
  name: string;
  registrationNumber: string;
}

interface Event {
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
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceSet, setAttendanceSet] = useState<Set<string>>(new Set());
  const [ratingData, setRatingData] = useState<{
    memberId: string;
    rating: number;
    remark?: string;
  } | null>(null);

  // Load event data
  useEffect(() => {
    fetch(`/api/team-lead/events/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setEvent(data.event);
        setAttendanceSet(new Set(data.event?.attendance ?? []));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading event…</p>;
  if (!event) return <p>Event not found.</p>;

  const toggleAttendance = (memberId: string) => {
    const newSet = new Set(attendanceSet);
    if (newSet.has(memberId)) newSet.delete(memberId);
    else newSet.add(memberId);
    setAttendanceSet(newSet);
  };

  const submitAttendance = async () => {
    const memberIds = Array.from(attendanceSet);
    const res = await fetch(`/api/team-lead/events/${id}?action=attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberIds }),
    });
    if (res.ok) alert("Attendance saved");
    else alert("Failed to save attendance");
  };

  const openRating = (memberId: string) => {
    setRatingData({ memberId, rating: 1 });
  };

  const submitRating = async () => {
    if (!ratingData) return;
    const { memberId, rating, remark } = ratingData;
    const res = await fetch(`/api/team-lead/events/${id}?action=rating`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, rating, remark }),
    });
    if (res.ok) {
      alert("Rating saved");
      setRatingData(null);
      // Refresh event data to reflect new rating
      const refreshed = await fetch(`/api/team-lead/events/${id}`).then((r) =>
        r.json(),
      );
      setEvent(refreshed.event);
    } else alert("Failed to save rating");
  };

  return (
    <div className="p-6 mt-20 min-h-screen bg-[#08090b] text-white sm:px-8 lg:px-12">
      <button
        onClick={() => router.back()}
        className="mb-4 text-blue-600 hover:underline"
      >
        ← Back to events
      </button>
      <h1 className="mb-2 text-2xl font-bold">{event.title}</h1>
      <p className="text-sm text-gray-600">
        {new Date(event.date).toLocaleString()}
      </p>
      {event.description && <p className="mt-2">{event.description}</p>}

      <section className="mt-6">
        <h2 className="mb-2 text-xl font-semibold">Assigned Members</h2>
        <ul className="space-y-2">
          {event.assignedMembers.map((m) => (
            <li
              key={m._id}
              className="flex items-center justify-between rounded border p-2"
            >
              <span>
                {m.name} ({m.registrationNumber})
              </span>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={attendanceSet.has(m._id)}
                    onChange={() => toggleAttendance(m._id)}
                  />
                  <span className="text-sm">Present</span>
                </label>
                <button
                  type="button"
                  onClick={() => openRating(m._id)}
                  className="rounded bg-yellow-500 px-2 py-1 text-xs text-white hover:bg-yellow-600"
                >
                  Rate
                </button>
              </div>
            </li>
          ))}
        </ul>
        <button
          onClick={submitAttendance}
          className="mt-4 rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700"
        >
          Save Attendance
        </button>
      </section>

      {/* Rating modal */}
      {ratingData && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded bg-white p-6 shadow-lg">
            <h3 className="mb-2 text-lg font-medium">Rate Member</h3>
            <label className="block mb-2">
              Stars (1‑5):
              <select
                value={ratingData.rating}
                onChange={(e) =>
                  setRatingData({
                    ...ratingData,
                    rating: Number(e.target.value),
                  })
                }
                className="ml-2 rounded border p-1"
              >
                {[1, 2, 3, 4, 5].map((v) => (
                  <option key={v} value={v}>
                    {" "}
                    {v}{" "}
                  </option>
                ))}
              </select>
            </label>
            <label className="block mb-2">
              Remarks:
              <textarea
                value={ratingData.remark ?? ""}
                onChange={(e) =>
                  setRatingData({ ...ratingData, remark: e.target.value })
                }
                className="mt-1 w-full rounded border p-2"
              />
            </label>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setRatingData(null)}
                className="rounded bg-gray-300 px-3 py-1 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRating}
                className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
