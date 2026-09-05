import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { publicPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return publicPageMetadata({
    title: t("getStartedTitle"),
    description: t("getStartedDescription"),
    path: "/get-started",
    locale: t("locale"),
    imageAlt: t("imageAlt"),
  });
}

export default function GetStartedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
