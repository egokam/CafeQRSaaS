"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "../../../lib/supabase";
import { ChefHat, CheckCircle2, Clock, Bell, Lock, AlertTriangle, Flame } from "lucide-react";
import { verifyPin, cashierUpdateOrderStatus } from "../../../actions/auth";
import { checkCafeSubscription } from "../../../actions/saas";

export default function KitchenDisplaySystem({ params }: { params: Promise<{ cafeSlug: string }> }) {
  const { cafeSlug } = use(params);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const [cafeId, setCafeId] = useState<string | null>(null);
  const [cafeName, setCafeName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  // 🌟 جلب الطلبات المقبولة فقط (التي تنتظر التحضير)
  const fetchKitchenOrders = async (cId: string) => {
    const { data } = await supabase
      .from('orders')
      .select('*, tables(table_number)')
      .eq('cafe_id', cId)
      .eq('status', 'accepted') // 👈 السر هنا: المطبخ يرى فقط ما قبله الكاشير!
      .order('created_at', { ascending: true }); // الأقدم أولاً لكي لا ينتظر الزبون طويلاً

    if (data) setOrders(data);
  };

  useEffect(() => {
    const sessionKey = `kitchen_auth_${cafeSlug}`;
    if (sessionStorage.getItem(sessionKey) === 'true') setIsAuthenticated(true);

    const initKitchen = async () => {
      setIsLoading(true);

      // 💀 1. نبض الـ SaaS الصامت
      const subCheck = await checkCafeSubscription(cafeSlug);
      if (!subCheck.isValid) {
        setIsSuspended(true);
        setIsLoading(false);
        return;
      }

      const { data: cData } = await supabase.from('cafes').select('id, name').eq('slug', cafeSlug).single();
      if (!cData) { setIsNotFound(true); setIsLoading(false); return; }

      setCafeId(cData.id);
      setCafeName(cData.name);
      await fetchKitchenOrders(cData.id);
      setIsLoading(false);
    };

    initKitchen();
  }, [cafeSlug]);

  // 📡 البث الحي للمطبخ + النبض الصامت
  useEffect(() => {
    if (!isAuthenticated || !cafeId) return;

    fetchKitchenOrders(cafeId);

    const heartbeat = setInterval(async () => {
      const liveCheck = await checkCafeSubscription(cafeSlug);
      if (!liveCheck.isValid) setIsSuspended(true);
    }, 60000);

    // الاستماع لأي طلب تحول إلى accepted
    const kitchenChannel = supabase.channel(`kitchen-live-${cafeId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `cafe_id=eq.${cafeId}` }, (payload: any) => {
        fetchKitchenOrders(cafeId);
        // تشغيل صوت تنبيه فخم عند وصول طلب جديد للمطبخ
        if (payload.new && payload.new.status === 'accepted') {
          new Audio('/bell.mp3').play().catch(() => {});
        }
      }).subscribe();

    return () => {
      clearInterval(heartbeat);
      supabase.removeChannel(kitchenChannel);
    };
  }, [isAuthenticated, cafeId, cafeSlug]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || !cafeId) return;

    setIsChecking(true);
    // نستخدم صلاحية الكاشير لدخول المطبخ
    const isValid = await verifyPin(cafeId, "cashier", pinInput);
    setIsChecking(false);

    if (isValid) {
      setIsAuthenticated(true);
      sessionStorage.setItem(`kitchen_auth_${cafeSlug}`, 'true');
      new Audio('/bell.mp3').play().catch(() => {});
    } else {
      setPinInput("");
      alert("الرمز غير صحيح ❌");
    }
  };

  const markOrderReady = async (orderId: string) => {
    // تحديث الحالة إلى ready لكي تختفي من شاشة الطباخ وتظهر عند الكاشير
    const { success } = await cashierUpdateOrderStatus(orderId, 'ready');
    if (success) {
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } else {
      alert("فشل تحديث الحالة");
    }
  };

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center font-bold text-white">جاري تشغيل شاشة المطبخ...</div>;
  if (isNotFound) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-2xl font-bold">404 - المقهى غير موجود</div>;

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-rose-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans" dir="rtl">
        <Lock size={64} className="text-rose-500 mb-4 animate-pulse" />
        <h1 className="text-3xl font-black mb-2">شاشة المطبخ متوقفة 🚫</h1>
        <p className="text-rose-200/80">انتهت صلاحية اشتراك المقهى في الخوادم المركزية.</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans" dir="rtl">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] w-full max-w-sm text-center shadow-2xl">
          <div className="bg-amber-500/10 text-amber-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
            <ChefHat size={40} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">شاشة المطبخ (KDS)</h2>
          <p className="text-slate-400 mb-8 text-xs font-bold">أدخل رمز الطاقم لعرض الطلبات</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input type="password" inputMode="numeric" value={pinInput} onChange={(e) => setPinInput(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center text-3xl tracking-[0.5em] font-mono text-white focus:border-amber-500 outline-none" placeholder="••••" autoFocus />
            <button type="submit" className="py-4 rounded-2xl font-black text-slate-950 bg-amber-500 hover:bg-amber-400 text-lg">دخول للمطبخ</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 font-sans select-none" dir="rtl">
      
      {/* هيدر المطبخ الصارم */}
      <header className="mb-8 flex items-center justify-between bg-slate-900/80 border border-slate-800 p-6 rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-amber-500 text-slate-950 rounded-2xl font-black shadow-lg shadow-amber-500/10">
            <Flame size={28} />
          </div>
          <div>
            <span className="text-[10px] font-mono text-amber-400 tracking-widest block uppercase">Kitchen Display System</span>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">{cafeName} - محطة التحضير</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-5 py-2.5 rounded-2xl">
          <Clock className="text-amber-400 animate-spin" size={18} />
          <span className="font-mono font-bold text-sm">قيد التحضير دابا: <strong className="text-amber-400 text-lg">{orders.length}</strong></span>
        </div>
      </header>

      {/* شبكة بطاقات الطلبات العملاقة */}
      <main>
        {orders.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-slate-800 rounded-[3rem] bg-slate-900/20">
            <CheckCircle2 className="mx-auto text-emerald-500/40 mb-4" size={64} />
            <h2 className="text-2xl font-black text-slate-400">لا توجد طلبات معلقة</h2>
            <p className="text-slate-600 text-sm mt-1">المطبخ مرتاح حالياً.. بانتظار طلبات الكاشير</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {orders.map((ord: any) => {
              const waitingMinutes = Math.floor((Date.now() - new Date(ord.created_at).getTime()) / 60000);
              const isLate = waitingMinutes >= 10; // تنبيه أحمر إذا مر على الطلب 10 دقائق!

              return (
                <div key={ord.id} className={`bg-slate-900 border-2 rounded-[2.5rem] p-6 flex flex-col justify-between shadow-xl transition-all ${isLate ? 'border-rose-500 bg-rose-950/10 animate-pulse' : 'border-slate-800 hover:border-slate-700'}`}>
                  
                  <div>
                    {/* رأس التذكرة */}
                    <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-800">
                      <div>
                        <span className="text-xs font-mono text-slate-500 block">#{ord.id.split('-')[0]}</span>
                        <h3 className="text-2xl font-black text-white mt-0.5">
                          {ord.tables?.table_number ? `طاولة ${ord.tables.table_number.replace('table_', '')}` : "مباشر (POS)"}
                        </h3>
                      </div>
                      <span className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl border ${isLate ? 'bg-rose-500 text-white border-rose-400' : 'bg-slate-950 text-amber-400 border-slate-800'}`}>
                        ⏱️ {waitingMinutes} دقيقة
                      </span>
                    </div>

                    {/* قائمة الأصناف المصممة لسهولة القراءة السريعة */}
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

                  {/* زر الإنجاز العملاق */}
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