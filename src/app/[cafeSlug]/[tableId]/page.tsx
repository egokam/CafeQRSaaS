"use client";

import { useState, useEffect, use } from "react";
import MenuCard from "../../../components/MenuCard";
import {
  CheckCircle,
  Clock,
  Coffee,
  Home,
  Menu,
  Receipt,
  ShoppingCart,
  X as XIcon,
  Zap,
} from "lucide-react";
import { useCart } from "../../../store/useCart";
import { supabase } from "../../../lib/supabase";
import { checkCafeSubscription } from "../../../actions/saas";
import {
  cancelClientOrder,
  createClientOrder,
  getCachedCafeMenu,
} from "../../../actions/menu";

type Lang = "en" | "fr" | "ar";

type Translation = {
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

type Category = {
  id: string;
  name_ar?: string | null;
  name_en?: string | null;
  name_fr?: string | null;
};

type Product = {
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
    empty: "No products in this category.",
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
    empty: "Aucun produit dans cette catégorie.",
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

const LANGUAGES: Lang[] = ["en", "fr", "ar"];
const formatMAD = (price: number) => `${Number(price).toFixed(2)}`;

const getSafeUUID = () => {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const getCategoryIconName = (nameEn: string) => {
  const mapping: Record<string, string> = {
    Promotions: "cat_promotions.png",
    Bundles: "cat_bundles.png",
    Packs: "cat_bundles.png",
    Patisserie: "cat_patisserie.png",
    "Hot Coffee": "cat_hot_coffee.png",
    Tea: "cat_tea.png",
    "Cold Coffee": "cat_cold_coffee.png",
    "Soft Drinks": "cat_soft_drinks.png",
    Juices: "cat_juices.png",
    Milkshakes: "cat_milkshakes.png",
    Smoothies: "cat_smoothies.png",
    Breakfasts: "cat_breakfasts.png",
    Sandwiches: "cat_sandwiches.png",
    Paninis: "cat_paninis.png",
    Tacos: "cat_tacos.png",
    Burgers: "cat_burgers.png",
    Pizzas: "cat_pizzas.png",
    "Fried Chicken": "cat_fried_chicken.png",
    Salads: "cat_salads.png",
    Plates: "cat_plats.png",
    Plats: "cat_plats.png",
    Desserts: "cat_desserts.png",
  };
  return mapping[nameEn] || "default.png";
};

export default function ClientMenuPage({ params }: { params: Promise<{ cafeSlug: string, tableId: string }> }) {
  const { cafeSlug, tableId: urlTableId } = use(params);
  const { items, totalItems, totalPrice, clearCart } = useCart();

  const [activeLang, setActiveLang] = useState<Lang>("en");
  const t = TRANSLATIONS[activeLang];
  const dir = activeLang === "ar" ? "rtl" : "ltr";

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState("all");

  const [activeSubCategory, setActiveSubCategory] = useState("all");

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

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

  const displayTitle = cafeData?.name
    ? cafeData.name
    : activeLang === "ar"
      ? "مقهى النخبة"
      : activeLang === "fr"
        ? "Café Élite"
        : "Elite Cafe";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        if (menuData.error === "table_not_found") { setCafeData(menuData.cafe); setIsTableNotFound(true); setIsLoading(false); return; }

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

      setActiveOrders(prev => [res.order, ...prev]);
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
      setActiveOrders(prev => {
        const newOrders = prev.filter(o => o.id !== orderId);
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

  const productsInActiveCategory = activeCategoryId === "all"
    ? products
    : products.filter(p => p.category_id === activeCategoryId);

  const uniqueSubCategories = Array.from(
    new Set(
      productsInActiveCategory
        .map(p => p.sub_category)
        .filter((sub): sub is string => Boolean(sub && sub.trim() !== ""))
    )
  );

  const finalFilteredProducts = activeSubCategory === "all"
    ? productsInActiveCategory
    : productsInActiveCategory.filter(p => p.sub_category === activeSubCategory);

  const cartCount = totalItems();
  const headerBadgeCount = cartCount > 0 ? cartCount : activeOrders.length;

  const getCategoryName = (cat: Category) => {
    if (activeLang === "ar" && cat.name_ar) return cat.name_ar;
    if (activeLang === "fr" && cat.name_fr) return cat.name_fr;
    return cat.name_en || cat.name_fr || cat.name_ar || "";
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white font-sans text-[#0a0a0a]" dir="ltr">
      {showOrdersModal && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/40 p-4 backdrop-blur-sm animate-in fade-in sm:justify-center" dir={dir}>
          <div className="mx-auto flex h-[85vh] max-h-[85vh] w-full max-w-lg flex-col rounded-[2rem] bg-white shadow-2xl sm:h-auto sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <h2 className="flex items-center gap-2 text-xl font-extrabold text-black">
                <Receipt size={20} />
                {t.myOrders}
              </h2>
              <button onClick={() => setShowOrdersModal(false)} className="rounded-full bg-gray-100 p-2 text-gray-500 transition-colors hover:bg-gray-200">
                <XIcon size={20} />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {activeOrders.map(order => (
                <div key={order.id} className={`flex flex-col gap-4 rounded-2xl border-2 bg-white p-5 shadow-sm transition-colors ${order.status === "ready" ? "border-green-400 bg-green-50/50" : "border-gray-100"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-500">{t.orderNum}: #{order.id.split("-")[0]}</span>
                      <h3 className="mt-1 text-xl font-extrabold text-black">{formatMAD(order.total_amount)} <span className="text-sm font-bold text-gray-500">MAD</span></h3>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {order.status === "pending" && <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700"><Clock size={12} /> {t.reviewing}</span>}
                      {order.status === "accepted" && <span className="flex animate-pulse items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700"><Coffee size={12} /> {t.preparing}</span>}
                      {order.status === "ready" && <span className="flex animate-bounce items-center gap-1 rounded-full bg-green-500 px-3 py-1.5 text-xs font-black text-white shadow-md"><CheckCircle size={14} /> {t.ready}</span>}
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3 text-sm font-bold text-black">
                    {order.items.map((item, i: number) => {
                      const itemName = activeLang === "en" && item.name_en ? item.name_en : activeLang === "fr" && item.name_fr ? item.name_fr : item.name_ar;
                      return (
                        <div key={i} className="flex justify-between">
                          <span>{item.quantity}x {itemName}</span>
                        </div>
                      );
                    })}
                  </div>
                  {order.status === "pending" && (
                    <button onClick={() => handleCancelOrder(order.id)} className="mt-2 w-full rounded-xl bg-red-50 py-3 font-bold text-red-600 transition-colors hover:bg-red-100">
                      {t.cancel}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <header className="z-50 flex h-[6.5rem] shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 sm:px-8 lg:px-10">
        <div className="flex min-w-0 items-center gap-4">
          <button
            onClick={() => setIsSidebarExpanded(prev => !prev)}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-black shadow-sm transition-transform hover:bg-gray-100 active:scale-95"
            aria-label="Toggle menu"
          >
            <Menu size={30} strokeWidth={2.4} />
          </button>

          <div className="min-w-0" dir={dir}>
            <h1 className="truncate text-3xl font-black uppercase tracking-normal text-black sm:text-4xl">
              {displayTitle}
            </h1>
            <p className="mt-1 truncate text-xs font-extrabold uppercase text-[#4d403b] sm:text-sm">
              {t.subtitle}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3" dir="ltr">
          <div className="flex rounded-full bg-gray-100 p-1 shadow-inner">
            {LANGUAGES.map(lang => (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`rounded-full px-3 py-2 text-[10px] font-black uppercase transition-all sm:px-4 ${activeLang === lang ? "bg-white text-black shadow-md" : "text-gray-500 hover:text-black"}`}
              >
                {lang}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (activeOrders.length > 0) setShowOrdersModal(true);
            }}
            className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#0a0a0a] text-white shadow-lg transition-transform active:scale-95"
            aria-label="Cart"
          >
            <ShoppingCart size={21} strokeWidth={2.6} />
            {headerBadgeCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white">
                {headerBadgeCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden bg-white">
        <aside className={`relative z-40 h-full shrink-0 transition-[width] duration-300 ease-out ${isSidebarExpanded ? "w-[17rem]" : "w-[5.25rem] sm:w-[6rem]"}`}>
          <div className="relative flex h-full flex-col overflow-hidden rounded-tr-[4.5rem] bg-[#0a0a0a] shadow-[12px_0_40px_rgba(0,0,0,0.14)]">
            <nav
              className={`relative z-10 flex flex-1 flex-col gap-4 overflow-y-auto pb-28 pt-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${isSidebarExpanded ? "px-5" : "px-2"}`}
              aria-label="Menu categories"
            >
              <button
                onClick={() => { setActiveCategoryId("all"); setIsSidebarExpanded(false); }}
                className={`group flex w-full items-center rounded-[2rem] py-3 transition-all duration-300 ${isSidebarExpanded ? "justify-start gap-4 px-2" : "justify-center px-0"}`}
                title={!isSidebarExpanded ? t.home : undefined}
              >
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center transition-all duration-300 ${activeCategoryId === "all" ? "scale-[1.3] text-white drop-shadow-[0_14px_18px_rgba(255,255,255,0.42)]" : "scale-90 text-white/65 opacity-70 group-hover:scale-110 group-hover:text-white group-hover:opacity-100"}`}>
                  <Home size={34} fill="currentColor" strokeWidth={2.2} />
                </span>
                {isSidebarExpanded && (
                  <span className={`min-w-0 truncate ${activeCategoryId === "all" ? "text-2xl font-black text-white" : "text-lg font-extrabold text-white/70 group-hover:text-white"}`} dir={dir}>
                    {t.home}
                  </span>
                )}
              </button>

              {categories.map((cat) => {
                const isActive = activeCategoryId === cat.id;
                const catName = getCategoryName(cat);
                const iconFilename = getCategoryIconName(cat.name_en || "");

                return (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveCategoryId(cat.id); setIsSidebarExpanded(false); }}
                    className={`group flex w-full items-center rounded-[2rem] py-3 transition-all duration-300 ${isSidebarExpanded ? "justify-start gap-4 px-2" : "justify-center px-0"}`}
                    title={!isSidebarExpanded ? catName : undefined}
                  >
                    <img
                      src={`/icons/${iconFilename}`}
                      alt={catName}
                      className={`h-12 w-12 shrink-0 object-contain transition-all duration-300 ${isActive ? "scale-[1.3] opacity-100 drop-shadow-[0_16px_22px_rgba(255,255,255,0.38)]" : "scale-90 opacity-60 group-hover:scale-110 group-hover:opacity-100"}`}
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                    {isSidebarExpanded && (
                      <span className={`min-w-0 truncate ${isActive ? "text-2xl font-black text-white" : "text-lg font-extrabold text-white/70 group-hover:text-white"}`} dir={dir}>
                        {catName}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-28 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent" />
          </div>
        </aside>

        <main className="relative min-w-0 flex-1 overflow-hidden bg-white" dir={dir}>
          {isSidebarExpanded && (
            <button
              className="absolute inset-0 z-40 cursor-default bg-black/25 backdrop-blur-[6px]"
              onClick={() => setIsSidebarExpanded(false)}
              aria-label="Close expanded menu"
            />
          )}

          <section className="h-full overflow-y-auto px-4 py-7 pb-40 sm:px-8 lg:px-12">
            {activeCategoryId === "all" ? (
              <div className="min-h-full" aria-label="Home view placeholder" />
            ) : (
              <div className="mx-auto w-full max-w-3xl">
                {uniqueSubCategories.length > 0 && (
                  <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => setActiveSubCategory("all")}
                      className={`rounded-full border px-7 py-3 text-sm font-black transition-all ${activeSubCategory === "all" ? "border-black bg-black text-white shadow-[0_8px_18px_rgba(0,0,0,0.18)]" : "border-gray-200 bg-white text-black shadow-sm hover:border-gray-300"}`}
                    >
                      {t.all}
                    </button>
                    {uniqueSubCategories.map((subCat: unknown, idx: number) => {
                      const subCategoryName = String(subCat);
                      return (
                        <button
                          key={idx}
                          onClick={() => setActiveSubCategory(subCategoryName)}
                          className={`rounded-full border px-7 py-3 text-sm font-black transition-all ${activeSubCategory === subCategoryName ? "border-black bg-black text-white shadow-[0_8px_18px_rgba(0,0,0,0.18)]" : "border-gray-200 bg-white text-black shadow-sm hover:border-gray-300"}`}
                        >
                          {subCategoryName}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-col gap-5">
                  {finalFilteredProducts.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center justify-center rounded-[2rem] border border-gray-100 bg-white p-12 shadow-sm">
                      <Coffee size={48} className="mb-4 text-gray-200" />
                      <p className="text-center font-bold text-gray-500">{t.empty}</p>
                    </div>
                  ) : (
                    finalFilteredProducts.map((product) => (
                      <MenuCard key={product.id} product={product} lang={activeLang} />
                    ))
                  )}
                </div>

                {!cafeData?.is_white_label && (
                  <div className="flex select-none flex-col items-center justify-center pb-10 pt-16 opacity-40">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Zap size={14} className="text-amber-500" />
                      <span className="font-mono text-[10px] font-bold uppercase tracking-widest">Powered by CafeQR</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {cartCount > 0 && (
            <div className="absolute inset-x-0 bottom-0 z-30 border-t border-gray-100 bg-white/95 p-4 shadow-[0_-16px_50px_rgba(0,0,0,0.08)] backdrop-blur-md sm:p-5">
              <div className="mx-auto flex max-w-3xl items-center justify-between gap-6" dir={dir}>
                <button onClick={handleCheckout} disabled={isSubmitting} className={`h-14 flex-1 rounded-[1.25rem] bg-black text-lg font-bold text-white shadow-md transition-transform ${isSubmitting ? "opacity-70" : "active:scale-[0.98]"}`}>
                  {isSubmitting ? t.sending : t.confirmOrder}
                </button>
                <div className={`flex flex-col ${activeLang === "ar" ? "items-end pr-2" : "items-start pl-2"}`}>
                  <span className="text-xs font-bold text-gray-500">{cartCount} {t.itemsCount}</span>
                  <span className="text-2xl font-black text-[#4d403b]">{formatMAD(totalPrice())}</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
