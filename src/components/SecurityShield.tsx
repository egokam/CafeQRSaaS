"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

// نظام الترجمة الخاص بالتنبيه
const TRANSLATIONS: Record<string, any> = {
  en: {
    prefix: "ALERT:",
    message: "You are not allowed to copy content or view source"
  },
  fr: {
    prefix: "ALERTE :",
    message: "Vous n'êtes pas autorisé à copier le contenu ou à afficher la source"
  },
  ar: {
    prefix: "تنبيه:",
    message: "غير مسموح لك بنسخ المحتوى أو عرض مصدر الصفحة"
  }
};

export default function SecurityShield() {
  const [showAlert, setShowAlert] = useState(false);
  const [lang, setLang] = useState("en");

  useEffect(() => {
    // 1. تحديد لغة الصفحة الحالية لضبط لغة التنبيه
    const currentLang = localStorage.getItem("app_lang") || document.documentElement.lang || "en";
    if (["en", "fr", "ar"].includes(currentLang)) {
      setLang(currentLang);
    }

    // 2. دالة إظهار التنبيه ومنع الحدث
    const triggerAlert = (e: Event) => {
      e.preventDefault();
      setShowAlert(true);
      // إخفاء التنبيه بعد 3 ثوانٍ
      setTimeout(() => setShowAlert(false), 3000);
    };

    // 3. مراقبة اختصارات لوحة المفاتيح
    const handleKeyDown = (e: KeyboardEvent) => {
      // منع زر F12
      if (e.key === "F12") {
        triggerAlert(e);
      }
      
      // منع Ctrl+U (عرض المصدر) و Ctrl+C (النسخ) و Ctrl+S (الحفظ)
      if (e.ctrlKey && ["u", "U", "c", "C", "s", "S"].includes(e.key)) {
        triggerAlert(e);
      }
      
      // منع Ctrl+Shift+I و Ctrl+Shift+J و Ctrl+Shift+C (أدوات المطور)
      if (e.ctrlKey && e.shiftKey && ["i", "I", "j", "J", "c", "C"].includes(e.key)) {
        triggerAlert(e);
      }
    };

    // 4. مراقبة الزر الأيمن للفأرة وعمليات النسخ
    const handleContextMenu = (e: MouseEvent) => triggerAlert(e);
    const handleCopy = (e: ClipboardEvent) => triggerAlert(e);

    // تفعيل المراقبة
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("copy", handleCopy);

    return () => {
      // تنظيف المراقبة عند إغلاق الصفحة
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("copy", handleCopy);
    };
  }, []);

  if (!showAlert) return null;

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <div 
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] animate-in fade-in slide-in-from-top-8 duration-300 pointer-events-none"
      dir={dir}
    >
      <div className="bg-[#fef2f2] border border-[#fca5a5] px-6 py-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(239,68,68,0.2)] flex items-center gap-4 min-w-[320px] max-w-md">
        <AlertTriangle 
          className="text-amber-500 shrink-0" 
          size={26} 
          fill="#fef3c7" 
        />
        <p className="text-[15px] text-slate-600 flex-1">
          <strong className="font-black text-slate-800 mr-1 ml-1">
            {TRANSLATIONS[lang].prefix}
          </strong> 
          <span className="font-medium">
            {TRANSLATIONS[lang].message}
          </span>
        </p>
      </div>
    </div>
  );
}