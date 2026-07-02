"use client";

import { motion } from "framer-motion";
import { QrCode } from "lucide-react";
import Link from "next/link"; // 🌟 استدعاء Link من Next.js

export function Navbar() {
  return (
    <motion.nav
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <div className="flex w-full max-w-6xl items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-xl">
        <a href="#top" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-zinc-950">
            <QrCode className="h-5 w-5" strokeWidth={2.4} />
          </span>
          <span className="text-lg font-semibold tracking-tight text-zinc-50">
            CafeQR
          </span>
        </a>

        <div className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
          <a href="#features" className="transition-colors hover:text-zinc-50">
            Features
          </a>
          <a href="#demo" className="transition-colors hover:text-zinc-50">
            Live Demo
          </a>
          <a href="#pricing" className="transition-colors hover:text-zinc-50">
            Pricing
          </a>
        </div>

        {/* 🌟 تم تغليف الزر للتوجه لصفحة العروض */}
        <Link href="/get-started">
          <button className="rounded-full bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-400 cursor-pointer">
            Get Started
          </button>
        </Link>
      </div>
    </motion.nav>
  );
}