"use client";
import Hero from "@/components/Hero";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { coreRoleRank, normalizeRole } from "@/lib/teamRoles";

type CoreMember = {
  _id: string;
  name: string;
  role: string;
  group: "core" | "lead" | "member";
  contactNumber?: string;
  image?: string;
};

type RecognitionWinner = {
  memberId: string;
  name: string;
  role: string;
  image?: string;
  attendedEvents: number;
  assignedEvents: number;
  averageRating: number;
  score: number;
};

const localWorkAssets = [
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
].map((url) => ({ url, resourceType: "image" as const }));

type HomeWorkAsset = { url: string; resourceType: "image" };

function randomWorkSelection(assets: HomeWorkAsset[]) {
  return [...assets].sort(() => Math.random() - 0.5).slice(0, 3);
}

export default function Home() {
  const [coreMembers, setCoreMembers] = useState<CoreMember[]>([]);
  const [advisor, setAdvisor] = useState<CoreMember | null>(null);
  const [coreTeamStatus, setCoreTeamStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [recognition, setRecognition] = useState<{
    week: RecognitionWinner | null;
    month: RecognitionWinner | null;
  } | null>(null);
  const [selectedWork, setSelectedWork] = useState<HomeWorkAsset[]>(() =>
    randomWorkSelection(localWorkAssets),
  );

  useEffect(() => {
    fetch("/api/team")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message);
        const members = result.members as CoreMember[];
        setAdvisor(
          members.find((member) => normalizeRole(member.role).includes("advisor")) ?? null,
        );
        setCoreMembers(
          members
            .filter(
              (member) =>
                member.group === "core" &&
                normalizeRole(member.role) !== "president",
            )
            .sort((a, b) => coreRoleRank(a.role) - coreRoleRank(b.role)),
        );
        setCoreTeamStatus("ready");
      })
      .catch(() => setCoreTeamStatus("error"));
  }, []);

  useEffect(() => {
    let availableWork = localWorkAssets;
    const rotateSelection = () => setSelectedWork(randomWorkSelection(availableWork));
    fetch("/api/work")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) return;
        const uploadedImages = (result.assets as HomeWorkAsset[]).filter((asset) => asset.resourceType === "image");
        availableWork = [...localWorkAssets, ...uploadedImages];
        rotateSelection();
      })
      .catch(() => undefined);
    const timer = window.setInterval(rotateSelection, 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("/api/recognition")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message);
        setRecognition(result);
      })
      .catch(() => setRecognition({ week: null, month: null }));
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
            <Image
              src="/faculty-head.png"
              alt="Dr. Faisal Shafique Butt, Faculty Head of the COMSATS Media Club"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover object-center"
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


      <section className="m-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0d10]">
        <div className="grid min-h-[360px] lg:grid-cols-[0.65fr_1.35fr]">
          <div className="relative min-h-[280px] bg-white/[0.03]">
            {advisor?.image ? (
              <Image
                src={advisor.image}
                alt={advisor.name}
                fill
                sizes="(min-width: 1024px) 30vw, 100vw"
                unoptimized
                className="object-cover object-center"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-7xl font-semibold text-white/10">{advisor?.name?.charAt(0) || "A"}</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d10] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#0b0d10]" />
          </div>
          <div className="flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-16">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-amber-200/65">Our Advisor</p>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">Guidance behind the work.</h2>
            {advisor ? (
              <><p className="mt-6 text-xl font-medium text-white/90">{advisor.name}</p><p className="mt-2 text-sm uppercase tracking-[0.16em] text-white/40">{advisor.role}</p></>
            ) : <p className="mt-6 max-w-lg text-sm leading-6 text-white/45">Our advisor will be introduced here soon.</p>}
            <div className="mt-8 h-px w-12 bg-amber-200/60" />
          </div>
        </div>
      </section>

      <section className="m-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0d10]">
        <div className="grid min-h-[360px] lg:grid-cols-[0.65fr_1.35fr]">
          <div className="relative min-h-[280px] bg-white/[0.03]">
            <Image
              src="/president.jpeg"
              alt="Syed Imad Iltaf, President of the COMSATS Media Club"
              fill
              sizes="(min-width: 1024px) 30vw, 100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d10] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#0b0d10]" />
          </div>
          <div className="flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-16">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-blue-400">Our President</p>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">Leading with purpose.</h2>
            <p className="mt-6 text-xl font-medium text-white/90">Syed Imad Iltaf</p>
            <p className="mt-2 text-sm uppercase tracking-[0.16em] text-white/40">President, COMSATS Media Club</p>
            <div className="mt-8 h-px w-12 bg-blue-400/60" />
          </div>
        </div>
      </section>

      {/* Core Team Preview */}
      <section className="m-6 rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 py-12 sm:px-10 lg:px-16 lg:py-16">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/35">
              The Core Team
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              The people beside the vision.
            </h2>
          </div>
          <Link
            href="/team"
            className="group inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm text-white/70 transition hover:border-white/40 hover:bg-white/10 hover:text-white"
          >
            Meet the team
            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {coreTeamStatus === "loading" ? (
            <p className="text-sm text-white/35">Loading the core team...</p>
          ) : coreTeamStatus === "error" ? (
            <p className="text-sm text-white/35">
              The core team could not be loaded right now.
            </p>
          ) : coreMembers.length === 0 ? (
            <p className="text-sm text-white/35">
              The core team will be announced soon.
            </p>
          ) : (
            coreMembers.map((member) => (
              <div
                key={member._id}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/[0.07]">
                  {member.image ? (
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      sizes="56px"
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-white/35">
                      {member.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white/85">
                    {member.name}
                  </p>
                  <p className="mt-1 truncate text-[10px] uppercase tracking-[0.14em] text-blue-200/60">
                    {member.role}
                  </p>
                 
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="m-6 rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 py-12 sm:px-10 lg:px-16 lg:py-16">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-blue-200/60">
              Recognition
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Members who showed up.
            </h2>
          </div>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          <RecognitionCard
            label="Member of the week"
            winner={recognition?.week}
          />
          <RecognitionCard
            label="Member of the month"
            winner={recognition?.month}
          />
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
                What we&apos;ve been
                <br />
                <span className="text-white/35">creating.</span>
              </h2>
            </div>

            <Link
              href="/work"
              className="group hidden items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm text-white/70 transition hover:border-white/40 hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              View all work
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>

          <div className="mt-14 grid gap-3 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="relative min-h-[420px] overflow-hidden rounded-[1.5rem] border border-white/10">
              <Image
                src={selectedWork[0]?.url || localWorkAssets[0].url}
                alt="Selected work by the COMSATS Media Club"
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                unoptimized={!selectedWork[0]?.url.startsWith("/")}
                className="object-cover"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="relative min-h-[205px] overflow-hidden rounded-[1.5rem] border border-white/10">
                <Image
                  src={selectedWork[1]?.url || localWorkAssets[1].url}
                  alt="Selected work by the COMSATS Media Club"
                  fill
                  sizes="(min-width: 1024px) 35vw, (min-width: 640px) 50vw, 100vw"
                  unoptimized={!selectedWork[1]?.url.startsWith("/")}
                  className="object-cover"
                />
              </div>

              <div className="relative min-h-[205px] overflow-hidden rounded-[1.5rem] border border-white/10">
                <Image
                  src={selectedWork[2]?.url || localWorkAssets[2].url}
                  alt="Selected work by the COMSATS Media Club"
                  fill
                  sizes="(min-width: 1024px) 35vw, (min-width: 640px) 50vw, 100vw"
                  unoptimized={!selectedWork[2]?.url.startsWith("/")}
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <Link
            href="/work"
            className="group mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm text-white/70 transition hover:border-white/40 hover:bg-white/10 hover:text-white sm:hidden"
          >
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

function RecognitionCard({
  label,
  winner,
}: {
  label: string;
  winner: RecognitionWinner | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-amber-200/15 bg-amber-200/[0.04] p-5 sm:p-6">
      <p className="text-xs uppercase tracking-[0.22em] text-amber-200/65">
        {label}
      </p>
      {winner ? (
        <div className="mt-6 flex items-center gap-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-amber-200/10 text-xl font-semibold text-amber-100">
            {winner.image ? (
              <Image
                src={winner.image}
                alt={winner.name}
                fill
                sizes="64px"
                unoptimized
                className="object-cover"
              />
            ) : (
              winner.name.charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-medium text-white">
              {winner.name}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-6 text-sm text-white/40">Revealing soon...</p>
      )}
    </div>
  );
}
