"use client";

import { useState } from "react";
import { Check, X, Clock, ChefHat, AlertOctagon, Printer, Lock, AlertTriangle, Plus, UtensilsCrossed, ShoppingBag } from "lucide-react";
import { useDemoProducts, useDemoOrders } from "@/lib/demoStore";

const formatMAD = (price: number) => {
  return `${Number(price).toFixed(2)} د.م`;
};

// 🌟 طاولات وهمية للـ Demo
const DEMO_TABLES = [
  { id: "t1", table_number: "table_1" },
  { id: "t4", table_number: "table_4" },
  { id: "t12", table_number: "table_12" }
];

export default function CashierDemoDashboard() {
  // 🌟 استدعاء الداتا الحية المشتركة (Zero-Server)
  const { products } = useDemoProducts();
  const { orders, updateOrders } = useDemoOrders();

  const [printOrder, setPrintOrder] = useState<any>(null);
  const [showPOS, setShowPOS] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string>("t1");
  const [posCart, setPosCart] = useState<{ [key: string]: any }>({});
  const [posCategory, setPosCategory] = useState<string>("الجميع");
  const [isSubmittingPos, setIsSubmittingPos] = useState(false);

  // تصفية الطلبات: الكاشير كيشوف غير الطلبات اللي مازال ماسالاتش
  const activeOrders = orders.filter(o => !['completed', 'rejected', 'cancelled'].includes(o.status));

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    // تحديث حالة الطلب ومزامنتها مع باقي الصفحات
    const updatedOrders = orders.map(o => 
      o.id === orderId ? { ...o, status: newStatus } : o
    );
    updateOrders(updatedOrders);
  };

  const markOutOfStock = (productId: string, productName: string) => {
    if(!confirm(`تأكيد إيقاف "${productName}"؟ (ديمو)`)) return;
    alert(`تم إيقاف "${productName}". (محاكاة فقط في بيئة التجربة)`);
  };

  const handlePrintReceipt = (order: any) => {
    setPrintOrder(order);
    setTimeout(() => { window.print(); }, 150);
  };

  // 🌟 دوال إدارة سلة الـ POS اليدوية
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

  const handleCreateManualOrder = () => {
    const cartItems = Object.values(posCart);
    if (cartItems.length === 0 || !selectedTableId) return;

    setIsSubmittingPos(true);
    
    // محاكاة تأخير الشبكة بشكل خفيف
    setTimeout(() => {
      const totalAmount = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      const targetTable = DEMO_TABLES.find(t => t.id === selectedTableId);

      const newOrder = {
        id: "ORD-" + Math.floor(1000 + Math.random() * 9000),
        tables: { table_number: targetTable?.table_number },
        items: cartItems,
        total_amount: totalAmount,
        status: 'accepted', // يذهب للمطبخ مباشرة
        created_at: new Date().toISOString()
      };

      updateOrders([newOrder, ...orders]); // مزامنة مع المتجر المحلي

      setPosCart({});
      setShowPOS(false);
      setIsSubmittingPos(false);
      alert("تم تسجيل الطلب وإرساله للمطبخ بنجاح! ⚡");
    }, 400);
  };

  const posCategoriesList = ["الجميع", ...Array.from(new Set(products.map(p => p.category)))];
  const cartItemsArray = Object.values(posCart);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `@media print { .no-print { display: none !important; } .print-only { display: block !important; } @page { margin: 0; size: 80mm auto; } body { background-color: white; margin: 0; } }`}} />
      
      <div className="min-h-screen bg-muted/20 p-6 md:p-12 no-print font-sans" dir="rtl">
        
        {/* هيدر الكاشير الفخم */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between bg-white p-6 rounded-[2rem] shadow-sm border border-emerald-500/30 gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl">LIVE SYNC DEMO</div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"/>
              <span className="text-[11px] font-bold font-mono tracking-wider text-emerald-600 uppercase">Live POS Terminal</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">شاشة الكاشير وإدارة الطلبات 💳</h1>
            <p className="text-muted-foreground mt-1 text-sm font-bold">يقوم بإنشاء واستقبال الطلبات وإرسالها للمطبخ بدون سيرفر.</p>
          </div>
          
          <button 
            onClick={() => setShowPOS(true)}
            className="bg-foreground hover:bg-foreground/90 text-white px-6 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 shadow-xl transition-transform active:scale-95 shrink-0"
          >
            <Plus size={20} className="text-primary" />
            <span>تسجيل طلب مباشر (POS)</span>
          </button>
        </header>

        {/* نافذة تسجيل الطلبات المباشرة (POS Modal Drawer) */}
        {showPOS && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-5xl h-[88vh] rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-border">
              
              {/* قائمة الأصناف السريعة */}
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
                  {products.length === 0 && <div className="col-span-full py-10 text-center text-muted-foreground font-bold">لا توجد منتجات. أضفها من لوحة الإدارة أولاً.</div>}
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

              {/* تذكرة الطلب */}
              <div className="w-full md:w-88 bg-white p-6 flex flex-col justify-between border-r order-1 md:order-2 shadow-lg z-10">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-lg">تذكرة الطلب المباشر</h3>
                    <button onClick={() => setShowPOS(false)} className="p-1.5 bg-muted rounded-full hover:bg-gray-200"><X size={18}/></button>
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">اختر الطاولة المستهدفة:</label>
                    <select value={selectedTableId} onChange={(e) => setSelectedTableId(e.target.value)} className="w-full p-3 bg-muted/40 border-2 rounded-xl font-bold text-sm focus:border-primary outline-none">
                      {DEMO_TABLES.map(t => <option key={t.id} value={t.id}>طاولة رقم {t.table_number.replace('table_', '')}</option>)}
                    </select>
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

        {/* شبكة الطلبات الحية */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeOrders.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white rounded-[2.5rem] border border-dashed p-10">
              <ShoppingBag className="mx-auto text-muted-foreground/30 mb-3" size={48}/>
              <p className="text-muted-foreground text-lg font-bold">لا توجد طلبات نشطة حالياً.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">اضغط على [+ تسجيل طلب مباشر] لإنشاء طلب وتجربة المزامنة الحية.</p>
            </div>
          ) : activeOrders.map((order) => (
            <div key={order.id} className={`bg-white rounded-[2rem] p-6 shadow-sm border-2 ${order.status === 'pending' ? 'border-yellow-400' : order.status === 'accepted' ? 'border-blue-400' : 'border-green-400 animate-pulse'}`}>
              <div className="flex justify-between items-start mb-6 border-b pb-4">
                <div>
                  <h2 className="text-2xl font-extrabold">طاولة {order.tables?.table_number?.replace('table_', '')}</h2>
                  <p className="text-xs font-bold text-muted-foreground mt-1">#{order.id.split('-')[0]}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xl font-black text-primary">{formatMAD(order.total_amount)}</span>
                  <button onClick={() => handlePrintReceipt(order)} className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-xl text-sm font-bold"><Printer size={16} /> طباعة</button>
                </div>
              </div>

              <div className="space-y-2 mb-8 min-h-[120px]">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-muted/30 p-2.5 rounded-xl border">
                    <div className="flex items-center gap-3">
                      <span className="bg-primary text-white w-7 h-7 flex items-center justify-center rounded-lg font-bold text-sm">x{item.quantity}</span>
                      <span className="font-bold">{item.name_ar}</span>
                    </div>
                    <button onClick={() => markOutOfStock(item.id, item.name_ar)} className="text-red-500 bg-red-50 p-2 rounded-lg hover:bg-red-500 hover:text-white"><AlertOctagon size={18} /></button>
                  </div>
                ))}
              </div>

              {/* أزرار الحسم المفصولة عن المطبخ */}
              <div className="grid grid-cols-2 gap-3 mt-auto">
                {order.status === 'pending' && (
                  <>
                    <button onClick={() => updateOrderStatus(order.id, 'accepted')} className="bg-foreground text-white py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 active:scale-95 transition-transform"><Check size={18} /> قبول</button>
                    <button onClick={() => updateOrderStatus(order.id, 'rejected')} className="bg-red-50 text-red-600 py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-red-100 transition-colors"><X size={18} /> رفض</button>
                  </>
                )}

                {order.status === 'accepted' && (
                  <div className="col-span-2 bg-blue-50 text-blue-700 py-4 rounded-xl font-bold flex justify-center items-center gap-2 border border-blue-200 select-none">
                    <Clock className="animate-spin text-blue-500" size={18} /> 
                    <span>جاري التحضير في المطبخ... 👨‍🍳</span>
                  </div>
                )}

                {order.status === 'ready' && (
                  <button onClick={() => updateOrderStatus(order.id, 'completed')} className="col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black text-base flex justify-center items-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95 transition-all">
                    <Check size={22} /> إنهاء الطلب 
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
      
      {printOrder && (<div className="print-only hidden font-mono text-black bg-white w-full max-w-[300px] mx-auto p-4 text-sm" dir="rtl"><div className="text-center pb-4 border-b-2 border-dashed border-gray-400 mb-4"><h2 className="text-2xl font-extrabold mb-1">CafeQR Demo</h2><p className="text-xs">Smart QR System</p></div><div className="mb-4 text-xs space-y-1 font-bold"><p>رقم الطاولة: {printOrder.tables?.table_number?.replace('table_', '')}</p><p>رقم الطلب: #{printOrder.id}</p></div><div className="border-b-2 border-dashed border-gray-400 pb-4 mb-4"><table className="w-full text-sm"><tbody>{printOrder.items.map((item: any, i: number) => (<tr key={i}><td className="py-1 font-bold">{item.name_ar}</td><td className="text-center font-extrabold">x{item.quantity}</td></tr>))}</tbody></table></div><div className="text-center"><p className="text-xl font-extrabold">{formatMAD(printOrder.total_amount)}</p></div></div>)}
    </>
  );
}