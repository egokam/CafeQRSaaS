"use client";

import { useState } from "react";
import { MonitorSmartphone } from "lucide-react";
import { updateCafeSettings } from "../../actions/auth";

export default function SettingsTab({
  cafeId,
  activeLang,
  t,
  cafeName,
  setCafeName,
  maxCashiers,
  activeCashiers,
}: any) {
  const [newAdminPin, setNewAdminPin] = useState("");
  const [newCashierPin, setNewCashierPin] = useState("");
  const [isChecking, setIsChecking] = useState(false);

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
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
      <div className="bg-white p-6 rounded-3xl border border-border shadow-sm flex flex-col sm:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="font-extrabold text-lg mb-1 flex items-center gap-2">
            <MonitorSmartphone className="text-primary" /> {t.connectedDevices}
          </h3>
          <p className="text-xs text-muted-foreground font-bold">{t.liveMonitoring}</p>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none text-center px-6 py-4 bg-muted/20 border rounded-2xl">
            <span className="block text-xs font-bold text-muted-foreground mb-1">{t.cashierSlot}</span>
            <div className="flex items-baseline justify-center gap-1" dir="ltr">
              <span className={`text-3xl font-black ${activeCashiers > 0 ? 'text-emerald-500 animate-pulse' : 'text-slate-300'}`}>
                {activeCashiers}
              </span>
              <span className="text-sm font-bold text-muted-foreground">/ {maxCashiers === "9999" ? "♾️" : maxCashiers}</span>
            </div>
          </div>
        </div>
      </div>

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

          <div>
            <label className="block text-xs font-bold mb-1 text-primary">{t.maxCashierLabel}</label>
            <input
              type="text"
              readOnly
              required
              value={maxCashiers === "9999" ? "♾️" : maxCashiers}
              className="w-full border-2 border-primary/30 rounded-xl p-3 bg-primary/5 font-bold text-xl text-center focus:border-primary outline-none disabled:opacity-75 cursor-not-allowed"
              dir="ltr"
              title="Linked to your current plan"
            />
          </div>

          <div className="pt-4 border-t border-border/50">
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