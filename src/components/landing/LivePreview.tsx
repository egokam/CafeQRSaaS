"use client";

import { Smartphone, CreditCard, Settings, ChefHat } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Sandbox, type SandboxView } from "./Sandbox";

export function LivePreview() {
  const t = useTranslations("Landing.LivePreview");
  const locale = useLocale();

  const views: SandboxView[] = [
    {
      id: "client",
      label: t("views.client"),
      icon: Smartphone,
      content: (
        <iframe
          key={`client-${locale}`}
          src="/demo/client"
          className="h-[650px] w-full rounded-b-2xl border-none bg-background"
          title={t("titles.client")}
        />
      ),
    },
    {
      id: "pos",
      label: t("views.pos"),
      icon: CreditCard,
      content: (
        <iframe
          key={`pos-${locale}`}
          src="/demo/pos"
          className="h-[650px] w-full rounded-b-2xl border-none bg-zinc-950"
          title={t("titles.pos")}
        />
      ),
    },
    {
      id: "kitchen",
      label: t("views.kitchen"),
      icon: ChefHat,
      content: (
        <iframe
          key={`kitchen-${locale}`}
          src="/demo/kitchen"
          className="h-[650px] w-full rounded-b-2xl border-none bg-[#121212]"
          title={t("titles.kitchen")}
        />
      ),
    },
    {
      id: "admin",
      label: t("views.admin"),
      icon: Settings,
      content: (
        <iframe
          key={`admin-${locale}`}
          src="/demo/admin"
          className="h-[650px] w-full rounded-b-2xl border-none bg-muted/20"
          title={t("titles.admin")}
        />
      ),
    },
  ];

  return (
    <section className="relative z-10 mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <p className="mb-2 text-sm font-bold uppercase tracking-widest text-amber-500">
          {t("eyebrow")}
        </p>
        <h2 className="mb-4 text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
          {t("title")}
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-zinc-400">
          {t("description")}
        </p>
      </div>

      <Sandbox
        key={locale}
        views={views}
        tabsLabel={t("tabsLabel")}
        url="app.cafeqr.io/live-demo"
      />
    </section>
  );
}
