"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "About Us", href: "/about" },
  { name: "Our Work", href: "/work" },
  { name: "Team", href: "/team" },
  { name: "Join Us", href: "/join" },
];

const socials = [
  { name: "Instagram", href: "#" },
  { name: "Facebook", href: "#" },
  { name: "LinkedIn", href: "#" },
];

export default function Footer() {
  return (
    <footer className="bg-[#08090b] px-3 pb-3 sm:px-5 sm:pb-5">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0f12]">

        {/* Background glow */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-16 lg:py-20">

          {/* Main Footer */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="grid grid-cols-1 gap-14 lg:grid-cols-[1.5fr_1fr_1fr]"
          >

            {/* Brand */}
            <div className="max-w-xl">
              <div className="mb-7 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-sm font-black text-black">
                  CM
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
               <FooterColumn title="">
                <p className="text-sm leading-6 text-white/40">
                  COMSATS University Islamabad
                  <br />
                  Wah Campus
                </p>

                <p className="mt-3 text-[10px] tracking-[0.25em] text-white/25">
                  PAKISTAN
                </p>
              </FooterColumn>

              <Link href="/join" className="mt-8 inline-block">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="
                    inline-flex
                    items-center
                    gap-4
                    rounded-full
                    bg-white
                    px-6
                    py-3.5
                    text-sm
                    font-semibold
                    text-black
                    transition
                    hover:bg-white/90
                  "
                >
                  Join the Club
                  <span className="text-lg">→</span>
                </motion.div>
              </Link>
            </div>

            {/* Navigation */}
            <FooterColumn title="Navigate">
              {navLinks.map((link) => (
                <FooterLink key={link.name} href={link.href}>
                  {link.name}
                </FooterLink>
              ))}
            </FooterColumn>

            {/* Connect + Campus */}
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-1">

              <FooterColumn title="Connect">
                {socials.map((social) => (
                  <FooterLink
                    key={social.name}
                    href={social.href}
                  >
                    {social.name}
                  </FooterLink>
                ))}
              </FooterColumn>

             

            </div>

          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="my-14 h-px origin-left bg-white/10"
          />

          {/* Bottom */}
          <div className="flex flex-col gap-4 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between">

            <p>
              © {new Date().getFullYear()} COMSATS Media Club.
              All rights reserved.
            </p>

            <p className="tracking-[0.2em] uppercase">
              Capture • Create • Communicate
            </p>

          </div>

        </div>
      </div>
    </footer>
  );
}

/* ---------------- Components ---------------- */

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

      <div className="flex flex-col gap-3">
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
      className="
        group
        w-fit
        text-sm
        text-white/60
        transition-colors
        duration-300
        hover:text-white
      "
    >
      <span className="inline-flex items-center gap-2">
        <span
          className="
            h-1
            w-1
            rounded-full
            bg-white/0
            transition-all
            duration-300
            group-hover:bg-white
          "
        />

        {children}
      </span>
    </Link>
  );
}