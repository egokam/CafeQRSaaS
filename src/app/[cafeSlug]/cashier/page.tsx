"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "../../../lib/supabase";
import { Check, X, Clock, ChefHat, AlertOctagon, Printer, Lock, AlertTriangle, Plus, UtensilsCrossed, ShoppingBag, Ban, Hourglass, Loader2 } from "lucide-react";
import {
  cashierMarkOutOfStock,
  cashierUpdateOrderStatus,
  createManualCashierOrder,
  getCashierActiveOrders,
  getCashierCafeBySlug,
  getCashierWorkspace,
  loginCashierWithDevice, 
} from "../../../actions/auth";
import { checkCafeSubscription } from "../../../actions/saas";

// 🌟 Translation System
const TRANSLATIONS: Record<string, any> = {
  en: {
    loading: "Loading...",
    notFoundTitle: "404 - Cafe Not Found",
    suspendedTitle: "Cashier System Suspended 🚫",
    suspendedSub: "The cafe's subscription has expired. Please renew to resume operations.",
    sessionFullTitle: "Session Full",
    sessionFullSub: "This cafe has reached its maximum allowed cashier screens.",
    pendingTitle: "Device Pending Approval ⏳",
    pendingSub: "Your device has been registered. Please wait for the admin to approve it.",
    blockedTitle: "Device Blocked ⛔",
    blockedSub: "This device is no longer authorized to access the cashier system.",
    retryBtn: "Retry 🔄",
    cashierZone: "Cashier Zone",
    enterPin: "Enter PIN to receive orders",
    loginBtn: "Login",
    tempBan: "Temporarily blocked. Please wait a minute.",
    wrongPin: "Invalid PIN ❌",
    updateError: "Error updating status.",
    confirmDisable: "Confirm out of stock for",
    disabledSuccess: "marked out of stock.",
    manualPosFail: "Failed to create manual order.",
    posTerminal: "Live POS Terminal",
    mainTitle: "Cashier & Order Management 💳",
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
    confirmSend: "Confirm & Send to Kitchen ⚡",
    noOrdersTitle: "No active orders currently.",
    noOrdersSub: "Scan QR or click [+ Direct POS Order] above to create a new order",
    directPosBadge: "Direct (POS)",
    printBtn: "Print",
    acceptBtn: "Accept",
    rejectBtn: "Reject",
    preparingStatus: "Preparing in the kitchen... 👨‍🍳",
    completeBtn: "Complete Order",
    printTitle: "Smart QR System",
    orderNoLabel: "Order No:",
    tableNoLabel: "Table No:"
  },
  fr: {
    loading: "Chargement...",
    notFoundTitle: "404 - Café Introuvable",
    suspendedTitle: "Système de Caisse Suspendu 🚫",
    suspendedSub: "L'abonnement du café a expiré. Veuillez renouveler pour reprendre les opérations.",
    sessionFullTitle: "Session Pleine",
    sessionFullSub: "Ce café a atteint son nombre maximum d'écrans de caisse.",
    pendingTitle: "En Attente d'Approbation ⏳",
    pendingSub: "Votre appareil est enregistré. Veuillez attendre l'approbation de l'administrateur.",
    blockedTitle: "Appareil Bloqué ⛔",
    blockedSub: "Cet appareil n'est plus autorisé à accéder au système de caisse.",
    retryBtn: "Réessayer 🔄",
    cashierZone: "Espace Caisse",
    enterPin: "Entrez le code PIN pour recevoir les commandes",
    loginBtn: "Connexion",
    tempBan: "Bloqué temporairement. Veuillez patienter une minute.",
    wrongPin: "Code PIN invalide ❌",
    updateError: "Erreur de mise à jour.",
    confirmDisable: "Confirmer la rupture de stock pour",
    disabledSuccess: "marqué en rupture de stock.",
    manualPosFail: "Échec de la création de la commande manuelle.",
    posTerminal: "Terminal de Caisse",
    mainTitle: "Caisse & Gestion des Commandes 💳",
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
    confirmSend: "Confirmer & Envoyer en Cuisine ⚡",
    noOrdersTitle: "Aucune commande active pour le moment.",
    noOrdersSub: "Scannez le QR ou cliquez sur [+ Nouvelle Commande] pour créer une commande",
    directPosBadge: "Direct (Caisse)",
    printBtn: "Imprimer",
    acceptBtn: "Accepter",
    rejectBtn: "Refuser",
    preparingStatus: "Préparation en cuisine... 👨‍🍳",
    completeBtn: "Terminer la Commande",
    printTitle: "Système QR Intelligent",
    orderNoLabel: "N° Cmd :",
    tableNoLabel: "N° Table :"
  },
  ar: {
    loading: "جاري التحميل...",
    notFoundTitle: "404 - المقهى غير موجود",
    suspendedTitle: "نظام الكاشير متوقف مؤقتاً 🚫",
    suspendedSub: "انتهت صلاحية اشتراك المقهى. يرجى التجديد لاستئناف العمل.",
    sessionFullTitle: "الجلسة ممتلئة",
    sessionFullSub: "وصل هذا المقهى للحد الأقصى من شاشات الكاشير المسموحة.",
    pendingTitle: "الجهاز قيد المراجعة ⏳",
    pendingSub: "تم إرسال طلب تسجيل هذا الجهاز إلى الإدارة. يرجى انتظار الموافقة.",
    blockedTitle: "تم حظر هذا الجهاز ⛔",
    blockedSub: "لا يمكنك استخدام نظام الكاشير من هذا الجهاز بعد الآن.",
    retryBtn: "إعادة المحاولة 🔄",
    cashierZone: "منطقة الكاشير",
    enterPin: "أدخل الرمز السري لاستقبال الطلبات",
    loginBtn: "دخول",
    tempBan: "تم حظرك مؤقتاً. يرجى الانتظار دقيقة.",
    wrongPin: "الرمز غير صحيح ❌",
    updateError: "خطأ أثناء التحديث.",
    confirmDisable: "تأكيد إيقاف",
    disabledSuccess: "تم إيقاف",
    manualPosFail: "فشل إنشاء الطلب اليدوي.",
    posTerminal: "Live POS Terminal",
    mainTitle: "شاشة الكاشير وإدارة الطلبات 💳",
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
    confirmSend: "تأكيد وإرسال للمطبخ ⚡",
    noOrdersTitle: "لا توجد طلبات نشطة حالياً.",
    noOrdersSub: "امسح الـ QR أو اضغط على [+ تسجيل طلب مباشر] فوق لإنشاء طلب جديد",
    directPosBadge: "مباشر (POS)",
    printBtn: "طباعة",
    acceptBtn: "قبول",
    rejectBtn: "رفض",
    preparingStatus: "جاري التحضير في المطبخ... 👨‍🍳",
    completeBtn: "إنهاء الطلب",
    printTitle: "نظام QR الذكي",
    orderNoLabel: "رقم الطلب:",
    tableNoLabel: "رقم الطاولة:"
  }
};

