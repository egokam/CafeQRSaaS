"use client";

import { ImageOff } from "lucide-react";
import type { Product, Lang } from "@/app/[cafeSlug]/[tableId]/page";
import { formatMAD } from "@/app/[cafeSlug]/[tableId]/page";

interface ProductCardProps {
  product: Product;
  activeLang: Lang;
  onClick: () => void;
}

export default function ProductCard({ product, activeLang, onClick }: ProductCardProps) {
  const dir = activeLang === "ar" ? "rtl" : "ltr";

  const getProductName = (p: Product) => {
    if (activeLang === "ar" && p.name_ar) return p.name_ar;
    if (activeLang === "fr" && p.name_fr) return p.name_fr;
    return p.name_en || p.name_fr || p.name_ar || "";
  };

  const getProductDescription = (p: Product) => {
    if (activeLang === "ar" && p.description_ar) return p.description_ar;
    if (activeLang === "fr" && p.description_fr) return p.description_fr;
    return p.description_en || p.description_fr || p.description_ar || "";
  };

  const name = getProductName(product);
  const description = getProductDescription(product);

  return (
    <button
      onClick={onClick}
      className="flex w-full flex-col overflow-hidden rounded-[2rem] border border-black/30 bg-white p-3 shadow-design-card transition-transform active:scale-95 text-start"
      dir={dir}
    >
      <div className="relative mb-3 flex aspect-square w-full items-center justify-center overflow-hidden rounded-[1.5rem] bg-[#F5F5F5]">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={name}
            className="h-full w-full object-cover" 
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <ImageOff size={32} />
          </div>
        )}
      </div>

      <div className="flex flex-col w-full flex-1 px-1">
        <h3 className="line-clamp-1 text-[16px] font-black leading-tight text-black">
          {name}
        </h3>
        {description && (
          <p className="mt-1 line-clamp-1 text-[12px] font-bold text-gray-400">
            {description}
          </p>
        )}
      </div>

      <div className="mt-3 flex w-full items-baseline justify-end gap-1 px-1">
        <span className="text-[11px] font-black text-gray-400">MAD</span>
        <span className="text-[38px] font-black leading-none text-black tracking-tighter">
          {formatMAD(product.price)}
        </span>
      </div>
    </button>
  );
}