"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/store/useCart"; // تأكد من مسار الـ store الخاص بك
import MenuCard from "@/components/MenuCard"; // تأكد من مسار الـ MenuCard الخاص بك
import { Receipt, X as XIcon, Clock, CheckCircle, Coffee, CakeSlice, CupSoda, Croissant, QrCode } from "lucide-react";
import { useDemoProducts, useDemoOrders } from "@/lib/demoStore";

const TRANSLATIONS: Record<string, any> = {
  ar: {
    subtitle: "اكتشف المذاق الأصيل ☕", empty: "لا توجد منتجات في هذا القسم حالياً.",
    confirmOrder: "تأكيد الطلب", sending: "جاري الإرسال...", itemsCount: "منتج", total: "الإجمالي",
    reviewing: "قيد المراجعة ⏳", preparing: "جاري التحضير 👨‍🍳", ready: "جاهز للتقديم 🚶‍♂️",
    orderNum: "رقم الطلب", addMore: "+ طلب شيء آخر", cancel: "إلغاء الطلب",
    myOrders: "طلباتي الحالية", emptyOrders: "لا توجد طلبات نشطة حالياً.", close: "إغلاق",
    categories: [
      { id: "coffee", name: "القهوة", icon: Coffee }, { id: "sweets", name: "الحلوى", icon: CakeSlice },
      { id: "juice", name: "عصائر", icon: CupSoda }, { id: "bakery", name: "مخبوزات", icon: Croissant }
    ]
  },
  en: {
    subtitle: "Discover Authentic Taste ☕", empty: "No products in this category.",
    confirmOrder: "Confirm Order", sending: "Sending...", itemsCount: "items", total: "Total",
    reviewing: "Reviewing ⏳", preparing: "Preparing 👨‍🍳", ready: "Ready! 🚶‍♂️",
    orderNum: "Order #", addMore: "+ Add more", cancel: "Cancel",
    myOrders: "My Orders", emptyOrders: "No active orders.", close: "Close",
    categories: [
      { id: "coffee", name: "Coffee", icon: Coffee }, { id: "sweets", name: "Sweets", icon: CakeSlice },
      { id: "juice", name: "Juices", icon: CupSoda }, { id: "bakery", name: "Bakery", icon: Croissant }
    ]
  },
  fr: {
    subtitle: "Découvrez le goût authentique ☕", empty: "Aucun produit dans cette catégorie.",
    confirmOrder: "Confirmer la cmd", sending: "Envoi...", itemsCount: "articles", total: "Total",
    reviewing: "En révision ⏳", preparing: "Préparation 👨‍🍳", ready: "Prêt! 🚶‍♂️",
    orderNum: "N° Cmd", addMore: "+ Ajouter", cancel: "Annuler",
    myOrders: "Mes Commandes", emptyOrders: "Aucune commande active.", close: "Fermer",
    categories: [
      { id: "coffee", name: "Café", icon: Coffee }, { id: "sweets", name: "Desserts", icon: CakeSlice },
      { id: "juice", name: "Jus", icon: CupSoda }, { id: "bakery", name: "Boulangerie", icon: Croissant }
    ]
  }
};

const LANGUAGES = ["ar", "fr", "en"];
const formatMAD = (price: number) => `${Number(price).toFixed(2)}`;

