"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Camera,
  Clapperboard,
  Palette,
  MessageCircle,
  ArrowRight,
  ArrowDown,
  Check,
} from "lucide-react";

const focusAreas = [
  {
    icon: Camera,
    number: "01",
    title: "Photography",
    description:
      "Capturing the people, moments, and experiences that define life at COMSATS.",
  },
  {
    icon: Clapperboard,
    number: "02",
    title: "Videography",
    description:
      "Turning university events and everyday moments into meaningful visual stories.",
  },
  {
    icon: Palette,
    number: "03",
    title: "Creative Design",
    description:
      "Creating graphics and visual content that communicate ideas with impact.",
  },
  {
    icon: MessageCircle,
    number: "04",
    title: "Communication",
    description:
      "Connecting students, ideas, and the university community through media.",
  },
];

const objectives = [
  "Promote responsible and ethical media practices.",
  "Develop students' creative and technical abilities.",
  "Cover and promote university activities and achievements.",
  "Encourage teamwork, leadership, and collaboration.",
  "Provide opportunities for students to showcase their talent.",
  "Create meaningful content across social media, publications, events, and multimedia platforms.",
];

const expectations = [
  "Learn new skills",
  "Gain practical experience",
  "Work on university events",
  "Build a creative portfolio",
  "Meet like-minded people",
  "Contribute to COMSATS",
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#08090b] px-3 py-3 text-white sm:px-5 sm:py-5">

      <section className="relative min-h-[85vh] overflow-hidden rounded-[2rem] border border-white/10">

        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/about-hero.jpg')",
          }}
        />

        {/* Dark cinematic overlay */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Left gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/10" />

        {/* Bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

        {/* Content */}
        <div className="relative z-10 flex min-h-[85vh] items-end">

          <div className="w-full max-w-7xl px-6 pb-12 sm:px-10 sm:pb-16 lg:px-16 lg:pb-20">

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="mb-5 text-xs uppercase tracking-[0.3em] text-white/60 sm:text-sm"
            >
              About the Media Club
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="max-w-5xl text-5xl font-semibold leading-[0.9] tracking-tight sm:text-7xl lg:text-8xl"
            >
              More than
              <br />
              <span className="text-white/55">
                a club.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mt-7 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg"
            >
              We don't just represent a society.
              We represent COMSATS as a whole — its people,
              its achievements, its creativity, and its stories.
            </motion.p>

          </div>
        </div>

        {/* Scroll */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 right-8 hidden items-center gap-3 text-xs uppercase tracking-[0.2em] text-white/50 sm:flex"
        >
          Discover our story

          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20">
            <ArrowDown size={14} />
          </div>
        </motion.div>

      </section>


      <section className="mt-4 sm:mt-5">

        <div className="rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 py-16 sm:px-10 lg:px-16 lg:py-24">

          <div className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr]">

            {/* Left */}
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                Who We Are
              </p>

              <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
                A platform for
                <br />
                <span className="text-white/35">
                  creative minds.
                </span>
              </h2>
            </div>

            {/* Right */}
            <div className="max-w-3xl">

              <p className="text-xl leading-relaxed text-white/80 sm:text-2xl">
                The COMSATS Media Club is a creative platform where students
                come together to learn, create, collaborate, and tell stories.
              </p>

              <p className="mt-7 text-base leading-8 text-white/45">
                From photography and videography to graphic design,
                communication, content creation, and digital storytelling,
                the club gives students the opportunity to develop both
                creative and technical skills.
              </p>

              <p className="mt-5 text-base leading-8 text-white/45">
                Every event has a story. Every achievement has a moment worth
                remembering. Our role is to capture those moments and present
                the identity of COMSATS through meaningful and responsible
                media.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          WHAT WE DO
      ===================================================== */}

       {/* What We Do */}
      <section className="border-y border-white/10 bg-white/[0.015] px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              What We Do
            </p>

            <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <h2 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Creating, capturing,
                <br />
                <span className="text-white/40">and communicating.</span>
              </h2>

              <p className="max-w-md text-sm leading-7 text-white/50">
                From a camera behind an event to the design behind a campaign,
                we bring different creative disciplines together.
              </p>
            </div>
          </motion.div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {focusAreas.map((area, index) => {
              const Icon = area.icon;

              return (
                <motion.div
                  key={area.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.08,
                  }}
                  className="group bg-[#0b0d10] p-7 transition-colors duration-300 hover:bg-white/[0.06] sm:p-8"
                >
                  <Icon
                    size={24}
                    strokeWidth={1.5}
                    className="mb-12 text-white/60 transition-colors group-hover:text-white"
                  />

                  <h3 className="text-lg font-medium">
                    {area.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-white/45">
                    {area.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

        </div>
      </section>

      {/* =====================================================
          OUR PURPOSE
      ===================================================== */}

      <section className="mt-4 sm:mt-5">

        <div className="rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 py-16 sm:px-10 lg:px-16 lg:py-24">

          <div className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr]">

            <div>

              <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                03 — Our Purpose
              </p>

              <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
                Why
                <br />
                <span className="text-white/35">
                  we exist.
                </span>
              </h2>

              <p className="mt-7 max-w-sm text-sm leading-7 text-white/40">
                Our purpose goes beyond creating content. We want to develop
                responsible creators who can contribute to the university
                community through media.
              </p>

            </div>


            {/* Objectives */}
            <div className="border-t border-white/10">

              {objectives.map((objective, index) => (
                <motion.div
                  key={objective}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.05,
                  }}
                  className="flex gap-6 border-b border-white/10 py-6"
                >

                  <span className="text-xs text-white/25">
                    0{index + 1}
                  </span>

                  <p className="text-base leading-7 text-white/65 sm:text-lg">
                    {objective}
                  </p>

                </motion.div>
              ))}

            </div>

          </div>

        </div>

      </section>

       {/* WHY JOIN */}
      <section className="mt-4 sm:mt-5">
        <div className="rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 py-16 sm:px-10 lg:px-16 lg:py-24">

          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">

            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/35">
                Why Join
              </p>

              <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                More than
                <br />
                <span className="text-white/30">
                  a society.
                </span>
              </h2>
            </div>

            <div className="max-w-2xl lg:pt-8">

              <p className="text-xl leading-relaxed text-white/70 sm:text-2xl">
                The Media Club is a place to create, learn, collaborate,
                and represent COMSATS through meaningful media.
              </p>

              <p className="mt-6 text-base leading-8 text-white/40">
                You don't need to be an expert. Whether you're already
                experienced or simply curious about media, there's room
                for you to learn and contribute.
              </p>

              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                {expectations.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10">
                      <Check size={13} className="text-white/50" />
                    </div>

                    <span className="text-sm text-white/55">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </section>





      {/* Bottom spacing */}
      <div className="h-4 sm:h-5" />

    </main>
  );
}