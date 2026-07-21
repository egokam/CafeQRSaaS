"use client";

import { motion, type Variants } from "framer-motion";
import {
  ScanLine,
  Soup,
  Zap,
  ShieldCheck,
  Clock,
  CreditCard,
} from "lucide-react";
import { useTranslations } from "next-intl";

const FEATURES = [
  { key: "scan", icon: ScanLine },
  { key: "kitchen", icon: Soup },
  { key: "pos", icon: CreditCard },
  { key: "realtime", icon: Zap },
  { key: "secure", icon: ShieldCheck },
  { key: "setup", icon: Clock },
];

const container: Variants = {
  show: { transition: { staggerChildren: 0.08 } },
};

const card: Variants = {
  hidden: { y: 28, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

export function Features() {
  const t = useTranslations("Landing.Features");

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <h2 className="text-balance text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
          {t("title")}
        </h2>
        <p className="mt-4 text-pretty text-lg leading-relaxed text-zinc-400">
          {t("description")}
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {FEATURES.map((feature) => {
          const Icon = feature.icon;

          return (
            <motion.div
              key={feature.key}
              variants={card}
              className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition-colors hover:border-amber-400/30 hover:bg-white/[0.06]"
            >
              <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300 transition-colors group-hover:bg-amber-400 group-hover:text-zinc-950">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="text-lg font-semibold text-zinc-50">
                {t(`items.${feature.key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {t(`items.${feature.key}.description`)}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
