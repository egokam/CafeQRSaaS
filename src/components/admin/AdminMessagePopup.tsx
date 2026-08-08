"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, Globe, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminMessagePopup({ cafeId }: { cafeId: string }) {
  const [message, setMessage] = useState<{ id: string; text: string } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [lang, setLang] = useState<"ar" | "fr" | "en">("ar");

  useEffect(() => {
    const fetchMessage = async () => {
      if (!cafeId) return;

      const { data: cafe } = await supabase
        .from("cafes")
        .select("subscription_status")
        .eq("id", cafeId)
        .single();

      if (cafe?.subscription_status === "paused") {
        const { data: receipt } = await supabase
          .from("payment_receipts")
          .select("id, rejection_reason")
          .eq("cafe_id", cafeId)
          .eq("status", "rejected")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (receipt?.rejection_reason) {
          // التحقق مما إذا كان العميل قد قرأ هذه الرسالة مسبقاً
          const isRead = localStorage.getItem(`msg_read_${receipt.id}`);
          if (!isRead) {
            setMessage({ id: receipt.id, text: receipt.rejection_reason });
            setIsVisible(true);
          }
        }
      }
    };

    fetchMessage();
  }, [cafeId]);

  const handleMarkAsRead = () => {
    if (message) {
      localStorage.setItem(`msg_read_${message.id}`, "true");
      setIsVisible(false);
    }
  };

  const handleTranslateText = () => {
    if (message) {
      const url = `https://translate.google.com/?sl=auto&tl=${lang}&text=${encodeURIComponent(message.text)}&op=translate`;
      window.open(url, "_blank");
    }
  };

  if (!isVisible || !message) return null;

  const t = {
    ar: {
      title: "رسالة هامة من الإدارة",
      sub: "تم إيقاف تفعيل حسابك بسبب الملاحظة التالية:",
      markRead: "تحديد كمقروء وإخفاء",
      translateMsg: "ترجمة النص",
    },
    fr: {
      title: "Message important de l'administration",
      sub: "Votre compte a été suspendu suite à cette remarque :",
      markRead: "Marquer comme lu et masquer",
      translateMsg: "Traduire le texte",
    },
    en: {
      title: "Important Admin Message",
      sub: "Your account activation was paused due to the following note:",
      markRead: "Mark as read & dismiss",
      translateMsg: "Translate text",
    }
  };

  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <div className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 z-[100] w-full max-w-[90vw] sm:max-w-md animate-in slide-in-from-bottom-8 fade-in duration-500 font-sans">
      <div className="bg-white rounded-[2rem] shadow-2xl border-2 border-rose-200 overflow-hidden" dir={dir}>
        
        {/* Header & Lang Switcher */}
        <div className="bg-rose-50 px-6 py-4 flex justify-between items-center border-b border-rose-100">
          <div className="flex items-center gap-2 text-rose-600 font-black">
            <AlertTriangle size={20} />
            <span>{t[lang].title}</span>
          </div>
          <div className="flex bg-white rounded-lg border border-rose-200 p-1 shadow-sm gap-1" dir="ltr">
            <button onClick={() => setLang("en")} className={`text-[10px] font-bold px-2 py-1 rounded-md transition-colors ${lang === "en" ? "bg-rose-600 text-white" : "text-rose-400 hover:bg-rose-50"}`}>EN</button>
            <button onClick={() => setLang("fr")} className={`text-[10px] font-bold px-2 py-1 rounded-md transition-colors ${lang === "fr" ? "bg-rose-600 text-white" : "text-rose-400 hover:bg-rose-50"}`}>FR</button>
            <button onClick={() => setLang("ar")} className={`text-[10px] font-bold px-2 py-1 rounded-md transition-colors ${lang === "ar" ? "bg-rose-600 text-white" : "text-rose-400 hover:bg-rose-50"}`}>AR</button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm font-bold text-zinc-500 mb-3">{t[lang].sub}</p>
          <div className="bg-zinc-900 text-rose-200 p-4 rounded-2xl font-mono text-sm shadow-inner border border-zinc-800 leading-relaxed">
            "{message.text}"
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <button 
              onClick={handleTranslateText}
              className="flex-1 flex justify-center items-center gap-2 bg-zinc-100 text-zinc-700 py-3 rounded-xl font-bold text-xs hover:bg-zinc-200 transition-colors border border-zinc-200"
            >
              <Globe size={16} /> {t[lang].translateMsg} <ExternalLink size={14} className="opacity-50" />
            </button>
            
            <button 
              onClick={handleMarkAsRead}
              className="flex-[1.5] flex justify-center items-center gap-2 bg-rose-600 text-white py-3 rounded-xl font-black text-xs hover:bg-rose-700 transition-colors shadow-lg shadow-rose-600/20 active:scale-95"
            >
              <CheckCircle2 size={16} /> {t[lang].markRead}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}