"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Coffee, Receipt, X as XIcon, Zap } from "lucide-react";
import { useCart, type CartItem } from "@/store/useCart";
import Topbar from "@/components/client/Topbar";
import Searchbar from "@/components/client/Searchbar";
import CartButton from "@/components/client/Cart";
import Navbar from "@/components/client/Navbar";
import SubNavbar from "@/components/client/SubNavbar";
import ProductCard from "@/components/client/ProductCard";
import LanguagePopup from "@/components/client/LanguagePopup";
import ClientHome from "@/components/client/Home";
import {
  DEMO_CAFE,
  DEMO_TABLES,
  createDemoOrder,
  useDemoCategories,
  useDemoOrders,
  useDemoProducts,
  type DemoOrder,
  type DemoProduct,
} from "@/lib/demoStore";
import type { Lang, Translation } from "@/app/[cafeSlug]/[tableId]/page";

const TRANSLATIONS: Record<Lang, Translation> = {
  ar: {
    subtitle: "اكتشف المذاق الأصيل",
    empty: "لا توجد منتجات في هذا القسم حالياً.",
    confirmOrder: "تأكيد الطلب",
    sending: "جاري الإرسال...",
    itemsCount: "منتج",
    total: "الإجمالي",
    reviewing: "قيد المراجعة",
    preparing: "جاري التحضير",
    ready: "جاهز للتقديم",
    orderNum: "رقم الطلب",
    addMore: "+ طلب شيء آخر",
    cancel: "إلغاء الطلب",
    myOrders: "طلباتي الحالية",
    emptyOrders: "لا توجد طلبات نشطة حالياً.",
    close: "إغلاق",
    tableErrorTitle: "الطاولة غير مفعلة",
    tableErrorDesc: "عذراً، كود QR الخاص بهذه الطاولة غير مسجل بعد.",
    home: "الرئيسية",
    all: "الكل",
    loading: "جاري التحميل...",
    suspended: "النظام معلق",
    cafeError: "خطأ في المقهى أو الطاولة",
  },
  en: {
    subtitle: "Discover Authentic Taste",
    empty: "No products found.",
    confirmOrder: "Confirm Order",
    sending: "Sending...",
    itemsCount: "items",
    total: "Total",
    reviewing: "Reviewing",
    preparing: "Preparing",
    ready: "Ready!",
    orderNum: "Order #",
    addMore: "+ Add more",
    cancel: "Cancel",
    myOrders: "My Orders",
    emptyOrders: "No active orders.",
    close: "Close",
    tableErrorTitle: "Table Not Active",
    tableErrorDesc: "Sorry, this table's QR code is not registered in the system yet.",
    home: "Home",
    all: "All",
    loading: "Loading...",
    suspended: "System suspended",
    cafeError: "Cafe or table error",
  },
  fr: {
    subtitle: "Découvrez le goût authentique",
    empty: "Aucun produit trouvé.",
    confirmOrder: "Confirmer la cmd",
    sending: "Envoi...",
    itemsCount: "articles",
    total: "Total",
    reviewing: "En révision",
    preparing: "Préparation",
    ready: "Prêt!",
    orderNum: "N° Cmd",
    addMore: "+ Ajouter",
    cancel: "Annuler",
    myOrders: "Mes Commandes",
    emptyOrders: "Aucune commande active.",
    close: "Fermer",
    tableErrorTitle: "Table Non Active",
    tableErrorDesc: "Désolé, le code QR de cette table n'est pas encore enregistré.",
    home: "Accueil",
    all: "Tout",
    loading: "Chargement...",
    suspended: "Système suspendu",
    cafeError: "Erreur café ou table",
  },
};

const CLIENT_SESSION_KEY = "cafeqr_demo_client_session";
const CLIENT_LANG_KEY = "cafeqr_client_lang";
const formatMAD = (price: number) => `${Number(price).toFixed(0)}`;

