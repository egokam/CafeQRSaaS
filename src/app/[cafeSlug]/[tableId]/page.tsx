"use client";

import { useState, useEffect, use } from "react";
import { useCart } from "../../../store/useCart";
import MenuCard from "../../../components/MenuCard";
import { Receipt, X as XIcon, Clock, CheckCircle, Coffee, AlertTriangle, QrCode, Zap, LayoutGrid } from "lucide-react";
import * as Icons from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { checkCafeSubscription } from "../../../actions/saas";
import {
  cancelClientOrder,
  createClientOrder,
  getCachedCafeMenu,
  getClientActiveOrders,
} from "../../../actions/menu";

const TRANSLATIONS: Record<string, any> = {
  ar: {
    subtitle: "اكتشف المذاق الأصيل ☕", empty: "لا توجد منتجات في هذا القسم حالياً.",
    confirmOrder: "تأكيد الطلب", sending: "جاري الإرسال...", itemsCount: "منتج", total: "الإجمالي",
    reviewing: "قيد المراجعة ⏳", preparing: "جاري التحضير 👨‍🍳", ready: "جاهز للتقديم 🚶‍♂️",
    orderNum: "رقم الطلب", addMore: "+ طلب شيء آخر", cancel: "إلغاء الطلب",
    myOrders: "طلباتي الحالية", emptyOrders: "لا توجد طلبات نشطة حالياً.", close: "إغلاق",
    tableErrorTitle: "الطاولة غير مفعّلة 🚫", tableErrorDesc: "عذراً، كود الـ QR الخاص بهذه الطاولة غير مسجل في النظام بعد. يرجى مراجعة طاقم المقهى.",
    all: "الكل"
  },
  en: {
    subtitle: "Discover Authentic Taste ☕", empty: "No products in this category.",
    confirmOrder: "Confirm Order", sending: "Sending...", itemsCount: "items", total: "Total",
    reviewing: "Reviewing ⏳", preparing: "Preparing 👨‍🍳", ready: "Ready! 🚶‍♂️",
    orderNum: "Order #", addMore: "+ Add more", cancel: "Cancel",
    myOrders: "My Orders", emptyOrders: "No active orders.", close: "Close",
    tableErrorTitle: "Table Not Active 🚫", tableErrorDesc: "Sorry, this table's QR code is not registered in the system yet. Please ask the cafe staff.",
    all: "All"
  },
  fr: {
    subtitle: "Découvrez le goût authentique ☕", empty: "Aucun produit dans cette catégorie.",
    confirmOrder: "Confirmer la cmd", sending: "Envoi...", itemsCount: "articles", total: "Total",
    reviewing: "En révision ⏳", preparing: "Préparation 👨‍🍳", ready: "Prêt! 🚶‍♂️",
    orderNum: "N° Cmd", addMore: "+ Ajouter", cancel: "Annuler",
    myOrders: "Mes Commandes", emptyOrders: "Aucune commande active.", close: "Fermer",
    tableErrorTitle: "Table Non Active 🚫", tableErrorDesc: "Désolé, le code QR de cette table n'est pas encore enregistré. Veuillez contacter le personnel.",
    all: "Tout"
  }
};

const LANGUAGES = ["ar", "fr", "en"];
const formatMAD = (price: number) => `${Number(price).toFixed(2)}`;

