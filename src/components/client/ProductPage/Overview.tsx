"use client";

import { ImageOff } from "lucide-react";
import type { Product, Lang } from "@/app/[cafeSlug]/[tableId]/page";

interface OverviewProps {
  product: Product;
  activeLang: Lang;
}

export default function Overview({ product, activeLang }: OverviewProps) {
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
      {/* Product Image */}
      <div className="relative mb-6 flex w-full items-center justify-center">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={name}
            className="aspect-square w-full max-w-[18rem] rounded-[2rem] object-cover shadow-lg"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex aspect-square w-full max-w-[18rem] items-center justify-center rounded-[2rem] bg-gray-50 text-gray-300">
            <ImageOff size={48} />
          </div>
        )}
      </div>

      {/* Title & Description */}
      <div className="mb-8 pt-5 flex flex-col">
        <h2 className="mb-5 text-2xl text font-black leading-tight text-black">
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