"use client";

import type { Translation } from "@/app/[cafeSlug]/[tableId]/page";

interface SubNavbarProps {
  subCategories: string[];
  activeSubCategory: string;
  setActiveSubCategory: (subCategory: string) => void;
  t: Translation;
}

export default function SubNavbar({
  subCategories,
  activeSubCategory,
  setActiveSubCategory,
  t,
}: SubNavbarProps) {
  return (
    <div className="w-full px-5 py-2">
      <div className="flex flex-wrap justify-center gap-3.5">
        <button
          onClick={() => setActiveSubCategory("all")}
          className={`rounded-full border border-black/30 px-7 py-2.5 text-[15px] font-black transition-all ${
            activeSubCategory === "all"
              ? "bg-[#2525FF] text-white shadow-design-pill-active"
              : "bg-white text-black shadow-design-pill"
          }`}
        >
          {t.all}
        </button>
        {subCategories.map((subCategory) => (
          <button
            key={subCategory}
            onClick={() => setActiveSubCategory(subCategory)}
            className={`rounded-full border border-black/30 px-7 py-2.5 text-[15px] font-black transition-all ${
              activeSubCategory === subCategory
                ? "bg-[#2525FF] text-white shadow-design-pill-active"
                : "bg-white text-black shadow-design-pill"
            }`}
          >
            {subCategory}
          </button>
        ))}
      </div>
    </div>
  );
}