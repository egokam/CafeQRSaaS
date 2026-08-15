"use client";

import { ShoppingCart } from "lucide-react";

const TRANSLATIONS = {
  en: { ariaLabel: "Open cart" },
  fr: { ariaLabel: "Ouvrir le panier" },
  ar: { ariaLabel: "فتح السلة" }
};

interface CartProps {
  cartItemCount: number;
  onClick: () => void;
  activeLang?: "en" | "fr" | "ar";
}

export default function Cart({ cartItemCount, onClick, activeLang = "en" }: CartProps) {
  const isAr = activeLang === "ar";

  return (
    <button
      onClick={onClick}
      className="relative flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-full bg-black text-white shadow-md transition-transform active:scale-95"
      aria-label={TRANSLATIONS[activeLang].ariaLabel}
    >
      <ShoppingCart size={24} strokeWidth={2} />
      {cartItemCount > 0 && (
        <span className={`absolute -top-1 ${isAr ? '-left-1' : '-right-1'} flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-black leading-none text-white ring-2 ring-white`}>
          {cartItemCount}
        </span>
      )}
    </button>
  );
}