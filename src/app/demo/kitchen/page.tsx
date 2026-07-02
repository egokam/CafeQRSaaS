"use client";

import { useState, useEffect } from "react";
import { ChefHat, CheckCircle2, Clock, Flame } from "lucide-react";
import { useDemoOrders } from "@/lib/demoStore";

export default function KitchenDemoDisplay() {
  const [isLoading, setIsLoading] = useState(true);
  
  // 🌟 استدعاء الداتا الحية المشتركة
  const { orders, updateOrders } = useDemoOrders();

  // المطبخ يرى فقط الطلبات المقبولة (accepted)
  const kitchenOrders = orders
    .filter(o => o.status === 'accepted')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  useEffect(() => {
    // محاكاة التحميل
    setTimeout(() => {
      setIsLoading(false);
    }, 400);
  }, []);

  const markOrderReady = (orderId: string) => {
    // تغيير الحالة إلى جاهز وتحديث الـ Store المحلي
    const updatedOrders = orders.map(o => 
      o.id === orderId ? { ...o, status: 'ready' } : o
    );
    updateOrders(updatedOrders);
    
    // تشغيل صوت الإشعار
    new Audio('/bell.mp3').play().catch(() => {});
  };

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center font-bold text-white">جاري تشغيل بيئة المطبخ التجريبية...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 font-sans select-none relative" dir="rtl">
      
      {/* 🌟 لافتة الديمو */}
      <div className="absolute top-0 left-0 bg-amber-500 text-slate-950 text-xs font-black px-4 py-1.5 rounded-br-2xl tracking-widest uppercase z-50">
        Live Sync Demo Mode
      </div>

      {/* هيدر المطبخ الصارم */}
      <header className="mb-8 flex items-center justify-between bg-slate-900/80 border border-amber-500/30 p-6 rounded-3xl mt-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-amber-500 text-slate-950 rounded-2xl font-black shadow-lg shadow-amber-500/10">
            <Flame size={28} />
          </div>
          <div>
            <span className="text-[10px] font-mono text-amber-400 tracking-widest block uppercase">Kitchen Display System</span>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">CafeQR Demo - محطة التحضير</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-5 py-2.5 rounded-2xl">
          <Clock className="text-amber-400 animate-spin" size={18} />
          <span className="font-mono font-bold text-sm">قيد التحضير دابا: <strong className="text-amber-400 text-lg">{kitchenOrders.length}</strong></span>
        </div>
      </header>

      {/* شبكة بطاقات الطلبات العملاقة */}
      <main>
        {kitchenOrders.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-slate-800 rounded-[3rem] bg-slate-900/20">
            <CheckCircle2 className="mx-auto text-emerald-500/40 mb-4" size={64} />
            <h2 className="text-2xl font-black text-slate-400">لا توجد طلبات معلقة</h2>
            <p className="text-slate-600 text-sm mt-1">المطبخ مرتاح حالياً.. بانتظار طلبات الكاشير (ديمو)</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {kitchenOrders.map((ord: any) => {
              const waitingMinutes = Math.floor((Date.now() - new Date(ord.created_at).getTime()) / 60000);
              const isLate = waitingMinutes >= 10; 

              return (
                <div key={ord.id} className={`bg-slate-900 border-2 rounded-[2.5rem] p-6 flex flex-col justify-between shadow-xl transition-all ${isLate ? 'border-rose-500 bg-rose-950/10 animate-pulse' : 'border-slate-800 hover:border-slate-700'}`}>
                  
                  <div>
                    <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-800">
                      <div>
                        <span className="text-xs font-mono text-slate-500 block">#{ord.id}</span>
                        <h3 className="text-2xl font-black text-white mt-0.5">
                          {ord.tables?.table_number ? `طاولة ${ord.tables.table_number.replace('table_', '')}` : "مباشر (POS)"}
                        </h3>
                      </div>
                      <span className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl border ${isLate ? 'bg-rose-500 text-white border-rose-400' : 'bg-slate-950 text-amber-400 border-slate-800'}`}>
                        ⏱️ {waitingMinutes} دقيقة
                      </span>
                    </div>

                    <div className="space-y-3 my-6 max-h-[35vh] overflow-y-auto pr-1">
                      {ord.items.map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 text-base font-bold">
                          <span className="text-slate-200 truncate pr-2">{item.name_ar}</span>
                          <span className="bg-amber-500 text-slate-950 font-black px-3 py-1 rounded-xl text-lg shrink-0">
                            x{item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => markOrderReady(ord.id)}
                    className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-lg rounded-2xl shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 transition-all mt-4"
                  >
                    <CheckCircle2 size={24} />
                    <span>جاهز للتقديم 🔔</span>
                  </button>

                </div>
              );
            })}
          </div>
        )}
      </main>

    </div>
  );
}