import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { ArrowLeft, ArrowRight, Compass, Home, BookOpen } from "lucide-react";
import { getLocaleDirection, type Locale } from "@/i18n/config";
import { privatePageMetadata } from "@/lib/seo";

const copy = {
  en: {
    title: "Page not found",
    description: "The page you requested does not exist or may have moved.",
    home: "Go to home",
    guide: "Read the product guide",
  },
  fr: {
    title: "Page introuvable",
    description: "La page demandée n’existe pas ou a peut-être été déplacée.",
    home: "Retour à l’accueil",
    guide: "Lire le guide produit",
  },
  ar: {
    title: "الصفحة غير موجودة",
    description: "الصفحة التي طلبتها غير موجودة أو ربما تم نقلها.",
    home: "العودة للرئيسية",
    guide: "قراءة دليل المنتج",
  },
} satisfies Record<Locale, { title: string; description: string; home: string; guide: string }>;

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  const t = copy[locale];

  return {
    ...privatePageMetadata,
    title: t.title,
    description: t.description,
  };
}

export default async function NotFound() {
  const locale = (await getLocale()) as Locale;
  const t = copy[locale];
  const direction = getLocaleDirection(locale);
  const Arrow = direction === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <main
      dir={direction}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-6 py-16 text-zinc-50"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.16),transparent_36%)]" />
      <div className="relative w-full max-w-xl text-center">
        <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-300">
          <Compass className="h-8 w-8" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">404</p>
        <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{t.title}</h1>
        <p className="mx-auto mt-5 max-w-md text-pretty text-lg leading-relaxed text-zinc-400">{t.description}</p>
        <nav aria-label="Helpful links" className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-6 py-3.5 font-semibold text-zinc-950 transition-colors hover:bg-amber-300"
          >
            <Home className="h-4 w-4" />
            {t.home}
            <Arrow className="h-4 w-4" />
          </Link>
          <Link
            href="/tutorial"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3.5 font-semibold text-zinc-100 transition-colors hover:bg-white/5"
          >
            <BookOpen className="h-4 w-4" />
            {t.guide}
          </Link>
        </nav>
      </div>
    </main>
  );
}
