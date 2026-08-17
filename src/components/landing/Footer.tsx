"use client";

import { motion } from "framer-motion";
import { ArrowRight, QrCode } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { MagneticButton } from "./MagneticButton";

export function Footer() {
  const t = useTranslations("Landing.Footer");
  const isRtl = useLocale() === "ar";

  return (
    <footer className="mx-auto max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-10 text-center backdrop-blur-xl sm:p-16"
      >
        <div className="absolute -top-24 start-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-500/20 blur-[100px] rtl:translate-x-1/2" />
        <h2 className="relative text-balance text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
          {t("title")}
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-pretty text-lg leading-relaxed text-zinc-400">
          {t("description")}
        </p>
        <div className="relative mt-8 flex justify-center">
          <Link href="/get-started">
            <MagneticButton className="group inline-flex cursor-pointer items-center gap-2 rounded-full bg-amber-400 px-8 py-4 text-base font-semibold text-zinc-950 shadow-[0_0_50px_-8px_rgba(251,191,36,0.7)]">
              {t("getStarted")}
              <ArrowRight
                className={`h-5 w-5 transition-transform ${
                  isRtl
                    ? "rotate-180 group-hover:-translate-x-1"
                    : "group-hover:translate-x-1"
                }`}
              />
            </MagneticButton>
          </Link>
        </div>
      </motion.div>

      <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 pb-12 sm:flex-row">
        <a href="#top" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-zinc-950">
            <QrCode className="h-4 w-4" strokeWidth={2.4} />
          </span>
          <span className="font-semibold text-zinc-50">Qerve</span>
        </a>
        <p className="text-sm text-zinc-500">
          {t("copyright", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
