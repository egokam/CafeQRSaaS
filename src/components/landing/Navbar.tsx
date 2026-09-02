"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Navbar() {
  const t = useTranslations("Landing.Navbar");

  return (
    <motion.nav
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <div className="flex w-full max-w-6xl items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl sm:px-5">
        <a href="#top" className="flex shrink-0 items-center">
  <Image
    src="/logo.svg"
    alt="Qerve Logo"
    width={120}
    height={40}
    className="h-8 w-auto object-contain sm:h-9"
    priority
  />
</a>

        <div className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
          <a href="#features" className="transition-colors hover:text-zinc-50">
            {t("links.features")}
          </a>
          <a href="#demo" className="transition-colors hover:text-zinc-50">
            {t("links.demo")}
          </a>
          <a href="#tutorial" className="transition-colors hover:text-zinc-50">
            {t("links.tutorial")}
          </a>
          <a href="#pricing" className="transition-colors hover:text-zinc-50">
            {t("links.pricing")}
          </a>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <Link href="/get-started">
            <button className="cursor-pointer rounded-full bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-400 sm:px-4">
              {t("getStarted")}
            </button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}