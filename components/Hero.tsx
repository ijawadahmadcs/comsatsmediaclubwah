"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-[#08090b] px-3 pt-3 sm:px-5 sm:pt-5">
      {/* Hero Container */}
      <div className="relative min-h-[calc(100vh-1.5rem)] sm:min-h-[calc(100vh-2.5rem)] overflow-hidden rounded-[2rem] border border-white/10">
        
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/assets/images/hero.png')",
          }}
        />

        {/* Dark Cinematic Overlay */}
        <div className="absolute inset-0 bg-black/45" />

        {/* Left-to-right gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/10" />

        {/* Bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Content */}
        <div className="relative z-10 flex min-h-[calc(100vh-1.5rem)] sm:min-h-[calc(100vh-2.5rem)] items-end mt-7">
          <div className="w-full max-w-7xl mx-auto px-6 pb-12 sm:px-10 sm:pb-16 lg:px-16 lg:pb-20">

            {/* Small Label */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-white/70 sm:text-sm"
            >
              COMSATS University Islamabad · Wah Campus
            </motion.p>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="max-w-5xl text-5xl font-semibold leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-8xl"
            >
              We capture
              <br />
              <span className="text-white/60">what matters.</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg"
            >
              Stories, moments, and creativity from the people
              who make our campus what it is.
            </motion.p>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link
                href="/work"
                className="group flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-all duration-300 hover:bg-white/90"
              >
                Explore Our Work

                <ArrowRight
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/join"
                className="rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-md transition-all duration-300 hover:bg-white/20"
              >
                Join the Club
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-8 right-8 hidden items-center gap-3 text-xs uppercase tracking-[0.2em] text-white/50 sm:flex"
        >
          Scroll to explore

          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20">
            <ArrowDown size={14} />
          </div>
        </motion.div>

      </div>
    </section>
  );
}