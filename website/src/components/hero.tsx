"use client";

import { PlayIcon } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-[calc(var(--header-height)*-1)] h-full bg-[radial-gradient(ellipse_at_top,rgba(255,0,0,0.28),transparent_55%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center sm:py-28">
        <div className="relative mb-8 grid size-40 place-items-center">
          <div className="absolute inset-3 rounded-full bg-yt/20 blur-xl" />
          <img
            src="/logo.png"
            alt="Artified DIY"
            className="relative h-28 w-28 object-contain drop-shadow-lg"
          />
        </div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-medium tracking-tight sm:text-6xl"
        >
          <img
            src="/artified-diy-type.svg"
            alt="Artified DIY"
            className="sm:h-24 h-12"
          />
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mt-4 max-w-xl text-lg text-muted dark:text-muted-dark"
        >
          Projects, tools, and the materials behind every build.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="mt-8"
        >
          <Link
            href="/videos"
            className="inline-flex items-center gap-2 rounded-full bg-yt px-5 py-2.5 text-sm font-medium text-white transition hover:bg-yt-press"
          >
            <PlayIcon size={16} weight="fill" />
            Browse videos
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
