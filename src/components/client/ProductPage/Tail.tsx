"use client";

import { formatMAD } from "@/app/[cafeSlug]/[tableId]/page";

interface TailProps {
  finalPrice: number;
  onAddToCart: () => void;
}

export default function Tail({ finalPrice, onAddToCart }: TailProps) {
  return (
    <div className="bg-white px-5 pb-8 pt-4">
      <div className="flex items-center gap-3">
        {/* زر السعر (أزرق) */}
        <div className="flex h-16 shrink-0 items-center justify-center rounded-[1.25rem] bg-[#001BFF] px-6 text-white shadow-md">
          <span className="text-[28px] font-black leading-none tracking-tighter">
            {formatMAD(finalPrice)}
          </span>
          <span className="ml-1 mt-2 text-[10px] font-black uppercase">
            MAD
          </span>
        </div>

        {/* زر إضافة للسلة (أسود) */}
        <button
          onClick={onAddToCart}
          className="flex h-16 flex-1 items-center justify-center rounded-[1.25rem] bg-black text-[17px] font-black text-white shadow-md transition-transform active:scale-95"
        >
          Add To Cart
        </button>
      </div>
    </div>
  );
}