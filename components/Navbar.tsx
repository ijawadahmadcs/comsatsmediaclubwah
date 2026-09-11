"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

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
      <motion.nav
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.7,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="
          absolute
          top-6
          left-1/2
          z-50
          w-[calc(100%-2rem)]
          max-w-6xl
          -translate-x-1/2
          rounded-2xl
          border
          border-white/15
          bg-black/40
          px-4
          py-3
          shadow-2xl
          backdrop-blur-xl
        "
      >
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-3"
          >
            <div className="
              flex h-10 w-10
              items-center justify-center
              rounded-xl
              bg-white
              text-sm font-black
              text-black
              transition-transform
              duration-300
              group-hover:scale-105
            ">
              CM
            </div>

            <div className="hidden sm:block leading-none">
              <p className="text-sm font-bold tracking-wider text-white">
                COMSATS
              </p>
              <p className="mt-1 text-[9px] font-medium tracking-[0.25em] text-white/50">
                MEDIA CLUB
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item, index) => (
              <NavItem
                key={item.name}
                item={item}
                index={index}
              />
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="
              flex h-10 w-10
              items-center justify-center
              rounded-xl
              border border-white/10
              bg-white/5
              text-white
              md:hidden
            "
            aria-label="Toggle menu"
          >
            <div className="space-y-1.5">
              <motion.span
                animate={{
                  rotate: isOpen ? 45 : 0,
                  y: isOpen ? 6 : 0,
                }}
                className="block h-0.5 w-5 bg-white"
              />

              <motion.span
                animate={{
                  opacity: isOpen ? 0 : 1,
                }}
                className="block h-0.5 w-5 bg-white"
              />

              <motion.span
                animate={{
                  rotate: isOpen ? -45 : 0,
                  y: isOpen ? -6 : 0,
                }}
                className="block h-0.5 w-5 bg-white"
              />
            </div>
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
              }}
              animate={{
                opacity: 1,
                height: "auto",
              }}
              exit={{
                opacity: 0,
                height: 0,
              }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden md:hidden"
            >
              <div className="mt-4 border-t border-white/10 pt-3">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{
                      opacity: 0,
                      x: -15,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    transition={{
                      delay: index * 0.06,
                    }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="
                        block rounded-xl
                        px-4 py-3
                        text-sm
                        font-medium
                        text-white/70
                        transition
                        hover:bg-white/5
                        hover:text-white
                      "
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}

function NavItem({
  item,
  index,
}: {
  item: {
    name: string;
    href: string;
  };
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.15 + index * 0.08,
        duration: 0.5,
      }}
      className="relative"
    >
      <Link
        href={item.href}
        className="
          group
          relative
          block
          rounded-xl
          px-4
          py-2.5
          text-sm
          font-medium
          text-white/60
          transition-colors
          duration-300
          hover:text-white
        "
      >
        {item.name}

        {/* Hover line */}
        <span
          className="
            absolute
            bottom-1
            left-1/2
            h-[2px]
            w-0
            -translate-x-1/2
            rounded-full
            bg-white
            transition-all
            duration-300
            group-hover:w-5
          "
        />
      </Link>
    </motion.div>
  );
}