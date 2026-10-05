"use client";

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
  motivation: string;
  expectations?: string;
  status?: string;
  paymentStatus?: string;
  createdAt: string;
  updatedAt?: string;
};

const statuses = ["All", "Pending", "Reviewed", "Accepted", "Rejected"];
const paymentStatuses = ["Unpaid", "Paid"];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [department, setDepartment] = useState("All");
  const [semester, setSemester] = useState("All");
  const [interest, setInterest] = useState("All");
  const [paymentStatus, setPaymentStatus] = useState("All");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadApplications() {
    const response = await fetch("/api/applications");
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Unable to load applications.");
    setApplications(result.applications);
  }

  useEffect(() => {
    loadApplications().catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load applications.")).finally(() => setLoading(false));
  }, []);

  const options = useMemo(() => ({
    departments: ["All", ...new Set(applications.map((item) => item.department))],
    semesters: ["All", ...new Set(applications.map((item) => item.semester))],
    interests: ["All", ...new Set(applications.map((item) => item.areaOfInterest))],
  }), [applications]);

  const filtered = applications.filter((item) => {
    const haystack = [item.fullName, item.registrationNumber, item.email, item.department, item.areaOfInterest].join(" ").toLowerCase();
    return (!search || haystack.includes(search.toLowerCase())) && (status === "All" || (item.status || "Pending") === status) && (department === "All" || item.department === department) && (semester === "All" || item.semester === semester) && (interest === "All" || item.areaOfInterest === interest) && (paymentStatus === "All" || (item.paymentStatus || "Unpaid") === paymentStatus);
  });

  async function updateApplication(changes: { status?: string; paymentStatus?: string }) {
    if (!selected) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/applications/${selected._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to update application.");
      const updated = result.application as Application;
      setApplications((items) => items.map((item) => item._id === updated._id ? updated : item));
      setSelected(updated);
      setMessage("Application updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update application.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteApplication() {
    if (!selected || !window.confirm(`Delete ${selected.fullName}'s application? This also removes their linked team record.`)) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/applications/${selected._id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to delete application.");
      setApplications((items) => items.filter((item) => item._id !== selected._id));
      setSelected(null);
      setMessage("Application deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete application.");
    } finally {
      setSaving(false);
    }
  }

  function exportApplications(format: string) {
    const params = new URLSearchParams({ format, search, status, department, semester, areaOfInterest: interest, paymentStatus });
    window.location.href = `/api/applications/export?${params}`;
  }

  return (
    <main className="min-h-screen bg-[#08090b] px-5 py-16 text-white sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-300/60">Admin · Intake</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Applications</h1>
        <p className="mt-3 text-sm text-white/40">Review applications and confirm registration fees.</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search applications..." className="min-w-64 flex-1 rounded-xl border border-white/10 bg-[#0b0d10] px-4 py-3 text-sm outline-none focus:border-blue-300/50" />
          <select aria-label="Status" value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-white/10 bg-[#0b0d10] px-3 py-3 text-sm text-white/70">{statuses.map((option) => <option key={option}>{option}</option>)}</select>
          <select aria-label="Department" value={department} onChange={(event) => setDepartment(event.target.value)} className="rounded-xl border border-white/10 bg-[#0b0d10] px-3 py-3 text-sm text-white/70">{options.departments.map((option) => <option key={option}>{option}</option>)}</select>
          <select aria-label="Semester" value={semester} onChange={(event) => setSemester(event.target.value)} className="rounded-xl border border-white/10 bg-[#0b0d10] px-3 py-3 text-sm text-white/70">{options.semesters.map((option) => <option key={option}>{option}</option>)}</select>
          <select aria-label="Interest" value={interest} onChange={(event) => setInterest(event.target.value)} className="rounded-xl border border-white/10 bg-[#0b0d10] px-3 py-3 text-sm text-white/70">{options.interests.map((option) => <option key={option}>{option}</option>)}</select>
          <select aria-label="Registration fee" value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)} className="rounded-xl border border-white/10 bg-[#0b0d10] px-3 py-3 text-sm text-white/70"><option>All</option>{paymentStatuses.map((option) => <option key={option}>{option}</option>)}</select>
          <button onClick={() => { setSearch(""); setStatus("All"); setDepartment("All"); setSemester("All"); setInterest("All"); setPaymentStatus("All"); }} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/60">Clear Filters</button>
          <button onClick={() => exportApplications("csv")} className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-black">Export CSV</button>
          <button onClick={() => exportApplications("xlsx")} className="rounded-xl border border-white/15 px-4 py-3 text-sm text-white/75">Export Excel</button>
        </div>

        {message && <p className="mt-5 text-sm text-blue-200">{message}</p>}
        {loading ? <p className="py-20 text-center text-sm text-white/40">Loading applications...</p> : <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10 bg-[#0b0d10]"><table className="w-full min-w-[980px] text-left text-sm"><thead className="border-b border-white/10 text-xs uppercase tracking-[0.15em] text-white/30"><tr><th className="p-4">Applicant</th><th className="p-4">Registration</th><th className="p-4">Department</th><th className="p-4">Interest</th><th className="p-4">Status</th><th className="p-4">Fee</th><th className="p-4">Submitted</th></tr></thead><tbody>{filtered.map((item) => <tr key={item._id} onClick={() => setSelected(item)} className="cursor-pointer border-b border-white/[0.06] transition hover:bg-white/[0.04]"><td className="p-4 text-white/85">{item.fullName}<span className="mt-1 block text-xs text-white/35">{item.email}</span></td><td className="p-4 text-white/55">{item.registrationNumber}</td><td className="p-4 text-white/55">{item.department}</td><td className="p-4 text-white/55">{item.areaOfInterest}</td><td className="p-4 text-white/55">{item.status || "Pending"}</td><td className="p-4 text-white/55">{item.paymentStatus || "Unpaid"}</td><td className="p-4 text-white/40">{new Date(item.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table>{!filtered.length && <p className="py-16 text-center text-sm text-white/40">No applications match these filters.</p>}</div>}
      </div>

      {selected && <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/75 px-4 py-8 backdrop-blur-sm"><div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-[#111419] p-6 sm:p-8"><div className="flex justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-blue-300/60">Application details</p><h2 className="mt-2 text-2xl font-semibold">{selected.fullName}</h2></div><button onClick={() => setSelected(null)} className="text-white/50">Close</button></div><div className="mt-7 grid gap-5 sm:grid-cols-2">{[["Registration", selected.registrationNumber], ["Department", selected.department], ["Semester", selected.semester], ["Contact", selected.contactNumber], ["Email", selected.email], ["Interest", selected.areaOfInterest]].map(([label, value]) => <div key={label}><p className="text-xs uppercase tracking-[0.15em] text-white/30">{label}</p><p className="mt-2 text-sm text-white/75">{value}</p></div>)}</div><div className="mt-7 space-y-5 border-t border-white/10 pt-6"><div><p className="text-xs uppercase tracking-[0.15em] text-white/30">Why they want to join</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/65">{selected.motivation}</p></div><div><p className="text-xs uppercase tracking-[0.15em] text-white/30">Expectations</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/65">{selected.expectations || "Not provided"}</p></div></div><div className="mt-7 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-xs uppercase tracking-[0.15em] text-white/30">Application status</span><select disabled={saving} value={selected.status || "Pending"} onChange={(event) => void updateApplication({ status: event.target.value })} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm"><option>Pending</option><option>Reviewed</option><option>Accepted</option><option>Rejected</option></select></label><label className="block"><span className="mb-2 block text-xs uppercase tracking-[0.15em] text-white/30">Registration fee</span><select disabled={saving} value={selected.paymentStatus || "Unpaid"} onChange={(event) => void updateApplication({ paymentStatus: event.target.value })} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm"><option>Unpaid</option><option>Paid</option></select></label></div><div className="mt-6 flex justify-between gap-3"><button disabled={saving} onClick={() => void deleteApplication()} className="rounded-full border border-red-400/20 px-5 py-3 text-sm text-red-200 transition hover:bg-red-400/10 disabled:opacity-50">Delete Application</button><button onClick={() => setSelected(null)} className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black">Done</button></div></div></div>}
    </main>
  );
}