const formatMAD = (price: number) => {
  return `${Number(price).toFixed(2)} MAD`;
};

const LANGUAGES = ["en", "fr", "ar"];

export default function CashierDashboard({ params }: { params: Promise<{ cafeSlug: string }> }) {
  const { cafeSlug } = use(params);
  
  // 🌟 Language State
  const [activeLang, setActiveLang] = useState("en");
  const t = TRANSLATIONS[activeLang];
  const dir = activeLang === 'ar' ? 'rtl' : 'ltr';

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // 🌟 حالات الجهاز والمنع
  const [deviceId, setDeviceId] = useState("");
  const [deviceStatus, setDeviceStatus] = useState<'none' | 'pending' | 'blocked' | 'approved'>('none');
  const [isSessionFull, setIsSessionFull] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const [cafeId, setCafeId] = useState<string | null>(null);
  const [cafeDataObj, setCafeDataObj] = useState<any>(null); 
  
  const [printOrder, setPrintOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  // 🌟 أدوات نظام الكاشير المباشر
  const [products, setProducts] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [showPOS, setShowPOS] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [posCart, setPosCart] = useState<{ [key: string]: any }>({});
  const [posCategory, setPosCategory] = useState<string>("ALL");
  const [isSubmittingPos, setIsSubmittingPos] = useState(false);

  const getProductName = (item: any) => {
    if (activeLang === "ar") return item.name_ar;
    if (activeLang === "fr") return item.name_fr || item.name_en || item.name_ar;
    return item.name_en || item.name_ar;
  };

  const fetchOrders = async (cId: string) => {
    const res = await getCashierActiveOrders(cId);
    if (res.success) setOrders(res.orders);
  };

  // 🌟 توليد بصمة الجهاز واسترجاع الجلسة عند التحديث (Refresh Restore)
  useEffect(() => {
    let storedId = localStorage.getItem(`cafeqr_device_${cafeSlug}`);
    if (!storedId) {
      storedId = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem(`cafeqr_device_${cafeSlug}`, storedId);
    }
    setDeviceId(storedId);

    const initCafe = async () => {
      setIsLoading(true);

      const subCheck = await checkCafeSubscription(cafeSlug);
      if (!subCheck.isValid) {
        setIsSuspended(true);
        setIsLoading(false);
        return;
      }

      const cafeRes = await getCashierCafeBySlug(cafeSlug);
      if (!cafeRes.success || !cafeRes.cafe) { setIsNotFound(true); setIsLoading(false); return; }
      
      const cId = cafeRes.cafe.id;
      setCafeId(cId);
      setCafeDataObj(cafeRes.cafe);

      // 🔥 فحص حالة الجهاز من قاعدة البيانات وتخطي الدخول إذا كان مصرحاً
      try {
        const { data: deviceData } = await supabase
          .from("pos_devices")
          .select("status")
          .eq("cafe_id", cId)
          .eq("device_id", storedId)
          .maybeSingle();

        if (deviceData) {
          setDeviceStatus(deviceData.status as any);
          
          if (deviceData.status === 'approved' && sessionStorage.getItem(`cashier_auth_${cafeSlug}`) === 'true') {
            const workspace = await getCashierWorkspace(cId);
            if (workspace.success) {
              setProducts(workspace.products);
              setTables(workspace.tables);
              setOrders(workspace.orders);
              if (workspace.tables.length > 0) setSelectedTableId(workspace.tables[0].id);
              setIsAuthenticated(true);
            } else {
              sessionStorage.removeItem(`cashier_auth_${cafeSlug}`);
            }
          }
        }
      } catch (err) {
        console.error("Error verifying device session:", err);
      }

      setIsLoading(false);
    };
    initCafe();
  }, [cafeSlug]);

  // 📡 المراقبة الحية للطلبات، حالة الجهاز، والحد الأقصى للجلسات (Realtime Logic)
  useEffect(() => {
    if (!isAuthenticated || !cafeDataObj || !deviceId) return;

    fetchOrders(cafeDataObj.id);

    // 1. مراقبة الطلبات الجديدة للمطبخ
    const ordersChannel = supabase.channel(`live-orders-${cafeDataObj.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `cafe_id=eq.${cafeDataObj.id}` }, (payload: any) => {
        fetchOrders(cafeDataObj.id);
        if (payload.eventType === 'INSERT' || (payload.new && payload.new.status === 'ready')) {
          new Audio('/bell.mp3').play().catch(() => {});
        }
      }).subscribe();

    // 2. 🌟 الطرد المباشر من الإدارة (إذا تم حظر الجهاز من لوحة التحكم)
    const deviceChannel = supabase.channel(`device_${deviceId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pos_devices', filter: `device_id=eq.${deviceId}` }, (payload: any) => {
        if (payload.new.status === 'blocked') {
          setIsAuthenticated(false);
          setDeviceStatus('blocked');
        } else if (payload.new.status === 'pending') {
          setIsAuthenticated(false);
          setDeviceStatus('pending');
        }
      }).subscribe();

    // 3. 🌟 الحفاظ على نظامك القديم: طرد الكاشير الزائد عن الحد المسموح (Session Full)
    const slotChannel = supabase.channel(`cashier_slots_${cafeDataObj.id}`, {
      config: { presence: { key: deviceId } } // نربط التواجد ببصمة الجهاز الثابتة
    });

    slotChannel.on('presence', { event: 'sync' }, () => {
      const presenceState = slotChannel.presenceState();
      const maxAllowed = cafeDataObj.max_cashiers || 1;
      
      if (!presenceState[deviceId]) return;

      const activeSessions: { key: string, onlineAt: number }[] = [];
      Object.entries(presenceState).forEach(([key, presences]: [string, any]) => {
        if (presences.length > 0) activeSessions.push({ key, onlineAt: new Date(presences[0].online_at || Date.now()).getTime() });
      });

      // ترتيب الأجهزة حسب وقت الدخول (الأقدم له الأولوية)
      activeSessions.sort((a, b) => a.onlineAt - b.onlineAt);
      const allowedKeys = activeSessions.slice(0, maxAllowed).map(s => s.key);

      // إذا لم يكن هذا الجهاز ضمن القائمة المسموحة، يتم طرده فوراً
      if (!allowedKeys.includes(deviceId)) {
        setIsSessionFull(true);
        slotChannel.untrack();
        setIsAuthenticated(false); // نخرجه من النظام
      }
    });

    slotChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') await slotChannel.track({ online_at: new Date().toISOString() });
    });

    return () => { 
      supabase.removeChannel(ordersChannel); 
      supabase.removeChannel(deviceChannel);
      supabase.removeChannel(slotChannel);
    };
  }, [isAuthenticated, cafeDataObj, deviceId]);

  // 🌟 نظام تسجيل الدخول الجديد (بصمة الجهاز)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || !cafeId || !deviceId) return;

    setIsChecking(true);
    
    // جلب اسم المتصفح لتسهيل التعرف عليه في لوحة الإدارة
    const deviceName = `${navigator.platform || 'Unknown'} - ${navigator.userAgent.split(' ')[0] || 'Browser'}`;
    
    // إرسال طلب الدخول مع البصمة للسيرفر
    const res = await loginCashierWithDevice(cafeSlug, pinInput, deviceId, deviceName);
    setIsChecking(false);

    if (res.success) {
      const workspace = await getCashierWorkspace(cafeId);
      if (!workspace.success) {
        alert(t.updateError);
        return;
      }
      setProducts(workspace.products);
      setTables(workspace.tables);
      setOrders(workspace.orders);
      if (workspace.tables.length > 0) setSelectedTableId(workspace.tables[0].id);
      
      setIsAuthenticated(true);
      sessionStorage.setItem(`cashier_auth_${cafeSlug}`, 'true'); // حفظ الجلسة محلياً
      setDeviceStatus('approved');
      setAttempts(0);
      setPinInput("");
      new Audio('/bell.mp3').play().catch(()=> {});
    } else if (res.status === 'pending') {
      setDeviceStatus('pending');
    } else if (res.status === 'blocked') {
      setDeviceStatus('blocked');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPinInput("");
      if (newAttempts >= 5) {
        setIsLocked(true);
        alert(t.tempBan);
        setTimeout(() => { setIsLocked(false); setAttempts(0); }, 60000);
      } else alert(res.error || t.wrongPin);
    }
  };

  const handlePrintReceipt = (order: any) => {
    setPrintOrder(order);
    setTimeout(() => { window.print(); }, 150);
  };

  const updateOrderStatus = async (order: any, newStatus: string) => {
    const { success } = await cashierUpdateOrderStatus(order.id, newStatus);
    if (!success) {
      alert(t.updateError);
      return;
    }
    if (newStatus === 'accepted') {
      handlePrintReceipt(order);
    }
  };

  const markOutOfStock = async (productId: string, productName: string) => {
    if(!confirm(`${t.confirmDisable} "${productName}"?`)) return;
    const { success } = await cashierMarkOutOfStock(productId);
    if (success) alert(`"${productName}" ${t.disabledSuccess}`);
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

  const handleCreateManualOrder = async () => {
    const cartItems = Object.values(posCart);
    if (cartItems.length === 0 || !selectedTableId || !cafeId) return;

    setIsSubmittingPos(true);
    try {
      const dummySession = "manual_pos_" + Date.now();
      const res = await createManualCashierOrder({
        cafeId,
        tableId: selectedTableId,
        sessionId: dummySession,
        items: cartItems,
      });

      if (!res.success || !res.order) throw new Error(res.error);

      new Audio('/bell.mp3').play().catch(()=>{});
      handlePrintReceipt(res.order);

      setPosCart({});
      setShowPOS(false);
      fetchOrders(cafeId);
    } catch (err) { alert(t.manualPosFail); } 
    finally { setIsSubmittingPos(false); }
  };

  const LanguageToggle = () => (
    <div className="flex bg-muted/60 p-1 rounded-full w-max border" dir="ltr">
      {LANGUAGES.map(lang => (
        <button
          key={lang}
          onClick={() => setActiveLang(lang)}
          className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${activeLang === lang ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          {lang}
        </button>
      ))}
    </div>
  );

  if (isLoading) return <div className="min-h-screen bg-muted/20 flex items-center justify-center"><div className="w-12 h-12 border-4 border-foreground border-t-transparent rounded-full animate-spin"/></div>;

  if (isNotFound) return <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-6 text-center" dir={dir}><AlertTriangle className="w-16 h-16 text-red-500 mb-4"/><h1 className="text-3xl font-bold">{t.notFoundTitle}</h1></div>;

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-rose-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans" dir={dir}>
        <Lock size={64} className="text-rose-500 mb-4 animate-pulse" />
        <h1 className="text-3xl font-black mb-2">{t.suspendedTitle}</h1>
        <p className="text-rose-200/80 max-w-md text-sm">{t.suspendedSub}</p>
      </div>
    );
  }

  // 🌟 شاشات المنع الجديدة (Pending & Blocked)
  if (deviceStatus === 'pending') {
    return (
      <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-6 text-center" dir={dir}>
        <div className="bg-amber-100 p-6 rounded-full text-amber-600 mb-6 animate-pulse"><Hourglass size={48} /></div>
        <h1 className="text-3xl font-black mb-2 text-amber-900">{t.pendingTitle}</h1>
        <p className="text-amber-700/80 font-bold max-w-md mb-8">{t.pendingSub}</p>
        <button onClick={() => window.location.reload()} className="bg-amber-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2">{t.retryBtn}</button>
      </div>
    );
  }

  if (deviceStatus === 'blocked') {
    return (
      <div className="min-h-screen bg-red-950 flex flex-col items-center justify-center p-6 text-center" dir={dir}>
        <div className="bg-red-500/20 p-6 rounded-full text-red-500 mb-6"><Ban size={48} /></div>
        <h1 className="text-3xl font-black mb-2 text-white">{t.blockedTitle}</h1>
        <p className="text-red-200/80 font-bold max-w-md mb-8">{t.blockedSub}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-6" dir={dir}>
        <div className={`absolute top-6 ${activeLang === 'ar' ? 'left-6' : 'right-6'}`}><LanguageToggle /></div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border w-full max-w-sm text-center">
          <div className="bg-foreground w-20 h-20 rounded-full flex items-center justify-center text-white mx-auto mb-6"><Lock size={36}/></div>
          <h2 className="text-2xl font-extrabold mb-2">{t.cashierZone}</h2>
          <p className="text-muted-foreground mb-8 text-sm font-bold">{t.enterPin}</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input type="password" inputMode="numeric" value={pinInput} onChange={(e) => setPinInput(e.target.value)} className="border-2 rounded-2xl p-4 text-center text-3xl tracking-[0.5em] font-mono outline-none" placeholder="••••" autoFocus dir="ltr" disabled={isChecking} />
            <button disabled={isChecking} type="submit" className="py-4 rounded-2xl font-bold text-lg text-white bg-foreground hover:opacity-90 disabled:opacity-50">
              {isChecking ? <Loader2 className="animate-spin mx-auto" size={24} /> : t.loginBtn}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const posCategoriesList = ["ALL", ...Array.from(new Set(products.map(p => p.category)))];
  const cartItemsArray = Object.values(posCart);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `@media print { .no-print { display: none !important; } .print-only { display: block !important; } @page { margin: 0; size: 80mm auto; } body { background-color: white; margin: 0; } }`}} />
      
      <div className="min-h-screen bg-muted/20 p-6 md:p-12 no-print font-sans" dir={dir}>
        
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between bg-white p-6 rounded-[2rem] shadow-sm border border-border gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"/>
              <span className="text-[11px] font-bold font-mono tracking-wider text-emerald-600 uppercase">{t.posTerminal}</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">{t.mainTitle}</h1>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap shrink-0">
            <LanguageToggle />
            <button 
              onClick={() => setShowPOS(true)}
              className="bg-foreground hover:bg-foreground/90 text-white px-6 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 shadow-xl transition-transform active:scale-95 shrink-0"
            >
              <Plus size={20} className="text-primary" />
              <span>{t.directOrderBtn}</span>
            </button>
          </div>
        </header>

        {/* POS Modal Drawer */}
        {showPOS && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-5xl h-[88vh] rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-border">
              
              <div className={`flex-1 flex flex-col bg-slate-50/60 p-6 overflow-hidden order-2 ${activeLang === 'ar' ? 'md:order-1' : 'md:order-2'}`}>
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

              <div className={`w-full md:w-88 bg-white p-6 flex flex-col justify-between order-1 shadow-lg z-10 ${activeLang === 'ar' ? 'md:order-2 border-r' : 'md:order-1 border-l'}`}>
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-lg">{t.directTicket}</h3>
                    <button onClick={() => setShowPOS(false)} className="p-1.5 bg-muted rounded-full hover:bg-gray-200"><X size={18}/></button>
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">{t.selectTargetTable}</label>
                    {tables.length === 0 ? (
                      <div className="p-3 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">{t.noTables}</div>
                    ) : (
                      <select value={selectedTableId} onChange={(e) => setSelectedTableId(e.target.value)} className={`w-full p-3 bg-muted/40 border-2 rounded-xl font-bold text-sm focus:border-primary outline-none ${activeLang === 'ar' ? 'text-right' : 'text-left'}`}>
                        {tables.map(tb => <option key={tb.id} value={tb.id}>{t.tablePrefix} {tb.table_number.replace('table_', '')}</option>)}
                      </select>
                    )}
                  </div>

                  <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1 mb-4">
                    {cartItemsArray.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground text-xs font-bold border-2 border-dashed rounded-2xl">{t.clickToAdd}</div>
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
                    {isSubmittingPos ? t.sending : t.confirmSend}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Active Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white rounded-[2.5rem] border border-dashed p-10">
              <ShoppingBag className="mx-auto text-muted-foreground/30 mb-3" size={48}/>
              <p className="text-muted-foreground text-lg font-bold">{t.noOrdersTitle}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{t.noOrdersSub}</p>
            </div>
          ) : orders.map((order) => (
            <div key={order.id} className={`bg-white rounded-[2rem] p-6 shadow-sm border-2 ${order.status === 'pending' ? 'border-yellow-400' : order.status === 'accepted' ? 'border-blue-400' : 'border-green-400 animate-pulse'}`}>
              <div className="flex justify-between items-start mb-6 border-b pb-4">
                <div>
                  <h2 className="text-2xl font-extrabold">{order.tables?.table_number ? `${t.tablePrefix} ${order.tables.table_number.replace('table_', '')}` : t.directPosBadge}</h2>
                  <p className="text-xs font-bold text-muted-foreground mt-1">#{order.id.split('-')[0]}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xl font-black text-primary" dir="ltr">{formatMAD(order.total_amount)}</span>
                  <button onClick={() => handlePrintReceipt(order)} className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-xl text-sm font-bold"><Printer size={16} /> {t.printBtn}</button>
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
                    <button onClick={() => updateOrderStatus(order, 'accepted')} className="bg-foreground text-white py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 active:scale-95 transition-transform"><Check size={18} /> {t.acceptBtn}</button>
                    <button onClick={() => updateOrderStatus(order, 'rejected')} className="bg-red-50 text-red-600 py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-red-100 transition-colors"><X size={18} /> {t.rejectBtn}</button>
                  </>
                )}

                {order.status === 'accepted' && (
                  <div className="col-span-2 bg-blue-50 text-blue-700 py-4 rounded-xl font-bold flex justify-center items-center gap-2 border border-blue-200 select-none">
                    <Clock className="animate-spin text-blue-500" size={18} /> 
                    <span>{t.preparingStatus}</span>
                  </div>
                )}

                {order.status === 'ready' && (
                  <button onClick={() => updateOrderStatus(order, 'completed')} className="col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black text-base flex justify-center items-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95 transition-all">
                    <Check size={22} /> {t.completeBtn} 
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
            <h2 className="text-2xl font-extrabold mb-1">EgoCafe</h2>
            <p className="text-xs">{t.printTitle}</p>
          </div>
          <div className="mb-4 text-xs space-y-1 font-bold">
            <p>{t.tableNoLabel} {printOrder.tables?.table_number?.replace('table_', '') || t.directPosBadge}</p>
            <p>{t.orderNoLabel} #{printOrder.id.split('-')[0]}</p>
          </div>
          <div className="border-b-2 border-dashed border-gray-400 pb-4 mb-4">
            <table className="w-full text-sm">
              <tbody>
                {printOrder.items.map((item: any, i: number) => (
                  <tr key={i}>
                    <td className="py-1 font-bold">{getProductName(item)}</td>
                    <td className={`font-extrabold ${activeLang === 'ar' ? 'text-left' : 'text-right'}`}>x{item.quantity}</td>
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