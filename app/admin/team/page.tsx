"use client";

import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Plus, Trash2, X } from "lucide-react";

type TeamMember = {
  _id: string;
  name: string;
  role: string;
  department?: string;
  registrationNumber?: string;
  semester?: number;
  bio?: string;
  image?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  order: number;
};

type AcceptedApplicant = {
  _id: string;
  fullName: string;
  registrationNumber: string;
  department: string;
  areaOfInterest: string;
};

type FormValues = Omit<TeamMember, "_id">;

const emptyForm: FormValues = {
  name: "",
  role: "",
  department: "",
  registrationNumber: "",
  semester: undefined,
  bio: "",
  image: "",
  instagram: "",
  facebook: "",
  linkedin: "",
  order: 0,
};

const fields: { key: keyof FormValues; label: string; type?: string; wide?: boolean }[] = [
  { key: "name", label: "Name *" },
  { key: "role", label: "Role *" },
  { key: "department", label: "Department" },
  { key: "registrationNumber", label: "Registration Number" },
  { key: "semester", label: "Semester", type: "number" },
  { key: "order", label: "Display Order", type: "number" },
  { key: "instagram", label: "Instagram URL" },
  { key: "facebook", label: "Facebook URL" },
  { key: "linkedin", label: "LinkedIn URL" },
];

