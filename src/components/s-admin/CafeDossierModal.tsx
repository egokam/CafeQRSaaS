"use client";

import { useState, useEffect } from "react";
import { UserCog, AlertOctagon, Trash2, XCircle, Loader2, ChevronDown, History, ShieldCheck, Calendar, BarChart2 } from "lucide-react";

// 🌟 Custom Premium Dropdown 
const PremiumSelect = ({ value, onChange, options, dir }: { value: string, onChange: (val: string) => void, options: {label: string, value: string}[], dir: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-zinc-950 border border-white/10 rounded-xl p-4 text-sm font-mono text-white focus:outline-none focus:border-amber-400/50 transition-colors flex justify-between items-center uppercase font-bold hover:bg-zinc-900 ${isOpen ? 'border-amber-400/50 shadow-[0_0_15px_-3px_rgba(251,191,36,0.15)]' : ''}`}
        dir="ltr"
      >
        <span>{options.find(o => o.value === value)?.label || value}</span>
        <ChevronDown size={16} className={`text-zinc-500 transition-transform duration-300 ${isOpen ? "rotate-180 text-amber-400" : ""}`} />
      </button>
      
      {isOpen && (
        <div className={`absolute left-0 right-0 top-full mt-2 z-[60] bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir="ltr">
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={`p-4 text-sm font-mono cursor-pointer transition-colors ${value === opt.value ? 'text-amber-400 bg-amber-400/10 font-black border-l-2 border-amber-400' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'}`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function CafeDossierModal({ 
  cafe, 
  onClose, 
  onForceSave, 
  onUpdateAuth, 
  onDeepDelete,
  t, 
  dir, 
  isArabic 
}: any) {
  const [newDateInput, setNewDateInput] = useState("");
  const [newStatusInput, setNewStatusInput] = useState("");
  const [newPlanInput, setNewPlanInput] = useState(""); 
  const [editOwnerEmail, setEditOwnerEmail] = useState("");
  const [editOwnerPassword, setEditOwnerPassword] = useState("");
  const [isUpdatingAuth, setIsUpdatingAuth] = useState(false);

  useEffect(() => {
    if (cafe) {
      setNewDateInput(cafe.subscription_ends_at ? cafe.subscription_ends_at.split('T')[0] : "");
      setNewStatusInput(cafe.subscription_status || "active");
      setNewPlanInput(cafe.plan_type || "silver"); 
      setEditOwnerEmail(cafe.owner_email || "");
      setEditOwnerPassword("");
    }
  }, [cafe]);

  const planOptionsShort = [
    { label: t("factory.planSilverShort") || "Silver", value: "silver" },
    { label: t("factory.planGoldShort") || "Gold", value: "gold" },
    { label: t("factory.planDiamondShort") || "Diamond", value: "diamond" }
  ];

  const statusOptions = [
    { label: t("dossier.statusActive") || "ACTIVE", value: "active" },
    { label: t("dossier.statusPaused") || "PAUSED", value: "paused" }
  ];

  // 🌟 MOCK PAYMENT HISTORY DATA
  const mockPaymentHistory = [
    { id: 1, date: "2026-07-27", amount: "2990.00", plan: "GOLD", status: "PAID", method: "Credit Card" },
    { id: 2, date: "2026-06-27", amount: "2990.00", plan: "GOLD", status: "PAID", method: "Credit Card" },
    { id: 3, date: "2026-05-27", amount: "2000.00", plan: "SILVER", status: "PAID", method: "Bank Transfer" },
  ];

  if (!cafe) return null;

  // الحسابات الخاصة بمدة الصلاحية والاستهلاك التي نقلناها للنافذة الجانبية
  const ends = cafe.subscription_ends_at ? new Date(cafe.subscription_ends_at) : new Date();
  const diffDays = Math.ceil((ends.getTime() - Date.now()) / (1000 * 3600 * 24));
  const productsCount = cafe.products?.[0]?.count || 0;
  const ordersCount = cafe.orders?.[0]?.count || 0;

  return (
    <div className={`fixed inset-0 z-50 flex ${isArabic ? 'justify-start' : 'justify-end'} bg-black/60 backdrop-blur-sm animate-in fade-in duration-300`}>
      <div className={`w-full max-w-md bg-zinc-950 border-white/10 h-full overflow-y-auto hide-scrollbar p-6 sm:p-8 flex flex-col justify-between shadow-2xl animate-in ${isArabic ? 'border-l slide-in-from-left-8' : 'border-r slide-in-from-right-8'} duration-500`} dir={dir}>
        <div>
          {/* Header */}
          <div className="flex justify-between items-start pb-6 border-b border-white/10 mb-6 sticky top-0 bg-zinc-950/90 backdrop-blur-md z-10">
            <div>
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-[0.2em] font-bold" dir="ltr">{t("dossier.overrideSubtitle")}</span>
              <h2 className="text-2xl font-black text-white mt-2">{cafe.name}</h2>
            </div>
            <button onClick={onClose} className="p-2.5 bg-zinc-900 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors border border-white/5"><XCircle size={20}/></button>
          </div>

          {/* 🌟 نظرة عامة سريعة (التي أزلناها من الجدول) */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
                <Calendar size={12} />
                <span className="text-[10px] font-mono uppercase tracking-wider">{t("table.expiry")}</span>
              </div>
              <div className="font-bold text-white text-sm" dir="ltr">{ends.toISOString().split('T')[0]}</div>
              <div className={`text-[10px] mt-1 ${diffDays < 0 ? 'text-rose-400 font-bold' : diffDays <= 5 ? 'text-amber-400' : 'text-zinc-500'}`}>
                {diffDays < 0 ? t("table.expiredSince", { days: Math.abs(diffDays) }) : t("table.remainingDays", { days: diffDays })}
              </div>
            </div>
            
            <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
                <BarChart2 size={12} />
                <span className="text-[10px] font-mono uppercase tracking-wider">{t("table.usage")}</span>
              </div>
              <div className="font-bold text-white mt-1 text-sm tracking-widest" dir="ltr">
                📦 {productsCount}
              </div>
              <div className="text-[10px] mt-1 text-zinc-400 tracking-widest" dir="ltr">
                🛒 {ordersCount}
              </div>
            </div>
          </div>

          {/* 🔐 Auth Settings */}
          <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5 mb-6 space-y-5 shadow-inner">
            <h4 className="text-xs font-bold text-emerald-400 uppercase font-mono tracking-widest flex items-center gap-2">
              <UserCog size={16} /> {t("dossier.editAuthTitle")}
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-2 font-bold">{t("dossier.newEmailLabel")}</label>
                <input type="email" value={editOwnerEmail} onChange={(e) => setEditOwnerEmail(e.target.value)} className="w-full bg-zinc-950 border border-white/10 rounded-xl p-4 text-sm font-mono text-white focus:outline-none focus:border-emerald-400/50 text-left transition-colors" dir="ltr" />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-2 font-bold">{t("dossier.newPasswordLabel")}</label>
                <input type="text" placeholder={t("dossier.passwordPlaceholder")} value={editOwnerPassword} onChange={(e) => setEditOwnerPassword(e.target.value)} className="w-full bg-zinc-950 border border-white/10 rounded-xl p-4 text-sm font-mono text-white focus:outline-none focus:border-emerald-400/50 text-left placeholder:text-zinc-700 transition-colors" dir="ltr" />
              </div>
            </div>
            <button 
              disabled={isUpdatingAuth} 
              onClick={async () => {
                setIsUpdatingAuth(true);
                await onUpdateAuth(cafe.id, cafe.owner_auth_id, editOwnerEmail, editOwnerPassword);
                setIsUpdatingAuth(false);
              }} 
              className="w-full py-4 bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-emerald-400 font-black rounded-xl text-sm transition-all active:scale-95 shadow-sm border border-emerald-500/20 disabled:opacity-50"
            >
              {isUpdatingAuth ? <Loader2 className="animate-spin mx-auto" size={18}/> : t("dossier.forceUpdateAuthBtn")}
            </button>
          </div>

          {/* ⚡ God Mode Settings */}
          <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5 mb-8 space-y-5 shadow-inner">
            <h4 className="text-xs font-bold text-amber-400 uppercase font-mono tracking-widest flex items-center gap-2">
              <AlertOctagon size={16} /> {t("dossier.godModeTitle")}
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-2 font-bold">{t("dossier.changePlanLabel")}</label>
                <PremiumSelect value={newPlanInput} onChange={setNewPlanInput} options={planOptionsShort} dir={dir} />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-2 font-bold">{t("dossier.expiryDateLabel")}</label>
                <input type="date" value={newDateInput} onChange={(e) => setNewDateInput(e.target.value)} className={`w-full bg-zinc-950 border border-white/10 rounded-xl p-4 text-sm font-mono text-white focus:outline-none focus:border-amber-400/50 transition-colors ${isArabic ? 'text-right' : 'text-left'}`} />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-2 font-bold">{t("dossier.forceStatusLabel")}</label>
                <PremiumSelect value={newStatusInput} onChange={setNewStatusInput} options={statusOptions} dir={dir} />
              </div>
            </div>
            <button onClick={() => onForceSave(cafe.id, newStatusInput, newDateInput, newPlanInput)} className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-xl text-sm transition-transform active:scale-95 shadow-[0_0_20px_-5px_rgba(251,191,36,0.4)]">
              {t("dossier.saveOverrideBtn")}
            </button>
          </div>

          {/* 💳 MOCK: Payment History */}
          <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5 mb-8 space-y-5 shadow-inner">
            <h4 className="text-xs font-bold text-blue-400 uppercase font-mono tracking-widest flex items-center gap-2">
              <History size={16} /> سجل المدفوعات والاشتراكات
            </h4>
            <div className="space-y-3 max-h-[250px] overflow-y-auto hide-scrollbar pr-1">
              {mockPaymentHistory.map((payment) => (
                <div key={payment.id} className="bg-zinc-950 border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-300" dir="ltr">{payment.date}</span>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-md text-[10px] font-bold font-mono tracking-wider flex items-center gap-1">
                      <ShieldCheck size={12} /> {payment.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-end border-t border-white/5 pt-3">
                    <div>
                      <div className="text-[10px] text-zinc-500 font-mono mb-1">{payment.method}</div>
                      <div className="text-xs font-black text-amber-400/90 tracking-widest">{payment.plan} PLAN</div>
                    </div>
                    <div className="text-sm font-black text-white font-mono">{payment.amount} MAD</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* 🚨 Danger Zone */}
        <div className="pt-8 border-t border-rose-500/20 mt-4">
          <button onClick={() => onDeepDelete(cafe)} className="w-full py-4 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 font-black rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border border-rose-500/30 active:scale-95">
            <Trash2 size={18} /> {t("dossier.deepWipeBtn")}
          </button>
          <div className="mt-6 text-center font-mono text-[9px] text-zinc-600 uppercase tracking-widest" dir="ltr">
            Core ID: {cafe.id.split('-')[0]}***
          </div>
        </div>
      </div>
    </div>
  );
}