const getSafeUUID = () => {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function ClientMenuPage({ params }: { params: Promise<{ cafeSlug: string, tableId: string }> }) {
  const { cafeSlug, tableId: urlTableId } = use(params);
  const { items, totalItems, totalPrice, clearCart } = useCart();

  const [activeLang, setActiveLang] = useState("en");
  const t = TRANSLATIONS[activeLang];
  
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState("all");

  const [products, setProducts] = useState<any[]>([]);
  const [cafeData, setCafeData] = useState<any>(null);
  const [tableId, setTableId] = useState<string | null>(null);

  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isTableNotFound, setIsTableNotFound] = useState(false);
  const [isCafeNotFound, setIsCafeNotFound] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);

  const displayTitle = cafeData?.name ? cafeData.name : (activeLang === 'ar' ? "مقهى النخبة" : activeLang === 'fr' ? "Café Élite" : "Elite Cafe");

  const fetchUserOrders = async (sessionId: string, targetCafeId = cafeData?.id) => {
    if (!targetCafeId) return;
    const res = await getClientActiveOrders(targetCafeId, sessionId);
    if (res.success) setActiveOrders(res.orders);
  };

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        setIsLoading(true);
        setIsTableNotFound(false);
        setIsCafeNotFound(false);
        setIsSuspended(false);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          await supabase.auth.signInAnonymously();
        }

        const subCheck = await checkCafeSubscription(cafeSlug);
        if (subCheck.status === 'not_found') {
          setIsCafeNotFound(true);
          setIsLoading(false);
          return;
        }
        if (!subCheck.isValid) {
          setIsSuspended(true);
          setIsLoading(false);
          return;
        }

        const menuData = await getCachedCafeMenu(cafeSlug, urlTableId);

        if (menuData.error === 'cafe_not_found') {
          setIsCafeNotFound(true);
          setIsLoading(false);
          return;
        }

        if (menuData.error === 'table_not_found') {
          setCafeData(menuData.cafe);
          setIsTableNotFound(true);
          setIsLoading(false);
          return;
        }

        if (menuData.success) {
          setCafeData(menuData.cafe);
          setTableId(menuData.table.id);
          setProducts(menuData.products);

          const { data: cats } = await supabase
            .from('menu_categories')
            .select('*')
            .eq('cafe_id', menuData.cafe.id)
            .order('created_at', { ascending: true });
            
          if (cats) {
            setCategories(cats);
          }
        }

        let sessionId = localStorage.getItem('cafe_lux_client_session');
        if (!sessionId) {
          sessionId = getSafeUUID();
          localStorage.setItem('cafe_lux_client_session', sessionId);
        }
        if (menuData.success) {
          await fetchUserOrders(sessionId, menuData.cafe.id);
        }

      } catch (error) {
        console.error("Error loading client data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRealData();
  }, [cafeSlug, urlTableId]);

  useEffect(() => {
    const sessionId = localStorage.getItem('cafe_lux_client_session');
    if (!sessionId || isTableNotFound || isCafeNotFound || isSuspended) return;

    const channel = supabase.channel(`client-orders-${sessionId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const updatedOrder = payload.new;
          
          setActiveOrders(prevOrders => {
            if (['completed', 'rejected', 'cancelled'].includes(updatedOrder.status)) {
              const newOrders = prevOrders.filter(o => o.id !== updatedOrder.id);
              if (newOrders.length === 0) setShowOrdersModal(false);
              return newOrders;
            }
            
            return prevOrders.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o);
          });
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isTableNotFound, isCafeNotFound, isSuspended]);

  useEffect(() => {
    if (isSuspended || isCafeNotFound || isTableNotFound) return;

    const heartbeat = setInterval(async () => {
      try {
        const liveCheck = await checkCafeSubscription(cafeSlug);
        if (!liveCheck.isValid) {
          setIsSuspended(true);
        }
      } catch (error) {
        console.error("Heartbeat error:", error);
      }
    }, 60000);

    return () => clearInterval(heartbeat);
  }, [cafeSlug, isSuspended, isCafeNotFound, isTableNotFound]);

  const handleCheckout = async () => {
    if (totalItems() === 0 || !cafeData || !tableId) return;
    setIsSubmitting(true);

    try {
      const sessionId = localStorage.getItem('cafe_lux_client_session');
      if (!sessionId) throw new Error("Missing session");

      const res = await createClientOrder({
        cafeId: cafeData.id,
        tableId,
        sessionId,
        items,
      });

      if (!res.success || !res.order) throw new Error(res.error);

      setActiveOrders(prev => [res.order, ...prev]);
      setShowOrdersModal(true);
      clearCart();
    } catch (error) {
      alert("حدث خطأ في إرسال الطلب.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm(activeLang === 'ar' ? "هل أنت متأكد من الإلغاء؟" : "Are you sure?")) return;
    
    // 🌟 استخراج الجلسة قبل فتح كتلة try لكي تكون متاحة لكتلة catch أيضاً
    const sessionId = localStorage.getItem('cafe_lux_client_session');
    
    if (!sessionId || !cafeData?.id) {
      alert("Missing session or cafe data");
      return;
    }

    try {
      // التحديث اللحظي للمسح لكي لا ينتظر العميل
      setActiveOrders(prev => prev.filter(o => o.id !== orderId));
      if (activeOrders.length <= 1) setShowOrdersModal(false);

      const res = await cancelClientOrder(orderId, cafeData.id, sessionId);
      if (!res.success) throw new Error(res.error);
    } catch (error) { 
      alert("خطأ في الإلغاء.");
      // استرجاع البيانات إذا فشل السيرفر
      fetchUserOrders(sessionId, cafeData.id); 
    }
  };

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center font-bold text-foreground">جاري التحميل...</div>;

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-6 text-center select-none" dir="rtl">
        <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-3xl flex items-center justify-center mb-6 border border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.15)] animate-pulse">
          <Coffee size={40} />
        </div>
        <h1 className="text-3xl font-black mb-3 tracking-tight">النظام في وضع الصيانة المجدولة ⚙️</h1>
        <p className="text-stone-400 max-w-sm leading-relaxed mb-8 text-sm font-medium">
          عذراً، قائمة الطعام الرقمية لهذا المقهى غير متاحة مؤقتاً لتحديث الخوادم. يرجى طلب المنيو الورقي من طاقم الخدمة.
        </p>
        <span className="text-[10px] font-mono tracking-widest text-stone-600 uppercase border border-stone-800 px-3 py-1 rounded-full">EgoCafe SaaS Infrastructure</span>
      </div>
    );
  }

  if (isCafeNotFound) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4 opacity-80" />
        <h1 className="text-3xl font-extrabold text-foreground mb-2">404 - المقهى غير موجود</h1>
        <p className="text-muted-foreground text-sm max-w-sm">يرجى التأكد من مسح كود QR صحيح.</p>
      </div>
    );
  }

  if (isTableNotFound) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center select-none" dir={activeLang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-6 border border-amber-500/20 shadow-sm">
          <QrCode size={40} />
        </div>
        <h1 className="text-2xl font-black text-foreground mb-2 tracking-tight">{t.tableErrorTitle}</h1>
        <p className="text-muted-foreground text-sm max-w-xs leading-relaxed mb-8 font-medium">
          {t.tableErrorDesc}
        </p>

        <div className="flex gap-1 bg-muted p-1 rounded-full border border-border/50">
          {LANGUAGES.map(lang => (
            <button key={lang} onClick={() => setActiveLang(lang)} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-colors ${activeLang === lang ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'}`}>{lang}</button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32" dir={activeLang === 'ar' ? 'rtl' : 'ltr'}>

      {showOrdersModal && (
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto p-6 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-extrabold text-foreground">{t.myOrders}</h2>
            <button onClick={() => setShowOrdersModal(false)} className="bg-muted p-2 rounded-full text-muted-foreground hover:bg-gray-200 transition-colors">
              <XIcon size={24} />
            </button>
          </div>

          <div className="space-y-4 flex-1">
            {activeOrders.length === 0 ? (
              <p className="text-center text-muted-foreground mt-10 font-bold">{t.emptyOrders}</p>
            ) : (
              activeOrders.map(order => (
                <div key={order.id} className={`bg-white p-5 rounded-2xl border-2 shadow-sm flex flex-col gap-4 transition-colors ${order.status === 'ready' ? 'border-green-400 bg-green-50/50' : 'border-border'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-muted-foreground">{t.orderNum}: #{order.id.split('-')[0]}</span>
                      <h3 className="font-extrabold text-xl mt-1 text-foreground">{formatMAD(order.total_amount)} <span className="text-sm font-bold text-muted-foreground">MAD</span></h3>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {order.status === 'pending' && <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={12} /> {t.reviewing}</span>}
                      {order.status === 'accepted' && <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse"><Coffee size={12} /> {t.preparing}</span>}
                      {order.status === 'ready' && <span className="bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1 shadow-md animate-bounce"><CheckCircle size={14} /> {t.ready}</span>}
                    </div>
                  </div>

                  <div className="bg-muted/30 p-3 rounded-lg text-sm text-foreground font-bold">
                    {order.items.map((item: any, i: number) => (
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

          <button onClick={() => setShowOrdersModal(false)} className="mt-8 bg-foreground text-white py-4 rounded-xl font-bold w-full shadow-lg transition-transform active:scale-95">
            {t.addMore}
          </button>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-border/50">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-foreground tracking-tight uppercase">{displayTitle}</h1>
          <p className="text-xs text-primary font-bold mt-1 uppercase">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-3" dir="ltr">
          <div className="flex gap-1 bg-muted p-1 rounded-full border border-border/50">
            {LANGUAGES.map(lang => (
              <button key={lang} onClick={() => setActiveLang(lang)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-colors ${activeLang === lang ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'}`}>{lang}</button>
            ))}
          </div>

          {activeOrders.length > 0 && (
            <button onClick={() => setShowOrdersModal(true)} className="relative p-2 text-foreground bg-muted rounded-full hover:bg-gray-200 transition-colors">
              <Receipt size={20} />
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-pulse">
                {activeOrders.length}
              </span>
            </button>
          )}
        </div>
      </header>

      <div className="px-5 py-6 overflow-x-auto custom-scrollbar flex gap-3 bg-muted/20">
        <button 
          onClick={() => setActiveCategoryId('all')} 
          className={`px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-colors shadow-sm active:scale-95 flex items-center gap-2.5 ${activeCategoryId === 'all' ? "bg-foreground text-white" : "bg-white text-foreground border border-border hover:bg-muted"}`}
        >
          <LayoutGrid size={18} className={activeCategoryId === 'all' ? 'text-primary' : 'text-muted-foreground'} />
          {t.all}
        </button>
        {categories.map((cat: any) => {
          const IconComponent = (Icons as any)[cat.icon || 'Coffee'] || Coffee;
          
          return (
            <button 
              key={cat.id} 
              onClick={() => setActiveCategoryId(cat.id)} 
              className={`px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-colors shadow-sm active:scale-95 flex items-center gap-2.5 ${activeCategoryId === cat.id ? "bg-foreground text-white" : "bg-white text-foreground border border-border hover:bg-muted"}`}
            >
              <IconComponent size={18} className={activeCategoryId === cat.id ? 'text-primary' : 'text-muted-foreground'} />
              {activeLang === 'ar' ? cat.name_ar : activeLang === 'fr' ? cat.name_fr : cat.name_en}
            </button>
          );
        })}
      </div>

      <main className="px-6 mt-6 space-y-3">
        <div className="flex flex-col gap-3">
          {(() => {
            const filteredProducts = activeCategoryId === 'all' 
              ? products 
              : products.filter(p => p.category_id === activeCategoryId);

            if (filteredProducts.length === 0) {
              return (
                <div className="bg-white border border-border rounded-2xl p-10 flex flex-col items-center justify-center mt-4">
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

      {!cafeData?.is_white_label && (
        <div className="pt-12 pb-6 flex flex-col items-center justify-center opacity-40 select-none">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Zap size={14} className="text-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Powered by CafeQR</span>
          </div>
        </div>
      )}

      {totalItems() > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-border/50 p-6 shadow-[0_-15px_60px_rgba(0,0,0,0.06)] z-50 rounded-t-[2rem]">
          <div className="max-w-md mx-auto flex items-center justify-between gap-6" dir={activeLang === 'ar' ? 'rtl' : 'ltr'}>
            <button onClick={handleCheckout} disabled={isSubmitting} className={`flex-1 bg-foreground text-white h-16 rounded-[1.5rem] font-bold text-xl transition-transform ${isSubmitting ? 'opacity-70' : 'active:scale-[0.97]'}`}>
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