"use client";
import Hero from "@/components/Hero";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  Clapperboard,
  Palette,
  PenTool,
} from "lucide-react";
import { section } from "framer-motion/m";

const creativeAreas = [
  {
    number: "01",
    title: "Photography",
    description: "Capturing moments that deserve to be remembered.",
    icon: Camera,
  },
  {
    number: "02",
    title: "Videography",
    description: "Turning experiences into visual stories.",
    icon: Clapperboard,
  },
  {
    number: "03",
    title: "Creative Design",
    description: "Giving ideas a visual identity.",
    icon: Palette,
  },
  {
    number: "04",
    title: "Digital Storytelling",
    description: "Communicating ideas through meaningful content.",
    icon: PenTool,
  },
];

const team = [
  {
    role: "President",
    name: "Syed Imad Iltaf",
    image: "/team/president.jpg",
  },
  {
    role: "Vice President",
    name: "Your Name",
    image: "/team/vice-president.jpg",
  },
  {
    role: "General Secretary",
    name: "Your Name",
    image: "/team/general-secretary.jpg",
  },
  {
    role: "Treasurer",
    name: "Your Name",
    image: "/team/treasurer.jpg",
  },
  {
    role: "Media / Communications Secretary",
    name: "Your Name",
    image: "/team/media-secretary.jpg",
  },
];

export default function Home() {
  return (
   <>
   <Hero/>
    <section className="mt-4 sm:mt-5 p-5">
        <div className="rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">

            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                Our Perspective
              </p>

              <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Every moment
                <br />
                <span className="text-white/35">has a story.</span>
              </h2>
            </div>

            <div className="max-w-2xl lg:pt-8">
              <p className="text-xl leading-relaxed text-white/75 sm:text-2xl">
                We believe every event, achievement, and moment on campus
                deserves to be seen and remembered.
              </p>

              <p className="mt-6 text-base leading-8 text-white/40">
                The COMSATS Media Club brings together creative minds to
                capture, create, and communicate the stories that shape our
                university.
              </p>

              <Link
                href="/about"
                className="group mt-8 inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
              >
                Discover the Club
                <ArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>

          </div>
        </div>
      </section>

      <section className="mt-4 sm:mt-5 p-5">
        <div className="rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 py-16 sm:px-10 lg:px-16 lg:py-24">

          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                Selected Work
              </p>

              <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                What we've been
                <br />
                <span className="text-white/35">creating.</span>
              </h2>
            </div>

            <Link
              href="/work"
              className="group hidden items-center gap-2 text-sm text-white/60 transition hover:text-white sm:flex"
            >
              View All
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>

          <div className="mt-14 grid gap-3 lg:grid-cols-[1.4fr_0.8fr]">

            <div
              className="min-h-[420px] rounded-[1.5rem] border border-white/10 bg-cover bg-center"
              style={{
                backgroundImage: "url('/work/work-1.jpg')",
              }}
            />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div
                className="min-h-[205px] rounded-[1.5rem] border border-white/10 bg-cover bg-center"
                style={{
                  backgroundImage: "url('/work/work-2.jpg')",
                }}
              />

              <div
                className="min-h-[205px] rounded-[1.5rem] border border-white/10 bg-cover bg-center"
                style={{
                  backgroundImage: "url('/work/work-3.jpg')",
                }}
              />
            </div>

          </div>

          <Link
            href="/work"
            className="group mt-6 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white sm:hidden"
          >
            View All Work
            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </section>
   </>
  );
}
