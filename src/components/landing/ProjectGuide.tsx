"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CreditCard,
  LayoutDashboard,
  Printer,
  QrCode,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

const topics = [
  { key: "qr", icon: QrCode },
  { key: "pos", icon: CreditCard },
  { key: "kitchen", icon: Printer },
  { key: "admin", icon: LayoutDashboard },
  { key: "saas", icon: Building2 },
  { key: "business", icon: Rocket },
  { key: "security", icon: ShieldCheck },
];

const container: Variants = {
  hidden: { opacity: 0, y: 34 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: "easeOut", staggerChildren: 0.08 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function ProjectGuide() {
  const t = useTranslations("Landing.ProjectGuide");
  const isRtl = useLocale() === "ar";
  const steps = t.raw("steps") as string[];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-90px" }}
      className="mx-auto max-w-6xl"
    >
      <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.035] to-amber-400/[0.08] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl transition-colors hover:border-amber-400/30 sm:p-8 lg:p-10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(251,191,36,0.08)_45%,transparent_70%)] opacity-70 transition-opacity group-hover:opacity-100" />

        <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-center">
          <div>
            <motion.span
              variants={item}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-1.5 text-sm font-medium text-amber-300"
            >
              <BookOpen className="h-4 w-4" />
              {t("badge")}
            </motion.span>

            <motion.h2
              variants={item}
              className="text-balance text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl lg:text-5xl"
            >
              {t("titleBefore")}{" "}
              <span className="bg-gradient-to-r from-amber-300 to-orange-500 bg-clip-text text-transparent">
                {t("titleHighlight")}
              </span>
            </motion.h2>

            <motion.p
              variants={item}
              className="mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-zinc-400"
            >
              {t("description")}
            </motion.p>

            <motion.div
              variants={item}
              className="mt-7 grid gap-3 sm:grid-cols-2"
            >
              {topics.map((topic) => {
                const Icon = topic.icon;

                return (
                  <div
                    key={topic.key}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-300 transition-colors group-hover:border-white/15"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>{t(`topics.${topic.key}`)}</span>
                  </div>
                );
              })}
            </motion.div>

            <motion.div variants={item} className="mt-8">
              <Link
                href="/tutorial"
                className="group/button inline-flex items-center gap-2 rounded-full bg-amber-400 px-7 py-3.5 text-base font-semibold text-zinc-950 shadow-[0_0_45px_-10px_rgba(251,191,36,0.75)] transition-all hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-[0_0_60px_-8px_rgba(251,191,36,0.85)]"
              >
                {t("button")}
                <ArrowRight
                  className={`h-5 w-5 transition-transform ${
                    isRtl
                      ? "rotate-180 group-hover/button:-translate-x-1"
                      : "group-hover/button:translate-x-1"
                  }`}
                />
              </Link>
            </motion.div>
          </div>

          <motion.div
            variants={item}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/70 p-5 shadow-xl shadow-black/30"
          >
            <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/90" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-500">
                {t("path")}
              </span>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step} className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-sm font-semibold text-amber-300">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-amber-300/40 to-transparent rtl:bg-gradient-to-l" />
                  <span className="w-36 text-sm font-medium text-zinc-200">
                    {step}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <p className="text-sm leading-relaxed text-zinc-300">
                  {t("note")}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
