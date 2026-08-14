"use client";

import { ShoppingCart } from "lucide-react";

interface CartProps {
  cartItemCount: number;
  onClick: () => void;
}

export default function Cart({ cartItemCount, onClick }: CartProps) {
  return (
    <button
      onClick={onClick}
      className="relative flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-full bg-black text-white shadow-md transition-transform active:scale-95"
      aria-label="Open cart"
    >
      <ShoppingCart size={24} strokeWidth={2} />
      {cartItemCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-black leading-none text-white ring-2 ring-white">
          {cartItemCount}
        </span>
      )}
    </button>
  );
}