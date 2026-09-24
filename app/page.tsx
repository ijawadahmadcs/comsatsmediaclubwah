"use client";
import Hero from "@/components/Hero";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  Clapperboard,
  Palette,
  PenTool,
} from "lucide-react";

type CoreMember = {
  _id: string;
  name: string;
  role: string;
  contactNumber?: string;
  image?: string;
};

const coreRoles = [
  "president",
  "vice president",
  "general secretary",
  "treasurer",
  "media/communications secretary",
];

function normalizeRole(role: string) {
  return role.trim().toLowerCase().replace(/\s*\/\s*/g, "/");
}

export default function Home() {
  const [coreMembers, setCoreMembers] = useState<CoreMember[]>([]);

  useEffect(() => {
    fetch("/api/team")
      .then(async (response) => {
        const result = await response.json();
        if (response.ok && result.success) {
          setCoreMembers(
            result.members
              .filter((member: CoreMember) => coreRoles.includes(normalizeRole(member.role)))
              .filter((member: CoreMember) => normalizeRole(member.role) !== "president")
              .sort((a: CoreMember, b: CoreMember) => coreRoles.indexOf(normalizeRole(a.role)) - coreRoles.indexOf(normalizeRole(b.role))),
          );
        }
      })
      .catch(() => undefined);
  }, []);

  return (
    <>
      <Hero />
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
              creativity, ideas, and talent forward. Take every opportunity to
              learn something new, try something different, and discover what
              you can create.
              <br />
              You do not have to be perfect to create something meaningful. What
              matters is your effort, creativity, and willingness to learn. Work
              together, support one another, and make every experience
              memorable.
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

      {/* President Vision */}
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
                backgroundImage: "url('/president.jpeg')",
              }}
            />

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d10] via-black/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[#0b0d10]" />

            {/* Blue glow */}
            <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-blue-600/20 blur-[120px]" />
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
                A Message From Our President
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
              I believe media is not just about capturing moments-it is about
              telling stories, expressing ideas, and creating an identity for
              our community. As a club, our goal is to provide students with a
              platform where creativity meets opportunity. From photography and
              videography to graphic design, content creation, and event
              coverage, we want to encourage everyone to explore their talents
              and turn their ideas into meaningful work.
              <br />
              Together, we aim to build a Media Club that is creative, active,
              and open to everyone. I look forward to working with our team and
              fellow students to make this journey memorable and impactful.
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
                Syed Imad Iltaf
              </p>

              <p className="mt-1 text-sm text-white/40">
                President, COMSATS Media Club
              </p>
            </motion.div>

            {/* Decorative quote mark */}
            <span className="pointer-events-none absolute right-8 top-8 text-[160px] font-serif leading-none text-white/[0.025] select-none">
              “
            </span>
          </div>
        </div>
      </section>

      {/* Core Team Preview */}
      <section className="m-6 rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 py-12 sm:px-10 lg:px-16 lg:py-16">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/35">The Core Team</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">The people beside the vision.</h2>
          </div>
          <Link href="/team" className="group inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm text-white/70 transition hover:border-white/40 hover:bg-white/10 hover:text-white">
            Meet the team
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {coreMembers.length === 0 ? (
            <p className="text-sm text-white/35">Loading the core team...</p>
          ) : (
            coreMembers.map((member) => (
              <div key={member._id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/[0.07]">
                  {member.image ? <img src={member.image} alt={member.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-white/35">{member.name.charAt(0)}</div>}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white/85">{member.name}</p>
                  <p className="mt-1 truncate text-[10px] uppercase tracking-[0.14em] text-blue-200/60">{member.role}</p>
                  <p className="mt-2 truncate text-xs text-white/35">{member.contactNumber || "Media Club core team"}</p>
                </div>
              </div>
            ))
          )}
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

            <Link href="/work" className="group hidden items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm text-white/70 transition hover:border-white/40 hover:bg-white/10 hover:text-white sm:inline-flex">
              View all work
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
                backgroundImage: "url('/work/work-5.jpg')",
              }}
            />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div
                className="min-h-[205px] rounded-[1.5rem] border border-white/10 bg-cover bg-center"
                style={{
                  backgroundImage: "url('/work/work-3.jpeg')",
                }}
              />

              <div
                className="min-h-[205px] rounded-[1.5rem] border border-white/10 bg-cover bg-center"
                style={{
                  backgroundImage: "url('/work/work-8.jpg')",
                }}
              />
            </div>
          </div>

          <Link href="/work" className="group mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm text-white/70 transition hover:border-white/40 hover:bg-white/10 hover:text-white sm:hidden">
            View all work
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
