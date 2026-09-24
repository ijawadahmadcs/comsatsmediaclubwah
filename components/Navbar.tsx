"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navItems = [
  { name: "Home", href: "/" },
  { name: "About Us", href: "/about" },
  { name: "Our Work", href: "/work" },
  { name: "Team", href: "/team" },
  { name: "Join Us", href: "/join" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Navbar */}
      <motion.nav
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed left-1/2 top-7 z-50 w-[calc(100%-1.5rem)] max-w-6xl -translate-x-1/2"
      >
        <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 shadow-2xl backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-sm font-bold text-white">
                <Image src="/logo.jpg" alt="COMSATS Media Club" width={35} height={35} className="rounded-xl"/>
              </div>

              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-semibold text-white">
                  COMSATS
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                  Media Club
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-8 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group relative text-sm text-white/70 transition-colors duration-300 hover:text-white"
                >
                  {item.name}

                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-white transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white md:hidden"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 8, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl md:hidden"
            >
              <div className="flex flex-col p-3">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}