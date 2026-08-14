"use client";

import { useState, useEffect, use } from "react";
import { CheckCircle, Clock, Coffee, Receipt, X as XIcon, Zap } from "lucide-react";
import { useCart } from "../../../store/useCart";
import { supabase } from "../../../lib/supabase";
import { checkCafeSubscription } from "../../../actions/saas";
import { cancelClientOrder, createClientOrder, getCachedCafeMenu } from "../../../actions/menu";

// استيراد المكونات الجديدة
import Topbar from "../../../components/client/Topbar";
import Searchbar from "../../../components/client/Searchbar";
import CartButton from "../../../components/client/Cart";
import Navbar from "../../../components/client/Navbar";
import SubNavbar from "../../../components/client/SubNavbar";
import ProductCard from "../../../components/client/ProductCard";
import ProductPage from "../../../components/client/ProductPage";

export type Lang = "en" | "fr" | "ar";

export type Translation = {
  subtitle: string;
  empty: string;
  confirmOrder: string;
  sending: string;
  itemsCount: string;
  total: string;
  reviewing: string;
  preparing: string;
  ready: string;
  orderNum: string;
  addMore: string;
  cancel: string;
  myOrders: string;
  emptyOrders: string;
  close: string;
  tableErrorTitle: string;
  tableErrorDesc: string;
  home: string;
  all: string;
  loading: string;
  suspended: string;
  cafeError: string;
};

export type Category = {
  id: string;
  name_ar?: string | null;
  name_en?: string | null;
  name_fr?: string | null;
};

export type Product = {
  id: string;
  category_id?: string | null;
  sub_category?: string | null;
  name_ar?: string | null;
  name_en?: string | null;
  name_fr?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  description_fr?: string | null;
  image_url?: string | null;
  price: number;
  [key: string]: unknown;
};

type CafeData = {
  id: string;
  name?: string | null;
  is_white_label?: boolean | null;
};

type OrderItem = {
  quantity: number;
  name_ar?: string | null;
  name_en?: string | null;
  name_fr?: string | null;
};

type ActiveOrder = {
  id: string;
  status: string;
  total_amount: number;
  items: OrderItem[];
};

const TRANSLATIONS: Record<Lang, Translation> = {
  ar: {
    subtitle: "اكتشف المذاق الأصيل ☕",
    empty: "لا توجد منتجات في هذا القسم حالياً.",
    confirmOrder: "تأكيد الطلب",
    sending: "جاري الإرسال...",
    itemsCount: "منتج",
    total: "الإجمالي",
    reviewing: "قيد المراجعة ⏳",
    preparing: "جاري التحضير 👨‍🍳",
    ready: "جاهز للتقديم 🚶‍♂️",
    orderNum: "رقم الطلب",
    addMore: "+ طلب شيء آخر",
    cancel: "إلغاء الطلب",
    myOrders: "طلباتي الحالية",
    emptyOrders: "لا توجد طلبات نشطة حالياً.",
    close: "إغلاق",
    tableErrorTitle: "الطاولة غير مفعلة 🚫",
    tableErrorDesc: "عذراً، كود الـ QR الخاص بهذه الطاولة غير مسجل في النظام بعد. يرجى مراجعة طاقم المقهى.",
    home: "الرئيسية",
    all: "الكل",
    loading: "جاري التحميل...",
    suspended: "النظام معلق",
    cafeError: "خطأ في المقهى أو الطاولة",
  },
  en: {
    subtitle: "Discover Authentic Taste ☕",
    empty: "No products found.",
    confirmOrder: "Confirm Order",
    sending: "Sending...",
    itemsCount: "items",
    total: "Total",
    reviewing: "Reviewing ⏳",
    preparing: "Preparing 👨‍🍳",
    ready: "Ready! 🚶‍♂️",
    orderNum: "Order #",
    addMore: "+ Add more",
    cancel: "Cancel",
    myOrders: "My Orders",
    emptyOrders: "No active orders.",
    close: "Close",
    tableErrorTitle: "Table Not Active 🚫",
    tableErrorDesc: "Sorry, this table's QR code is not registered in the system yet. Please ask the cafe staff.",
    home: "Home",
    all: "All",
    loading: "Loading...",
    suspended: "System suspended",
    cafeError: "Cafe or table error",
  },
  fr: {
    subtitle: "Découvrez le goût authentique ☕",
    empty: "Aucun produit trouvé.",
    confirmOrder: "Confirmer la cmd",
    sending: "Envoi...",
    itemsCount: "articles",
    total: "Total",
    reviewing: "En révision ⏳",
    preparing: "Préparation 👨‍🍳",
    ready: "Prêt! 🚶‍♂️",
    orderNum: "N° Cmd",
    addMore: "+ Ajouter",
    cancel: "Annuler",
    myOrders: "Mes Commandes",
    emptyOrders: "Aucune commande active.",
    close: "Fermer",
    tableErrorTitle: "Table Non Active 🚫",
    tableErrorDesc: "Désolé, le code QR de cette table n'est pas encore enregistré. Veuillez contacter le personnel.",
    home: "Accueil",
    all: "Tout",
    loading: "Chargement...",
    suspended: "Système suspendu",
    cafeError: "Erreur café ou table",
  },
};

