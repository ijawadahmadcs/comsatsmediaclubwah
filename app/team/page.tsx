"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

type TeamMember = {
  _id: string;
  name: string;
  role: string;
  registrationNumber?: string;
  contactNumber?: string;
  areaOfInterest?: string;
  image?: string;
  order: number;
};

type AcceptedApplicant = {
  _id: string;
  fullName: string;
  registrationNumber: string;
  areaOfInterest?: string;
  image?: string;
};

const coreRoles = [
  "president",
  "vice president",
  "general secretary",
  "treasurer",
  "media/communications secretary",
];

const leadRoles = [
  "videographylead",
  "videoeditinglead",
  "photographylead",
  "graphicslead",
  "contentcreationlead",
];

function normalizeRole(role: string) {
  return role
    .trim()
    .toLowerCase()
    .replace(/\s*\/\s*/g, "/");
}

function isCoreMember(member: TeamMember) {
  return coreRoles.includes(normalizeRole(member.role));
}

function isLeadMember(member: TeamMember) {
  return leadRoles.includes(normalizeRole(member.role).replace(/\s+/g, ""));
}

function MemberImage({ member }: { member: TeamMember }) {
  if (!member.image) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white/[0.06] text-5xl font-semibold text-white/25">
        {member.name.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <div
      className="h-full w-full bg-cover bg-center"
      style={{ backgroundImage: `url('${member.image}')` }}
      role="img"
      aria-label={member.name}
    />
  );
}

