"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";

type TeamMember = {
  _id: string;
  name: string;
  role: string;
  image?: string;
  order: number;
};

const coreRoles = ["president", "vice president", "general secretary", "treasurer", "media / communications secretary"];

function isCoreMember(member: TeamMember) {
  return coreRoles.includes(member.role.trim().toLowerCase());
}

function MemberImage({ member, className }: { member: TeamMember; className: string }) {
  if (!member.image) {
    return <div className={`${className} flex items-center justify-center bg-white/[0.06] text-4xl font-semibold text-white/30`}>{member.name.charAt(0).toUpperCase()}</div>;
  }
  return <div className={`${className} bg-cover bg-center`} style={{ backgroundImage: `url('${member.image}')` }} role="img" aria-label={member.name} />;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMembers() {
      try {
        const response = await fetch("/api/team");
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Unable to load team members.");
        setMembers(result.members);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load team members.");
      } finally {
        setIsLoading(false);
      }
    }
    loadMembers();
  }, []);

  const coreTeam = members.filter(isCoreMember);
  const president = coreTeam.find((member) => member.role.trim().toLowerCase() === "president");
  const otherCoreMembers = coreTeam.filter((member) => member !== president);
  const generalMembers = members.filter((member) => !isCoreMember(member));

  return (
    <main className="min-h-screen bg-[#08090b] px-3 py-3 text-white sm:px-5 sm:py-5">
      <section className="rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 pb-16 pt-32 sm:px-10 lg:px-16 lg:pb-24 lg:pt-40">
        <div className="mx-auto max-w-7xl">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-xs uppercase tracking-[0.3em] text-white/40">COMSATS Media Club · The Team</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 35 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="mt-6 max-w-6xl text-5xl font-semibold leading-[0.9] tracking-tight sm:text-7xl lg:text-8xl">The people<br /><span className="text-white/30">behind the vision.</span></motion.h1>
          <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }} className="mt-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <p className="max-w-2xl text-base leading-8 text-white/45 sm:text-lg">A team of creators, storytellers, and communicators working together to represent the visual identity of COMSATS.</p>
            <p className="text-xs uppercase tracking-[0.2em] text-white/25">{members.length} Members · 2026</p>
          </motion.div>
        </div>
      </section>

      {isLoading && <section className="mt-4 rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 py-20 text-center text-sm text-white/40 sm:mt-5">Loading the team...</section>}
      {!isLoading && error && <section className="mt-4 rounded-[2rem] border border-red-400/20 bg-[#0b0d10] px-6 py-20 text-center text-sm text-red-200 sm:mt-5">{error}</section>}
      {!isLoading && !error && members.length === 0 && <section className="mt-4 rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 py-20 text-center sm:mt-5"><p className="text-sm text-white/45">No team members yet.</p><Link href="/join" className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90">Join the Team</Link></section>}

      {!isLoading && !error && members.length > 0 && <>
        <section className="mt-4 sm:mt-5"><div className="rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><p className="text-xs uppercase tracking-[0.3em] text-white/35">01 — Core Team</p><h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">Leading the<br /><span className="text-white/30">creative direction.</span></h2></div><p className="max-w-md text-sm leading-7 text-white/40">Members responsible for leading, coordinating, and shaping the vision of the Media Club.</p></div>
          {president && <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="group relative mt-14 min-h-[550px] overflow-hidden rounded-[1.75rem] border border-white/10"><MemberImage member={president} className="absolute inset-0 transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-black/20" /><div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" /><div className="relative z-10 flex min-h-[550px] flex-col justify-between p-7 sm:p-10"><div className="flex justify-between"><span className="rounded-full border border-white/15 bg-black/20 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white/60 backdrop-blur-md">Core Team</span><span className="text-xs text-white/30">01</span></div><div><p className="text-xs uppercase tracking-[0.2em] text-white/40">{president.role}</p><h3 className="mt-2 text-4xl font-medium tracking-tight sm:text-5xl lg:text-6xl">{president.name}</h3></div></div></motion.div>}
          {otherCoreMembers.length > 0 && <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{otherCoreMembers.map((member, index) => <motion.div key={member._id} initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.08 }} className="group"><div className="aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03]"><MemberImage member={member} className="h-full w-full grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0" /></div><div className="flex items-start justify-between gap-3 pt-4"><div><p className="text-[10px] uppercase tracking-[0.2em] text-white/35">{member.role}</p><h3 className="mt-1 text-sm font-medium text-white/80">{member.name}</h3></div><ArrowUpRight size={15} className="mt-1 text-white/20 transition group-hover:text-white" /></div></motion.div>)}</div>}
        </div></section>

        {generalMembers.length > 0 && <section className="mt-4 sm:mt-5"><div className="rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 py-16 sm:px-10 lg:px-16 lg:py-24"><div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><p className="text-xs uppercase tracking-[0.3em] text-white/35">02 — General Members</p><h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">The creative<br /><span className="text-white/30">collective.</span></h2></div><p className="max-w-md text-sm leading-7 text-white/40">The creators behind the camera, the designs, the edits, and the stories that bring the club to life.</p></div><div className="mt-14 grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">{generalMembers.map((member, index) => <motion.div key={member._id} initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: (index % 5) * 0.06 }} className="group"><div className="aspect-[4/5] overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/[0.03]"><MemberImage member={member} className="h-full w-full grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0" /></div><p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-white/30">{member.role}</p><h3 className="mt-1 text-sm font-medium text-white/75">{member.name}</h3></motion.div>)}</div></div></section>}

        <section className="mt-4 sm:mt-5"><div className="rounded-[2rem] border border-white/10 bg-[#0b0d10] px-6 py-20 sm:px-10 lg:px-16 lg:py-28"><p className="text-xs uppercase tracking-[0.3em] text-white/35">03 — One Team</p><h2 className="mt-6 max-w-5xl text-4xl font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">Different skills.<br /><span className="text-white/30">One creative vision.</span></h2><div className="mt-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end"><p className="max-w-2xl text-base leading-8 text-white/40 sm:text-lg">From photography and videography to design, editing, and storytelling, every member contributes to how COMSATS is seen and remembered.</p><Link href="/join" className="group inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90">Join the Team<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link></div></div></section>
        <div className="h-4 sm:h-5" />
      </>}
    </main>
  );
}