export default function TeamManagementPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [acceptedApplicants, setAcceptedApplicants] = useState<AcceptedApplicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [formError, setFormError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function loadMembers() {
    setIsLoading(true);
    try {
      const [teamResponse, applicationsResponse] = await Promise.all([
        fetch("/api/team"),
        fetch("/api/applications"),
      ]);
      const teamResult = await teamResponse.json();
      const applicationsResult = await applicationsResponse.json();
      if (!teamResponse.ok || !teamResult.success) throw new Error(teamResult.message || "Unable to load team members.");
      if (!applicationsResponse.ok || !applicationsResult.success) throw new Error(applicationsResult.message || "Unable to load accepted applicants.");
      setMembers(teamResult.members);
      setAcceptedApplicants(
        applicationsResult.applications.filter(
          (application: AcceptedApplicant & { status?: string }) => application.status === "Accepted",
        ),
      );
    } catch (loadError) {
      setFeedback({ type: "error", message: loadError instanceof Error ? loadError.message : "Unable to load team members." });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMembers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function openAddForm() {
    setEditingMember(null);
    setForm(emptyForm);
    setImageFile(null);
    setFormError("");
    setIsFormOpen(true);
  }

  function openEditForm(member: TeamMember) {
    setEditingMember(member);
    setForm({ ...emptyForm, ...member });
    setImageFile(null);
    setFormError("");
    setIsFormOpen(true);
  }

  function closeForm() {
    if (!isSaving) setIsFormOpen(false);
  }

  function updateField(key: keyof FormValues, value: string) {
    setForm((current) => ({ ...current, [key]: key === "semester" || key === "order" ? (value === "" ? undefined : Number(value)) : value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.role.trim()) {
      setFormError("Name and role are required.");
      return;
    }

    setIsSaving(true);
    setFormError("");
    setFeedback({ type: "", message: "" });
    const url = editingMember ? `/api/team/${editingMember._id}` : "/api/team";

    try {
      let image = form.image;
      if (imageFile) {
        setIsUploading(true);
        const uploadData = new FormData();
        uploadData.append("file", imageFile);
        const uploadResponse = await fetch("/api/upload", { method: "POST", body: uploadData });
        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok || !uploadResult.success) throw new Error(uploadResult.message || "Unable to upload image.");
        image = uploadResult.secure_url;
      }
      const response = await fetch(url, {
        method: editingMember ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, image }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to save team member.");
      setIsFormOpen(false);
      setForm(emptyForm);
      setImageFile(null);
      setEditingMember(null);
      setFeedback({ type: "success", message: editingMember ? "Team member updated." : "Team member added." });
      await loadMembers();
    } catch (saveError) {
      setFormError(saveError instanceof Error ? saveError.message : "Unable to save team member.");
    } finally {
      setIsUploading(false);
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!memberToDelete) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/team/${memberToDelete._id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to delete team member.");
      setMemberToDelete(null);
      setFeedback({ type: "success", message: "Team member deleted." });
      await loadMembers();
    } catch (deleteError) {
      setFeedback({ type: "error", message: deleteError instanceof Error ? deleteError.message : "Unable to delete team member." });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#08090b] px-3 py-28 text-white sm:px-5">
      <section className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 py-10 sm:px-10 lg:px-16">
        <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-end">
          <div><p className="text-xs uppercase tracking-[0.3em] text-blue-300/60">Admin · People</p><h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Team Management</h1><p className="mt-3 text-sm text-white/40">Manage the people behind the vision.</p></div>
          <button type="button" onClick={openAddForm} className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90"><Plus size={16} /> Add Member</button>
        </div>

        <AnimatePresence mode="wait">
          {feedback.message && <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`mt-6 rounded-xl border px-4 py-3 text-sm ${feedback.type === "success" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-red-400/20 bg-red-400/10 text-red-200"}`}>{feedback.message}</motion.p>}
        </AnimatePresence>

        {!isLoading && acceptedApplicants.length > 0 && (
          <div className="mt-8 rounded-2xl border border-blue-300/15 bg-blue-300/[0.05] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-blue-200/60">Accepted Applications</p>
                <h2 className="mt-2 text-xl font-medium text-white/90">Ready to join the team</h2>
              </div>
              <span className="rounded-full border border-blue-200/20 px-3 py-1 text-xs text-blue-100/70">{acceptedApplicants.length}</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {acceptedApplicants.map((applicant) => (
                <div key={applicant._id} className="rounded-xl border border-white/10 bg-black/15 px-4 py-3">
                  <p className="font-medium text-white/85">{applicant.fullName}</p>
                  <p className="mt-1 text-xs text-white/45">{applicant.registrationNumber}</p>
                  <p className="mt-1 text-xs text-white/35">{applicant.department} · {applicant.areaOfInterest}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoading ? <div className="py-24 text-center text-sm text-white/40">Loading team members...</div> : members.length === 0 ? <div className="py-24 text-center"><p className="text-sm text-white/40">No team members yet.</p><button type="button" onClick={openAddForm} className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm text-white transition hover:bg-white/10"><Plus size={16} /> Add Member</button></div> : <div className="mt-8 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-white/10 text-xs uppercase tracking-[0.18em] text-white/30"><tr><th className="pb-4 pr-5">Member</th><th className="pb-4 pr-5">Role</th><th className="pb-4 pr-5">Department</th><th className="pb-4 pr-5">Semester</th><th className="pb-4 pr-5">Order</th><th className="pb-4 text-right">Actions</th></tr></thead><tbody>{members.map((member) => <tr key={member._id} className="border-b border-white/[0.06] last:border-0"><td className="py-5 pr-5"><div className="flex items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.05] text-sm text-white/40">{member.image ? <img src={member.image} alt="" className="h-full w-full object-cover" /> : member.name.charAt(0).toUpperCase()}</div><span className="font-medium text-white/85">{member.name}</span></div></td><td className="py-5 pr-5 text-white/60">{member.role}</td><td className="py-5 pr-5 text-white/45">{member.department || "-"}</td><td className="py-5 pr-5 text-white/45">{member.semester || "-"}</td><td className="py-5 pr-5 text-white/45">{member.order}</td><td className="py-5 text-right"><div className="inline-flex gap-2"><button type="button" onClick={() => openEditForm(member)} aria-label={`Edit ${member.name}`} className="rounded-lg border border-white/10 p-2 text-white/50 transition hover:bg-white/10 hover:text-white"><Pencil size={15} /></button><button type="button" onClick={() => setMemberToDelete(member)} aria-label={`Delete ${member.name}`} className="rounded-lg border border-red-400/15 p-2 text-red-300/70 transition hover:bg-red-400/10 hover:text-red-200"><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>}
      </section>

      <AnimatePresence>
        {isFormOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] overflow-y-auto bg-black/75 px-4 py-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="member-form-title"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#111419] p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-blue-300/60">{editingMember ? "Edit profile" : "New profile"}</p><h2 id="member-form-title" className="mt-2 text-2xl font-semibold">{editingMember ? "Edit team member" : "Add team member"}</h2></div><button type="button" onClick={closeForm} aria-label="Close form" className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white"><X size={19} /></button></div><form onSubmit={handleSubmit} className="mt-7 grid gap-5 sm:grid-cols-2">{fields.map((field) => <label key={field.key} className="block"><span className="mb-2 block text-xs uppercase tracking-[0.12em] text-white/45">{field.label}</span><input type={field.type || "text"} min={field.key === "semester" ? 1 : undefined} value={form[field.key] ?? ""} onChange={(event) => updateField(field.key, event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-blue-300/50" /></label>)}<label className="block sm:col-span-2"><span className="mb-2 block text-xs uppercase tracking-[0.12em] text-white/45">Upload Image</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] || null)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/60 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:text-black" />{form.image && <p className="mt-2 truncate text-xs text-white/35">Current image: {form.image}</p>}</label><label className="block sm:col-span-2"><span className="mb-2 block text-xs uppercase tracking-[0.12em] text-white/45">Bio</span><textarea value={form.bio || ""} onChange={(event) => updateField("bio", event.target.value)} rows={4} className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-300/50" /></label>{formError && <p className="sm:col-span-2 text-sm text-red-300">{formError}</p>}<div className="flex justify-end gap-3 border-t border-white/10 pt-5 sm:col-span-2"><button type="button" onClick={closeForm} disabled={isSaving} className="rounded-full border border-white/15 px-5 py-3 text-sm text-white/70 transition hover:bg-white/10">Cancel</button><button type="submit" disabled={isSaving || isUploading} className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50">{isUploading ? "Uploading..." : isSaving ? "Saving..." : editingMember ? "Save Changes" : "Add Member"}</button></div></form></motion.div></motion.div>}
      </AnimatePresence>

      <AnimatePresence>
        {memberToDelete && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-title"><motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111419] p-6 shadow-2xl"><h2 id="delete-title" className="text-xl font-semibold">Delete team member?</h2><p className="mt-3 text-sm leading-6 text-white/45">Are you sure you want to delete this team member?</p><div className="mt-7 flex justify-end gap-3"><button type="button" onClick={() => setMemberToDelete(null)} disabled={isSaving} className="rounded-full border border-white/15 px-5 py-3 text-sm text-white/70 transition hover:bg-white/10">Cancel</button><button type="button" onClick={handleDelete} disabled={isSaving} className="rounded-full bg-red-400/15 px-5 py-3 text-sm text-red-200 transition hover:bg-red-400/25 disabled:opacity-50">{isSaving ? "Deleting..." : "Delete"}</button></div></motion.div></motion.div>}
      </AnimatePresence>
    </main>
  );
}
