"use client";

import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";

interface BannerProps {
  categories: any[];
  activeLang: string;
  onCategoryClick: (categoryId: string) => void;
}

const TRANSLATIONS: Record<string, any> = {
  en: { sub: "Freshly made. Just for you.", btn: "Explore" },
  fr: { sub: "Préparé frais. Juste pour vous.", btn: "Découvrir" },
  ar: { sub: "طازج ومحضر خصيصاً لك.", btn: "تصفح" }
};

const getBannerImage = (nameEn: string) => {
  const mapping: Record<string, string> = {
    Breakfast: "breakfasts.png",
    Burger: "burgers.png",
    Pizza: "pizzas.png",
  };
  const normalized = nameEn ? nameEn.toLowerCase().replace(/\s+/g, "_") : "default";
  const filename = mapping[nameEn] || `${normalized}.png`;
  return `/banners/${filename}`;
};

export default function Banner({ categories, activeLang, onCategoryClick }: BannerProps) {
  const t = TRANSLATIONS[activeLang] || TRANSLATIONS.en;
  const isAr = activeLang === "ar";
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselCategories = categories.slice(0, 5);

  useEffect(() => {
    if (carouselCategories.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselCategories.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [carouselCategories.length]);

  const getCategoryName = (cat: any) => {
    if (isAr && cat.name_ar) return cat.name_ar;
    if (activeLang === "fr" && cat.name_fr) return cat.name_fr;
    return cat.name_en || cat.name_fr || cat.name_ar || "";
  };

  if (carouselCategories.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-[2rem] bg-black text-white shadow-xl min-h-[180px] sm:min-h-[220px]">
      {carouselCategories.map((cat, idx) => {
        const catName = getCategoryName(cat);
        const imagePath = getBannerImage(cat.name_en || "");
        const isActive = idx === currentIndex;

        return (
          <div
            key={cat.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              isActive ? "opacity-100 z-20" : "opacity-0 z-10 pointer-events-none"
            }`}
          >
            {/* Adjusted gradient to fade out completely, allowing the image to show on the right */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent z-10" />
            
            {/* Increased image opacity from 60% to 85% */}
            <img
              src={imagePath}
              alt={catName}
              className="absolute inset-0 w-full h-full object-cover opacity-85"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=1000&auto=format&fit=crop";
              }}
            />

            {/* Reduced padding on mobile, restricted max-width of text container */}
            <div className="relative z-20 flex flex-col justify-center p-6 sm:p-10 h-full w-[90%] sm:w-[70%]">
              <h2 className="text-2xl font-black leading-tight tracking-tight sm:text-4xl capitalize">
                {catName}
              </h2>
              <p className="mt-1.5 text-xs font-bold text-gray-200 sm:mt-2 sm:text-base">
                {t.sub}
              </p>
              
              <button
                onClick={() => onCategoryClick(cat.id)}
                className="mt-4 flex w-fit items-center gap-2 rounded-xl sm:rounded-2xl bg-white px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-black text-black transition-transform active:scale-95 shadow-lg"
              >
                {t.btn} {catName}
                <ArrowRight size={16} className={`sm:h-[18px] sm:w-[18px] ${isAr ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>
        );
      })}

      {carouselCategories.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 sm:bottom-4 sm:gap-2 z-30">
          {carouselCategories.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex ? "w-5 sm:w-6 bg-white" : "w-1.5 sm:w-2 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}