"use client";

import { useState, useEffect } from "react";
import {
  UserCog, AlertOctagon, Trash2, XCircle, Loader2,
  ChevronDown, History, ShieldCheck, Calendar,
  CreditCard, Lock, Save, AlertTriangle, Clock, Ban, AlertCircle, ExternalLink, MapPin
} from "lucide-react";
import { getPaymentHistory } from "@/actions/payment";

// 🌟 Custom Premium Dropdown (Z-Index Fixed)
const PremiumSelect = ({
  value,
  onChange,
  options,
  dir,
  dropUpOnPc = false
}: {
  value: string,
  onChange: (val: string) => void,
  options: { label: string, value: string }[],
  dir: string,
  dropUpOnPc?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative w-full ${isOpen ? 'z-[999]' : 'z-10'}`}>
      <button
        type="button"
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-[#111113] border border-white/10 rounded-xl p-3.5 text-sm font-mono text-white focus:outline-none transition-all flex justify-between items-center uppercase font-bold hover:bg-[#18181b] ${isOpen ? 'border-amber-500/50 shadow-[0_0_15px_-3px_rgba(245,158,11,0.15)] relative z-[1000]' : ''}`}
        dir="ltr"
      >
        <span>{options.find(o => o.value === value)?.label || value}</span>
        <ChevronDown size={16} className={`text-zinc-500 transition-transform duration-300 ${isOpen ? "rotate-180 text-amber-500" : ""}`} />
      </button>

      {isOpen && (
        <div className={`absolute left-0 right-0 z-[1000] bg-[#111113] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${dir === 'rtl' ? 'text-right' : 'text-left'} ${dropUpOnPc ? 'top-full mt-2 lg:top-auto lg:bottom-full lg:mb-2' : 'top-full mt-2'}`} dir="ltr">
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={`p-3.5 text-sm font-mono cursor-pointer transition-colors ${value === opt.value ? 'text-amber-500 bg-amber-500/10 font-black border-l-2 border-amber-500' : 'text-zinc-400 hover:bg-[#18181b] hover:text-white'}`}
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
  const [newBillingCycle, setNewBillingCycle] = useState("monthly");
  const [editOwnerEmail, setEditOwnerEmail] = useState("");
  const [editOwnerPassword, setEditOwnerPassword] = useState("");
  const [isUpdatingAuth, setIsUpdatingAuth] = useState(false);
  
  // 🌟 Coordinates States
  const [newLatitude, setNewLatitude] = useState("");
  const [newLongitude, setNewLongitude] = useState("");

  // 🌟 Actual Payment History States
  const [receipts, setReceipts] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    if (cafe) {
      setNewDateInput(cafe.subscription_ends_at ? cafe.subscription_ends_at.split('T')[0] : "");
      setNewStatusInput(cafe.subscription_status || "active");
      setNewPlanInput(cafe.plan_type || "silver");
      setNewBillingCycle(cafe.billing_cycle || "monthly");
      setEditOwnerEmail(cafe.owner_email || "");
      setEditOwnerPassword("");
      
      // 🌟 Load existing coordinates
      setNewLatitude(cafe.latitude ? cafe.latitude.toString() : "");
      setNewLongitude(cafe.longitude ? cafe.longitude.toString() : "");

      // 🌟 Fetch Actual Payment History
      setIsLoadingHistory(true);
      getPaymentHistory(cafe.id).then((res) => {
        if (res.success) {
          setReceipts(res.data);
        }
        setIsLoadingHistory(false);
      });
    }
  }, [cafe]);

  const getPlanOptions = (cycle: string) => {
    const isYearly = cycle === "yearly";
    return [
      { label: `SILVER (${isYearly ? "2,490" : "249"} MAD)`, value: "silver" },
      { label: `GOLD (${isYearly ? "3,990" : "399"} MAD)`, value: "gold" },
      { label: `DIAMOND (${isYearly ? "7,990" : "799"} MAD)`, value: "diamond" }
    ];
  };

  const planOptionsShort = getPlanOptions(newBillingCycle);

  const cycleOptions = [
    { label: "MONTHLY", value: "monthly" },
    { label: "YEARLY (-2 MONTHS)", value: "yearly" }
  ];

  const statusOptions = [
    { label: "ACTIVE", value: "active" },
    { label: "PENDING", value: "pending_verification" },
    { label: "SUSPENDED", value: "suspended" }
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "paid": return { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: <ShieldCheck size={12} /> };
      case "pending": return { color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: <Clock size={12} /> };
      case "rejected": return { color: "text-rose-400 bg-rose-500/10 border-rose-500/20", icon: <XCircle size={12} /> };
      case "canceled": return { color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20", icon: <Ban size={12} /> };
      default: return { color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: <AlertCircle size={12} /> };
    }
  };

  if (!cafe) return null;

  const ends = cafe.subscription_ends_at ? new Date(cafe.subscription_ends_at) : new Date();
  const diffDays = Math.ceil((ends.getTime() - Date.now()) / (1000 * 3600 * 24));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 md:p-6" dir={dir}>

      {/* 🌟 Custom Tiny Scrollbar CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-tiny-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-tiny-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-tiny-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        .custom-tiny-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
      `}} />

      <div className="w-full h-full md:h-auto md:max-h-[95vh] md:max-w-5xl bg-[#0a0a0a] border border-white/10 md:rounded-[2.5rem] flex flex-col shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">

        {/* Sticky Header */}
        <div className="flex justify-between items-center p-6 sm:p-8 border-b border-white/5 bg-[#0a0a0a]/95 backdrop-blur-xl z-[80] shrink-0">
          <div>
            <span className="text-[10px] font-mono text-amber-500 uppercase tracking-[0.25em] font-black drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" dir="ltr">
              DEEP DOSSIER OVERRIDE
            </span>
            <h2 className="text-3xl font-black text-white mt-1 truncate max-w-[280px] sm:max-w-md" title={cafe.name}>{cafe.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-zinc-900 rounded-full hover:bg-zinc-800 hover:text-white text-zinc-500 transition-all border border-white/5 active:scale-95"
          >
            <XCircle size={24} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-tiny-scrollbar p-6 sm:p-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 h-full">

            {/* ⬅️ LEFT COLUMN: Stats, Auth, God Mode */}
            <div className="space-y-6">

              {/* Stats Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#111113] p-5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2 text-zinc-500 mb-2">
                    <Calendar size={14} />
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold">EXPIRY</span>
                  </div>
                  <div className="font-black text-white text-base sm:text-lg" dir="ltr">{ends.toISOString().split('T')[0]}</div>
                  <div className={`text-[11px] mt-1 font-mono ${diffDays < 0 ? 'text-rose-500 font-bold' : diffDays <= 7 ? 'text-amber-500' : 'text-zinc-500'}`}>
                    {diffDays < 0 ? `${Math.abs(diffDays)} DAYS OVERDUE` : `${diffDays} DAYS LEFT`}
                  </div>
                </div>

                <div className="bg-[#111113] p-5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2 text-zinc-500 mb-2">
                    <CreditCard size={14} />
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold">CYCLE</span>
                  </div>
                  <div className="font-black text-amber-500 text-base sm:text-lg tracking-widest uppercase" dir="ltr">
                    {cafe.billing_cycle || 'MONTHLY'}
                  </div>
                  <div className="text-[11px] mt-1 text-zinc-500 tracking-widest uppercase font-mono" dir="ltr">
                    {cafe.plan_type || 'SILVER'} PLAN
                  </div>
                </div>
              </div>

              {/* Edit Auth Section */}
              <div className="bg-[#111113] p-6 rounded-3xl border border-emerald-500/10 space-y-5 relative group">
                <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full group-hover:bg-emerald-500/10 transition-colors" />
                </div>

                <h4 className="text-[11px] font-black text-emerald-500 uppercase font-mono tracking-[0.2em] flex items-center gap-2 relative z-10">
                  <UserCog size={16} /> EDIT OWNER AUTH
                </h4>

                <div className="space-y-4 relative z-10">
                  <div>
                    <label className="block text-[10px] font-mono tracking-widest text-zinc-500 mb-2 uppercase font-bold">New Email Address</label>
                    <input
                      type="email"
                      value={editOwnerEmail}
                      onChange={(e) => setEditOwnerEmail(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono tracking-widest text-zinc-500 mb-2 uppercase font-bold">New Password</label>
                    <input
                      type="text"
                      placeholder="Leave blank to ignore..."
                      value={editOwnerPassword}
                      onChange={(e) => setEditOwnerPassword(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-3.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500/50 placeholder:text-zinc-700 transition-colors"
                      dir="ltr"
                    />
                  </div>
                </div>

                <button
                  disabled={isUpdatingAuth}
                  onClick={async () => {
                    setIsUpdatingAuth(true);
                    await onUpdateAuth(cafe.id, cafe.owner_auth_id, editOwnerEmail, editOwnerPassword);
                    setIsUpdatingAuth(false);
                  }}
                  className="w-full py-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-black tracking-wide uppercase rounded-xl text-sm transition-all active:scale-95 border border-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 relative z-10"
                >
                  {isUpdatingAuth ? <Loader2 className="animate-spin" size={18} /> : <>Force Update <Lock size={16} /></>}
                </button>
              </div>

              {/* God Mode Section */}
              <div className="bg-[#111113] p-6 rounded-3xl border border-amber-500/10 space-y-5 relative group">

                <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full group-hover:bg-amber-500/10 transition-colors" />
                </div>

                <h4 className="text-[11px] font-black text-amber-500 uppercase font-mono tracking-[0.2em] flex items-center gap-2 relative">
                  <AlertTriangle size={16} /> SYSTEM OVERRIDES (GOD MODE)
                </h4>

                <div className="space-y-4 relative flex flex-col">

                  {/* Billing Cycle */}
                  <div className="relative">
                    <label className="block text-[10px] font-mono tracking-widest text-zinc-500 mb-2 uppercase font-bold">Billing Cycle</label>
                    <PremiumSelect value={newBillingCycle} onChange={setNewBillingCycle} options={cycleOptions} dir={dir} />
                  </div>

                  {/* Change Plan */}
                  <div className="relative">
                    <label className="block text-[10px] font-mono tracking-widest text-zinc-500 mb-2 uppercase font-bold">Change Plan</label>
                    <PremiumSelect value={newPlanInput} onChange={setNewPlanInput} options={planOptionsShort} dir={dir} />
                  </div>

                  {/* Expiration Date & Forced Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
                    <div className="relative">
                      <label className="block text-[10px] font-mono tracking-widest text-zinc-500 mb-2 uppercase font-bold">Expiration Date</label>
                      <input
                        type="date"
                        value={newDateInput}
                        onChange={(e) => setNewDateInput(e.target.value)}
                        className="block w-full min-w-0 appearance-none m-0 box-border bg-[#0a0a0a] border border-white/10 rounded-xl p-3.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                        dir="ltr"
                      />
                    </div>

                    <div className="relative">
                      <label className="block text-[10px] font-mono tracking-widest text-zinc-500 mb-2 uppercase font-bold">Forced Status</label>
                      <PremiumSelect value={newStatusInput} onChange={setNewStatusInput} options={statusOptions} dir={dir} dropUpOnPc={true} />
                    </div>
                  </div>

                  {/* 🌟 Coordinates Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
                    <div className="relative">
                      <label className="block text-[10px] font-mono tracking-widest text-zinc-500 mb-2 uppercase font-bold flex items-center gap-1.5"><MapPin size={10} /> Latitude</label>
                      <input
                        type="text"
                        value={newLatitude}
                        onChange={(e) => setNewLatitude(e.target.value)}
                        className="block w-full min-w-0 appearance-none m-0 box-border bg-[#0a0a0a] border border-white/10 rounded-xl p-3.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-zinc-700"
                        placeholder="e.g. 30.4277"
                        dir="ltr"
                      />
                    </div>

                    <div className="relative">
                      <label className="block text-[10px] font-mono tracking-widest text-zinc-500 mb-2 uppercase font-bold flex items-center gap-1.5"><MapPin size={10} /> Longitude</label>
                      <input
                        type="text"
                        value={newLongitude}
                        onChange={(e) => setNewLongitude(e.target.value)}
                        className="block w-full min-w-0 appearance-none m-0 box-border bg-[#0a0a0a] border border-white/10 rounded-xl p-3.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-zinc-700"
                        placeholder="e.g. -9.5981"
                        dir="ltr"
                      />
                    </div>
                  </div>

                </div>

                <button
                  onClick={() => onForceSave(cafe.id, newStatusInput, newDateInput, newPlanInput, newBillingCycle, newLatitude, newLongitude)}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black tracking-wide uppercase rounded-xl text-sm transition-all active:scale-95 shadow-[0_0_20px_-5px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 relative mt-2 z-[5]"
                >
                  Save Override <Save size={16} />
                </button>
              </div>

            </div>

            {/* ➡️ RIGHT COLUMN: History & Wipe */}
            <div className="flex flex-col space-y-6 relative z-10">

              {/* Payment History */}
              <div className="bg-[#111113] p-6 rounded-3xl border border-blue-500/10 flex flex-col flex-1 min-h-[300px]">
                <h4 className="text-[11px] font-black text-blue-400 uppercase font-mono tracking-[0.2em] flex items-center gap-2 mb-5 shrink-0">
                  <History size={16} /> PAYMENT HISTORY
                </h4>

                <div className="space-y-3 overflow-y-auto custom-tiny-scrollbar pr-2 flex-1">
                  {isLoadingHistory ? (
                    <div className="flex justify-center items-center py-10 h-full"><Loader2 className="animate-spin text-zinc-500" size={32} /></div>
                  ) : receipts.length === 0 ? (
                    <div className="text-center text-zinc-600 font-mono text-xs py-10 flex flex-col items-center justify-center h-full border border-dashed border-white/5 rounded-2xl bg-zinc-950/50">
                      <AlertCircle className="mb-2 opacity-50" size={24} /> NO PAYMENT RECORDS FOUND
                    </div>
                  ) : (
                    receipts.map((receipt) => {
                      const statusConfig = getStatusConfig(receipt.status);
                      const date = new Date(receipt.uploaded_at).toISOString().split('T')[0];

                      return (
                        <div key={receipt.id} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 hover:border-white/10 transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-zinc-300 tracking-wider" dir="ltr">{date}</span>
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black font-mono tracking-widest flex items-center gap-1.5 border ${statusConfig.color}`}>
                              {statusConfig.icon} {receipt.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex justify-between items-end pt-1">
                            <div>
                              <div className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mb-1 flex items-center gap-1.5">
                                {receipt.requested_cycle} CYCLE
                                {receipt.receipt_url && (
                                  <>
                                    <span className="text-zinc-700">•</span>
                                    <a href={receipt.receipt_url} target="_blank" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                      VIEW <ExternalLink size={10} />
                                    </a>
                                  </>
                                )}
                              </div>
                              <div className="text-xs font-black text-amber-500 tracking-widest uppercase">{receipt.requested_plan}</div>
                            </div>
                            <div className="text-sm font-black text-white font-mono tracking-wider">{receipt.amount} MAD</div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="shrink-0 mt-auto">
                <button
                  onClick={() => onDeepDelete(cafe)}
                  className="w-full py-4 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-black tracking-wide uppercase rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border border-rose-500/20 active:scale-95 group"
                >
                  <Trash2 size={18} className="group-hover:animate-bounce" /> Permanently Destroy Cafe (Deep Wipe)
                </button>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}