const getSafeUUID = () => {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

const toBaseCartItem = (product: DemoProduct): CartItem => ({
  id: product.id,
  product_id: product.id,
  name_ar: product.name_ar || product.name_en || "",
  name_en: product.name_en || product.name_ar || "",
  name_fr: product.name_fr || product.name_en || product.name_ar || "",
  price: Number(product.price),
  quantity: 1,
  image_url: product.image_url || "",
  modifiers: {},
});

const isVisibleOrder = (order: DemoOrder) =>
  !["completed", "rejected", "cancelled"].includes(order.status);

export default function ClientMenuDemo() {
  const { items, addItem, totalItems, totalPrice, clearCart } = useCart();
  const isSubmittingRef = useRef(false);

  const { products } = useDemoProducts();
  const { categories } = useDemoCategories();
  const { orders, updateOrders } = useDemoOrders();

  const [activeLang, setActiveLang] = useState<Lang>("en");
  const [showLangPopup, setShowLangPopup] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState("home");
  const [activeSubCategory, setActiveSubCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = TRANSLATIONS[activeLang];
  const dir = activeLang === "ar" ? "rtl" : "ltr";
  const displayTitle = DEMO_CAFE.name;
  const cartCount = totalItems();

  useEffect(() => {
    const savedLang = localStorage.getItem(CLIENT_LANG_KEY);
    let localSession = localStorage.getItem(CLIENT_SESSION_KEY);

    if (!localSession) {
      localSession = getSafeUUID();
      localStorage.setItem(CLIENT_SESSION_KEY, localSession);
    }

    window.setTimeout(() => {
      if (savedLang === "ar" || savedLang === "fr" || savedLang === "en") {
        setActiveLang(savedLang);
      } else {
        setShowLangPopup(true);
      }

      setSessionId(localSession);
      setIsLoading(false);
    }, 0);
  }, []);

  const handleLanguageSelect = (lang: Lang) => {
    setActiveLang(lang);
    localStorage.setItem(CLIENT_LANG_KEY, lang);
    setShowLangPopup(false);
  };

  const handleCategorySelect = (categoryId: string) => {
    setActiveCategoryId(categoryId);
    setActiveSubCategory("all");
  };

  const activeOrders = useMemo(
    () => orders.filter((order) => order.session_id === sessionId && isVisibleOrder(order)),
    [orders, sessionId]
  );

  const activeProducts = useMemo(
    () => products.filter((product) => product.is_active !== false),
    [products]
  );

  const searchedProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return activeProducts;

    return activeProducts.filter((product) =>
      product.name_en?.toLowerCase().includes(query) ||
      product.name_fr?.toLowerCase().includes(query) ||
      product.name_ar?.toLowerCase().includes(query) ||
      product.description_en?.toLowerCase().includes(query) ||
      product.description_fr?.toLowerCase().includes(query) ||
      product.description_ar?.toLowerCase().includes(query)
    );
  }, [activeProducts, searchQuery]);

  const productsInActiveCategory = activeCategoryId === "home"
    ? searchedProducts
    : searchedProducts.filter((product) => product.category_id === activeCategoryId);

  const uniqueSubCategories = Array.from(
    new Set(
      productsInActiveCategory
        .map((product) => product.sub_category)
        .filter((subCategory): subCategory is string => Boolean(subCategory?.trim()))
    )
  );

  const finalFilteredProducts = activeSubCategory === "all"
    ? productsInActiveCategory
    : productsInActiveCategory.filter((product) => product.sub_category === activeSubCategory);

  const headerBadgeCount = cartCount > 0 ? cartCount : activeOrders.length;

  const handleProductClick = (product: DemoProduct) => {
    addItem(toBaseCartItem(product));
  };

  const handleCheckout = () => {
    if (cartCount === 0 || !sessionId || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const newOrder = createDemoOrder({
        tableId: DEMO_TABLES[0].id,
        sessionId,
        items,
        status: "pending",
      });

      updateOrders([newOrder, ...orders]);
      setShowOrdersModal(true);
      clearCart();
    } catch {
      alert(activeLang === "ar" ? "حدث خطأ في إرسال الطلب." : "There was an error sending the order.");
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = (orderId: string) => {
    if (!confirm(activeLang === "ar" ? "هل أنت متأكد من الإلغاء؟" : "Are you sure?")) return;

    const updatedAt = new Date().toISOString();
    const updatedOrders = orders.map((order) =>
      order.id === orderId && order.session_id === sessionId
        ? { ...order, status: "cancelled" as const, updated_at: updatedAt }
        : order
    );

    updateOrders(updatedOrders);
    if (activeOrders.length <= 1) setShowOrdersModal(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white font-bold text-black">
        <h1 className="sr-only">Interactive customer menu demo</h1>
        {t.loading}
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-white text-black" dir={dir}>
      {showLangPopup && <LanguagePopup onSelect={handleLanguageSelect} />}

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
              {activeOrders.length === 0 ? (
                <p className="py-10 text-center text-sm font-bold text-gray-400">{t.emptyOrders}</p>
              ) : (
                activeOrders.map((order) => (
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
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="relative z-50 shrink-0 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <Topbar
          cafeName={displayTitle}
          subtitle={t.subtitle}
          activeLang={activeLang}
          onSelectLang={handleLanguageSelect}
        />
      </div>

      <main className="flex-1 w-full overflow-y-auto pb-24 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex px-5 gap-3 mt-4 mb-1 items-center">
          <Searchbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} activeLang={activeLang} />
          <CartButton
            cartItemCount={headerBadgeCount}
            activeLang={activeLang}
            onClick={() => {
              if (activeOrders.length > 0 || cartCount > 0) setShowOrdersModal(true);
            }}
          />
        </div>

        <div className="mb-1.5">
          <Navbar
            categories={categories}
            activeCategoryId={activeCategoryId}
            setActiveCategoryId={handleCategorySelect}
            activeLang={activeLang}
          />
        </div>

        {activeCategoryId === "home" && !searchQuery ? (
          <ClientHome
            activeLang={activeLang}
            products={activeProducts}
            categories={categories}
            onCategorySelect={handleCategorySelect}
            onProductClick={handleProductClick}
          />
        ) : (
          <>
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

            <div className="flex flex-wrap justify-center gap-4 px-5 pb-10 pt-2">
              {finalFilteredProducts.length === 0 ? (
                <div className="mt-10 flex w-full flex-col items-center justify-center rounded-3xl p-6 opacity-50">
                  <Coffee size={40} className="mb-3 text-gray-400" />
                  <p className="text-center font-bold text-gray-500">{t.empty}</p>
                </div>
              ) : (
                finalFilteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.67rem)] lg:w-[calc(16.666%-0.84rem)] max-w-[260px] flex-shrink-0"
                  >
                    <ProductCard
                      product={product}
                      activeLang={activeLang}
                      onClick={() => handleProductClick(product)}
                    />
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {!DEMO_CAFE.is_white_label && (
          <div className="flex select-none flex-col items-center justify-center pb-8 pt-4 opacity-40">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Zap size={14} className="text-amber-500" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest">Powered by Qerve</span>
            </div>
          </div>
        )}
      </main>

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
