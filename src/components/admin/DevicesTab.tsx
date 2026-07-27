"use client";

import { History, Loader2, Clock, Check, Ban, Trash2 } from "lucide-react";
import { updateDeviceStatus, deletePosDevice } from "../../actions/auth";

export default function DevicesTab({ cafeId, activeLang, t, devicesList, fetchDevices, isLoadingDevices, maxCashiers }: any) {
  const handleUpdateDeviceStatus = async (deviceId: string, status: 'approved' | 'blocked' | 'pending') => {
    const res = await updateDeviceStatus(cafeId, deviceId, status);
    if (res.success) fetchDevices(cafeId); else alert(res.error);
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (!confirm(t.confirmDelete)) return;
    const res = await deletePosDevice(cafeId, deviceId);
    if (res.success) fetchDevices(cafeId); else alert(t.deleteFailed);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t.tabDevices}</h2>
        <button onClick={() => fetchDevices(cafeId)} className="p-2.5 bg-muted rounded-xl hover:bg-gray-200 text-xs font-bold flex items-center gap-1.5 transition-colors"><History size={16} /> {t.refreshLog}</button>
      </div>

      {isLoadingDevices ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Pending */}
          <div className="bg-white p-6 rounded-3xl border border-amber-200 shadow-sm flex flex-col">
            <h3 className="font-bold flex items-center gap-2 text-amber-500 mb-6 border-b pb-4"><Clock size={20} /> {t.pendingDevices}</h3>
            <div className="flex-1 space-y-3">
              {devicesList.filter((d: any) => d.status === 'pending').length === 0 ? (
                <p className="text-xs text-muted-foreground font-bold text-center py-8">{t.noDevices}</p>
              ) : (
                devicesList.filter((d: any) => d.status === 'pending').map((d: any) => (
                  <div key={d.id} className="p-4 bg-muted/20 border rounded-2xl">
                    <div className="flex items-start justify-between mb-3"><div><p className="font-bold text-sm">{d.device_name}</p><p className="text-[10px] text-muted-foreground mt-1">{new Date(d.created_at).toLocaleString()}</p></div></div>
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateDeviceStatus(d.id, 'approved')} className="flex-1 bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white py-2 rounded-xl text-xs font-bold transition-colors">{t.approveBtn}</button>
                      <button onClick={() => handleUpdateDeviceStatus(d.id, 'blocked')} className="flex-1 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white py-2 rounded-xl text-xs font-bold transition-colors">{t.blockBtn}</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* Approved */}
          <div className="bg-white p-6 rounded-3xl border border-emerald-200 shadow-sm flex flex-col">
            <h3 className="font-bold flex items-center gap-2 text-emerald-500 mb-6 border-b pb-4"><Check size={20} /> {t.approvedDevices} ({devicesList.filter((d: any) => d.status === 'approved').length} / {maxCashiers === "9999" ? "♾️" : maxCashiers})</h3>
            <div className="flex-1 space-y-3">
              {devicesList.filter((d: any) => d.status === 'approved').length === 0 ? (
                <p className="text-xs text-muted-foreground font-bold text-center py-8">{t.noDevices}</p>
              ) : (
                devicesList.filter((d: any) => d.status === 'approved').map((d: any) => (
                  <div key={d.id} className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                    <div className="flex items-start justify-between mb-3"><div><p className="font-bold text-sm">{d.device_name}</p><p className="text-[10px] text-emerald-600/70 mt-1">{new Date(d.last_active).toLocaleString()}</p></div></div>
                    <button onClick={() => handleUpdateDeviceStatus(d.id, 'blocked')} className="w-full bg-white border border-border hover:bg-red-50 hover:border-red-200 hover:text-red-500 py-2 rounded-xl text-xs font-bold transition-colors">{t.blockBtn}</button>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* Blocked */}
          <div className="bg-white p-6 rounded-3xl border shadow-sm flex flex-col">
            <h3 className="font-bold flex items-center gap-2 text-red-500 mb-6 border-b pb-4"><Ban size={20} /> {t.blockedDevices}</h3>
            <div className="flex-1 space-y-3">
              {devicesList.filter((d: any) => d.status === 'blocked').length === 0 ? (
                <p className="text-xs text-muted-foreground font-bold text-center py-8">{t.noDevices}</p>
              ) : (
                devicesList.filter((d: any) => d.status === 'blocked').map((d: any) => (
                  <div key={d.id} className="p-4 bg-muted/30 border rounded-2xl opacity-75">
                    <div className="flex items-start justify-between mb-3">
                      <div><p className="font-bold text-sm line-through">{d.device_name}</p><p className="text-[10px] text-muted-foreground mt-1">{new Date(d.updated_at || d.created_at).toLocaleString()}</p></div>
                      <button onClick={() => handleRemoveDevice(d.id)} className="text-red-400 hover:text-red-600" title={t.deleteBtn}><Trash2 size={16} /></button>
                    </div>
                    <button onClick={() => handleUpdateDeviceStatus(d.id, 'pending')} className="w-full bg-white border border-border hover:bg-muted py-2 rounded-xl text-xs font-bold transition-colors">Unblock / Pending</button>
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