function ApplicantImage({ applicant }: { applicant: AcceptedApplicant }) {
  if (!applicant.image) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white/[0.07] text-lg font-semibold text-white/35">
        {applicant.fullName.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <div
      className="h-full w-full bg-cover bg-center"
      style={{ backgroundImage: `url('${applicant.image}')` }}
      role="img"
      aria-label={applicant.fullName}
    />
  );
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [acceptedApplicants, setAcceptedApplicants] = useState<
    AcceptedApplicant[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInterest, setSelectedInterest] = useState("All");

  useEffect(() => {
    async function loadTeam() {
      try {
        const response = await fetch("/api/team");
        const result = await response.json();
        if (!response.ok || !result.success)
          throw new Error(result.message || "Unable to load team members.");
        setMembers(result.members);
        setAcceptedApplicants(result.acceptedApplicants || []);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load team members.",
        );
      } finally {
        setIsLoading(false);
      }
    }
    void loadTeam();
  }, []);

  const coreMembers = members
    .filter(isCoreMember)
    .sort(
      (a, b) =>
        coreRoles.indexOf(normalizeRole(a.role)) -
        coreRoles.indexOf(normalizeRole(b.role)),
    );
  const leadMembers = members
    .filter(isLeadMember)
    .sort((a, b) => a.order - b.order);
  const coreOrLeadRegistrationNumbers = new Set(
    members
      .filter((member) => isCoreMember(member) || isLeadMember(member))
      .map((member) => member.registrationNumber?.trim().toLowerCase())
      .filter(Boolean),
  );
  const generalMembers = acceptedApplicants.filter(
    (applicant) =>
      applicant.fullName.trim().length > 0 &&
      !coreOrLeadRegistrationNumbers.has(applicant.registrationNumber?.trim().toLowerCase()),
  );
  const interests = [
    "All",
    ...Array.from(
      new Set(
        generalMembers
          .map((member) => member.areaOfInterest)
          .filter(Boolean) as string[],
      ),
    ),
  ];
  const filteredGeneralMembers =
    selectedInterest === "All"
      ? generalMembers
      : generalMembers.filter(
          (member) => member.areaOfInterest === selectedInterest,
        );

  return (
    <main className="min-h-screen bg-[#08090b] px-3 py-3 text-white sm:px-5 sm:py-5">
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
          <p className="mt-10 max-w-2xl text-base leading-8 text-white/45 sm:text-lg">
            Meet the people creating, communicating, and shaping the visual
            identity of COMSATS.
          </p>
        </div>
      </section>

      {isLoading && (
        <section className="mt-4 rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 py-20 text-center text-sm text-white/40 sm:mt-5">
          Loading the team...
        </section>
      )}
      {!isLoading && error && (
        <section className="mt-4 rounded-[2rem] border border-red-400/20 bg-[#0b0d10] px-6 py-20 text-center text-sm text-red-200 sm:mt-5">
          {error}
        </section>
      )}

      {!isLoading && !error && (
        <>
          <section className="mt-4 sm:mt-5">
            <div className="rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
              <p className="text-xs uppercase tracking-[0.3em] text-white/35">
                Core Members
              </p>
              <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                  Leading the
                  <br />
                  <span className="text-white/30">creative direction.</span>
                </h2>
                <p className="max-w-md text-sm leading-7 text-white/40"></p>
              </div>
              {coreMembers.length === 0 ? (
                <p className="mt-12 text-sm text-white/40"></p>
              ) : (
                <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {coreMembers.slice(0, 5).map((member, index) => (
                    <motion.article
                      key={member._id}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45, delay: index * 0.06 }}
                      className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
                    >
                      <div className="aspect-[4/5] overflow-hidden">
                        <MemberImage member={member} />
                      </div>
                      <div className="p-4">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-blue-200/65">
                          {member.role}
                        </p>
                        <h3 className="mt-2 text-lg font-medium text-white/90">
                          {member.name}
                        </h3>
                        <p className="mt-3 text-xs text-white/45">
                          {member.contactNumber || "Contact not available"}
                        </p>
                      </div>
                    </motion.article>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="mt-4 sm:mt-5">
            <div className="rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 py-12 sm:px-10 lg:px-16 lg:py-16">
              <p className="text-xs uppercase tracking-[0.3em] text-white/35">
                Team Leads
              </p>
              {leadMembers.length === 0 ? (
                <p className="mt-8 text-sm text-white/40">
                  Team leads will appear here after they are added.
                </p>
              ) : (
                <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {leadMembers.slice(0, 5).map((member, index) => (
                    <motion.article
                      key={member._id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-3 transition hover:border-blue-200/30 hover:bg-blue-200/[0.05]"
                    >                   
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#101216] sm:h-24 sm:w-24">
                        <MemberImage member={member} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="mt-1 truncate text-base font-medium text-white/90">
                          {member.name}
                        </h3>
                        <p className="mt-2 text-[10px] uppercase leading-4 tracking-[0.12em] text-white/45">
                          {member.role}
                        </p>
                      </div>
                    </motion.article>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="mt-4 sm:mt-5">
            <div className="rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
              <p className="text-xs uppercase tracking-[0.3em] text-white/35">
                Members
              </p>
              <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <p className="max-w-md text-sm leading-7 text-white/40"></p>
              </div>
              {generalMembers.length > 0 && (
                <div
                  className="mt-8 flex flex-wrap gap-2"
                  role="group"
                  aria-label="Filter general members by interest"
                >
                  {interests.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => setSelectedInterest(interest)}
                      className={`rounded-full border px-4 py-2 text-xs transition ${selectedInterest === interest ? "border-white bg-white text-black" : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/25 hover:text-white"}`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              )}
              {filteredGeneralMembers.length === 0 ? (
                <p className="mt-12 text-sm text-white/40">
                  No members found for this interest.
                </p>
              ) : (
                <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {filteredGeneralMembers.map((member, index) => (
                    <motion.article
                      key={member._id}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: (index % 5) * 0.05 }}
                      className="rounded-xl border border-white/10 bg-white/[0.025] p-4"
                    >
                      <div className="h-12 w-12 overflow-hidden rounded-lg bg-white/[0.07]">
                        <ApplicantImage applicant={member} />
                      </div>
                      <h3 className="mt-4 truncate text-sm font-medium text-white/85">
                        {member.fullName}
                      </h3>
                      <p className="mt-2 text-xs leading-5 text-blue-200/60">
                        {member.areaOfInterest || "Media Club Member"}
                      </p>
                    </motion.article>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* <section className="mt-4 sm:mt-5">
            <div className="rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
              <p className="text-xs uppercase tracking-[0.3em] text-white/35">
                03 - One Team
              </p>
              <h2 className="mt-6 max-w-5xl text-4xl font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                Different skills.
                <br />
                <span className="text-white/30">One creative vision.</span>
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
          </section> */}
          <div className="h-4 sm:h-5" />
        </>
      )}
    </main>
  );
}