const getSafeUUID = () => {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function ClientMenuDemo() {
  const { items, totalItems, totalPrice, clearCart } = useCart();
  
  // 🌟 استدعاء الداتا الحية المشتركة
  const { products } = useDemoProducts();
  const { orders, updateOrders } = useDemoOrders();

  const [activeLang, setActiveLang] = useState("en");
  const t = TRANSLATIONS[activeLang];
  const [activeCategoryId, setActiveCategoryId] = useState("coffee");

  const [sessionId, setSessionId] = useState<string>("");
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // تصفية الطلبات: إظهار طلبات هذه الجلسة فقط (الزائر الحالي)
  const activeOrders = orders.filter(o => 
    o.session_id === sessionId && !['completed', 'rejected', 'cancelled'].includes(o.status)
  );

  const displayTitle = activeLang === 'ar' ? "مقهى ديمو" : activeLang === 'fr' ? "Café Demo" : "Demo Cafe";

  useEffect(() => {
    // محاكاة تحميل سريع وإنشاء جلسة وهمية للزائر
    setTimeout(() => {
      let localSession = localStorage.getItem('demo_client_session');
      if (!localSession) {
        localSession = getSafeUUID();
        localStorage.setItem('demo_client_session', localSession);
      }
      setSessionId(localSession);
      setIsLoading(false);
    }, 400);
  }, []);

  const handleCheckout = () => {
    if (totalItems() === 0) return;
    setIsSubmitting(true);

    // محاكاة إرسال الطلب (ينتقل فوراً للـ LocalStore ليظهر عند الكاشير)
    setTimeout(() => {
      const newOrder = {
        id: "ORD-" + Math.floor(1000 + Math.random() * 9000),
        cafe_id: "demo_cafe",
        table_id: "t1",
        tables: { table_number: "table_1" }, // نفترض أن هذا الزائر يجلس على الطاولة 1 في الديمو
        session_id: sessionId,
        items: items,
        total_amount: totalPrice(),
        status: 'pending', // يبدأ كقيد المراجعة ليوافق عليه الكاشير
        created_at: new Date().toISOString()
      };

      updateOrders([newOrder, ...orders]);
      setShowOrdersModal(true);
      clearCart();
      setIsSubmitting(false);
      
      // تشغيل صوت نجاح اختياري
      new Audio('/bell.mp3').play().catch(() => {});
    }, 600);
  };

  const handleCancelOrder = (orderId: string) => {
    if (!confirm(activeLang === 'ar' ? "هل أنت متأكد من الإلغاء؟" : "Are you sure?")) return;
    
    const updatedOrders = orders.map(o => 
      o.id === orderId ? { ...o, status: 'cancelled' } : o
    );
    updateOrders(updatedOrders);
    
    if (activeOrders.length <= 1) setShowOrdersModal(false);
  };

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center font-bold text-foreground">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-background pb-32 relative" dir={activeLang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* 🌟 لافتة الديمو */}
      <div className="bg-emerald-500 text-white text-xs font-black text-center py-1.5 tracking-widest uppercase">
        Live Sync Demo Mode
      </div>

      {/* 🌟 نافذة الطلبات الحالية */}
      {showOrdersModal && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto p-6 flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-8 mt-4 bg-white p-4 rounded-2xl shadow-sm border border-border">
            <h2 className="text-2xl font-extrabold text-foreground">{t.myOrders}</h2>
            <button onClick={() => setShowOrdersModal(false)} className="bg-muted p-2 rounded-full text-muted-foreground hover:bg-gray-200 transition-colors">
              <XIcon size={24} />
            </button>
          </div>

          <div className="space-y-4 flex-1">
            {activeOrders.length === 0 ? (
              <p className="text-center text-muted-foreground mt-10 font-bold bg-white p-6 rounded-2xl border">{t.emptyOrders}</p>
            ) : (
              activeOrders.map(order => (
                <div key={order.id} className="bg-white p-5 rounded-2xl border border-border shadow-sm flex flex-col gap-4 relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${order.status === 'pending' ? 'bg-yellow-400' : order.status === 'accepted' ? 'bg-blue-400' : 'bg-emerald-500'}`} />
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-muted-foreground">{t.orderNum}: #{order.id}</span>
                      <h3 className="font-extrabold text-xl mt-1 text-foreground">{formatMAD(order.total_amount)} <span className="text-sm font-bold text-muted-foreground">MAD</span></h3>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {order.status === 'pending' && <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={12}/> {t.reviewing}</span>}
                      {order.status === 'accepted' && <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{t.preparing}</span>}
                      {order.status === 'ready' && <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse"><CheckCircle size={12}/> {t.ready}</span>}
                    </div>
                  </div>

                  <div className="bg-muted/30 p-3 rounded-lg text-sm text-foreground font-bold">
                    {order.items.map((item:any, i:number) => (
                      <div key={i} className="flex justify-between">
                        <span>{item.quantity}x {activeLang === 'en' && item.name_en ? item.name_en : activeLang === 'fr' && item.name_fr ? item.name_fr : item.name_ar}</span>
                      </div>
                    ))}
                  </div>

                  {order.status === 'pending' && (
                    <button onClick={() => handleCancelOrder(order.id)} className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-100 transition-colors mt-2">
                      {t.cancel}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <button onClick={() => setShowOrdersModal(false)} className="mt-8 bg-foreground text-white py-4 rounded-xl font-bold w-full shadow-lg transition-transform active:scale-95 mb-4">
            {t.addMore}
          </button>
        </div>
      )}

      {/* 🌟 الهيدر الكلاسيكي النظيف */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-border/50">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-foreground tracking-tight uppercase">{displayTitle}</h1>
          <p className="text-xs text-primary font-bold mt-1 uppercase flex items-center gap-1">
            {t.subtitle} 
          </p>
        </div>
        <div className="flex items-center gap-3" dir="ltr">
          <div className="flex gap-1 bg-muted p-1 rounded-full border border-border/50">
            {LANGUAGES.map(lang => (
              <button key={lang} onClick={() => setActiveLang(lang)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-colors ${activeLang === lang ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'}`}>{lang}</button>
            ))}
          </div>

          {activeOrders.length > 0 && (
            <button onClick={() => setShowOrdersModal(true)} className="relative p-2 text-foreground bg-muted rounded-full hover:bg-gray-200 transition-colors animate-bounce">
              <Receipt size={20} />
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {activeOrders.length}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* 🌟 أقسام المنيو */}
      <div className="px-5 py-6 overflow-x-auto scrollbar-none flex gap-3 bg-muted/20 border-b border-border/50">
        {t.categories.map((cat: any) => (
          <button key={cat.id} onClick={() => setActiveCategoryId(cat.id)} className={`px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2.5 shadow-sm active:scale-95 ${activeCategoryId === cat.id ? "bg-foreground text-white ring-2 ring-primary ring-offset-2" : "bg-white text-foreground border border-border"}`}>
            <cat.icon size={18} className={`${activeCategoryId === cat.id ? 'text-primary' : 'text-muted-foreground'}`} /> {cat.name}
          </button>
        ))}
      </div>

      <main className="px-6 mt-6 space-y-3">
        <div className="flex flex-col gap-3">
          {(() => {
            const filteredProducts = products.filter(p => {
              const dbCat = p.category;
              if (activeCategoryId === 'coffee') return dbCat === 'القهوة';
              if (activeCategoryId === 'sweets') return dbCat === 'الحلوى';
              if (activeCategoryId === 'juice') return dbCat === 'عصائر';
              if (activeCategoryId === 'bakery') return dbCat === 'مخبوزات';
              return false;
            });

            if (filteredProducts.length === 0) {
              return (
                <div className="bg-white border border-border rounded-2xl p-10 flex flex-col items-center justify-center mt-4 shadow-sm">
                  <Coffee size={40} className="text-muted-foreground/30 mb-3" />
                  <p className="text-center text-muted-foreground font-bold">{t.empty}</p>
                </div>
              );
            }

            return filteredProducts.map((product) => (
              <MenuCard key={product.id} product={product} lang={activeLang} />
            ));
          })()}
        </div>
      </main>

      {/* 🌟 شريط السلة السفلي النظيف */}
      {totalItems() > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-border/50 p-6 shadow-[0_-15px_60px_rgba(0,0,0,0.06)] z-50 rounded-t-[2rem] animate-in slide-in-from-bottom-10">
          <div className="max-w-md mx-auto flex items-center justify-between gap-6" dir={activeLang === 'ar' ? 'rtl' : 'ltr'}>
            <button onClick={handleCheckout} disabled={isSubmitting} className={`flex-1 bg-foreground text-white h-16 rounded-[1.5rem] font-bold text-xl transition-transform flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70' : 'active:scale-[0.97]'}`}>
              {isSubmitting ? t.sending : t.confirmOrder}
            </button>
            <div className={`flex flex-col ${activeLang === 'ar' ? 'items-end pr-3' : 'items-start pl-3'}`}>
              <span className="text-xs font-bold text-muted-foreground">{totalItems()} {t.itemsCount}</span>
              <span className="text-2xl font-black text-primary">{formatMAD(totalPrice())}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}