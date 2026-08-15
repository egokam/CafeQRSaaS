"use client";

import { Minus, Plus, Check } from "lucide-react";

interface ModifiersProps {
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
  modifiers: any[]; // تم التعديل لتجنب أخطاء الأنواع
  selections: Record<string, number>;
  setSelections: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export default function Modifiers({
  quantity,
  setQuantity,
  modifiers,
  selections,
  setSelections,
}: ModifiersProps) {
  
  const handleDecreaseQuantity = () => {
    if (quantity > 1) setQuantity((q) => q - 1);
  };

  const handleIncreaseQuantity = () => {
    setQuantity((q) => q + 1);
  };

  const handleSingleSelection = (groupId: string, optionId: string) => {
    setSelections((prev) => {
      const newState = { ...prev };
      const currentGroup = modifiers.find((m) => m.id === groupId);
      // 🌟 التعديل هنا: قراءة المصفوفة بالاسمين
      const options = currentGroup?.modifier_options || currentGroup?.options || [];
      options.forEach((opt: any) => delete newState[opt.id]);
      newState[optionId] = 1;
      return newState;
    });
  };

  const handleMultipleSelection = (optionId: string, isChecked: boolean, max: number, currentSelectedCount: number) => {
    setSelections((prev) => {
      const newState = { ...prev };
      if (isChecked) {
        if (currentSelectedCount < max) newState[optionId] = 1;
      } else {
        delete newState[optionId];
      }
      return newState;
    });
  };

  const handleIncremental = (optionId: string, delta: number, max: number) => {
    setSelections((prev) => {
      const newState = { ...prev };
      const currentQty = newState[optionId] || 0;
      const newQty = currentQty + delta;

      if (newQty <= 0) {
        delete newState[optionId];
      } else if (newQty <= max) {
        newState[optionId] = newQty;
      }
      return newState;
    });
  };

  const getTranslatedName = (item: { name_ar?: string | null; name_en?: string | null; name_fr?: string | null }) => {
    return item.name_ar || item.name_en || item.name_fr || "";
  };

  // حماية إضافية في حالة عدم وجود إضافات
  if (!modifiers || modifiers.length === 0) return null;

  return (
    <div className="flex flex-col gap-8 px-6 pb-6">
      
      <div className="flex flex-col items-center">
        <h3 className="mb-2 text-[14px] font-black text-black self-start">Portion</h3>
        <div className="flex items-center gap-3 self-start">
          <button
            onClick={handleDecreaseQuantity}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#001BFF] text-white active:scale-95 transition-transform"
          >
            <Minus size={24} strokeWidth={2.5} />
          </button>
          <span className="w-4 text-center text-[20px] font-black text-black">
            {quantity}
          </span>
          <button
            onClick={handleIncreaseQuantity}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#001BFF] text-white active:scale-95 transition-transform"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {modifiers.map((group) => {
        const groupName = getTranslatedName(group);
        // 🌟 التعديل الأساسي هنا: المتغير الذكي للخيارات
        const options = group.modifier_options || group.options || [];
        const selectedCount = options.reduce((count: number, opt: any) => count + (selections[opt.id] ? 1 : 0), 0);

        return (
          <div key={group.id} className="flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[17px] font-black text-black">{groupName}</h3>
              {group.min_selections > 0 && <span className="text-[10px] font-bold text-red-500 uppercase">Required</span>}
            </div>

            {group.type === "single_choice" && (
              <div className="flex flex-col gap-4">
                {options.map((option: any) => {
                  const isSelected = !!selections[option.id];
                  return (
                    <div
                      key={option.id}
                      onClick={() => handleSingleSelection(group.id, option.id)}
                      className="flex cursor-pointer items-center justify-between gap-3 select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border-[2px] transition-colors ${
                            isSelected ? "border-[#001BFF] bg-transparent" : "border-black bg-transparent"
                          }`}
                        >
                          {isSelected && <div className="h-[10px] w-[10px] rounded-full bg-[#001BFF]" />}
                        </div>
                        <h3 className="text-[16px] font-bold text-black">{getTranslatedName(option)}</h3>
                      </div>
                      {Number(option.price_adjustment) > 0 && (
                        <span className="text-[14px] font-black text-black">
                          +{Number(option.price_adjustment)} <span className="text-[10px]">MAD</span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {group.type === "multiple_choice" && (
              <div className="flex flex-col gap-4">
                {options.map((option: any) => {
                  const isSelected = !!selections[option.id];
                  const isDisabled = !isSelected && selectedCount >= group.max_selections;
                  
                  return (
                    <div
                      key={option.id}
                      onClick={() => !isDisabled && handleMultipleSelection(option.id, !isSelected, group.max_selections, selectedCount)}
                      className={`flex items-center justify-between gap-3 select-none ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-[18px] w-[18px] items-center justify-center rounded-[4px] border-[2px] transition-colors ${
                            isSelected ? "border-[#001BFF] bg-transparent" : "border-black bg-transparent"
                          }`}
                        >
                          {isSelected && <Check size={14} strokeWidth={4} className="text-[#001BFF]" />}
                        </div>
                        <h3 className="text-[16px] font-bold text-black">{getTranslatedName(option)}</h3>
                      </div>
                      {Number(option.price_adjustment) > 0 && (
                        <span className="text-[14px] font-black text-black">
                          +{Number(option.price_adjustment)} <span className="text-[10px]">MAD</span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {group.type === "incremental" && (
              <div className="flex flex-col gap-4">
                {options.map((option: any) => {
                  const qty = selections[option.id] || 0;
                  return (
                    <div key={option.id} className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <h3 className="text-[16px] font-bold text-black">{getTranslatedName(option)}</h3>
                        {Number(option.price_adjustment) > 0 && (
                          <span className="text-[14px] font-black text-gray-500">
                            +{Number(option.price_adjustment)} MAD
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleIncremental(option.id, -1, group.max_selections)}
                          disabled={qty === 0}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-black active:scale-95 disabled:opacity-30 transition-transform"
                        >
                          <Minus size={18} strokeWidth={2.5} />
                        </button>
                        <span className="w-4 text-center text-[16px] font-black text-black">{qty}</span>
                        <button
                          onClick={() => handleIncremental(option.id, 1, group.max_selections)}
                          disabled={qty >= group.max_selections}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#001BFF] text-white active:scale-95 disabled:opacity-30 transition-transform"
                        >
                          <Plus size={18} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {group.type === "slider" && options.length > 0 && (
              <div className="flex w-full flex-col pt-2">
                <div className="relative flex h-1 w-full items-center rounded-full bg-gray-200">
                  {(() => {
                    const selectedIndex = Math.max(0, options.findIndex((opt: any) => !!selections[opt.id]));
                    const percentage = options.length > 1 ? (selectedIndex / (options.length - 1)) * 100 : 0;
                    
                    return (
                      <>
                        <div
                          className="absolute h-1 rounded-full bg-red-600 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                        <input
                          type="range"
                          min="0"
                          max={options.length - 1}
                          step="1"
                          value={selectedIndex}
                          onChange={(e) => {
                            const opt = options[Number(e.target.value)];
                            if (opt) handleSingleSelection(group.id, opt.id);
                          }}
                          className="absolute z-10 w-full cursor-pointer opacity-0"
                        />
                        <div
                          className="pointer-events-none absolute h-3 w-3 bg-red-600 transition-all rounded-full"
                          style={{ left: `calc(${percentage}% - 6px)` }}
                        />
                      </>
                    );
                  })()}
                </div>
                <div className="mt-3 flex justify-between px-1">
                  {options.map((opt: any) => (
                    <span key={opt.id} className="text-[10px] font-bold text-gray-500">
                      {getTranslatedName(opt)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        );
      })}
    </div>
  );
}