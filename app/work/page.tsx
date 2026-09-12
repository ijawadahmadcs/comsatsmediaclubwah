"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";

const projects = [
  {
    title: "Campus Life",
    category: "Photography",
    year: "2026",
    image: "/work/work-2.jpeg",
    size: "large",
  },
  {
    title: "University Events",
    category: "Event Coverage",
    year: "2026",
    image: "/work/work-3.jpeg",
    size: "small",
  },
  // {
  //   title: "Creative Stories",
  //   category: "Videography",
  //   year: "2026",
  //   image: "/work/creative-stories.jpg",
  //   size: "small",
  // },
  // {
  //   title: "Visual Identity",
  //   category: "Creative Design",
  //   year: "2026",
  //   image: "/work/visual-identity.jpg",
  //   size: "medium",
  // },
  // {
  //   title: "Moments at COMSATS",
  //   category: "Photography",
  //   year: "2026",
  //   image: "/work/moments.jpg",
  //   size: "medium",
  // },
  // {
  //   title: "Behind the Scenes",
  //   category: "Digital Storytelling",
  //   year: "2026",
  //   image: "/work/behind-scenes.jpg",
  //   size: "large",
  // },
];

const categories = [
  "All",
  "Photography",
  "Videography",
  "Creative Design",
  "Event Coverage",
];

export default function WorkPage() {
  return (
    <main className="min-h-screen bg-[#08090b] px-3 py-3 text-white sm:px-5 sm:py-5">
      {/* HEADER */}
      <section className="rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 pb-16 pt-32 sm:px-10 lg:px-16 lg:pb-24 lg:pt-40">
        <div className="mx-auto max-w-7xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.3em] text-white/40"
          >
            COMSATS Media Club · Our Work
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mt-6 max-w-6xl text-5xl font-semibold leading-[0.9] tracking-tight sm:text-7xl lg:text-8xl"
          >
            Stories we've
            <br />
            <span className="text-white/30">captured.</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end"
          >
            <p className="max-w-xl text-base leading-8 text-white/45 sm:text-lg">
              A collection of moments, events, people, and ideas captured by
              the creative minds of COMSATS Media Club.
            </p>

            <p className="text-xs uppercase tracking-[0.2em] text-white/25">
              2026 — Present
            </p>
          </motion.div>
        </div>
      </section>

      {/* FILTERS */}
      <section className="mt-4 sm:mt-5">
        <div className="rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 py-7 sm:px-10 lg:px-16">
          <div className="flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <button
                key={category}
                className={`rounded-full border px-5 py-2.5 text-sm transition ${
                  index === 0
                    ? "border-white bg-white text-black"
                    : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* WORK GRID */}
      <section className="mt-4 sm:mt-5">
        <div className="rounded-[2rem] border border-white/10 bg-[#0b0d10] p-3 sm:p-5 lg:p-6">
          <div className="grid gap-3 lg:grid-cols-2">
            {projects.map((project, index) => (
              <motion.article
                key={project.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.6,
                  delay: (index % 2) * 0.08,
                }}
                className={`group relative overflow-hidden rounded-[1.5rem] border border-white/10 ${
                  project.size === "large"
                    ? "min-h-[520px]"
                    : project.size === "medium"
                      ? "min-h-[430px]"
                      : "min-h-[350px]"
                }`}
              >
                {/* IMAGE */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
                  style={{
                    backgroundImage: `url('${project.image}')`,
                  }}
                />

                {/* OVERLAYS */}
                <div className="absolute inset-0 bg-black/15 transition duration-500 group-hover:bg-black/30" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                {/* CONTENT */}
                <div className="relative z-10 flex h-full min-h-inherit flex-col justify-between p-6 sm:p-8">
                  <div className="flex items-start justify-between">
                    <span className="rounded-full border border-white/15 bg-black/20 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white/60 backdrop-blur-md">
                      {project.category}
                    </span>

                    <span className="text-xs text-white/35">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-end justify-between gap-5">
                      <div>
                        <p className="mb-2 text-xs text-white/35">
                          {project.year}
                        </p>

                        <h2 className="max-w-lg text-3xl font-medium tracking-tight sm:text-4xl">
                          {project.title}
                        </h2>
                      </div>

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md transition duration-300 group-hover:bg-white group-hover:text-black">
                        <ArrowUpRight size={18} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* STATEMENT */}
      <section className="mt-4 sm:mt-5">
        <div className="rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
          <p className="text-xs uppercase tracking-[0.3em] text-white/35">
            Our Approach
          </p>

          <h2 className="mt-6 max-w-5xl text-4xl font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            We don't simply
            <br />
            <span className="text-white/30">document moments.</span>
            <br />
            We give them meaning.
          </h2>

          <div className="mt-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <p className="max-w-2xl text-base leading-8 text-white/40 sm:text-lg">
              From the energy of university events to the quiet moments
              between them, our work is about creating a visual memory of
              campus life.
            </p>

            <Link
              href="/join"
              className="group inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90"
            >
              Create With Us
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </section>

      <div className="h-4 sm:h-5" />
    </main>
  );
}