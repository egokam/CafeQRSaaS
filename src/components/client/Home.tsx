"use client";

import type { Lang, Product, Category } from "@/app/[cafeSlug]/[tableId]/page";
import Banner from "./home/Banner";
import TopPicks from "./home/TopPicks";
import Ad from "./home/Ad";

interface ClientHomeProps {
  activeLang: Lang;
  products: Product[];
  categories: Category[];
  onCategorySelect: (categoryId: string) => void;
  onProductClick: (product: Product) => void;
}

export default function ClientHome({ activeLang, products, categories, onCategorySelect, onProductClick }: ClientHomeProps) {
  const dir = activeLang === 'ar' ? 'rtl' : 'ltr';

  return (
    <div className="flex flex-col space-y-6 px-5 py-4 animate-in fade-in duration-300" dir={dir}>
      <Banner 
        categories={categories}
        activeLang={activeLang} 
        onCategoryClick={onCategorySelect} 
      />
      
      <TopPicks 
        products={products} 
        activeLang={activeLang} 
        onProductClick={onProductClick} 
      />

      <Ad slot="5935057769" />
    </div>
  );
}