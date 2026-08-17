"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import {
  AlertOctagon,
  AlertTriangle,
  Check,
  ChefHat,
  LayoutGrid,
  Loader2,
  Plus,
  ShoppingBag,
  UtensilsCrossed,
  X,
  Zap,
} from "lucide-react";
import {
  DEMO_CAFE,
  DEMO_TABLES,
  createDemoOrder,
  useDemoCategories,
  useDemoOrders,
  useDemoProducts,
  useDemoTables,
  type DemoOrder,
  type DemoOrderItem,
  type DemoProduct,
} from "@/lib/demoStore";

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    updateError: "Error updating status.",
    confirmDisable: "Confirm out of stock for",
    disabledSuccess: "marked out of stock.",
    manualPosFail: "Failed to create manual order.",
    posTerminal: "Live POS Terminal",
    mainTitle: "Cashier & Order Management",
    directOrderBtn: "Direct POS Order",
    quickMenu: "Quick Menu",
    all: "All",
    directTicket: "Direct Order Ticket",
    selectTargetTable: "Select Target Table:",
    noTables: "No registered tables!",
    tablePrefix: "Table",
    clickToAdd: "Click on a product to add it to the ticket",
    total: "Total:",
    sending: "Sending...",
    confirmSend: "Confirm & Send to Kitchen",
    noOrdersTitle: "No active orders currently.",
    noOrdersSub: "Scan QR or click [+ Direct POS Order] above to create a new order",
    directPosBadge: "Direct (POS)",
    printBtn: "Print",
    acceptBtn: "Accept",
    rejectBtn: "Reject",
    orderReadyBtn: "Order Ready",
    completeBtn: "Force Complete (Fallback)",
    printTitle: "Kitchen Receipt",
    orderNoLabel: "Order No:",
    tableNoLabel: "Table No:",
  },
  fr: {
    updateError: "Erreur de mise à jour.",
    confirmDisable: "Confirmer la rupture de stock pour",
    disabledSuccess: "marqué en rupture de stock.",
    manualPosFail: "Échec de la création de la commande manuelle.",
    posTerminal: "Terminal de Caisse",
    mainTitle: "Caisse & Gestion des Commandes",
    directOrderBtn: "Nouvelle Commande (POS)",
    quickMenu: "Menu Rapide",
    all: "Tout",
    directTicket: "Ticket de Commande",
    selectTargetTable: "Sélectionner la table cible :",
    noTables: "Aucune table enregistrée !",
    tablePrefix: "Table",
    clickToAdd: "Cliquez sur un produit pour l'ajouter au ticket",
    total: "Total :",
    sending: "Envoi...",
    confirmSend: "Confirmer & Envoyer en Cuisine",
    noOrdersTitle: "Aucune commande active pour le moment.",
    noOrdersSub: "Scannez le QR ou cliquez sur [+ Nouvelle Commande] pour créer une commande",
    directPosBadge: "Direct (Caisse)",
    printBtn: "Imprimer",
    acceptBtn: "Accepter",
    rejectBtn: "Refuser",
    orderReadyBtn: "Commande Prête",
    completeBtn: "Clôturer (Manuel)",
    printTitle: "Ticket Cuisine",
    orderNoLabel: "N° Cmd :",
    tableNoLabel: "N° Table :",
  },
  ar: {
    updateError: "خطأ أثناء التحديث.",
    confirmDisable: "تأكيد إيقاف",
    disabledSuccess: "تم إيقافه.",
    manualPosFail: "فشل إنشاء الطلب اليدوي.",
    posTerminal: "Live POS Terminal",
    mainTitle: "شاشة الكاشير وإدارة الطلبات",
    directOrderBtn: "تسجيل طلب مباشر (POS)",
    quickMenu: "المنيو السريع",
    all: "الجميع",
    directTicket: "تذكرة الطلب المباشر",
    selectTargetTable: "اختر الطاولة المستهدفة:",
    noTables: "لا توجد طاولات مسجلة!",
    tablePrefix: "طاولة",
    clickToAdd: "اضغط على منتج لإضافته للتذكرة",
    total: "الإجمالي:",
    sending: "جاري الإرسال...",
    confirmSend: "تأكيد وإرسال للمطبخ",
    noOrdersTitle: "لا توجد طلبات نشطة حالياً.",
    noOrdersSub: "امسح الـ QR أو اضغط على [+ تسجيل طلب مباشر] فوق لإنشاء طلب جديد",
    directPosBadge: "مباشر (POS)",
    printBtn: "طباعة",
    acceptBtn: "قبول",
    rejectBtn: "رفض",
    orderReadyBtn: "الطلب جاهز",
    completeBtn: "إنهاء يدوي (احتياطي)",
    printTitle: "تذكرة المطبخ",
    orderNoLabel: "رقم الطلب:",
    tableNoLabel: "رقم الطاولة:",
  },
};

