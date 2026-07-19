"use client";

import { useState } from "react";
import { Check, X, Clock, ChefHat, AlertOctagon, Printer, Lock, AlertTriangle, Plus, UtensilsCrossed, ShoppingBag } from "lucide-react";
import { useDemoProducts, useDemoOrders } from "@/lib/demoStore";

const formatMAD = (price: number) => {
  return `${Number(price).toFixed(2)} MAD`;
};

// 🌟 الطاولات الوهمية للـ Demo
const DEMO_TABLES = [
  { id: "t1", table_number: "table_1" },
  { id: "t4", table_number: "table_4" },
  { id: "t12", table_number: "table_12" }
];

// 🌟 قاموس الترجمات (Translation Dictionary)
const translations = {
  EN: {
    demoBadge: "LIVE SYNC DEMO",
    posTerminal: "Live POS Terminal",
    title: "Cashier & Order Management 💳",
    subtitle: "Accept orders here, then switch to the Kitchen tab to see the 3D printer in action!",
    newOrderBtn: "Direct POS Order",
    quickMenu: "Quick Menu",
    all: "All",
    noProducts: "No products available. Add them from the admin panel first.",
    ticketTitle: "Direct Order Ticket",
    targetTable: "Select Target Table:",
    table: "Table",
    emptyCart: "Click on a product to add it to the ticket",
    total: "Total:",
    sending: "Sending...",
    sendKitchen: "Confirm & Send to Kitchen ⚡",
    noOrders: "No active orders currently.",
    noOrdersSub: "Click [+ Direct POS Order] to create an order and test live sync.",
    print: "Print",
    accept: "Accept",
    reject: "Reject",
    preparing: "Preparing in the kitchen... (Go tear the receipt! 🏃‍♂️)",
    complete: "Complete Order",
    outOfStockPrompt: "Confirm out of stock for",
    outOfStockAlert: "marked out of stock. (Simulation only in Demo)",
    orderSuccess: "Sent! Switch to the Kitchen tab quickly to see it print! 🏃‍♂️⚡",
    printDemo: "Smart QR System",
    orderNo: "Order No",
  },
  FR: {
    demoBadge: "DÉMO EN DIRECT",
    posTerminal: "Terminal de Caisse",
    title: "Caisse & Commandes 💳",
    subtitle: "Acceptez les commandes ici, puis passez à l'onglet Cuisine pour voir l'imprimante 3D !",
    newOrderBtn: "Nouvelle Commande",
    quickMenu: "Menu Rapide",
    all: "Tout",
    noProducts: "Aucun produit disponible. Ajoutez-les depuis l'administration.",
    ticketTitle: "Ticket de Commande",
    targetTable: "Sélectionnez la table :",
    table: "Table",
    emptyCart: "Cliquez sur un produit pour l'ajouter",
    total: "Total :",
    sending: "Envoi...",
    sendKitchen: "Confirmer & Envoyer ⚡",
    noOrders: "Aucune commande active pour le moment.",
    noOrdersSub: "Cliquez sur [+ Nouvelle Commande] pour tester la démo.",
    print: "Imprimer",
    accept: "Accepter",
    reject: "Refuser",
    preparing: "En cuisine... (Allez déchirer le ticket ! 🏃‍♂️)",
    complete: "Terminer la Commande",
    outOfStockPrompt: "Confirmer la rupture de stock pour",
    outOfStockAlert: "marqué en rupture. (Simulation uniquement)",
    orderSuccess: "Envoyé ! Passez vite à l'onglet Cuisine pour le voir s'imprimer ! 🏃‍♂️⚡",
    printDemo: "Système QR Intelligent",
    orderNo: "Commande N°",
  },
  AR: {
    demoBadge: "مزامنة حية (ديمو)",
    posTerminal: "محطة الكاشير المباشرة",
    title: "شاشة الكاشير وإدارة الطلبات 💳",
    subtitle: "اقبل الطلبات هنا، ثم انتقل لتبويب المطبخ لترى طابعة الفواتير 3D في العمل!",
    newOrderBtn: "تسجيل طلب مباشر",
    quickMenu: "المنيو السريع",
    all: "الجميع",
    noProducts: "لا توجد منتجات. أضفها من لوحة الإدارة أولاً.",
    ticketTitle: "تذكرة الطلب المباشر",
    targetTable: "اختر الطاولة المستهدفة:",
    table: "طاولة",
    emptyCart: "اضغط على منتج لإضافته للتذكرة",
    total: "الإجمالي:",
    sending: "جاري الإرسال...",
    sendKitchen: "تأكيد وإرسال للمطبخ ⚡",
    noOrders: "لا توجد طلبات نشطة حالياً.",
    noOrdersSub: "اضغط على [+ تسجيل طلب مباشر] لإنشاء طلب وتجربة المزامنة الحية.",
    print: "طباعة",
    accept: "قبول",
    reject: "رفض",
    preparing: "في المطبخ... (اذهب واقطع الفاتورة! 🏃‍♂️)",
    complete: "إنهاء الطلب",
    outOfStockPrompt: "تأكيد إيقاف",
    outOfStockAlert: "تم إيقاف. (محاكاة فقط في بيئة التجربة)",
    orderSuccess: "تم الإرسال! انتقل لتبويب المطبخ بسرعة لتراها تُطبع! 🏃‍♂️⚡",
    printDemo: "نظام QR الذكي",
    orderNo: "رقم الطلب",
  }
};

