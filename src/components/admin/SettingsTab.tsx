"use client";

import { useState } from "react";
import { MonitorSmartphone, PackageSearch, QrCode, CreditCard, Shield } from "lucide-react";
import { updateCafeSettings } from "../../actions/auth";

export default function SettingsTab({
  cafeId,
  activeLang,
  t,
  cafeName,
  setCafeName,
  maxCashiers,
  activeCashiers,
  planType,
  billingCycle,
  maxTables,
  maxMenu
}: any) {
  const [newAdminPin, setNewAdminPin] = useState("");
  const [newCashierPin, setNewCashierPin] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  // Helper لتحويل القيم الكبيرة إلى رمز ما لا نهاية
  const formatLimit = (val: number | string) => {
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    return num >= 9999 ? "♾️" : num;
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeId) return;
    setIsChecking(true);
    const { success } = await updateCafeSettings(
      cafeId,
      cafeName,
      newAdminPin,
      newCashierPin,
      Number(maxCashiers),
      0
    );
    setIsChecking(false);
    if (success) {
      alert(t.settingsSaved);
      setNewAdminPin("");
      setNewCashierPin("");
    } else {
      alert(t.settingsSaveError);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      
      {/* 🌟 القسم الثاني: ملخص الباقة والقيود (للقراءة فقط) */}
      <div className="bg-white p-6 rounded-3xl border border-border shadow-sm">
        <h3 className="font-extrabold text-lg mb-6 flex items-center gap-2 border-b pb-4">
          <Shield className="text-amber-500" /> 
          {activeLang === 'ar' ? 'تفاصيل الباقة والقيود' : 'Plan & Limits Overview'}
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/30 p-4 rounded-2xl border border-border flex flex-col items-center justify-center text-center">
            <CreditCard size={20} className="text-primary mb-2 opacity-80" />
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">
              {activeLang === 'ar' ? 'الباقة الحالية' : 'Current Plan'}
            </span>
            <span className="font-black text-sm uppercase text-foreground">
              {planType || 'Silver'} 
              <span className="text-[9px] ml-1 bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                {billingCycle === 'yearly' ? 'YR' : 'MO'}
              </span>
            </span>
          </div>

          <div className="bg-muted/30 p-4 rounded-2xl border border-border flex flex-col items-center justify-center text-center">
            <QrCode size={20} className="text-primary mb-2 opacity-80" />
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">
              {activeLang === 'ar' ? 'حد الطاولات' : 'Tables Limit'}
            </span>
            <span className="font-black text-lg text-foreground" dir="ltr">{formatLimit(maxTables)}</span>
          </div>

          <div className="bg-muted/30 p-4 rounded-2xl border border-border flex flex-col items-center justify-center text-center">
            <PackageSearch size={20} className="text-primary mb-2 opacity-80" />
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">
              {activeLang === 'ar' ? 'حد المنتجات' : 'Menu Limit'}
            </span>
            <span className="font-black text-lg text-foreground" dir="ltr">{formatLimit(maxMenu)}</span>
          </div>

          <div className="bg-muted/30 p-4 rounded-2xl border border-border flex flex-col items-center justify-center text-center">
            <MonitorSmartphone size={20} className="text-primary mb-2 opacity-80" />
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">
              {activeLang === 'ar' ? 'شاشات الكاشير' : 'POS Screens'}
            </span>
            <span className="font-black text-lg text-foreground" dir="ltr">{formatLimit(maxCashiers)}</span>
          </div>
        </div>
      </div>

      {/* 🌟 القسم الثالث: الإعدادات القابلة للتعديل */}
      <div className="bg-white p-8 lg:p-10 rounded-3xl shadow-sm border border-border">
        <h2 className="text-2xl font-bold mb-6 border-b pb-4">{t.cafeSettings}</h2>
        <form onSubmit={handleUpdateSettings} className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2">{t.cafeNameLabel}</label>
            <input
              type="text"
              required
              value={cafeName}
              onChange={(e) => setCafeName(e.target.value)}
              className={`w-full border border-border rounded-xl p-3 bg-muted/30 font-bold ${
                activeLang === 'ar' ? 'text-right' : 'text-left'
              }`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
            <div>
              <label className="block text-sm font-bold mb-2">{t.adminPinLabel}</label>
              <input
                type="text"
                value={newAdminPin}
                onChange={(e) => setNewAdminPin(e.target.value)}
                className="w-full border border-border rounded-xl p-3 bg-muted/30 font-mono text-center"
                placeholder={t.leaveEmptyToKeep}
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">{t.staffPinLabel}</label>
              <input
                type="text"
                value={newCashierPin}
                onChange={(e) => setNewCashierPin(e.target.value)}
                className="w-full border border-border rounded-xl p-3 bg-muted/30 font-mono text-center tracking-widest"
                placeholder="••••"
                dir="ltr"
              />
            </div>
          </div>

          <button
            disabled={isChecking}
            type="submit"
            className="w-full bg-foreground text-white py-4 rounded-2xl font-black mt-4 shadow-xl active:scale-95 transition-all"
          >
            {isChecking ? t.saving : t.saveChangesBtn}
          </button>
        </form>
      </div>
    </div>
  );
}