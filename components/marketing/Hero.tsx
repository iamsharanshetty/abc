"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, Variants } from "framer-motion";

export function Hero() {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        type: "tween",
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="relative overflow-hidden pt-32 pb-24 md:pt-48 md:pb-32">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        className="container mx-auto px-4 text-center"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.h1
          className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-8 leading-tight max-w-5xl mx-auto"
          variants={item}
        >
          Turn Your Website Into an <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 capitalize">
            AI Sales Representative
          </span>{" "}
          <br className="hidden md:block" />
          That Never Misses a Lead
        </motion.h1>

        <motion.p
          className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-12 font-light leading-relaxed"
          variants={item}
        >
          You Need More Than a Chatbot. You Need a Website That Can Think.{" "}
          <br />
          Most AI tools are built for support. WebRep is built for conversions.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          variants={item}
        >
          <Link
            href="/onboarding"
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/demo-embed"
            className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg font-semibold text-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-all flex items-center justify-center"
          >
            View Demo
          </Link>
        </motion.div>

        {/* Social Proof / Trusted By */}
        <motion.div
          className="mt-24 pt-8 border-t border-slate-200 dark:border-slate-800/50"
          variants={item}
        >
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-8">
            Trusted by Forward-Thinking Businesses
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Simple Placeholders for Logos */}
            {["Acme Corp", "GlobalTech", "Nebula", "Velocity", "FoxRun"].map(
              (logo) => (
                <span
                  key={logo}
                  className="text-xl font-bold font-serif text-slate-800 dark:text-slate-200"
                >
                  {logo}
                </span>
              )
            )}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
