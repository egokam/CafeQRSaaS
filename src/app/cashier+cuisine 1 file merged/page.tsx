"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "../../../lib/supabase";
import { Check, X, Clock, ChefHat, AlertOctagon, Printer, Lock, AlertTriangle, Plus, UtensilsCrossed, ShoppingBag } from "lucide-react";
import { verifyPin, cashierUpdateOrderStatus, cashierMarkOutOfStock } from "../../../actions/auth";
import { checkCafeSubscription } from "../../../actions/saas";

const formatMAD = (price: number) => {
  return `${Number(price).toFixed(2)} د.م`;
};

export default function CashierDashboard({ params }: { params: Promise<{ cafeSlug: string }> }) {
  const { cafeSlug } = use(params);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // 🌟 حالات الحماية والمنع
  const [isSessionFull, setIsSessionFull] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const [cafeId, setCafeId] = useState<string | null>(null);
  const [cafeDataObj, setCafeDataObj] = useState<any>(null); 
  
  const [printOrder, setPrintOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  // 🌟 أدوات نظام الكاشير اليدوي مباشر (POS Drawer)
  const [products, setProducts] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [showPOS, setShowPOS] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [posCart, setPosCart] = useState<{ [key: string]: any }>({});
  const [posCategory, setPosCategory] = useState<string>("الجميع");
  const [isSubmittingPos, setIsSubmittingPos] = useState(false);

  const fetchOrders = async (cId: string) => {
    const { data } = await supabase
      .from('orders')
      .select('*, tables(table_number)')
      .eq('cafe_id', cId)
      .neq('status', 'completed')
      .neq('status', 'rejected')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  useEffect(() => {
    const sessionKey = `cashier_auth_${cafeSlug}`;
    if (sessionStorage.getItem(sessionKey) === 'true') setIsAuthenticated(true);

    const initCafe = async () => {
      setIsLoading(true);

      // 💀 1. التحقق الفوري من اشتراك الـ SaaS
      const subCheck = await checkCafeSubscription(cafeSlug);
      if (!subCheck.isValid) {
        setIsSuspended(true);
        setIsLoading(false);
        return;
      }

      const { data: cafeData } = await supabase.from('cafes').select('id, max_cashiers').eq('slug', cafeSlug).single();
      if (!cafeData) { setIsNotFound(true); setIsLoading(false); return; }
      
      setCafeId(cafeData.id);
      setCafeDataObj(cafeData);

      // 🌟 جلب المنتجات والطاولات المتاحة لاستخدامها في الكاشير اليدوي
      const [pRes, tRes] = await Promise.all([
        supabase.from('products').select('*').eq('cafe_id', cafeData.id).eq('is_active', true),
        supabase.from('tables').select('id, table_number').eq('cafe_id', cafeData.id)
      ]);

      if (pRes.data) setProducts(pRes.data);
      if (tRes.data) {
        setTables(tRes.data);
        if (tRes.data.length > 0) setSelectedTableId(tRes.data[0].id);
      }

      await fetchOrders(cafeData.id);
      setIsLoading(false);
    };
    initCafe();
  }, [cafeSlug]);

  // 📡 محرك الحماية والقلب الصامت (Heartbeat)
  useEffect(() => {
    if (!isAuthenticated || !cafeDataObj) return;

    fetchOrders(cafeDataObj.id);

    const heartbeat = setInterval(async () => {
      const liveCheck = await checkCafeSubscription(cafeSlug);
      if (!liveCheck.isValid) setIsSuspended(true);
    }, 60000);

    const ordersChannel = supabase.channel(`live-orders-${cafeDataObj.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `cafe_id=eq.${cafeDataObj.id}` }, (payload) => {
        fetchOrders(cafeDataObj.id);
        if (payload.eventType === 'INSERT') new Audio('/bell.mp3').play().catch(() => {});
      }).subscribe();

    let myTabId = sessionStorage.getItem('cashier_tab_id');
    if (!myTabId) {
      myTabId = Math.random().toString(36).substring(2, 12);
      sessionStorage.setItem('cashier_tab_id', myTabId);
    }

    const slotChannel = supabase.channel(`cashier_slots_${cafeDataObj.id}`, {
      config: { presence: { key: myTabId } }
    });

    slotChannel.on('presence', { event: 'sync' }, () => {
      const presenceState = slotChannel.presenceState();
      const maxAllowed = cafeDataObj.max_cashiers || 1;
      if (!presenceState[myTabId]) return;

      const activeSessions: { key: string, onlineAt: number }[] = [];
      Object.entries(presenceState).forEach(([key, presences]: [string, any]) => {
        if (presences.length > 0) activeSessions.push({ key, onlineAt: new Date(presences[0].online_at || Date.now()).getTime() });
      });

      activeSessions.sort((a, b) => a.onlineAt - b.onlineAt);
      const allowedKeys = activeSessions.slice(0, maxAllowed).map(s => s.key);

      if (!allowedKeys.includes(myTabId)) {
        setIsSessionFull(true);
        slotChannel.untrack();
        sessionStorage.removeItem(`cashier_auth_${cafeSlug}`);
        setIsAuthenticated(false);
      }
    });

    slotChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') await slotChannel.track({ online_at: new Date().toISOString() });
    });

    return () => { 
      clearInterval(heartbeat);
      supabase.removeChannel(ordersChannel); 
      supabase.removeChannel(slotChannel);
    };
  }, [isAuthenticated, cafeDataObj, cafeSlug]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || !cafeId) return;

    setIsChecking(true);
    const isValid = await verifyPin(cafeId, "cashier", pinInput);
    setIsChecking(false);

    if (isValid) {
      setIsAuthenticated(true);
      sessionStorage.setItem(`cashier_auth_${cafeSlug}`, 'true');
      setAttempts(0);
      new Audio('/bell.mp3').play().catch(()=> {});
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPinInput("");
      if (newAttempts >= 5) {
        setIsLocked(true);
        alert("تم حظرك مؤقتاً. يرجى الانتظار دقيقة.");
        setTimeout(() => { setIsLocked(false); setAttempts(0); }, 60000);
      } else alert(`الرمز غير صحيح ❌`);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { success } = await cashierUpdateOrderStatus(orderId, newStatus);
    if (!success) alert("خطأ أثناء التحديث.");
  };

  const markOutOfStock = async (productId: string, productName: string) => {
    if(!confirm(`تأكيد إيقاف "${productName}"؟`)) return;
    const { success } = await cashierMarkOutOfStock(productId);
    if (success) alert(`تم إيقاف "${productName}".`);
  };

  const handlePrintReceipt = (order: any) => {
    setPrintOrder(order);
    setTimeout(() => { window.print(); }, 150);
  };

  // 🌟 دوال التحكم في سلة الـ POS اليدوية
  const addToPos = (prod: any) => {
    setPosCart(prev => {
      const curr = prev[prod.id];
      if (curr) return { ...prev, [prod.id]: { ...curr, quantity: curr.quantity + 1 } };
      return { ...prev, [prod.id]: { id: prod.id, name_ar: prod.name_ar, price: prod.price, quantity: 1 } };
    });
  };

  const decFromPos = (pId: string) => {
    setPosCart(prev => {
      const curr = prev[pId];
      if (!curr) return prev;
      if (curr.quantity <= 1) {
        const next = { ...prev };
        delete next[pId];
        return next;
      }
      return { ...prev, [pId]: { ...curr, quantity: curr.quantity - 1 } };
    });
  };

  const handleCreateManualOrder = async () => {
    const cartItems = Object.values(posCart);
    if (cartItems.length === 0 || !selectedTableId || !cafeId) return;

    setIsSubmittingPos(true);
    try {
      const dummySession = "manual_pos_" + Date.now();
      const totalAmount = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

      const { error } = await supabase.from('orders').insert([{
        cafe_id: cafeId, table_id: selectedTableId, session_id: dummySession,
        items: cartItems, total_amount: totalAmount, status: 'accepted' // مقبول تلقائياً حيت الكاشير اللي دخلو
      }]);

      if (error) throw error;

      new Audio('/bell.mp3').play().catch(()=>{});
      setPosCart({});
      setShowPOS(false);
      fetchOrders(cafeId);
    } catch (err) { alert("فشل إنشاء الطلب اليدوي."); } 
    finally { setIsSubmittingPos(false); }
  };

  if (isLoading) return <div className="min-h-screen bg-muted/20 flex items-center justify-center"><div className="w-12 h-12 border-4 border-foreground border-t-transparent rounded-full animate-spin"/></div>;

  if (isNotFound) return <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-6 text-center" dir="rtl"><AlertTriangle className="w-16 h-16 text-red-500 mb-4"/><h1 className="text-3xl font-bold">404 - المقهى غير موجود</h1></div>;

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-rose-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans" dir="rtl">
        <Lock size={64} className="text-rose-500 mb-4 animate-pulse" />
        <h1 className="text-3xl font-black mb-2">نظام الكاشير متوقف مؤقتاً 🚫</h1>
        <p className="text-rose-200/80 max-w-md text-sm">انتهت صلاحية اشتراك المقهى. يرجى التجديد لاستئناف العمل.</p>
      </div>
    );
  }

  if (isSessionFull) {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <Lock size={64} className="text-red-500 mb-4" />
        <h1 className="text-3xl font-black mb-2">الجلسة ممتلئة</h1>
        <p className="text-stone-400 max-w-md mb-6">وصل هذا المقهى للحد الأقصى من شاشات الكاشير المسموحة.</p>
        <button onClick={() => window.location.reload()} className="bg-white text-black px-6 py-3 rounded-xl font-bold">إعادة المحاولة 🔄</button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-6" dir="rtl">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border w-full max-w-sm text-center">
          <div className="bg-foreground w-20 h-20 rounded-full flex items-center justify-center text-white mx-auto mb-6"><Lock size={36}/></div>
          <h2 className="text-2xl font-extrabold mb-2">منطقة الكاشير</h2>
          <p className="text-muted-foreground mb-8 text-sm font-bold">أدخل الرمز السري لاستقبال الطلبات</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input type="password" inputMode="numeric" value={pinInput} onChange={(e) => setPinInput(e.target.value)} className="border-2 rounded-2xl p-4 text-center text-3xl tracking-[0.5em] font-mono outline-none" placeholder="••••" autoFocus />
            <button type="submit" className="py-4 rounded-2xl font-bold text-lg text-white bg-foreground hover:opacity-90">دخول</button>
          </form>
        </div>
      </div>
    );
  }

  const posCategoriesList = ["الجميع", ...Array.from(new Set(products.map(p => p.category)))];
  const cartItemsArray = Object.values(posCart);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `@media print { .no-print { display: none !important; } .print-only { display: block !important; } @page { margin: 0; size: 80mm auto; } body { background-color: white; margin: 0; } }`}} />
      
      <div className="min-h-screen bg-muted/20 p-6 md:p-12 no-print font-sans" dir="rtl">
        
        {/* 🌟 الهيدر التفاعلي الجديد المجهز بـ POS */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between bg-white p-6 rounded-[2rem] shadow-sm border border-border gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"/>
              <span className="text-[11px] font-bold font-mono tracking-wider text-emerald-600 uppercase">Live POS Terminal</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">شاشة الكاشير والمطبخ 👨‍🍳</h1>
          </div>
          
          <button 
            onClick={() => setShowPOS(true)}
            className="bg-foreground hover:bg-foreground/90 text-white px-6 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 shadow-xl transition-transform active:scale-95 shrink-0"
          >
            <Plus size={20} className="text-primary" />
            <span>تسجيل طلب مباشر (POS)</span>
          </button>
        </header>

        {/* 🌟 نافذة إدخال الطلبات المباشرة (POS Modal Drawer) */}
        {showPOS && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-5xl h-[88vh] rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-border">
              
              {/* يمين النافذة: منتجات القهوة (70%) */}
              <div className="flex-1 flex flex-col bg-slate-50/60 p-6 overflow-hidden order-2 md:order-1">
                <div className="flex items-center justify-between pb-4 mb-4 border-b">
                  <h3 className="font-black text-xl flex items-center gap-2"><UtensilsCrossed className="text-primary" size={22}/> المنيو السريع</h3>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {posCategoriesList.map(cat => (
                      <button key={cat} onClick={() => setPosCategory(cat)} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${posCategory === cat ? 'bg-foreground text-white shadow-md' : 'bg-white text-muted-foreground border hover:bg-slate-100'}`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 pr-1">
                  {products.filter(p => posCategory === 'الجميع' || p.category === posCategory).map(p => (
                    <div key={p.id} onClick={() => addToPos(p)} className="bg-white p-3.5 rounded-2xl border hover:border-primary cursor-pointer shadow-sm hover:shadow transition-all flex flex-col justify-between active:scale-95 select-none">
                      <div className="aspect-square w-full rounded-xl bg-muted overflow-hidden mb-2">
                        <img src={p.image_url} alt={p.name_ar} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs truncate">{p.name_ar}</h4>
                        <span className="font-black text-sm text-primary mt-1 block">{formatMAD(p.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* يسار النافذة: التذكرة (30%) */}
              <div className="w-full md:w-88 bg-white p-6 flex flex-col justify-between border-r order-1 md:order-2 shadow-lg z-10">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-lg">تذكرة الطلب المباشر</h3>
                    <button onClick={() => setShowPOS(false)} className="p-1.5 bg-muted rounded-full hover:bg-gray-200"><X size={18}/></button>
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">اختر الطاولة المستهدفة:</label>
                    {tables.length === 0 ? (
                      <div className="p-3 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">لا توجد طاولات مسجلة!</div>
                    ) : (
                      <select value={selectedTableId} onChange={(e) => setSelectedTableId(e.target.value)} className="w-full p-3 bg-muted/40 border-2 rounded-xl font-bold text-sm focus:border-primary outline-none">
                        {tables.map(t => <option key={t.id} value={t.id}>طاولة رقم {t.table_number.replace('table_', '')}</option>)}
                      </select>
                    )}
                  </div>

                  <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1 mb-4">
                    {cartItemsArray.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground text-xs font-bold border-2 border-dashed rounded-2xl">اضغط على منتج لإضافته للتذكرة</div>
                    ) : (
                      cartItemsArray.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between p-2.5 bg-muted/20 border rounded-xl text-xs font-bold">
                          <div className="flex-1 truncate pr-1">{item.name_ar}</div>
                          <div className="flex items-center gap-2" dir="ltr">
                            <button onClick={() => decFromPos(item.id)} className="w-6 h-6 bg-muted rounded flex items-center justify-center hover:bg-red-100 hover:text-red-600 font-black">-</button>
                            <span className="w-4 text-center">{item.quantity}</span>
                            <button onClick={() => addToPos(item)} className="w-6 h-6 bg-primary text-white rounded flex items-center justify-center font-black">+</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-muted-foreground">الإجمالي:</span>
                    <span className="text-2xl font-black text-primary">{formatMAD(cartItemsArray.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0))}</span>
                  </div>

                  <button 
                    onClick={handleCreateManualOrder}
                    disabled={isSubmittingPos || cartItemsArray.length === 0 || !selectedTableId}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-2xl font-black text-base shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    {isSubmittingPos ? "جاري الإرسال..." : "تأكيد وإرسال للمطبخ ⚡"}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 🌟 شبكة الطلبات النشطة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white rounded-[2.5rem] border border-dashed p-10">
              <ShoppingBag className="mx-auto text-muted-foreground/30 mb-3" size={48}/>
              <p className="text-muted-foreground text-lg font-bold">لا توجد طلبات نشطة حالياً.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">امسح الـ QR أو اضغط على [+ تسجيل طلب مباشر] فوق لإنشاء طلب جديد</p>
            </div>
          ) : orders.map((order) => (
            <div key={order.id} className={`bg-white rounded-[2rem] p-6 shadow-sm border-2 ${order.status === 'pending' ? 'border-yellow-400' : order.status === 'accepted' ? 'border-blue-400' : 'border-green-400'}`}>
              <div className="flex justify-between items-start mb-6 border-b pb-4">
                <div><h2 className="text-2xl font-extrabold">طاولة {order.tables?.table_number?.replace('table_', '')}</h2><p className="text-xs font-bold text-muted-foreground mt-1">#{order.id.split('-')[0]}</p></div>
                <div className="flex flex-col items-end gap-2"><span className="text-xl font-black text-primary">{formatMAD(order.total_amount)}</span><button onClick={() => handlePrintReceipt(order)} className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-xl text-sm font-bold"><Printer size={16} /> طباعة</button></div>
              </div>
              <div className="space-y-2 mb-8 min-h-[120px]">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-muted/30 p-2.5 rounded-xl border"><div className="flex items-center gap-3"><span className="bg-primary text-white w-7 h-7 flex items-center justify-center rounded-lg font-bold text-sm">x{item.quantity}</span><span className="font-bold">{item.name_ar}</span></div><button onClick={() => markOutOfStock(item.id, item.name_ar)} className="text-red-500 bg-red-50 p-2 rounded-lg hover:bg-red-500 hover:text-white"><AlertOctagon size={18} /></button></div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-auto">
                {order.status === 'pending' && <><button onClick={() => updateOrderStatus(order.id, 'accepted')} className="bg-foreground text-white py-3.5 rounded-xl font-bold flex justify-center items-center gap-2"><Check size={18} /> قبول</button><button onClick={() => updateOrderStatus(order.id, 'rejected')} className="bg-red-50 text-red-600 py-3.5 rounded-xl font-bold flex justify-center items-center gap-2"><X size={18} /> رفض</button></>}
                {order.status === 'accepted' && <button onClick={() => updateOrderStatus(order.id, 'ready')} className="col-span-2 bg-primary text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2"><ChefHat size={20} /> جاهز للتقديم</button>}
                {order.status === 'ready' && <button onClick={() => updateOrderStatus(order.id, 'completed')} className="col-span-2 bg-green-500 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2"><Check size={20} /> إنهاء الطلب</button>}
              </div>
            </div>
          ))}
        </div>

      </div>
      
      {printOrder && (<div className="print-only hidden font-mono text-black bg-white w-full max-w-[300px] mx-auto p-4 text-sm" dir="rtl"><div className="text-center pb-4 border-b-2 border-dashed border-gray-400 mb-4"><h2 className="text-2xl font-extrabold mb-1">EgoCafe</h2><p className="text-xs">Smart QR System</p></div><div className="mb-4 text-xs space-y-1 font-bold"><p>رقم الطاولة: {printOrder.tables?.table_number?.replace('table_', '')}</p><p>رقم الطلب: #{printOrder.id.split('-')[0]}</p></div><div className="border-b-2 border-dashed border-gray-400 pb-4 mb-4"><table className="w-full text-sm"><tbody>{printOrder.items.map((item: any, i: number) => (<tr key={i}><td className="py-1 font-bold">{item.name_ar}</td><td className="text-center font-extrabold">x{item.quantity}</td></tr>))}</tbody></table></div><div className="text-center"><p className="text-xl font-extrabold">{formatMAD(printOrder.total_amount)}</p></div></div>)}
    </>
  );
}