type LangType = "AR" | "FR" | "EN";

export default function CashierDemoDashboard() {
  const { products } = useDemoProducts();
  const { orders, updateOrders } = useDemoOrders();

  // 🌟 حالة اللغة الافتراضية
  const [lang, setLang] = useState<LangType>("EN");
  const t = translations[lang];

  const [printOrder, setPrintOrder] = useState<any>(null);
  const [showPOS, setShowPOS] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string>("t1");
  const [posCart, setPosCart] = useState<{ [key: string]: any }>({});
  const [posCategory, setPosCategory] = useState<string>("ALL");
  const [isSubmittingPos, setIsSubmittingPos] = useState(false);

  // دالة لجلب اسم المنتج حسب اللغة
  const getProductName = (p: any) => {
    if (lang === "AR") return p.name_ar;
    if (lang === "FR") return p.name_fr || p.name_en || p.name_ar;
    return p.name_en || p.name_ar;
  };

  const activeOrders = orders.filter(o => !['completed', 'rejected', 'cancelled'].includes(o.status));

  const handlePrintReceipt = (order: any) => {
    setPrintOrder(order);
    setTimeout(() => { window.print(); }, 150);
  };

  const updateOrderStatus = (order: any, newStatus: string) => {
    const updatedOrders = orders.map(o => 
      o.id === order.id ? { ...o, status: newStatus } : o
    );
    updateOrders(updatedOrders);
    
    // تم إلغاء الطباعة التلقائية (window.print) هنا لكي لا تقاطع تجربة الانتقال لتبويب المطبخ 3D
  };

  const markOutOfStock = (productId: string, productName: string) => {
    if(!confirm(`${t.outOfStockPrompt} "${productName}"?`)) return;
    alert(`"${productName}" ${t.outOfStockAlert}`);
  };

  const addToPos = (prod: any) => {
    setPosCart(prev => {
      const curr = prev[prod.id];
      if (curr) return { ...prev, [prod.id]: { ...curr, quantity: curr.quantity + 1 } };
      return { ...prev, [prod.id]: { id: prod.id, name_ar: prod.name_ar, name_en: prod.name_en, name_fr: prod.name_fr, price: prod.price, quantity: 1 } };
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
    
    setTimeout(() => {
      const totalAmount = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      const targetTable = DEMO_TABLES.find(tb => tb.id === selectedTableId);

      const newOrder = {
        id: "ORD-" + Math.floor(1000 + Math.random() * 9000),
        tables: { table_number: targetTable?.table_number },
        items: cartItems,
        total_amount: totalAmount,
        status: 'accepted',
        created_at: new Date().toISOString()
      };

      updateOrders([newOrder, ...orders]);

      setPosCart({});
      setShowPOS(false);
      setIsSubmittingPos(false);
      alert(t.orderSuccess);
    }, 400);
  };

  const posCategoriesList = ["ALL", ...Array.from(new Set(products.map(p => p.category)))];
  const cartItemsArray = Object.values(posCart);
  
  // الاتجاه حسب اللغة
  const dir = lang === "AR" ? "rtl" : "ltr";

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `@media print { .no-print { display: none !important; } .print-only { display: block !important; } @page { margin: 0; size: 80mm auto; } body { background-color: white; margin: 0; } }`}} />
      
      <div className="min-h-screen bg-muted/20 p-6 md:p-12 no-print font-sans" dir={dir}>
        
        {/* Premium Cashier Header */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between bg-white p-6 rounded-[2rem] shadow-sm border border-emerald-500/30 gap-4 relative overflow-hidden">
          <div className={`absolute top-0 ${lang === "AR" ? "left-0 rounded-br-xl" : "right-0 rounded-bl-xl"} bg-emerald-500 text-white text-[10px] font-black px-3 py-1`}>
            {t.demoBadge}
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"/>
              <span className="text-[11px] font-bold font-mono tracking-wider text-emerald-600 uppercase">{t.posTerminal}</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">{t.title}</h1>
            <p className="text-muted-foreground mt-1 text-sm font-bold">{t.subtitle}</p>
          </div>
          
          <div className="flex items-center gap-4 shrink-0 flex-wrap">
            {/* 🌟 Language Switcher */}
            <div className="flex bg-muted/60 p-1 rounded-full w-max border">
              {(["AR", "FR", "EN"] as LangType[]).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${lang === l ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {l}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowPOS(true)}
              className="bg-foreground hover:bg-foreground/90 text-white px-6 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 shadow-xl transition-transform active:scale-95"
            >
              <Plus size={20} className="text-primary" />
              <span>{t.newOrderBtn}</span>
            </button>
          </div>
        </header>

        {/* POS Manual Order Drawer */}
        {showPOS && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-5xl h-[88vh] rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-border">
              
              <div className={`flex-1 flex flex-col bg-slate-50/60 p-6 overflow-hidden order-2 ${lang === "AR" ? "md:order-2" : "md:order-1"}`}>
                <div className="flex items-center justify-between pb-4 mb-4 border-b">
                  <h3 className="font-black text-xl flex items-center gap-2"><UtensilsCrossed className="text-primary" size={22}/> {t.quickMenu}</h3>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {posCategoriesList.map(cat => (
                      <button key={cat} onClick={() => setPosCategory(cat)} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${posCategory === cat ? 'bg-foreground text-white shadow-md' : 'bg-white text-muted-foreground border hover:bg-slate-100'}`}>
                        {cat === "ALL" ? t.all : cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 pr-1">
                  {products.length === 0 && <div className="col-span-full py-10 text-center text-muted-foreground font-bold">{t.noProducts}</div>}
                  {products.filter(p => posCategory === 'ALL' || p.category === posCategory).map(p => (
                    <div key={p.id} onClick={() => addToPos(p)} className="bg-white p-3.5 rounded-2xl border hover:border-primary cursor-pointer shadow-sm hover:shadow transition-all flex flex-col justify-between active:scale-95 select-none">
                      <div className="aspect-square w-full rounded-xl bg-muted overflow-hidden mb-2">
                        <img src={p.image_url} alt={getProductName(p)} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs truncate">{getProductName(p)}</h4>
                        <span className="font-black text-sm text-primary mt-1 block" dir="ltr">{formatMAD(p.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`w-full md:w-88 bg-white p-6 flex flex-col justify-between order-1 shadow-lg z-10 ${lang === "AR" ? "md:order-1 border-l" : "md:order-2 border-r"}`}>
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-lg">{t.ticketTitle}</h3>
                    <button onClick={() => setShowPOS(false)} className="p-1.5 bg-muted rounded-full hover:bg-gray-200"><X size={18}/></button>
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">{t.targetTable}</label>
                    <select value={selectedTableId} onChange={(e) => setSelectedTableId(e.target.value)} className={`w-full p-3 bg-muted/40 border-2 rounded-xl font-bold text-sm focus:border-primary outline-none ${lang === "AR" ? "text-right" : "text-left"}`}>
                      {DEMO_TABLES.map(tb => <option key={tb.id} value={tb.id}>{t.table} {tb.table_number.replace('table_', '')}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1 mb-4">
                    {cartItemsArray.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground text-xs font-bold border-2 border-dashed rounded-2xl">{t.emptyCart}</div>
                    ) : (
                      cartItemsArray.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between p-2.5 bg-muted/20 border rounded-xl text-xs font-bold">
                          <div className="flex-1 truncate pr-1">{getProductName(item)}</div>
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
                    <span className="font-bold text-sm text-muted-foreground">{t.total}</span>
                    <span className="text-2xl font-black text-primary" dir="ltr">{formatMAD(cartItemsArray.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0))}</span>
                  </div>

                  <button 
                    onClick={handleCreateManualOrder}
                    disabled={isSubmittingPos || cartItemsArray.length === 0 || !selectedTableId}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-2xl font-black text-base shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    {isSubmittingPos ? t.sending : t.sendKitchen}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Live Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeOrders.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white rounded-[2.5rem] border border-dashed p-10">
              <ShoppingBag className="mx-auto text-muted-foreground/30 mb-3" size={48}/>
              <p className="text-muted-foreground text-lg font-bold">{t.noOrders}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{t.noOrdersSub}</p>
            </div>
          ) : activeOrders.map((order) => (
            <div key={order.id} className={`bg-white rounded-[2rem] p-6 shadow-sm border-2 ${order.status === 'pending' ? 'border-yellow-400' : order.status === 'accepted' ? 'border-blue-400' : 'border-green-400 animate-pulse'}`}>
              <div className="flex justify-between items-start mb-6 border-b pb-4">
                <div>
                  <h2 className="text-2xl font-extrabold">{t.table} {order.tables?.table_number?.replace('table_', '')}</h2>
                  <p className="text-xs font-bold text-muted-foreground mt-1">#{order.id.split('-')[0]}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xl font-black text-primary" dir="ltr">{formatMAD(order.total_amount)}</span>
                  {/* إبقاء زر الطباعة اليدوية متاحاً للكاشير إذا أراد نسخة ورقية */}
                  <button onClick={() => handlePrintReceipt(order)} className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-xl text-sm font-bold"><Printer size={16} /> {t.print}</button>
                </div>
              </div>

              <div className="space-y-2 mb-8 min-h-[120px]">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-muted/30 p-2.5 rounded-xl border">
                    <div className="flex items-center gap-3">
                      <span className="bg-primary text-white w-7 h-7 flex items-center justify-center rounded-lg font-bold text-sm" dir="ltr">x{item.quantity}</span>
                      <span className="font-bold">{getProductName(item)}</span>
                    </div>
                    <button onClick={() => markOutOfStock(item.id, getProductName(item))} className="text-red-500 bg-red-50 p-2 rounded-lg hover:bg-red-500 hover:text-white"><AlertOctagon size={18} /></button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-auto">
                {order.status === 'pending' && (
                  <>
                    <button onClick={() => updateOrderStatus(order, 'accepted')} className="bg-foreground text-white py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 active:scale-95 transition-transform"><Check size={18} /> {t.accept}</button>
                    <button onClick={() => updateOrderStatus(order, 'rejected')} className="bg-red-50 text-red-600 py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-red-100 transition-colors"><X size={18} /> {t.reject}</button>
                  </>
                )}

                {/* عندما يقبل الكاشير الطلب، ينتظر تمزيق الفاتورة في المطبخ */}
                {order.status === 'accepted' && (
                  <div className="col-span-2 bg-blue-50 text-blue-700 py-4 rounded-xl font-bold flex justify-center items-center gap-2 border border-blue-200 select-none">
                    <Clock className="animate-spin text-blue-500" size={18} /> 
                    <span>{t.preparing}</span>
                  </div>
                )}

                {/* 🔥 بمجرد سحب وتمزيق الفاتورة من طابعة المطبخ، يتحول لـ ready ويظهر هذا الزر */}
                {order.status === 'ready' && (
                  <button onClick={() => updateOrderStatus(order, 'completed')} className="col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black text-base flex justify-center items-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95 transition-all">
                    <Check size={22} /> {t.complete} 
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
      
      {/* Print View */}
      {printOrder && (
        <div className="print-only hidden font-mono text-black bg-white w-full max-w-[300px] mx-auto p-4 text-sm" dir={dir}>
          <div className="text-center pb-4 border-b-2 border-dashed border-gray-400 mb-4">
            <h2 className="text-2xl font-extrabold mb-1">CafeQR Demo</h2>
            <p className="text-xs">{t.printDemo}</p>
          </div>
          <div className="mb-4 text-xs space-y-1 font-bold">
            <p>{t.table}: {printOrder.tables?.table_number?.replace('table_', '')}</p>
            <p>{t.orderNo}: #{printOrder.id.split('-')[0]}</p>
          </div>
          <div className="border-b-2 border-dashed border-gray-400 pb-4 mb-4">
            <table className="w-full text-sm">
              <tbody>
                {printOrder.items.map((item: any, i: number) => (
                  <tr key={i}>
                    <td className="py-1 font-bold">{getProductName(item)}</td>
                    <td className={`font-extrabold ${lang === "AR" ? "text-left" : "text-right"}`}>x{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-center">
            <p className="text-xl font-extrabold" dir="ltr">{formatMAD(printOrder.total_amount)}</p>
          </div>
        </div>
      )}
    </>
  );
}