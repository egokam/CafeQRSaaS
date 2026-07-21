"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import {
  getLocaleDirection,
  isLocale,
  localeCookieName,
  locales,
  type Locale,
} from "@/i18n/config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Make sure this path matches your shadcn setup

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("Landing.Navbar.language");
  const [isPending, startTransition] = useTransition();

  const handleChange = (nextLocale: string) => {
    if (!isLocale(nextLocale) || nextLocale === locale) return;

    const direction = getLocaleDirection(nextLocale);
    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = nextLocale;
    document.documentElement.dir = direction;

    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="relative block">
      <span className="sr-only">{t("label")}</span>
      
      {/* Absolute icon stays exactly where it was, floating over the trigger */}
      <Languages className="pointer-events-none absolute start-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-amber-300" />
      
      <Select 
        value={locale} 
        onValueChange={handleChange} 
        disabled={isPending}
      >
        {/* Trigger mapped with your exact glassmorphism & amber focus styles */}
        <SelectTrigger
          aria-label={t("label")}
          className="h-10 w-36 sm:w-40 appearance-none rounded-full border border-white/10 bg-zinc-950/70 py-0 ps-9 pe-4 text-sm font-medium text-zinc-200 shadow-sm outline-none backdrop-blur-xl transition-colors hover:border-amber-400/40 focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20 disabled:opacity-60"
        >
          <SelectValue placeholder={t("label")} />
        </SelectTrigger>
        
        {/* Content customized to match the dark theme, eliminating the default browser blue */}
        <SelectContent className="border-white/10 bg-zinc-950/95 text-zinc-200 backdrop-blur-xl">
          {locales.map((option) => (
            <SelectItem 
              key={option} 
              value={option}
              className="cursor-pointer focus:bg-amber-400/10 focus:text-amber-300"
            >
              {t(`options.${option as Locale}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}