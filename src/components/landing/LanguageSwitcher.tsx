"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Languages, Loader2 } from "lucide-react";
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
} from "@/components/ui/select"; 

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
    // استخدام group لربط تفاعل الـ Hover بين الزر والأيقونة الداخلية
    <div className="relative block group">
      <span className="sr-only">{t("label")}</span>
      
      {/* 🌟 أيقونة ديناميكية: تظهر دائرة تحميل عند تبديل اللغة */}
      <div className="pointer-events-none absolute start-3.5 top-1/2 z-10 -translate-y-1/2 transition-colors duration-300">
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
        ) : (
          <Languages className="h-4 w-4 text-zinc-400 group-hover:text-amber-300 transition-colors duration-300" />
        )}
      </div>
      
      <Select 
        value={locale} 
        onValueChange={handleChange} 
        disabled={isPending}
      >
        <SelectTrigger
          aria-label={t("label")}
          // 🌟 تجاوب كامل: العرض والخط يتغيران حسب حجم الشاشة مع تأثيرات زجاجية ممتازة
          className="h-10 w-[110px] sm:w-[130px] lg:w-40 appearance-none rounded-full border border-white/5 bg-zinc-950/40 hover:bg-zinc-900/60 py-0 ps-10 pe-3 sm:pe-4 text-xs sm:text-sm font-medium text-zinc-300 shadow-[0_4px_14px_0_rgb(0,0,0,10%)] outline-none backdrop-blur-md transition-all duration-300 hover:border-amber-400/40 hover:shadow-[0_0_15px_-3px_rgba(251,191,36,0.15)] focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SelectValue placeholder={t("label")} />
        </SelectTrigger>
        
        <SelectContent 
          align="end" // 🌟 محاذاة للنهاية لكي لا تخرج القائمة خارج شاشة الهاتف إذا كان الزر في الزاوية
          className="min-w-[140px] rounded-2xl border border-white/10 bg-zinc-950/85 text-zinc-200 backdrop-blur-2xl shadow-2xl overflow-hidden"
        >
          {locales.map((option) => (
            <SelectItem 
              key={option} 
              value={option}
              // 🌟 تحسين شكل الخيارات عند التحديد والـ Hover
              className="cursor-pointer py-2.5 px-3 text-xs sm:text-sm font-medium transition-colors focus:bg-amber-400/10 focus:text-amber-300 data-[state=checked]:text-amber-400 data-[state=checked]:bg-amber-400/5"
            >
              <div className="flex items-center gap-2">
                {/* رمز اللغة المختصر (EN, FR, AR) بلون خافت */}
                <span className="uppercase opacity-50 text-[10px] font-bold tracking-widest w-5">
                  {option}
                </span>
                {/* الاسم الكامل للغة */}
                <span className="truncate">
                  {t(`options.${option as Locale}`)}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
