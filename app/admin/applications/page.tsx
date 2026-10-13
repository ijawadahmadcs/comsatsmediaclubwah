"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type Application = {
  _id: string;
  fullName: string;
  registrationNumber: string;
  department: string;
  semester: string;
  contactNumber: string;
  email: string;
  areaOfInterest: string;
  image?: string;
  motivation: string;
  expectations?: string;
  status?: string;
  paymentStatus?: string;
  createdAt: string;
  updatedAt?: string;
};

type ApplicationsPage = {
  query: string;
  applications: Application[];
  total: number;
  filterOptions: { semesters: string[]; interests: string[]; departments: string[] };
};

type Filters = {
  search: string;
  status: string;
  department: string;
  semester: string;
  areaOfInterest: string;
  paymentStatus: string;
};

const statuses = ["All", "Pending", "Reviewed", "Accepted", "Rejected"];
const paymentStatuses = ["Unpaid", "Paid"];
const PAGE_SIZE = 25;
const defaultFilters: Filters = { search: "", status: "All", department: "All", semester: "All", areaOfInterest: "All", paymentStatus: "All" };

export default function ApplicationsPage() {
  const [data, setData] = useState<ApplicationsPage | null>(null);
  const [selected, setSelected] = useState<Application | null>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(filters.search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [filters.search]);

  // Filtering and paging happen on the server, so the page never downloads every application.
  const query = useMemo(
    () =>
      new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        search: debouncedSearch,
        status: filters.status,
        department: filters.department,
        semester: filters.semester,
        areaOfInterest: filters.areaOfInterest,
        paymentStatus: filters.paymentStatus,
      }).toString(),
    [page, debouncedSearch, filters.status, filters.department, filters.semester, filters.areaOfInterest, filters.paymentStatus],
  );

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/applications?${query}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Unable to load applications.");
        if (!cancelled) {
          setData({ ...result, query });
          setLoadError("");
        }
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Unable to load applications.");
      });
    return () => {
      cancelled = true;
    };
  }, [query, reloadKey]);

  const applications = data?.applications ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const isUpdating = Boolean(data) && data?.query !== query;

  function updateFilter(key: keyof Filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  async function updateApplication(changes: {
    status?: string;
    paymentStatus?: string;
  }) {
    if (!selected) return;
    if (
      changes.status &&
      (selected.status || "Pending") === "Accepted" &&
      changes.status !== "Accepted" &&
      !window.confirm(
        `Changing the status from Accepted hides ${selected.fullName} from the public team page and from Team Lead rosters. Continue?`,
      )
    )
      return;
    setSaving(true);
    try {
      const response = await fetch(`/api/applications/${selected._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Unable to update application.");
      const updated = result.application as Application;
      setData((current) =>
        current
          ? { ...current, applications: current.applications.map((item) => (item._id === updated._id ? updated : item)) }
          : current,
      );
      setSelected(updated);
      setMessage(result.warning || "Application updated.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update application.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteApplication() {
    if (
      !selected ||
      !window.confirm(
        `Delete ${selected.fullName}'s application? If they were accepted, their team record is removed too.`,
      )
    )
      return;
    setSaving(true);
    try {
      const response = await fetch(`/api/applications/${selected._id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Unable to delete application.");
      setSelected(null);
      setMessage(result.message || "Application deleted.");
      setReloadKey((key) => key + 1);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete application.",
      );
    } finally {
      setSaving(false);
    }
  }

  function exportUrl(format: string) {
    const params = new URLSearchParams({
      format,
      search: filters.search.trim(),
      status: filters.status,
      department: filters.department,
      semester: filters.semester,
      areaOfInterest: filters.areaOfInterest,
      paymentStatus: filters.paymentStatus,
    });
    return `/api/applications/export?${params}`;
  }

  return (
    <main className="min-h-screen bg-[#08090b] px-5 py-16 text-white sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-300/60">
          Admin · Intake
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Applications
        </h1>
        <p className="mt-3 text-sm text-white/40">
          Review applications and confirm registration fees.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <input
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            maxLength={100}
            placeholder="Search applications..."
            className="min-w-64 flex-1 rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm outline-none focus:border-blue-300/50"
          />
          <select
            aria-label="Status"
            value={filters.status}
            onChange={(event) => updateFilter("status", event.target.value)}
            className="rounded-xl border border-white/10 bg-[#0b0d10] px-3 py-3 text-sm text-white/70"
          >
            {statuses.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          {/* <select
            aria-label="Department"
            value={filters.department}
            onChange={(event) => updateFilter("department", event.target.value)}
            className="rounded-xl border border-white/10 bg-[#0b0d10] px-3 py-3 text-sm text-white/70"
          >
            {["All", ...(data?.filterOptions.departments ?? [])].map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select> */}
          <select
            aria-label="Semester"
            value={filters.semester}
            onChange={(event) => updateFilter("semester", event.target.value)}
            className="rounded-xl border border-white/10 bg-[#0b0d10] px-3 py-3 text-sm text-white/70"
          >
            {["All", ...(data?.filterOptions.semesters ?? [])].map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <select
            aria-label="Interest"
            value={filters.areaOfInterest}
            onChange={(event) => updateFilter("areaOfInterest", event.target.value)}
            className="rounded-xl border border-white/10 bg-[#0b0d10] px-3 py-3 text-sm text-white/70"
          >
            {["All", ...(data?.filterOptions.interests ?? [])].map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <select
            aria-label="Registration fee"
            value={filters.paymentStatus}
            onChange={(event) => updateFilter("paymentStatus", event.target.value)}
            className="rounded-xl border border-white/10 bg-[#0b0d10] px-3 py-3 text-sm text-white/70"
          >
            <option>All</option>
            {paymentStatuses.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <button
            onClick={() => {
              setFilters(defaultFilters);
              setPage(1);
            }}
            className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/60"
          >
            Clear Filters
          </button>
          <a
            href={exportUrl("csv")}
            className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-black"
          >
            Export CSV
          </a>
          <a
            href={exportUrl("xlsx")}
            className="rounded-xl border border-white/15 px-4 py-3 text-sm text-white/75"
          >
            Export Excel
          </a>
        </div>

        {message && <p className="mt-5 text-sm text-blue-200">{message}</p>}
        {loadError && <p className="mt-5 text-sm text-red-200">{loadError}</p>}
        {!data ? (
          <p className="py-20 text-center text-sm text-white/40">
            {loadError ? "" : "Loading applications..."}
          </p>
        ) : (
          <>
            <div className={`mt-8 overflow-x-auto rounded-2xl border border-white/10 bg-[#0b0d10] transition-opacity ${isUpdating ? "opacity-60" : ""}`}>
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase tracking-[0.15em] text-white/30">
                  <tr>
                    <th className="p-4">Applicant</th>
                    <th className="p-4">Registration</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Interest</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Fee</th>
                    <th className="p-4">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((item) => (
                    <tr
                      key={item._id}
                      onClick={() => setSelected(item)}
                      className="cursor-pointer border-b border-white/[0.06] transition hover:bg-white/[0.04]"
                    >
                      <td className="p-4 text-white/85">
                        {item.fullName}
                        <span className="mt-1 block text-xs text-white/35">
                          {item.email}
                        </span>
                      </td>
                      <td className="p-4 text-white/55">
                        {item.registrationNumber}
                      </td>
                      <td className="p-4 text-white/55">{item.department}</td>
                      <td className="p-4 text-white/55">{item.areaOfInterest}</td>
                      <td className="p-4 text-white/55">
                        {item.status || "Pending"}
                      </td>
                      <td className="p-4 text-white/55">
                        {item.paymentStatus || "Unpaid"}
                      </td>
                      <td className="p-4 text-white/40">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!applications.length && (
                <p className="py-16 text-center text-sm text-white/40">
                  No applications match these filters.
                </p>
              )}
            </div>
            <div className="mt-5 flex items-center justify-between text-sm text-white/45">
              <span>{data.total} application{data.total === 1 ? "" : "s"}</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-lg border border-white/10 px-3 py-2 disabled:opacity-40"
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-white/10 px-3 py-2 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/75 px-4 py-8 backdrop-blur-sm">
          <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-[#111419] p-6 sm:p-8">
            <div className="flex justify-between">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.05]">
                  {selected.image ? (
                    <Image src={selected.image} alt={`Photo submitted by ${selected.fullName}`} fill sizes="64px" unoptimized className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg text-white/35">
                      {selected.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-blue-300/60">
                    Application details
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    {selected.fullName}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-white/50"
              >
                Close
              </button>
            </div>
            {selected.image && (
              <p className="mt-3 text-xs text-white/35">
                Accepting this application publishes this photo on the Team page.{" "}
                <a href={selected.image} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                  View full size
                </a>
              </p>
            )}
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              {[
                ["Registration", selected.registrationNumber],
                ["Department", selected.department],
                ["Semester", selected.semester],
                ["Contact", selected.contactNumber],
                ["Email", selected.email],
                ["Interest", selected.areaOfInterest],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs uppercase tracking-[0.15em] text-white/30">
                    {label}
                  </p>
                  <p className="mt-2 text-sm text-white/75">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-7 space-y-5 border-t border-white/10 pt-6">
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-white/30">
                  Why they want to join
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/65">
                  {selected.motivation}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-white/30">
                  Expectations
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/65">
                  {selected.expectations || "Not provided"}
                </p>
              </div>
            </div>
            <div className="mt-7 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-white/30">
                  Application status
                </span>
                <select
                  disabled={saving}
                  value={selected.status || "Pending"}
                  onChange={(event) =>
                    void updateApplication({ status: event.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm"
                >
                  <option>Pending</option>
                  <option>Reviewed</option>
                  <option>Accepted</option>
                  <option>Rejected</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-white/30">
                  Registration fee
                </span>
                <select
                  disabled={saving}
                  value={selected.paymentStatus || "Unpaid"}
                  onChange={(event) =>
                    void updateApplication({
                      paymentStatus: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm"
                >
                  <option>Unpaid</option>
                  <option>Paid</option>
                </select>
              </label>
            </div>
            <div className="mt-6 flex justify-between gap-3">
              <button
                disabled={saving}
                onClick={() => void deleteApplication()}
                className="rounded-full border border-red-400/20 px-5 py-3 text-sm text-red-200 transition hover:bg-red-400/10 disabled:opacity-50"
              >
                Delete Application
              </button>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
