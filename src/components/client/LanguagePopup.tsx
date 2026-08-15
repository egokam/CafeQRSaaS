"use client";

import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

interface LanguagePopupProps {
  onSelect: (lang: "en" | "fr" | "ar") => void;
}

export default function LanguagePopup({ onSelect }: LanguagePopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  // تأخير بسيط لعرض النافذة بتأثير حركي ناعم بعد التحميل
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleSelect = (lang: "en" | "fr" | "ar") => {
    setIsVisible(false);
    setTimeout(() => {
      onSelect(lang);
    }, 300); // انتظار انتهاء الأنيميشن قبل إغلاق المكون كلياً
  };

  return (
    <div 
      className={`fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-[8px] p-4 transition-opacity duration-300 ease-in-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div 
        className={`bg-white w-full max-w-[320px] rounded-[2rem] p-7 shadow-2xl transition-all duration-300 ease-in-out ${
          isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        <h2 className="text-[19px] font-black text-center text-black mb-5">
          Pick Your Language
        </h2>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => handleSelect('ar')} 
            className="flex items-center justify-between w-full p-3.5 border border-gray-200 rounded-[1rem] bg-white hover:bg-gray-50 active:scale-[0.98] transition-all"
            dir="ltr"
          >
            <div className="flex items-center gap-3.5">
              <img src="https://flagcdn.com/w40/sa.png" alt="Arabic" className="w-7 h-7 rounded-full object-cover shadow-sm border border-black/5" />
              <span className="font-bold text-black text-[15px]">العربية</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </button>

          <button 
            onClick={() => handleSelect('fr')} 
            className="flex items-center justify-between w-full p-3.5 border border-gray-200 rounded-[1rem] bg-white hover:bg-gray-50 active:scale-[0.98] transition-all"
            dir="ltr"
          >
            <div className="flex items-center gap-3.5">
              <img src="https://flagcdn.com/w40/fr.png" alt="French" className="w-7 h-7 rounded-full object-cover shadow-sm border border-black/5" />
              <span className="font-bold text-black text-[15px]">Français</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </button>

          <button 
            onClick={() => handleSelect('en')} 
            className="flex items-center justify-between w-full p-3.5 border border-gray-200 rounded-[1rem] bg-white hover:bg-gray-50 active:scale-[0.98] transition-all"
            dir="ltr"
          >
            <div className="flex items-center gap-3.5">
              <img src="https://flagcdn.com/w40/gb.png" alt="English" className="w-7 h-7 rounded-full object-cover shadow-sm border border-black/5" />
              <span className="font-bold text-black text-[15px]">English</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}