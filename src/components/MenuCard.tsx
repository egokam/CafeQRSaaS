"use client";

import { ImageOff, Plus } from "lucide-react";
import { useCart, type CartItem } from "../store/useCart";

type MenuCardProduct = {
  id: string;
  name_ar?: string | null;
  name_en?: string | null;
  name_fr?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  description_fr?: string | null;
  image_url?: string | null;
  price: number | string;
  [key: string]: unknown;
};

export default function MenuCard({ product, lang }: { product: MenuCardProduct, lang: string }) {
  const addItem = useCart((state) => state.addItem);

  const name = lang === "en" && product.name_en ? product.name_en :
               lang === "fr" && product.name_fr ? product.name_fr :
               product.name_ar || "Item";

  const description = lang === "en" && product.description_en ? product.description_en :
                      lang === "fr" && product.description_fr ? product.description_fr :
                      product.description_ar || product.description_en || product.description_fr;

  // البناء الدقيق المطابق لـ CartItem لتجنب أي أخطاء وقت التشغيل
  const cartProduct: CartItem = {
    id: product.id, 
    product_id: product.id,
    name_ar: product.name_ar || product.name_en || product.name_fr || "Item",
    name_en: product.name_en || undefined,
    name_fr: product.name_fr || undefined,
    price: Number(product.price),
    quantity: 1,
    image_url: product.image_url || "",
    modifiers: {},
  };

  return (
    <article className="group flex min-h-36 w-full items-center gap-4 rounded-[2rem] border border-gray-200 bg-white p-3 shadow-[0_2px_14px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.10)]" dir="ltr">
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[1.35rem] bg-gray-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <ImageOff size={28} />
          </div>
        )}

        <button
          onClick={() => addItem(cartProduct)}
          className="absolute bottom-1.5 left-1.5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#0a0a0a] text-[#9b7565] shadow-[0_8px_18px_rgba(0,0,0,0.35)] transition-transform hover:scale-105 active:scale-95"
          aria-label={`Add ${name}`}
        >
          <Plus size={25} strokeWidth={2.8} />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-end pr-2 text-right" dir={lang === "ar" ? "rtl" : "ltr"}>
        <h3 className="max-w-full truncate text-xl font-black uppercase tracking-normal text-black">
          {name}
        </h3>
        {description && (
          <p className="mt-2 line-clamp-2 text-sm font-medium leading-relaxed text-gray-500">
            {description}
          </p>
        )}
        <p className="mt-4 flex items-baseline gap-2 text-xl font-black text-black">
          <span className="text-xs font-black uppercase text-gray-500">MAD</span>
          <span>{product.price}</span>
        </p>
      </div>
    </article>
  );
}