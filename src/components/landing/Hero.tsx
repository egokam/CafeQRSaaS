"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { MagneticButton } from "./MagneticButton";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const item: Variants = {
  hidden: { y: 24, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

export function Hero() {
  const t = useTranslations("Landing.Hero");
  const isRtl = useLocale() === "ar";

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto flex max-w-4xl flex-col items-center text-center"
    >
      <motion.span
        variants={item}
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-amber-300 backdrop-blur-md"
      >
        <Sparkles className="h-4 w-4" />
        {t("badge")}
      </motion.span>

      <motion.h1
        variants={item}
        className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-zinc-50 sm:text-6xl md:text-7xl"
      >
        {t("titleBefore")}{" "}
        <span className="bg-gradient-to-r from-amber-300 to-orange-500 bg-clip-text text-transparent">
          {t("titleHighlight")}
        </span>
      </motion.h1>

      <motion.p
        variants={item}
        className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-zinc-400"
      >
        {t("description")}
      </motion.p>

      <motion.div
        variants={item}
        className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
      >
        <Link href="/get-started">
          <MagneticButton className="group inline-flex cursor-pointer items-center gap-2 rounded-full bg-amber-400 px-7 py-3.5 text-base font-semibold text-zinc-950 shadow-[0_0_40px_-8px_rgba(251,191,36,0.6)] transition-shadow hover:shadow-[0_0_60px_-6px_rgba(251,191,36,0.8)]">
            {t("startTrial")}
            <ArrowRight
              className={`h-5 w-5 transition-transform ${
                isRtl
                  ? "rotate-180 group-hover:-translate-x-1"
                  : "group-hover:translate-x-1"
              }`}
            />
          </MagneticButton>
        </Link>

        <a
          href="#demo"
          className="rounded-full border border-white/15 px-7 py-3.5 text-base font-medium text-zinc-200 backdrop-blur-md transition-colors hover:bg-white/5"
        >
          {t("viewDemo")}
        </a>
      </motion.div>

      <motion.p variants={item} className="mt-6 text-sm text-zinc-500">
        {t("note")}
      </motion.p>
    </motion.div>
  );
}
