"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import PublicPageHeader from "@/components/PublicPageHeader";
import { Aperture } from "lucide-react";

const localGallery = [
  "/work/work-2.jpeg",
  "/work/work-3.jpeg",
  "/work/work-5.jpg",
  "/work/work-6.jpg",
  "/work/work-7.jpg",
  "/work/work-8.jpg",
  "/work/work-9.jpg",
  "/work/work-10.jpg",
  "/work/work-11.jpg",
  "/work/work-12.jpg",
  "/work/work-13.jpg",
];

type WorkAsset = {
  _id?: string;
  url: string;
  resourceType: "image" | "video";
};

export default function WorkPage() {
  const [uploadedAssets, setUploadedAssets] = useState<WorkAsset[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const gallery: WorkAsset[] = [
    ...localGallery.map((url) => ({ url, resourceType: "image" as const } satisfies WorkAsset)),
    ...uploadedAssets,
  ];

  useEffect(() => {
    fetch("/api/work")
      .then(async (response) => {
        const result = await response.json();
        if (response.ok && result.success) setUploadedAssets(result.assets);
      })
      .catch(() => undefined);
  }, []);

  // The gallery grows when uploaded media loads, so the navigation handlers track its length.
  const galleryLength = gallery.length;
  const isLightboxOpen = selectedIndex !== null;

  const closeLightbox = useCallback(() => setSelectedIndex(null), []);

  const showPrevious = useCallback(() => {
    setSelectedIndex((current) => current === null ? null : (current - 1 + galleryLength) % galleryLength);
  }, [galleryLength]);

  const showNext = useCallback(() => {
    setSelectedIndex((current) => current === null ? null : (current + 1) % galleryLength);
  }, [galleryLength]);

  useEffect(() => {
    if (!isLightboxOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isLightboxOpen, closeLightbox, showPrevious, showNext]);

  return (
    <main className="min-h-screen bg-[#08090b] px-3 py-3 text-white sm:px-5 sm:py-5">
      <section className="overflow-hidden px-3 pt-24 sm:px-5 sm:pt-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <PublicPageHeader
            eyebrow="Our portfolio"
            title="Stories through"
            highlightedTitle="every frame."
            description="Photography, videography, design, and campus stories created by the COMSATS Media Club."
            icon={Aperture}
          />
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/[0.08] bg-[#0b0d10] px-5 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/35">Featured work</p>
            <p className="text-xs text-white/35">{gallery.length} frames</p>
          </div>

          <div className="mt-6 columns-1 gap-3 sm:columns-2 lg:columns-3">
            {gallery.map((asset, index) => (
              <motion.button key={asset._id || asset.url} type="button" initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.55, delay: (index % 3) * 0.06 }} onClick={() => setSelectedIndex(index)} className="group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] text-left focus:outline-none focus:ring-2 focus:ring-white/60" aria-label={`Open work ${index + 1}`}>
                {asset.resourceType === "video" ? <video src={asset.url} muted playsInline loop autoPlay className="block h-auto max-h-[70vh] w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]" /> : <Image src={asset.url} alt="COMSATS Media Club work" width={0} height={0} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" unoptimized={!asset.url.startsWith("/")} style={{ width: "100%", height: "auto" }} className="block transition duration-700 ease-out group-hover:scale-[1.04]" />}
                <span className="pointer-events-none absolute inset-0 bg-black/0 transition duration-500 group-hover:bg-black/25" />
                <span className="absolute bottom-4 right-4 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white/75 opacity-0 backdrop-blur-md transition duration-300 group-hover:translate-y-0 group-hover:opacity-100"><Maximize2 size={16} /></span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md sm:p-8" role="dialog" aria-modal="true" onClick={closeLightbox}>
            <button type="button" onClick={closeLightbox} className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white hover:text-black" aria-label="Close image viewer"><X size={20} /></button>
            <button type="button" onClick={(event) => { event.stopPropagation(); showPrevious(); }} className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white transition hover:bg-white hover:text-black sm:left-8" aria-label="Previous image"><ChevronLeft size={22} /></button>
            {gallery[selectedIndex].resourceType === "video" ? <motion.video key={gallery[selectedIndex].url} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }} src={gallery[selectedIndex].url} controls autoPlay className="max-h-[88vh] max-w-[calc(100vw-5rem)] rounded-xl object-contain shadow-2xl sm:max-w-[calc(100vw-12rem)]" onClick={(event) => event.stopPropagation()} /> : <motion.img key={gallery[selectedIndex].url} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }} src={gallery[selectedIndex].url} alt="Expanded COMSATS Media Club work" className="max-h-[88vh] max-w-[calc(100vw-5rem)] rounded-xl object-contain shadow-2xl sm:max-w-[calc(100vw-12rem)]" onClick={(event) => event.stopPropagation()} />}
            <button type="button" onClick={(event) => { event.stopPropagation(); showNext(); }} className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white transition hover:bg-white hover:text-black sm:right-8" aria-label="Next image"><ChevronRight size={22} /></button>
            <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs tracking-[0.2em] text-white/45">{String(selectedIndex + 1).padStart(2, "0")} / {String(gallery.length).padStart(2, "0")}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
