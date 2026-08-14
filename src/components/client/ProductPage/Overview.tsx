"use client";

import { ArrowLeft, Search, ImageOff } from "lucide-react";
import type { Product, Lang } from "@/app/[cafeSlug]/[tableId]/page";

interface OverviewProps {
  product: Product;
  activeLang: Lang;
  onClose: () => void;
}

export default function Overview({ product, activeLang, onClose }: OverviewProps) {
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
    <div className="flex flex-col px-6 pt-4" dir={dir}>
      {/* Top Actions */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white transition-transform active:scale-95"
          aria-label="Go back"
        >
          <ArrowLeft size={28} strokeWidth={2.5} className="text-black rtl:rotate-180" />
        </button>
        <button
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white transition-transform active:scale-95"
          aria-label="Search"
        >
          <Search size={26} strokeWidth={2.5} className="text-black" />
        </button>
      </div>

      {/* Product Image */}
      <div className="relative mb-6 flex h-[18rem] w-full items-center justify-center">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={name}
            className="h-full w-full object-contain drop-shadow-2xl"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-[2rem] bg-gray-50 text-gray-300">
            <ImageOff size={48} />
          </div>
        )}
      </div>

      {/* Title & Description */}
      <div className="mb-8 flex flex-col">
        <h2 className="mb-4 text-3xl font-black leading-tight text-black">
          {name}
        </h2>
        {description && (
          <p className="text-[15px] font-medium leading-relaxed text-gray-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}