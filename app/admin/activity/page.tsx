"use client";

import { useEffect, useState } from "react";

type ActivityEntry = {
  _id: string;
  action: string;
  actorId?: string;
  actorRole?: string;
  actorRegistrationNumber?: string;
  targetType?: string;
  targetId?: string;
  details?: unknown;
  createdAt: string;
};

type ActivityPage = { entries: ActivityEntry[]; page: number; pageSize: number; total: number };

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
  return JSON.stringify(value);
}

// Turns an entry's details into short "key: value" lines, with "from → to" for recorded changes.
function describeDetails(details: unknown): string[] {
  if (!details || typeof details !== "object" || Array.isArray(details)) return details === undefined ? [] : [formatValue(details)];
  return Object.entries(details as Record<string, unknown>).flatMap(([key, value]) => {
    if (value === undefined) return [];
    if (key === "changes" && value && typeof value === "object") {
      return Object.entries(value as Record<string, { from?: unknown; to?: unknown }>).map(
        ([field, change]) => `${field}: ${formatValue(change?.from)} → ${formatValue(change?.to)}`,
      );
    }
    return [`${key}: ${formatValue(value)}`];
  });
}

export default function ActivityPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ActivityPage | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/activity?page=${page}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Unable to load activity.");
        if (!cancelled) {
          setData(result);
          setMessage("");
        }
      })
      .catch((error) => {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Unable to load activity.");
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <main className="min-h-screen bg-[#08090b] px-5 py-16 text-white sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-300/60">Superadmin · Audit</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Activity</h1>
        <p className="mt-3 text-sm text-white/40">Every change made by admins and Team Leads, newest first.</p>
        {message && <p className="mt-5 text-sm text-red-200">{message}</p>}
        <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10 bg-[#0b0d10]">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-[0.15em] text-white/30">
              <tr>
                <th className="p-4">When</th>
                <th className="p-4">Who</th>
                <th className="p-4">Action</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody>
              {!data ? (
                <tr><td colSpan={4} className="p-12 text-center text-white/40">{message ? "-" : "Loading activity..."}</td></tr>
              ) : data.entries.length === 0 ? (
                <tr><td colSpan={4} className="p-12 text-center text-white/40">No activity recorded yet.</td></tr>
              ) : (
                data.entries.map((entry) => (
                  <tr key={entry._id} className="border-b border-white/[0.06] align-top">
                    <td className="whitespace-nowrap p-4 text-white/55">{new Date(entry.createdAt).toLocaleString()}</td>
                    <td className="p-4 text-white/75">
                      {entry.actorRegistrationNumber || entry.actorId || "-"}
                      {entry.actorRole && <span className="mt-1 block text-[10px] uppercase tracking-[0.15em] text-white/30">{entry.actorRole}</span>}
                    </td>
                    <td className="p-4 text-white/75">{entry.action.replace(/_/g, " ")}</td>
                    <td className="p-4 text-xs leading-5 text-white/45">
                      {describeDetails(entry.details).map((line, index) => <p key={index} className="break-all">{line}</p>)}
                      {entry.targetId && <p className="text-white/25">{entry.targetType || "target"} {entry.targetId}</p>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex items-center justify-between text-sm text-white/45">
          <span>{data ? `${data.total} entr${data.total === 1 ? "y" : "ies"}` : ""}</span>
          <div className="flex items-center gap-3">
            <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-white/10 px-3 py-2 disabled:opacity-40">Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-white/10 px-3 py-2 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </main>
  );
}
