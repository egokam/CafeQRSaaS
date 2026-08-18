"use client";

import { useState } from "react";
import { History, Loader2, Clock, Check, Ban, Trash2, AlertCircle } from "lucide-react";
import { updateDeviceStatus, deletePosDevice } from "../../actions/auth";

type PosDeviceStatus = "pending" | "approved" | "blocked";

type PosDevice = {
  id: string;
  cafe_id: string;
  device_id: string;
  device_name: string;
  status: PosDeviceStatus;
  created_at: string;
  last_active: string | null;
  updated_at?: string | null;
};

type DevicesTabProps = {
  cafeId: string;
  activeLang: string;
  t: Record<string, string>;
  devicesList: PosDevice[];
  fetchDevices: (cafeId: string, background?: boolean) => Promise<boolean>;
  isLoadingDevices: boolean;
  devicesError: string | null;
  maxCashiers: string | number;
};

export default function DevicesTab({
  cafeId,
  activeLang,
  t,
  devicesList,
  fetchDevices,
  isLoadingDevices,
  devicesError,
  maxCashiers,
}: DevicesTabProps) {
  const [mutatingDeviceId, setMutatingDeviceId] = useState<string | null>(null);
  
  // 🌟 استخراج البيانات الحالية للقيود وحساب حالة التخفيض (Overage)
  const approvedCount = devicesList.filter((d) => d.status === 'approved').length;
  const maxLimit = parseInt(String(maxCashiers), 10) || 1;
  const isDiamond = maxLimit >= 9999;
  
  const isLimitReached = !isDiamond && approvedCount >= maxLimit;
  const isOverage = !isDiamond && approvedCount > maxLimit; // 🌟 اكتشاف حالة التجاوز بسبب تغيير الباقة
  
  const usagePercent = isDiamond ? 0 : Math.min(100, (approvedCount / maxLimit) * 100);

  const handleUpdateDeviceStatus = async (deviceId: string, status: 'approved' | 'blocked' | 'pending') => {
    // 🌟 فحص إضافي قبل إرسال الطلب للسيرفر
    if (status === 'approved' && isLimitReached) {
      alert(activeLang === 'ar' ? "العملية مقفلة. يرجى حظر الأجهزة الزائدة أو ترقية باقتك." : "Action locked. Block excess devices or upgrade plan.");
      return;
    }

    if (mutatingDeviceId) return;

    setMutatingDeviceId(deviceId);
    try {
      const res = await updateDeviceStatus(cafeId, deviceId, status);
      if (!res.success) {
        alert(res.error || "Unable to update device status.");
        return;
      }
      await fetchDevices(cafeId);
    } finally {
      setMutatingDeviceId(null);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (!confirm(t.confirmDelete)) return;
    if (mutatingDeviceId) return;

    setMutatingDeviceId(deviceId);
    try {
      const res = await deletePosDevice(cafeId, deviceId);
      if (!res.success) {
        alert(res.error || t.deleteFailed);
        return;
      }
      await fetchDevices(cafeId);
    } finally {
      setMutatingDeviceId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t.tabDevices}</h2>
        <button onClick={() => fetchDevices(cafeId)} className="p-2.5 bg-muted rounded-xl hover:bg-gray-200 text-xs font-bold flex items-center gap-1.5 transition-colors">
          <History size={16} /> {t.refreshLog}
        </button>
      </div>

      {devicesError && (
        <div className="p-4 rounded-2xl flex items-start gap-3 border bg-rose-50 border-rose-200 text-rose-700" role="alert">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Unable to synchronize POS devices</h4>
            <p className="text-xs mt-1 opacity-80">{devicesError}</p>
          </div>
        </div>
      )}

      {/* 🌟 رسالة تنبيه ديناميكية للحد الأقصى أو التجاوز */}
      {isLimitReached && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 border ${isOverage ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`} dir={activeLang === 'ar' ? 'rtl' : 'ltr'}>
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">
              {activeLang === 'ar' 
                ? (isOverage ? "تجاوز الحد الأقصى للأجهزة" : "الحد الأقصى للأجهزة") 
                : (isOverage ? "Device Limit Exceeded" : "Maximum Devices Reached")}
            </h4>
            <p className="text-xs mt-1 opacity-80">
              {activeLang === 'ar' 
                ? (isOverage 
                    ? `بسبب تغيير الباقة، أنت تتجاوز الحد المسموح به. يرجى حظر ${approvedCount - maxLimit} أجهزة كاشير لتتمكن من الموافقة على أجهزة جديدة.` 
                    : "لا يمكنك الموافقة على أجهزة كاشير جديدة. قم بترقية باقتك لإضافة المزيد من الأجهزة، أو قم بحظر جهاز حالي.")
                : (isOverage 
                    ? `Due to plan change, you are over the limit. Please block ${approvedCount - maxLimit} devices to approve new ones.` 
                    : "You cannot approve new cashier devices. Upgrade your plan to add more, or block an existing device.")}
            </p>
          </div>
        </div>
      )}

      {isLoadingDevices ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Pending */}
          <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm flex flex-col">
            <h3 className="font-bold flex items-center gap-2 text-amber-500 mb-6 border-b pb-4"><Clock size={20} /> {t.pendingDevices}</h3>
            <div className="flex-1 space-y-3">
              {devicesList.filter((d) => d.status === 'pending').length === 0 ? (
                <p className="text-xs text-muted-foreground font-bold text-center py-8">{t.noDevices}</p>
              ) : (
                devicesList.filter((d) => d.status === 'pending').map((d) => (
                  <div key={d.id} className="p-4 bg-muted/20 border rounded-2xl">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-sm">{d.device_name}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(d.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {/* 🌟 زر الموافقة يتغير مظهره في حالة التجاوز */}
                      <button 
                        onClick={() => handleUpdateDeviceStatus(d.id, 'approved')} 
                        disabled={isLimitReached || mutatingDeviceId !== null}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                          isLimitReached 
                            ? (isOverage ? "bg-rose-100 text-rose-500 cursor-not-allowed" : "bg-gray-100 text-gray-400 cursor-not-allowed")
                            : "bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white"
                        }`}
                      >
                        {mutatingDeviceId === d.id ? <Loader2 size={14} className="animate-spin mx-auto" /> : isLimitReached ? (isOverage ? "Locked (Overage) 🔒" : "Locked 🔒") : t.approveBtn}
                      </button>
                      <button disabled={mutatingDeviceId !== null} onClick={() => handleUpdateDeviceStatus(d.id, 'blocked')} className="flex-1 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50">{t.blockBtn}</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Approved */}
          <div className="bg-white p-6 rounded-3xl border border-emerald-200 shadow-sm flex flex-col">
            <div className="mb-6 border-b pb-4">
              <h3 className="font-bold flex items-center gap-2 text-emerald-500 mb-2">
                <Check size={20} /> {t.approvedDevices} 
                <span className={`text-xs ml-auto ${isOverage ? 'text-rose-500 font-black' : 'text-muted-foreground'}`} dir="ltr">({approvedCount} / {isDiamond ? "♾️" : maxLimit})</span>
              </h3>
              
              {/* 🌟 شريط التقدم يتحول للأحمر في حالة التجاوز */}
              {!isDiamond && (
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${isOverage ? 'bg-rose-500' : isLimitReached ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${usagePercent}%` }} 
                  />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3">
              {devicesList.filter((d) => d.status === 'approved').length === 0 ? (
                <p className="text-xs text-muted-foreground font-bold text-center py-8">{t.noDevices}</p>
              ) : (
                devicesList.filter((d) => d.status === 'approved').map((d) => (
                  <div key={d.id} className={`p-4 border rounded-2xl ${isOverage ? 'bg-rose-50/50 border-rose-100 opacity-90' : 'bg-emerald-50/50 border-emerald-100'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-sm">{d.device_name}</p>
                        <p className={`text-[10px] mt-1 ${isOverage ? 'text-rose-500/70' : 'text-emerald-600/70'}`}>{new Date(d.last_active).toLocaleString()}</p>
                      </div>
                    </div>
                    <button disabled={mutatingDeviceId !== null} onClick={() => handleUpdateDeviceStatus(d.id, 'blocked')} className="w-full bg-white border border-border hover:bg-red-50 hover:border-red-200 hover:text-red-500 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50">{mutatingDeviceId === d.id ? <Loader2 size={14} className="animate-spin mx-auto" /> : t.blockBtn}</button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Blocked */}
          <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col">
            <h3 className="font-bold flex items-center gap-2 text-red-500 mb-6 border-b pb-4"><Ban size={20} /> {t.blockedDevices}</h3>
            <div className="flex-1 space-y-3">
              {devicesList.filter((d) => d.status === 'blocked').length === 0 ? (
                <p className="text-xs text-muted-foreground font-bold text-center py-8">{t.noDevices}</p>
              ) : (
                devicesList.filter((d) => d.status === 'blocked').map((d) => (
                  <div key={d.id} className="p-4 bg-muted/30 border rounded-2xl opacity-75">
                    <div className="flex items-start justify-between mb-3">
                      <div><p className="font-bold text-sm line-through">{d.device_name}</p><p className="text-[10px] text-muted-foreground mt-1">{new Date(d.updated_at || d.created_at).toLocaleString()}</p></div>
                      <button disabled={mutatingDeviceId !== null} onClick={() => handleRemoveDevice(d.id)} className="text-red-400 hover:text-red-600 disabled:opacity-50" title={t.deleteBtn}><Trash2 size={16} /></button>
                    </div>
                    <button disabled={mutatingDeviceId !== null} onClick={() => handleUpdateDeviceStatus(d.id, 'pending')} className="w-full bg-white border border-border hover:bg-muted py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50">{mutatingDeviceId === d.id ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Unblock / Pending"}</button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
