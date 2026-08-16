"use client";

import { useEffect, useState } from "react";
import type { Product, Lang } from "@/app/[cafeSlug]/[tableId]/page";
import ProductCard from "../ProductCard";

interface TopPicksProps {
  products: Product[];
  activeLang: Lang;
  onProductClick: (product: Product) => void;
}

const TRANSLATIONS = {
  en: { title: "Popular Picks" },
  fr: { title: "Choix Populaires" },
  ar: { title: "أفضل الاختيارات" }
};

export default function TopPicks({ products, activeLang, onProductClick }: TopPicksProps) {
  const [dailyPicks, setDailyPicks] = useState<Product[]>([]);
  const t = TRANSLATIONS[activeLang] || TRANSLATIONS.en;

  useEffect(() => {
    if (!products || products.length === 0) return;

    // Generate a consistent seed based on the current day (changes every 24h)
    const todaySeed = Math.floor(Date.now() / 86400000);
    
    // Sort products using the daily seed to ensure consistency for all users throughout the day
    const shuffled = [...products].sort((a, b) => {
      const hashA = (todaySeed * (a.id.charCodeAt(0) || 1)) % 100;
      const hashB = (todaySeed * (b.id.charCodeAt(0) || 1)) % 100;
      return hashA - hashB;
    });

    setDailyPicks(shuffled.slice(0, 8));
  }, [products]);

  if (dailyPicks.length === 0) return null;

  return (
    <div className="w-full pt-4">
      <h3 className="mb-4 px-1 text-lg font-black text-zinc-900">{t.title}</h3>
      
      {/* Horizontal Scroll Container */}
      <div className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto pb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {dailyPicks.map((product) => (
          <div 
            key={product.id} 
            className="w-[160px] sm:w-[180px] md:w-[200px] lg:w-[220px] shrink-0 snap-start"
          >
            <ProductCard 
              product={product} 
              activeLang={activeLang} 
              onClick={() => onProductClick(product)} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}