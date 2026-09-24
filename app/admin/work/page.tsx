"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { ImagePlus, Trash2, Video } from "lucide-react";

type WorkAsset = { _id: string; url: string; publicId: string; resourceType: "image" | "video"; order: number };

export default function WorkManagementPage() {
  const [assets, setAssets] = useState<WorkAsset[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadAssets() {
    const response = await fetch("/api/work");
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || "Unable to load work assets.");
    setAssets(result.assets);
  }

  useEffect(() => {
    loadAssets().catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load work assets.")).finally(() => setLoading(false));
  }, []);

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] || null);
    setMessage("");
  }

  async function upload() {
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await fetch("/api/work", { method: "POST", body: data, credentials: "include" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to upload work media.");
      setFile(null);
      setMessage("Media uploaded successfully.");
      await loadAssets();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to upload work media.");
    } finally {
      setUploading(false);
    }
  }

  async function remove(asset: WorkAsset) {
    if (!window.confirm("Delete this work media?")) return;
    const response = await fetch(`/api/work/${asset._id}`, { method: "DELETE", credentials: "include" });
    const result = await response.json();
    if (!response.ok || !result.success) { setMessage(result.message || "Unable to delete work media."); return; }
    setAssets((current) => current.filter((item) => item._id !== asset._id));
    setMessage("Media deleted.");
  }

  return <main className="min-h-screen bg-[#08090b] px-5 py-16 text-white sm:px-10 lg:px-16"><div className="mx-auto max-w-7xl"><p className="text-xs uppercase tracking-[0.3em] text-blue-300/60">Admin · Portfolio</p><h1 className="mt-4 text-4xl font-semibold tracking-tight">Work Gallery</h1><p className="mt-3 text-sm text-white/40">Upload the images and videos shown on the Work page.</p><div className="mt-8 flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0b0d10] p-5 sm:flex-row sm:items-center"><label className="flex min-h-12 flex-1 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/20 px-4 text-sm text-white/55 transition hover:border-white/40 hover:text-white"><ImagePlus size={18} /><span className="truncate">{file ? file.name : "Choose image or video"}</span><input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" onChange={selectFile} className="sr-only" /></label><button type="button" onClick={() => void upload()} disabled={!file || uploading} className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50">{uploading ? "Uploading..." : "Upload Media"}</button></div>{message && <p className="mt-4 text-sm text-blue-200">{message}</p>}{loading ? <p className="py-20 text-center text-sm text-white/40">Loading gallery...</p> : assets.length === 0 ? <p className="py-20 text-center text-sm text-white/40">No uploaded media yet.</p> : <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{assets.map((asset) => <article key={asset._id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">{asset.resourceType === "video" ? <video src={asset.url} muted playsInline className="aspect-square w-full object-cover" /> : <img src={asset.url} alt="Work gallery asset" className="aspect-square w-full object-cover" />}<div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/65 p-3 opacity-0 backdrop-blur-sm transition group-hover:opacity-100"><span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-white/60">{asset.resourceType === "video" && <Video size={13} />}{asset.resourceType}</span><button type="button" onClick={() => void remove(asset)} className="rounded-lg border border-red-300/20 p-2 text-red-200 transition hover:bg-red-400/20" aria-label="Delete work asset"><Trash2 size={15} /></button></div></article>)}</div>}</div></main>;
}
