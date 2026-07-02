"use client";

import { motion, Variants } from "framer-motion";
import {
  ScanLine,
  Soup,
  Zap,
  ShieldCheck,
  Clock,
  CreditCard,
} from "lucide-react";

const FEATURES = [
  {
    icon: ScanLine,
    title: "Scan & Order",
    desc: "Guests scan a QR at the table and order in seconds — no app download required.",
  },
  {
    icon: Soup,
    title: "Live Kitchen Sync",
    desc: "Orders appear instantly on the kitchen display, sorted and timed automatically.",
  },
  {
    icon: CreditCard,
    title: "Integrated POS",
    desc: "Close tickets, split bills and accept payments from one clean cashier screen.",
  },
  {
    icon: Zap,
    title: "Real-Time Updates",
    desc: "Every status change syncs across guest, kitchen and cashier in milliseconds.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by Default",
    desc: "Role-based access and encrypted sessions keep your data and revenue safe.",
  },
  {
    icon: Clock,
    title: "5-Minute Setup",
    desc: "Upload your menu, print your codes and start taking orders the same day.",
  },
];

// 🌟 تم إخراج إعدادات الحاوية وإعطاؤها النوع Variants
const container: Variants = {
  show: { transition: { staggerChildren: 0.08 } },
};

// 🌟 تم إضافة النوع Variants للبطاقة
const card: Variants = {
  hidden: { y: 28, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

export function Features() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <h2 className="text-balance text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
          Everything your cafe needs to run
        </h2>
        <p className="mt-4 text-pretty text-lg leading-relaxed text-zinc-400">
          One platform connecting your guests, kitchen and counter — beautifully.
        </p>
      </div>

      <motion.div
        variants={container} // 🌟 تم استخدام المتغير هنا
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.title}
              variants={card} // 🌟 المتغير card الآن معرف كـ Variants
              className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition-colors hover:border-amber-400/30 hover:bg-white/[0.06]"
            >
              <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300 transition-colors group-hover:bg-amber-400 group-hover:text-zinc-950">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="text-lg font-semibold text-zinc-50">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {f.desc}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}