"use client";

import { Minus, Plus, Check } from "lucide-react";

interface Extra {
  id: string;
  name: string;
  price: number;
}

interface ModifiersProps {
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
  spicyLevel: number;
  setSpicyLevel: React.Dispatch<React.SetStateAction<number>>;
  selectedExtras: string[];
  setSelectedExtras: React.Dispatch<React.SetStateAction<string[]>>;
  availableExtras: Extra[];
}

export default function Modifiers({
  quantity,
  setQuantity,
  spicyLevel,
  setSpicyLevel,
  selectedExtras,
  setSelectedExtras,
  availableExtras,
}: ModifiersProps) {
  const toggleExtra = (id: string) => {
    setSelectedExtras((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDecrease = () => {
    if (quantity > 1) setQuantity((q) => q - 1);
  };

  const handleIncrease = () => {
    setQuantity((q) => q + 1);
  };

  return (
    <div className="px-6 pb-6">
      {/* Top Row: Spicy Slider & Portion */}
      <div className="mb-8 flex items-end justify-between">
        
        {/* Spicy Slider (Temporary UI) */}
        <div className="flex w-[55%] flex-col">
          <h3 className="mb-3 text-[17px] font-black text-black">Spicy</h3>
          <div className="relative flex h-1 w-full items-center rounded-full bg-gray-200">
            {/* Active Track */}
            <div
              className="absolute h-1 rounded-full bg-red-600 transition-all"
              style={{ width: `${(spicyLevel / 2) * 100}%` }}
            />
            {/* Hidden Input for interaction */}
            <input
              type="range"
              min="0"
              max="2"
              step="1"
              value={spicyLevel}
              onChange={(e) => setSpicyLevel(Number(e.target.value))}
              className="absolute z-10 w-full cursor-pointer opacity-0"
            />
            {/* Thumb Indicator */}
            <div
              className="pointer-events-none absolute h-3 w-3 bg-red-600 transition-all"
              style={{ left: `calc(${(spicyLevel / 2) * 100}% - 6px)` }}
            />
          </div>
          <div className="mt-2 flex justify-between px-1">
            <span className="text-[10px] font-bold text-green-500">Mild</span>
            <span className="text-[10px] font-bold text-red-600">Hot</span>
          </div>
        </div>

        {/* Portion Control */}
        <div className="flex flex-col items-center">
          <h3 className="mb-2 text-[14px] font-black text-black self-start">Portion</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDecrease}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#001BFF] text-white active:scale-95 transition-transform"
            >
              <Minus size={24} strokeWidth={2.5} />
            </button>
            <span className="w-4 text-center text-[20px] font-black text-black">
              {quantity}
            </span>
            <button
              onClick={handleIncrease}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#001BFF] text-white active:scale-95 transition-transform"
            >
              <Plus size={24} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Extras Checkboxes */}
      <div className="flex flex-col gap-4">
        {availableExtras.map((extra) => {
          const isSelected = selectedExtras.includes(extra.id);
          
          return (
            <div
              key={extra.id}
              onClick={() => toggleExtra(extra.id)}
              className="flex cursor-pointer items-center gap-3 select-none"
            >
              <h3 className="text-[17px] font-black text-black">
                {extra.name}
              </h3>
              
              <div
                className={`flex h-[18px] w-[18px] items-center justify-center rounded-[4px] border-[2px] transition-colors ${
                  isSelected
                    ? "border-[#001BFF] bg-transparent"
                    : "border-black bg-transparent"
                }`}
              >
                {isSelected && <Check size={14} strokeWidth={4} className="text-[#001BFF]" />}
              </div>

              {extra.price > 0 && (
                <span className="text-[14px] font-black text-black">
                  +{extra.price} <span className="text-[10px]">MAD</span>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}