export const formatMAD = (price: number) => `${Number(price).toFixed(0)}`; // تم تعديلها لتطابق التصميم (رقم صحيح)

const getSafeUUID = () => {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default function ClientMenuPage({ params }: { params: Promise<{ cafeSlug: string; tableId: string }> }) {
  const { cafeSlug, tableId: urlTableId } = use(params);
  const { items, totalItems, totalPrice, clearCart } = useCart();

  const [activeLang, setActiveLang] = useState<Lang>("en");
  const t = TRANSLATIONS[activeLang];
  const dir = activeLang === "ar" ? "rtl" : "ltr";

  // States
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [activeSubCategory, setActiveSubCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [cafeData, setCafeData] = useState<CafeData | null>(null);
  const [tableId, setTableId] = useState<string | null>(null);

  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTableNotFound, setIsTableNotFound] = useState(false);
  const [isCafeNotFound, setIsCafeNotFound] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);

  const displayTitle = cafeData?.name || "octOber";
  const subtitle = "Order your favourite food";

  useEffect(() => {
    setActiveSubCategory("all");
  }, [activeCategoryId]);

  const fetchUserOrders = async (sessionId: string, targetCafeId = cafeData?.id) => {
    if (!targetCafeId) return;
    const { data } = await supabase
      .from("orders")
      .select("*, tables(table_number)")
      .eq("cafe_id", targetCafeId)
      .eq("session_id", sessionId)
      .neq("status", "completed")
      .neq("status", "rejected")
      .neq("status", "cancelled")
      .order("created_at", { ascending: false });

    if (data) {
      setActiveOrders(data);
      if (data.length === 0) setShowOrdersModal(false);
    }
  };

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) await supabase.auth.signInAnonymously();

        const subCheck = await checkCafeSubscription(cafeSlug);
        if (subCheck.status === "not_found") { setIsCafeNotFound(true); setIsLoading(false); return; }
        if (!subCheck.isValid) { setIsSuspended(true); setIsLoading(false); return; }

        const menuData = await getCachedCafeMenu(cafeSlug, urlTableId);
        if (menuData.error === "cafe_not_found") { setIsCafeNotFound(true); setIsLoading(false); return; }
        if (menuData.error === "table_not_found") {
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
            .from("menu_categories")
            .select("*")
            .eq("cafe_id", menuData.cafe.id)
            .order("created_at", { ascending: true });

          if (cats) setCategories(cats);
        }

        let sessionId = localStorage.getItem("cafe_lux_client_session");
        if (!sessionId) {
          sessionId = getSafeUUID();
          localStorage.setItem("cafe_lux_client_session", sessionId);
        }
        if (menuData.success) await fetchUserOrders(sessionId, menuData.cafe.id);
      } catch (error) {
        console.error("Error loading client data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRealData();
  }, [cafeSlug, urlTableId]);

  useEffect(() => {
    const sessionId = localStorage.getItem("cafe_lux_client_session");
    if (!sessionId || !cafeData?.id || activeOrders.length === 0) return;
    const pollingInterval = setInterval(() => fetchUserOrders(sessionId, cafeData.id), 5000);
    return () => clearInterval(pollingInterval);
  }, [activeOrders.length, cafeData?.id]);

  const handleCheckout = async () => {
    if (totalItems() === 0 || !cafeData || !tableId) return;
    setIsSubmitting(true);
    try {
      const sessionId = localStorage.getItem("cafe_lux_client_session");
      if (!sessionId) throw new Error("Missing session");

      const res = await createClientOrder({ cafeId: cafeData.id, tableId, sessionId, items });
      if (!res.success || !res.order) throw new Error(res.error);

      setActiveOrders((prev) => [res.order, ...prev]);
      setShowOrdersModal(true);
      clearCart();
    } catch {
      alert(activeLang === "ar" ? "حدث خطأ في إرسال الطلب." : "There was an error sending the order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm(activeLang === "ar" ? "هل أنت متأكد من الإلغاء؟" : "Are you sure?")) return;
    const sessionId = localStorage.getItem("cafe_lux_client_session");
    if (!sessionId || !cafeData?.id) return;
    try {
      setActiveOrders((prev) => {
        const newOrders = prev.filter((o) => o.id !== orderId);
        if (newOrders.length === 0) setShowOrdersModal(false);
        return newOrders;
      });
      await cancelClientOrder(orderId, cafeData.id, sessionId);
    } catch {
      fetchUserOrders(sessionId, cafeData.id);
    }
  };

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-white font-bold text-black">{t.loading}</div>;
  if (isSuspended) return <div className="flex min-h-screen items-center justify-center bg-white font-bold text-black">{t.suspended}</div>;
  if (isCafeNotFound || isTableNotFound) return <div className="flex min-h-screen items-center justify-center bg-white font-bold text-black">{t.cafeError}</div>;

  // 1. Filter by Search Query First
  const searchedProducts = products.filter((p) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.name_en?.toLowerCase().includes(query) ||
      p.name_fr?.toLowerCase().includes(query) ||
      p.name_ar?.toLowerCase().includes(query) ||
      p.description_en?.toLowerCase().includes(query)
    );
  });

  // 2. Filter by Category
  const productsInActiveCategory = activeCategoryId === "all"
    ? searchedProducts
    : searchedProducts.filter((p) => p.category_id === activeCategoryId);

  // 3. Extract SubCategories for the UI
  const uniqueSubCategories = Array.from(
    new Set(
      productsInActiveCategory
        .map((p) => p.sub_category)
        .filter((sub): sub is string => Boolean(sub && sub.trim() !== ""))
    )
  );

  // 4. Final Filter by SubCategory
  const finalFilteredProducts = activeSubCategory === "all"
    ? productsInActiveCategory
    : productsInActiveCategory.filter((p) => p.sub_category === activeSubCategory);

  const cartCount = totalItems();
  const headerBadgeCount = cartCount > 0 ? cartCount : activeOrders.length;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-white text-black" dir={dir}>
      
      {/* Product Details Modal Overlay */}
      {selectedProduct && (
        <ProductPage 
          product={selectedProduct} 
          activeLang={activeLang} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}

      {/* Active Orders Modal */}
      {showOrdersModal && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/40 p-4 backdrop-blur-sm animate-in fade-in sm:justify-center">
          <div className="mx-auto flex h-[85vh] w-full max-w-lg flex-col rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <h2 className="flex items-center gap-2 text-xl font-extrabold text-black">
                <Receipt size={20} />
                {t.myOrders}
              </h2>
              <button onClick={() => setShowOrdersModal(false)} className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200">
                <XIcon size={20} />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {activeOrders.map((order) => (
                <div key={order.id} className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-500">{t.orderNum}: #{order.id.split("-")[0]}</span>
                      <h3 className="mt-1 text-xl font-extrabold text-black">{formatMAD(order.total_amount)} MAD</h3>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {order.status === "pending" && <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">{t.reviewing}</span>}
                      {order.status === "accepted" && <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">{t.preparing}</span>}
                      {order.status === "ready" && <span className="rounded-full bg-green-500 px-3 py-1.5 text-xs font-black text-white">{t.ready}</span>}
                    </div>
                  </div>
                  {order.status === "pending" && (
                    <button onClick={() => handleCancelOrder(order.id)} className="mt-2 w-full rounded-xl bg-red-50 py-3 font-bold text-red-600 hover:bg-red-100">
                      {t.cancel}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Top Area */}
      <div className="shrink-0 flex flex-col bg-white">
        <Topbar cafeName={displayTitle} subtitle={subtitle} />
        
        <div className="flex px-5 gap-3 mt-4 mb-1 items-center">
          <Searchbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          <CartButton 
            cartItemCount={headerBadgeCount} 
            onClick={() => {
              if (activeOrders.length > 0 || cartCount > 0) setShowOrdersModal(true);
            }} 
          />
        </div>

        <div className="mb-1.5">
          <Navbar 
            categories={categories} 
            activeCategoryId={activeCategoryId} 
            setActiveCategoryId={setActiveCategoryId} 
            activeLang={activeLang} 
          />
        </div>
        
        {uniqueSubCategories.length > 0 && (
          <div className="mb-2">
            <SubNavbar 
              subCategories={uniqueSubCategories} 
              activeSubCategory={activeSubCategory} 
              setActiveSubCategory={setActiveSubCategory} 
              t={t} 
            />
          </div>
        )}
      </div>

      {/* Scrollable Main Content - Product Grid */}
      <main className={`flex-1 overflow-y-auto px-5 pt-2 pb-24 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
        <div className="grid grid-cols-2 gap-4 pb-10">
          {finalFilteredProducts.length === 0 ? (
            <div className="col-span-2 mt-10 flex flex-col items-center justify-center rounded-3xl p-6 opacity-50">
              <Coffee size={40} className="mb-3 text-gray-400" />
              <p className="text-center font-bold text-gray-500">{t.empty}</p>
            </div>
          ) : (
            finalFilteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                activeLang={activeLang} 
                onClick={() => setSelectedProduct(product)} 
              />
            ))
          )}
        </div>

        {!cafeData?.is_white_label && (
          <div className="flex select-none flex-col items-center justify-center pb-8 pt-4 opacity-40">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Zap size={14} className="text-amber-500" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest">Powered by CafeQR</span>
            </div>
          </div>
        )}
      </main>

      {/* Fixed Bottom Checkout Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-30 bg-white/90 p-4 pb-6 shadow-[0_-12px_40px_rgba(0,0,0,0.1)] backdrop-blur-md">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
            <button 
              onClick={handleCheckout} 
              disabled={isSubmitting} 
              className={`h-14 flex-1 rounded-2xl bg-black text-lg font-black text-white shadow-lg transition-transform ${isSubmitting ? "opacity-70" : "active:scale-[0.98]"}`}
            >
              {isSubmitting ? t.sending : t.confirmOrder}
            </button>
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-gray-500">{cartCount} {t.itemsCount}</span>
              <span className="text-2xl font-black text-[#2A110A]">{formatMAD(totalPrice())} <span className="text-sm font-bold text-gray-500">MAD</span></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}