"use client";

import { AlertTriangle, CreditCard } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  endsAt: string | null;
  status: string;
  activeLang: string;
  onRenewClick: () => void;
  dir: string;
}

const TRANSLATIONS = {
  en: {
    expired: "Your subscription has expired! Please renew immediately to restore cafe services and avoid data loss.",
    expiringSoon: (days: number) => `Warning: Your subscription expires in ${days} day(s). Renew now to avoid service interruption.`,
    renewBtn: "Renew Now"
  },
  fr: {
    expired: "Votre abonnement a expiré ! Veuillez le renouveler immédiatement pour restaurer les services.",
    expiringSoon: (days: number) => `Attention : Votre abonnement expire dans ${days} jour(s). Renouvelez maintenant pour éviter toute interruption.`,
    renewBtn: "Renouveler"
  },
  ar: {
    expired: "لقد انتهى اشتراكك! يرجى التجديد فوراً لاستعادة عمل النظام في المقهى الخاص بك.",
    expiringSoon: (days: number) => `تنبيه: سينتهي اشتراكك خلال ${days} أيام. يرجى التجديد الآن لتجنب توقف النظام في المقهى.`,
    renewBtn: "تجديد الاشتراك"
  }
};

export default function SubscriptionWarningBar({ endsAt, status, activeLang, onRenewClick, dir }: Props) {
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!endsAt) return;
    const endDate = new Date(endsAt);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysRemaining(diffDays);
  }, [endsAt]);

  if (status === 'lifetime') return null;
  if (daysRemaining === null || daysRemaining > 7) return null;

  const t = TRANSLATIONS[activeLang as keyof typeof TRANSLATIONS] || TRANSLATIONS.en;
  const isExpired = daysRemaining <= 0 || status === 'suspended' || status === 'expired';

  return (
    <div 
      className="w-full bg-red-600 text-white px-4 py-2.5 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm font-bold z-[100] relative shadow-md" 
      dir={dir}
    >
      <div className="flex items-center gap-2 text-center">
        <AlertTriangle size={18} className="shrink-0 animate-pulse text-yellow-300" />
        <span>{isExpired ? t.expired : t.expiringSoon(daysRemaining)}</span>
      </div>
      <button 
        onClick={onRenewClick} 
        className="flex items-center gap-1.5 bg-white text-red-600 px-4 py-1.5 rounded-full text-xs hover:bg-red-50 transition-transform active:scale-95 shadow-sm font-black uppercase tracking-wide"
      >
        <CreditCard size={14} />
        {t.renewBtn}
      </button>
    </div>
  );
}