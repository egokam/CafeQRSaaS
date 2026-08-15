"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown } from "lucide-react";
import type { Lang } from "@/app/[cafeSlug]/[tableId]/page";

interface LangSwitchProps {
  activeLang: Lang;
  onSelectLang: (lang: Lang) => void;
}

const LANGUAGES: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
];

export default function LangSwitch({ activeLang, onSelectLang }: LangSwitchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLangLabel = LANGUAGES.find((l) => l.code === activeLang)?.label || "English";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-black/10 bg-gray-50 px-3.5 py-2 text-xs font-bold text-black shadow-sm transition-all hover:bg-gray-100 active:scale-95"
      >
        <Globe size={16} className="text-gray-600" />
        <span>{currentLangLabel}</span>
        <ChevronDown size={14} className={`text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* القائمة المنسدلة مع أنيميشن سلس */}
      <div
        className={`absolute right-0 mt-2 w-36 origin-top-right rounded-2xl border border-gray-100 bg-white p-1.5 shadow-xl z-50 transition-all duration-200 ease-out ${
          isOpen
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
        }`}
      >
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => {
              if (onSelectLang) onSelectLang(lang.code);
              setIsOpen(false);
            }}
            className={`w-full rounded-xl px-3 py-2.5 text-center text-xs font-bold transition-colors ${
              activeLang === lang.code
                ? "bg-gray-100 text-black font-black"
                : "text-gray-600 hover:bg-gray-50 hover:text-black"
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}