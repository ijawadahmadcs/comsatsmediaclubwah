"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";

const coreTeam = [
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

const generalMembers = [
  {
    name: "Member Name",
    role: "General Member",
    image: "/team/member-01.jpg",
  },
  {
    name: "Member Name",
    role: "General Member",
    image: "/team/member-02.jpg",
  },
  {
    name: "Member Name",
    role: "General Member",
    image: "/team/member-03.jpg",
  },
  {
    name: "Member Name",
    role: "General Member",
    image: "/team/member-04.jpg",
  },
  {
    name: "Member Name",
    role: "General Member",
    image: "/team/member-05.jpg",
  },
  {
    name: "Member Name",
    role: "General Member",
    image: "/team/member-06.jpg",
  },
  {
    name: "Member Name",
    role: "General Member",
    image: "/team/member-07.jpg",
  },
  {
    name: "Member Name",
    role: "General Member",
    image: "/team/member-08.jpg",
  },
  {
    name: "Member Name",
    role: "General Member",
    image: "/team/member-09.jpg",
  },
  {
    name: "Member Name",
    role: "General Member",
    image: "/team/member-10.jpg",
  },
];

export default function TeamPage() {
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
            COMSATS Media Club · The Team
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mt-6 max-w-6xl text-5xl font-semibold leading-[0.9] tracking-tight sm:text-7xl lg:text-8xl"
          >
            The people
            <br />
            <span className="text-white/30">behind the vision.</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end"
          >
            <p className="max-w-2xl text-base leading-8 text-white/45 sm:text-lg">
              A team of creators, storytellers, and communicators working
              together to represent the visual identity of COMSATS.
            </p>

            <p className="text-xs uppercase tracking-[0.2em] text-white/25">
              15 Members · 2026
            </p>
          </motion.div>

        </div>
      </section>


      {/* CORE TEAM */}
      <section className="mt-4 sm:mt-5">
        <div className="rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 py-16 sm:px-10 lg:px-16 lg:py-24">

          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/35">
                01 — Core Team
              </p>

              <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Leading the
                <br />
                <span className="text-white/30">creative direction.</span>
              </h2>
            </div>

            <p className="max-w-md text-sm leading-7 text-white/40">
              Five members responsible for leading, coordinating, and shaping
              the vision of the Media Club.
            </p>
          </div>


          {/* PRESIDENT */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="group relative mt-14 min-h-[550px] overflow-hidden rounded-[1.75rem] border border-white/10"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
              style={{
                backgroundImage: `url('${coreTeam[0].image}')`,
              }}
            />

            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

            <div className="relative z-10 flex min-h-[550px] flex-col justify-between p-7 sm:p-10">

              <div className="flex justify-between">
                <span className="rounded-full border border-white/15 bg-black/20 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white/60 backdrop-blur-md">
                  Core Team
                </span>

                <span className="text-xs text-white/30">
                  01
                </span>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                  {coreTeam[0].role}
                </p>

                <h3 className="mt-2 text-4xl font-medium tracking-tight sm:text-5xl lg:text-6xl">
                  {coreTeam[0].name}
                </h3>
              </div>

            </div>
          </motion.div>


          {/* OTHER CORE MEMBERS */}
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {coreTeam.slice(1).map((member, index) => (
              <motion.div
                key={member.role}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.08,
                }}
                className="group"
              >

                <div className="aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03]">

                  <div
                    className="h-full w-full bg-cover bg-center grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0"
                    style={{
                      backgroundImage: `url('${member.image}')`,
                    }}
                  />

                </div>

                <div className="flex items-start justify-between gap-3 pt-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                      {member.role}
                    </p>

                    <h3 className="mt-1 text-sm font-medium text-white/80">
                      {member.name}
                    </h3>
                  </div>

                  <ArrowUpRight
                    size={15}
                    className="mt-1 text-white/20 transition group-hover:text-white"
                  />
                </div>

              </motion.div>
            ))}
          </div>

        </div>
      </section>


      {/* GENERAL MEMBERS */}
      <section className="mt-4 sm:mt-5">
        <div className="rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 py-16 sm:px-10 lg:px-16 lg:py-24">

          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/35">
                02 — General Members
              </p>

              <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                The creative
                <br />
                <span className="text-white/30">collective.</span>
              </h2>
            </div>

            <p className="max-w-md text-sm leading-7 text-white/40">
              The creators behind the camera, the designs, the edits, and the
              stories that bring the club to life.
            </p>
          </div>


          <div className="mt-14 grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
            {generalMembers.map((member, index) => (
              <motion.div
                key={`${member.name}-${index}`}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.45,
                  delay: (index % 5) * 0.06,
                }}
                className="group"
              >

                <div className="aspect-[4/5] overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/[0.03]">

                  <div
                    className="h-full w-full bg-cover bg-center grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0"
                    style={{
                      backgroundImage: `url('${member.image}')`,
                    }}
                  />

                </div>

                <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-white/30">
                  {member.role}
                </p>

                <h3 className="mt-1 text-sm font-medium text-white/75">
                  {member.name}
                </h3>

              </motion.div>
            ))}
          </div>

        </div>
      </section>


      {/* TEAM STATEMENT */}
      <section className="mt-4 sm:mt-5">
        <div className="rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 py-20 sm:px-10 lg:px-16 lg:py-28">

          <p className="text-xs uppercase tracking-[0.3em] text-white/35">
            03 — One Team
          </p>

          <h2 className="mt-6 max-w-5xl text-4xl font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            Different skills.
            <br />
            <span className="text-white/30">
              One creative vision.
            </span>
          </h2>

          <div className="mt-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">

            <p className="max-w-2xl text-base leading-8 text-white/40 sm:text-lg">
              From photography and videography to design, editing, and
              storytelling, every member contributes to how COMSATS is seen
              and remembered.
            </p>

            <Link
              href="/join"
              className="group inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90"
            >
              Join the Team
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