const formatMAD = (price: number) => `${Number(price).toFixed(2)} MAD`;
const LANGUAGES = ["en", "fr", "ar"] as const;
type Lang = (typeof LANGUAGES)[number];

const isVisibleOrder = (order: DemoOrder) =>
  !["completed", "rejected", "cancelled"].includes(order.status);

function LanguageToggle({
  activeLang,
  onSelect,
}: {
  activeLang: Lang;
  onSelect: (lang: Lang) => void;
}) {
  return (
    <div className="flex bg-muted/60 p-1 rounded-full w-max border" dir="ltr">
      {LANGUAGES.map((lang) => (
        <button
          key={lang}
          onClick={() => onSelect(lang)}
          className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${activeLang === lang ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}

export default function CashierDemoDashboard() {
  const [activeLang, setActiveLang] = useState<Lang>("en");
  const t = TRANSLATIONS[activeLang];
  const dir = activeLang === "ar" ? "rtl" : "ltr";

  const { products, updateProducts } = useDemoProducts();
  const { categories } = useDemoCategories();
  const { tables } = useDemoTables();
  const { orders, updateOrders } = useDemoOrders();

  const [showPOS, setShowPOS] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState(DEMO_TABLES[0]?.id || "");
  const [posCart, setPosCart] = useState<Record<string, DemoOrderItem>>({});
  const [posCategory, setPosCategory] = useState<string>("ALL");
  const [isSubmittingPos, setIsSubmittingPos] = useState(false);

  const activeProducts = useMemo(
    () => products.filter((product) => product.is_active !== false),
    [products]
  );
  const activeOrders = useMemo(
    () => orders.filter(isVisibleOrder),
    [orders]
  );
  const cartItemsArray = Object.values(posCart);

  const parseProductData = (item: Pick<DemoOrderItem, "name_ar" | "name_en" | "name_fr">, lang: string) => {
    let fullName = "";
    if (lang === "ar") fullName = item.name_ar || item.name_en || item.name_fr || "";
    else if (lang === "fr") fullName = item.name_fr || item.name_en || item.name_ar || "";
    else fullName = item.name_en || item.name_ar || item.name_fr || "";

    const splitIndex = fullName.indexOf(" (+ ");
    if (splitIndex !== -1) {
      const baseName = fullName.substring(0, splitIndex).trim();
      const modsStr = fullName.substring(splitIndex + 4, fullName.length - 1);
      const modsList = modsStr.split(/،\s*|,\s*/).filter(Boolean);
      return { baseName, modsList, fullName };
    }

    return { baseName: fullName, modsList: [], fullName };
  };

  const updateOrderStatus = (order: DemoOrder, newStatus: DemoOrder["status"]) => {
    const updatedOrder = { ...order, status: newStatus, updated_at: new Date().toISOString() };
    updateOrders(orders.map((existingOrder) => existingOrder.id === order.id ? updatedOrder : existingOrder));
  };

  const markOutOfStock = (productId: string, productName: string) => {
    if (!confirm(`${t.confirmDisable} "${productName}"?`)) return;
    updateProducts(products.map((product) =>
      product.id === productId
        ? { ...product, is_active: false, stock_status: "out_of_stock" }
        : product
    ));
    alert(`"${productName}" ${t.disabledSuccess}`);
  };

  const addToPos = (product: DemoProduct | DemoOrderItem) => {
    setPosCart((previousCart) => {
      const currentItem = previousCart[product.id];
      if (currentItem) {
        return {
          ...previousCart,
          [product.id]: { ...currentItem, quantity: currentItem.quantity + 1 },
        };
      }

      const orderItem = product as Partial<DemoOrderItem>;
      const productId = typeof orderItem.product_id === "string" ? orderItem.product_id : product.id;
      const imageUrl = typeof product.image_url === "string" ? product.image_url : "";
      const modifiers = orderItem.modifiers && typeof orderItem.modifiers === "object"
        ? orderItem.modifiers
        : {};

      return {
        ...previousCart,
        [product.id]: {
          id: product.id,
          product_id: productId,
          name_ar: product.name_ar,
          name_en: product.name_en || "",
          name_fr: product.name_fr || "",
          price: Number(product.price),
          quantity: 1,
          image_url: imageUrl,
          modifiers,
        },
      };
    });
  };

  const decFromPos = (productId: string) => {
    setPosCart((previousCart) => {
      const currentItem = previousCart[productId];
      if (!currentItem) return previousCart;

      if (currentItem.quantity <= 1) {
        const nextCart = { ...previousCart };
        delete nextCart[productId];
        return nextCart;
      }

      return {
        ...previousCart,
        [productId]: { ...currentItem, quantity: currentItem.quantity - 1 },
      };
    });
  };

  const handleCreateManualOrder = () => {
    const cartItems = Object.values(posCart);
    if (cartItems.length === 0 || !selectedTableId) return;

    setIsSubmittingPos(true);

    try {
      const newOrder = createDemoOrder({
        tableId: selectedTableId,
        sessionId: `manual_pos_${Date.now()}`,
        items: cartItems,
        status: "accepted",
      });

      updateOrders([newOrder, ...orders]);
      setPosCart({});
      setShowPOS(false);
    } catch {
      alert(t.manualPosFail);
    } finally {
      setIsSubmittingPos(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-muted/20 p-6 md:p-12 no-print font-sans flex flex-col" dir={dir}>
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between bg-white p-6 rounded-[2rem] shadow-sm border border-border gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold font-mono tracking-wider text-emerald-600 uppercase">{t.posTerminal}</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">{t.mainTitle}</h1>
          </div>

          <div className="flex items-center gap-4 flex-wrap shrink-0">
            <LanguageToggle activeLang={activeLang} onSelect={setActiveLang} />
            <button
              onClick={() => setShowPOS(true)}
              className="bg-foreground hover:bg-foreground/90 text-white px-6 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 shadow-xl transition-transform active:scale-95 shrink-0"
            >
              <Plus size={20} className="text-primary" />
              <span>{t.directOrderBtn}</span>
            </button>
          </div>
        </header>

        {showPOS && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="bg-background w-full h-full max-w-[1400px] max-h-[95vh] rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-border">
              <div className={`flex-1 flex flex-col bg-slate-50/60 p-4 sm:p-6 overflow-hidden order-2 ${activeLang === "ar" ? "md:order-1" : "md:order-2"}`}>
                <div className="flex items-center justify-between pb-4 mb-4 border-b">
                  <h3 className="font-black text-xl flex items-center gap-2"><UtensilsCrossed className="text-primary" size={22} /> {t.quickMenu}</h3>

                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    <button
                      onClick={() => setPosCategory("ALL")}
                      className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${posCategory === "ALL" ? "bg-foreground text-white shadow-md" : "bg-white text-muted-foreground border hover:bg-muted"}`}
                    >
                      <LayoutGrid size={16} className={posCategory === "ALL" ? "text-primary" : "text-muted-foreground"} /> {t.all}
                    </button>
                    {categories.map((category) => {
                      const IconComponent = (Icons as unknown as Record<string, Icons.LucideIcon>)[category.icon || "Coffee"] || Icons.Coffee;
                      const categoryName = activeLang === "ar" ? category.name_ar : activeLang === "fr" ? category.name_fr : category.name_en;
                      return (
                        <button
                          key={category.id}
                          onClick={() => setPosCategory(category.id)}
                          className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${posCategory === category.id ? "bg-foreground text-white shadow-md" : "bg-white text-muted-foreground border hover:bg-muted"}`}
                        >
                          <IconComponent size={16} className={posCategory === category.id ? "text-primary" : "text-muted-foreground"} />
                          {categoryName}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 pr-2 custom-scrollbar content-start auto-rows-max">
                  {activeProducts.filter((product) => posCategory === "ALL" || product.category_id === posCategory).map((product) => {
                    const { baseName } = parseProductData(product, activeLang);
                    return (
                      <div
                        key={product.id}
                        onClick={() => addToPos(product)}
                        className="bg-white rounded-2xl border border-border overflow-hidden hover:border-primary hover:shadow-md transition-all cursor-pointer flex flex-col group active:scale-95 aspect-square"
                      >
                        <div className="relative h-[65%] w-full bg-muted overflow-hidden shrink-0">
                          <img src={product.image_url || ""} alt={baseName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-primary text-white rounded-full p-2 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform"><Plus size={20} /></div>
                          </div>
                        </div>
                        <div className="h-[35%] p-2 flex flex-col items-center justify-center text-center shrink-0">
                          <h4 className="font-bold text-[10px] sm:text-xs line-clamp-1 w-full leading-tight">{baseName}</h4>
                          <span className="font-black text-primary text-[11px] sm:text-sm mt-0.5 block tracking-tight" dir="ltr">{formatMAD(product.price)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={`w-full md:w-[400px] lg:w-[450px] bg-white p-6 flex flex-col justify-between order-1 shadow-2xl z-10 ${activeLang === "ar" ? "md:order-2 border-r" : "md:order-1 border-l"}`}>
                <div className="flex flex-col h-full max-h-full overflow-hidden">
                  <div className="flex justify-between items-center mb-6 shrink-0">
                    <h3 className="font-black text-2xl">{t.directTicket}</h3>
                    <button onClick={() => setShowPOS(false)} className="p-2 bg-muted rounded-full hover:bg-gray-200 transition-colors"><X size={20} /></button>
                  </div>

                  <div className="mb-6 shrink-0">
                    <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">{t.selectTargetTable}</label>
                    {tables.length === 0 ? (
                      <div className="p-4 rounded-xl bg-amber-50 text-amber-700 text-sm font-bold border border-amber-200 flex items-center gap-2"><AlertTriangle size={18} /> {t.noTables}</div>
                    ) : (
                      <select value={selectedTableId} onChange={(event) => setSelectedTableId(event.target.value)} className={`w-full p-4 bg-muted/40 border-2 rounded-xl font-bold text-base focus:border-primary outline-none transition-colors ${activeLang === "ar" ? "text-right" : "text-left"}`}>
                        {tables.map((table) => <option key={table.id} value={table.id}>{t.tablePrefix} {table.table_number.replace("table_", "")}</option>)}
                      </select>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar min-h-[200px]">
                    {cartItemsArray.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-4">
                        <ShoppingBag size={48} />
                        <span className="text-sm font-bold">{t.clickToAdd}</span>
                      </div>
                    ) : (
                      cartItemsArray.map((item) => {
                        const { baseName } = parseProductData(item, activeLang);
                        return (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-white border-2 rounded-2xl shadow-sm">
                            <div className="flex-1 truncate pr-3 font-bold text-sm">{baseName}</div>
                            <div className="flex items-center gap-3 shrink-0" dir="ltr">
                              <button onClick={() => decFromPos(item.id)} className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center hover:bg-red-100 hover:text-red-600 font-black text-lg transition-colors">-</button>
                              <span className="w-4 text-center font-black">{item.quantity}</span>
                              <button onClick={() => addToPos(item)} className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center font-black text-lg hover:bg-primary/90 transition-colors">+</button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="pt-6 border-t mt-4 shrink-0 bg-white">
                    <div className="flex justify-between items-center mb-6">
                      <span className="font-extrabold text-muted-foreground uppercase tracking-widest text-sm">{t.total}</span>
                      <span className="text-3xl font-black text-primary" dir="ltr">{formatMAD(cartItemsArray.reduce((sum, item) => sum + item.price * item.quantity, 0))}</span>
                    </div>

                    <button
                      onClick={handleCreateManualOrder}
                      disabled={isSubmittingPos || cartItemsArray.length === 0 || !selectedTableId}
                      className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-950/20 flex items-center justify-center gap-3 transition-all active:scale-95"
                    >
                      {isSubmittingPos ? <Loader2 className="animate-spin" size={24} /> : <><ChefHat size={24} /> {t.confirmSend}</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 items-start">
          {activeOrders.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white rounded-[2.5rem] border border-dashed p-10 mt-auto mb-auto">
              <ShoppingBag className="mx-auto text-muted-foreground/30 mb-3" size={48} />
              <p className="text-muted-foreground text-lg font-bold">{t.noOrdersTitle}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{t.noOrdersSub}</p>
            </div>
          ) : activeOrders.map((order) => (
            <div key={order.id} className={`bg-white rounded-[2rem] p-6 shadow-sm border-2 ${order.status === "pending" ? "border-yellow-400" : order.status === "accepted" ? "border-blue-400" : "border-green-400 animate-pulse"}`}>
              <div className="flex justify-between items-start mb-6 border-b pb-4">
                <div>
                  <h2 className="text-2xl font-extrabold">{order.tables?.table_number ? `${t.tablePrefix} ${order.tables.table_number.replace("table_", "")}` : t.directPosBadge}</h2>
                  <p className="text-xs font-bold text-muted-foreground mt-1">#{order.id.split("-")[0]}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xl font-black text-primary" dir="ltr">{formatMAD(order.total_amount)}</span>
                </div>
              </div>

              <div className="space-y-3 mb-8 min-h-[120px]">
                {order.items.map((item, idx) => {
                  const { baseName, modsList } = parseProductData(item, activeLang);
                  return (
                    <div key={`${item.id}-${idx}`} className="flex flex-col bg-muted/20 p-3 rounded-xl border border-border/50">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-start gap-3">
                          <span className="bg-primary text-white w-7 h-7 shrink-0 flex items-center justify-center rounded-lg font-bold text-sm mt-0.5" dir="ltr">x{item.quantity}</span>
                          <div className="flex flex-col">
                            <span className="font-bold text-base text-foreground leading-tight mt-1">{baseName}</span>
                            {modsList.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {modsList.map((mod, index) => (
                                  <span key={`${mod}-${index}`} className="text-[10px] bg-white border border-border shadow-sm px-2 py-0.5 rounded-md text-muted-foreground font-bold leading-tight">
                                    {mod}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <button onClick={() => markOutOfStock(item.product_id || item.id, baseName)} className="text-red-500 bg-red-50 p-2 rounded-lg hover:bg-red-500 hover:text-white transition-colors shrink-0 mt-0.5">
                          <AlertOctagon size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-auto">
                {order.status === "pending" && (
                  <>
                    <button onClick={() => updateOrderStatus(order, "accepted")} className="bg-foreground text-white py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 active:scale-95 transition-transform"><Check size={18} /> {t.acceptBtn}</button>
                    <button onClick={() => updateOrderStatus(order, "rejected")} className="bg-red-50 text-red-600 py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-red-100 transition-colors"><X size={18} /> {t.rejectBtn}</button>
                  </>
                )}

                {order.status === "accepted" && (
                  <button onClick={() => updateOrderStatus(order, "ready")} className="col-span-2 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black text-base flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95 transition-all">
                    <ChefHat size={22} /> {t.orderReadyBtn}
                  </button>
                )}

                {order.status === "ready" && (
                  <button onClick={() => updateOrderStatus(order, "completed")} className="col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black text-sm flex justify-center items-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95 transition-all opacity-80">
                    <Check size={18} /> {t.completeBtn}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {!DEMO_CAFE.is_white_label && (
          <div className="mt-auto pt-12 pb-2 flex flex-col items-center justify-center opacity-40 select-none">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Zap size={14} className="text-amber-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Powered by ServeQR</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
