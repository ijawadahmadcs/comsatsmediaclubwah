"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "About Us", href: "/about" },
  { name: "Our Work", href: "/work" },
  { name: "Team", href: "/team" },
  { name: "Join Us", href: "/join" },
];

const socials = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/comsatsmediaclubwah?stkn=czNmbXZpZ3Q5b3h1",
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/share/14nSjUdizRX/",
  },
  {
    name: "LinkedIn",
    href: "#",
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#08090b] px-3 pb-3 sm:px-5 sm:pb-5">
      <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0d0f12] sm:rounded-[2rem]">

        {/* Background glows */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-black-500/10 blur-3xl sm:h-80 sm:w-80" />

        <div className="pointer-events-none absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-blue-500/5 blur-3xl sm:h-80 sm:w-80" />

        <div className="relative mx-auto max-w-7xl px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">

          {/* Main Footer */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]"
          >

            {/* ================= BRAND ================= */}
            <div className="md:col-span-2 lg:col-span-1">

              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-black">
                <Image src="/logo.jpg" alt="COMSATS Media Club" width={35} height={35} className="rounded-xl"/>
                </div>

                <div className="leading-none">
                  <p className="text-sm font-bold tracking-wider text-white">
                    COMSATS
                  </p>

                  <p className="mt-1 text-[9px] tracking-[0.3em] text-white/40">
                    MEDIA CLUB
                  </p>
                </div>
              </div>

              {/* Campus */}
              <div className="mt-7">
                <p className="text-sm leading-6 text-white/50">
                  COMSATS University Islamabad
                  <br />
                  Wah Campus
                </p>

                <p className="mt-2 text-[10px] tracking-[0.25em] text-white/25">
                  PAKISTAN
                </p>
              </div>

              {/* CTA */}
              <Link
                href="/join"
                className="mt-7 inline-flex min-h-12 items-center gap-4 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Join the Club
                <span className="text-lg">→</span>
              </Link>
            </div>

            {/* ================= NAVIGATION ================= */}
            <FooterColumn title="Navigate">
              {navLinks.map((link) => (
                <FooterLink key={link.name} href={link.href}>
                  {link.name}
                </FooterLink>
              ))}
            </FooterColumn>

            {/* ================= CONNECT ================= */}
            <FooterColumn title="Connect">

              {socials.map((social) => (
                <ExternalFooterLink
                  key={social.name}
                  href={social.href}
                >
                  {social.name}
                </ExternalFooterLink>
              ))}

              {/* Email */}
              <a
                href="mailto:comsatsmediaclubwah@gmail.com"
                className="group mt-1 flex min-h-10 w-fit items-center text-sm text-white/60 transition-colors duration-300 hover:text-white"
              >
                <span className="mr-2 h-1 w-1 rounded-full bg-white/0 transition-all duration-300 group-hover:bg-white" />

                <span className="break-all">
                  Email: comsatsmediaclubwah@gmail.com
                </span>
              </a>

            </FooterColumn>
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="my-10 h-px origin-left bg-white/10 sm:my-14"
          />

          {/* ================= BOTTOM ================= */}
          <div className="flex flex-col gap-5 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between">

            <p className="leading-5">
              © {new Date().getFullYear()} COMSATS Media Club.
              <span className="hidden sm:inline"> </span>
              <br className="sm:hidden" />
              All rights reserved.
            </p>
            <a href="https://ijawadahmad.vercel.app" target="_blank" rel="noopener noreferrer" className="leading-5">
              Developed by: Jawad Ahmad <ArrowRight className="ml-1 inline h-3 w-3" />
            </a>

            <p className="text-[10px] uppercase tracking-[0.2em] text-white/25 sm:text-right">
              Capture • Create • Communicate
            </p>

          </div>

        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
        {title}
      </h3>

      <div className="flex flex-row flex-wrap gap-x-5 gap-y-2 sm:flex-col sm:gap-1">
  {children}
</div>
    </motion.div>
  );
}


function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-10 w-fit items-center text-sm text-white/60 transition-colors duration-300 hover:text-white"
    >
      <span className="mr-2 h-1 w-1 rounded-full bg-white/0 transition-all duration-300 group-hover:bg-white" />

      {children}
    </Link>
  );
}


function ExternalFooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-h-10 w-fit items-center text-sm text-white/60 transition-colors duration-300 hover:text-white"
    >
      <span className="mr-2 h-1 w-1 rounded-full bg-white/0 transition-all duration-300 group-hover:bg-white" />

      {children}
    </a>
  );
}