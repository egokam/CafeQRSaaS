"use client";

import { Search } from "lucide-react";

const TRANSLATIONS = {
  en: { placeholder: "Search..." },
  fr: { placeholder: "Rechercher..." },
  ar: { placeholder: "بحث..." }
};

interface SearchbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeLang: "en" | "fr" | "ar";
}

export default function Searchbar({ searchQuery, setSearchQuery, activeLang }: SearchbarProps) {
  const isAr = activeLang === "ar";
  const dir = isAr ? "rtl" : "ltr";

  return (
    <div className="relative flex-1" dir={dir}>
      <div className={`pointer-events-none absolute inset-y-0 ${isAr ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center`}>
        <Search size={22} className="text-black" strokeWidth={2.5} />
      </div>
      <input
        type="text"
        placeholder={TRANSLATIONS[activeLang].placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={`w-full rounded-full border border-black/20 shadow-[0_4px_15px_rgba(0,0,0,0.05)] py-3.5 text-[15px] font-bold text-black focus:border-black focus:outline-none placeholder:font-normal placeholder:text-gray-400 ${
          isAr ? "pr-12 pl-4" : "pl-12 pr-4"
        }`}
      />
    </div>
  );
}