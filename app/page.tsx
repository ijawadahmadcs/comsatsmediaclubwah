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
{/* Faculty Head Vision */}
<section className=" m-6 relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0d10]">
  <div className="grid min-h-[650px] lg:grid-cols-[0.9fr_1.1fr]">

    {/* Image */}
    <motion.div
      initial={{ opacity: 0, scale: 1.05 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="relative min-h-[500px] lg:min-h-full"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/faculty-head.png')",
        }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d10] via-black/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[#0b0d10]" />

      {/* Blue glow */}
      <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-blue-600/20 blur-[120px]" />

      {/* Label */}
      <div className="absolute bottom-8 left-8">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/50">
          Faculty Head
        </p>
        <p className="mt-2 text-lg font-medium text-white">
          COMSATS Media Club
        </p>
      </div>
    </motion.div>

    {/* Content */}
    <div className="relative flex flex-col justify-center px-8 py-16 sm:px-12 lg:px-16 xl:px-20">

      {/* Small heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <span className="text-xs font-medium uppercase tracking-[0.3em] text-blue-400">
          A Message From Our Faculty Head
        </span>
      </motion.div>

      {/* Quote */}
      <motion.blockquote
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="mt-10 max-w-2xl border-l border-blue-400/50 pl-6 text-base leading-8 text-white/60 sm:text-lg"
      >
        The Media Club is an opportunity for students to bring their
        creativity, ideas, and talent forward. Take every opportunity
        to learn something new, try something different, and discover
        what you can create.

        <br />
        <br />

        You do not have to be perfect to create something meaningful.
        What matters is your effort, creativity, and willingness to
        learn. Work together, support one another, and make every
        experience memorable.
      </motion.blockquote>

      {/* Attribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-10"
      >
        <div className="h-px w-12 bg-blue-400/60" />

        <p className="mt-5 text-lg font-medium text-white">
          Dr. Faisal Shafique Butt
        </p>

        <p className="mt-1 text-sm text-white/40">
          Faculty Head, COMSATS Media Club
        </p>
      </motion.div>

      {/* Decorative quote mark */}
      <span className="pointer-events-none absolute right-8 top-8 text-[160px] font-serif leading-none text-white/[0.025] select-none">
        “
      </span>

    </div>
  </div>
</section>

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
                backgroundImage: "url('/work/work-1.jpeg')",
              }}
            />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div
                className="min-h-[205px] rounded-[1.5rem] border border-white/10 bg-cover bg-center"
                style={{
                  backgroundImage: "url('/work/work-2.jpeg')",
                }}
              />

              <div
                className="min-h-[205px] rounded-[1.5rem] border border-white/10 bg-cover bg-center"
                style={{
                  backgroundImage: "url('/work/work-3.jpeg')",
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
