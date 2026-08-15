"use client";

import LangSwitch from "@/components/client/LangSwitch";
import type { Lang } from "@/app/[cafeSlug]/[tableId]/page";

interface TopbarProps {
  cafeName: string;
  subtitle: string;
  activeLang?: Lang;
  onSelectLang: (lang: Lang) => void;
}

export default function Topbar({ cafeName, subtitle, activeLang = "en", onSelectLang }: TopbarProps) {
  const dir = activeLang === "ar" ? "rtl" : "ltr";

  return (
    <div className="px-5 pb-[30px] pt-[30px] flex items-start justify-between" dir={dir}>
      <div className="flex flex-col">
        <h1 className="font-serif text-[3.25rem] font-black italic leading-none tracking-tighter text-black">
          {cafeName}
        </h1>
        <p className="mt-1 text-[14px] font-bold text-gray-400">
          {subtitle}
        </p>
      </div>
      <div className="pt-2">
        <LangSwitch activeLang={activeLang} onSelectLang={onSelectLang} />
      </div>
    </div>
  );
}