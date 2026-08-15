"use client";

import type { Category, Lang } from "@/app/[cafeSlug]/[tableId]/page";
import { Home } from "lucide-react";

interface NavbarProps {
  categories: Category[];
  activeCategoryId: string;
  setActiveCategoryId: (id: string) => void;
  activeLang: Lang;
}

const TRANSLATIONS = {
  en: { home: "Home" },
  fr: { home: "Accueil" },
  ar: { home: "الرئيسية" }
};

const getCategoryIconName = (nameEn: string) => {
  const mapping: Record<string, string> = {
    Breakfast: "cat_breakfasts.png",
    Breakfasts: "cat_breakfasts.png",
    Burger: "cat_burgers.png",
    Burgers: "cat_burgers.png",
    Pizzas: "cat_pizzas.png",
    Pizza: "cat_pizzas.png",
    Tacos: "cat_tacos.png",
    "Hot Coffee": "cat_hot_coffee.png",
    "Cold Coffee": "cat_cold_coffee.png",
    Desserts: "cat_desserts.png",
    "Fried Chicken": "cat_fried_chicken.png",
    Juices: "cat_juices.png",
    Milkshakes: "cat_milkshakes.png",
    Paninis: "cat_paninis.png",
    Patisserie: "cat_patisserie.png",
    Plates: "cat_plats.png",
    Plats: "cat_plats.png",
    Salads: "cat_salads.png",
    Sandwiches: "cat_sandwiches.png",
    Smoothies: "cat_smoothies.png",
    "Soft Drinks": "cat_soft_drinks.png",
    Tea: "cat_tea.png",
  };
  return mapping[nameEn] || "default.png";
};

export default function Navbar({
  categories,
  activeCategoryId,
  setActiveCategoryId,
  activeLang,
}: NavbarProps) {
  const isAr = activeLang === "ar";
  const dir = isAr ? "rtl" : "ltr";

  const getCategoryName = (cat: Category) => {
    if (isAr && cat.name_ar) return cat.name_ar;
    if (activeLang === "fr" && cat.name_fr) return cat.name_fr;
    return cat.name_en || cat.name_fr || cat.name_ar || "";
  };

  return (
    <div className="w-full mask-fade-x" dir={dir}>
      <div className="w-full overflow-x-auto px-5 py-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex gap-4">
          
          <button
            onClick={() => setActiveCategoryId("home")}
            className="flex shrink-0 flex-col items-center gap-1"
          >
            <div
              className={`flex h-[4.0rem] w-[4.0rem] items-center justify-center rounded-[1.5rem] transition-colors ${
                activeCategoryId === "home" ? "bg-blue-600 shadow-md" : "bg-[#18181b] shadow-sm"
              }`}
            >
              <Home className="h-7 w-7 text-white drop-shadow-md" strokeWidth={2} />
            </div>
            <span
              className={`text-[11px] transition-colors ${
                activeCategoryId === "home" ? "font-black text-blue-600" : "font-bold text-gray-800"
              }`}
            >
              {TRANSLATIONS[activeLang].home}
            </span>
          </button>

          {categories.map((cat) => {
            const isActive = activeCategoryId === cat.id;
            const catName = getCategoryName(cat);
            const iconFilename = getCategoryIconName(cat.name_en || "");

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className="flex shrink-0 flex-col items-center gap-1"
              >
                <div
                  className={`flex h-[4.0rem] w-[4.0rem] items-center justify-center rounded-[1.5rem] transition-colors ${
                    isActive ? "bg-blue-600 shadow-md" : "bg-[#18181b] shadow-sm"
                  }`}
                >
                  <img
                    src={`/icons/${iconFilename}`}
                    alt={catName}
                    className="h-11 w-11 object-contain drop-shadow-md"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <span
                  className={`text-[11px] transition-colors ${
                    isActive ? "font-black text-blue-600" : "font-bold text-gray-800"
                  }`}
                >
                  {catName}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}