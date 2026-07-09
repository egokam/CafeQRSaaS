"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "../../../lib/supabase";
import { ChefHat, CheckCircle2, Clock, Bell, Lock, AlertTriangle, Flame } from "lucide-react";
import { verifyPin, cashierUpdateOrderStatus } from "../../../actions/auth";
import { checkCafeSubscription } from "../../../actions/saas";

// 🌟 Translation System
const TRANSLATIONS: Record<string, any> = {
  en: {
    loading: "Starting Kitchen Display System...",
    notFoundTitle: "404 - Cafe Not Found",
    suspendedTitle: "Kitchen Display Suspended 🚫",
    suspendedSub: "Cafe subscription to central servers has expired.",
    sessionFullTitle: "Kitchen Station Full (Access Denied)",
    sessionFullSub1: "Sorry, this cafe is operating at the maximum allowed kitchen screens (",
    sessionFullSub2: " screens simultaneously). Please close an old screen to continue.",
    retryBtn: "Retry 🔄",
    kdsZone: "Kitchen Display (KDS)",
    enterPin: "Enter staff PIN to view orders",
    loginBtn: "Enter Kitchen",
    wrongPin: "Invalid PIN ❌",
    updateFail: "Failed to update status",
    kdsSub: "Kitchen Display System",
    prepStation: "Prep Station",
    preparingNow: "Preparing now:",
    noOrdersTitle: "No pending orders",
    noOrdersSub: "Kitchen is clear. Waiting for cashier orders",
    tablePrefix: "Table",
    directPos: "Direct (POS)",
    minsAbbr: "min",
    readyBtn: "Ready to Serve 🔔"
  },
  fr: {
    loading: "Démarrage du système de cuisine...",
    notFoundTitle: "404 - Café Introuvable",
    suspendedTitle: "Système de Cuisine Suspendu 🚫",
    suspendedSub: "L'abonnement du café aux serveurs centraux a expiré.",
    sessionFullTitle: "Station de Cuisine Pleine (Accès Refusé)",
    sessionFullSub1: "Désolé, ce café fonctionne au nombre maximum d'écrans de cuisine autorisés (",
    sessionFullSub2: " écrans simultanément). Veuillez fermer un ancien écran pour continuer.",
    retryBtn: "Réessayer 🔄",
    kdsZone: "Affichage Cuisine (KDS)",
    enterPin: "Entrez le PIN du personnel pour voir les commandes",
    loginBtn: "Entrer en Cuisine",
    wrongPin: "Code PIN invalide ❌",
    updateFail: "Échec de la mise à jour du statut",
    kdsSub: "Système d'Affichage Cuisine",
    prepStation: "Station de Prép.",
    preparingNow: "En préparation :",
    noOrdersTitle: "Aucune commande en attente",
    noOrdersSub: "Cuisine calme. En attente des commandes de la caisse",
    tablePrefix: "Table",
    directPos: "Direct (Caisse)",
    minsAbbr: "min",
    readyBtn: "Prêt à servir 🔔"
  },
  ar: {
    loading: "جاري تشغيل شاشة المطبخ...",
    notFoundTitle: "404 - المقهى غير موجود",
    suspendedTitle: "شاشة المطبخ متوقفة 🚫",
    suspendedSub: "انتهت صلاحية اشتراك المقهى في الخوادم المركزية.",
    sessionFullTitle: "محطة المطبخ ممتلئة (Access Denied)",
    sessionFullSub1: "عذراً، تعمل هذه المقهى بالحد الأقصى المسموح به من شاشات المطبخ (",
    sessionFullSub2: " شاشات في نفس الوقت). قم بإغلاق إحدى الشاشات القديمة للمتابعة.",
    retryBtn: "إعادة المحاولة 🔄",
    kdsZone: "شاشة المطبخ (KDS)",
    enterPin: "أدخل رمز الطاقم لعرض الطلبات",
    loginBtn: "دخول للمطبخ",
    wrongPin: "الرمز غير صحيح ❌",
    updateFail: "فشل تحديث الحالة",
    kdsSub: "Kitchen Display System",
    prepStation: "محطة التحضير",
    preparingNow: "قيد التحضير دابا:",
    noOrdersTitle: "لا توجد طلبات معلقة",
    noOrdersSub: "المطبخ مرتاح حالياً.. بانتظار طلبات الكاشير",
    tablePrefix: "طاولة",
    directPos: "مباشر (POS)",
    minsAbbr: "دقيقة",
    readyBtn: "جاهز للتقديم 🔔"
  }
};

const LANGUAGES = ["en", "fr", "ar"];

export default function KitchenDisplaySystem({ params }: { params: Promise<{ cafeSlug: string }> }) {
  const { cafeSlug } = use(params);

  // 🌟 Language State (Default: en)
  const [activeLang, setActiveLang] = useState("en");
  const t = TRANSLATIONS[activeLang];
  const dir = activeLang === 'ar' ? 'rtl' : 'ltr';

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  
  // 🌟 حالات الحماية والساس
  const [isSuspended, setIsSuspended] = useState(false);
  const [isSessionFull, setIsSessionFull] = useState(false); // 🔒 منع تجاوز عدد الشاشات

  const [orders, setOrders] = useState<any[]>([]);
  const [cafeId, setCafeId] = useState<string | null>(null);
  const [cafeName, setCafeName] = useState("");
  const [cafeDataObj, setCafeDataObj] = useState<any>(null); // لحفظ الحدود المسموحة

  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  const getProductName = (item: any) => {
    if (activeLang === "ar") return item.name_ar;
    if (activeLang === "fr") return item.name_fr || item.name_en || item.name_ar;
    return item.name_en || item.name_ar;
  };

  // 🌟 جلب الطلبات المقبولة فقط (التي تنتظر التحضير)
  const fetchKitchenOrders = async (cId: string) => {
    const { data } = await supabase
      .from('orders')
      .select('*, tables(table_number)')
      .eq('cafe_id', cId)
      .eq('status', 'accepted') // المطبخ يرى فقط ما قبله الكاشير!
      .order('created_at', { ascending: true }); // الأقدم أولاً لكي لا ينتظر الزبون طويلاً

    if (data) setOrders(data);
  };

  useEffect(() => {
    const sessionKey = `kitchen_auth_${cafeSlug}`;
    if (sessionStorage.getItem(sessionKey) === 'true') setIsAuthenticated(true);

    const initKitchen = async () => {
      setIsLoading(true);

      // 💀 1. نبض الـ SaaS الصامت
      const subCheck = await checkCafeSubscription(cafeSlug);
      if (!subCheck.isValid) {
        setIsSuspended(true);
        setIsLoading(false);
        return;
      }

      // جلب الاسم وحدود المطبخ من قاعدة البيانات
      const { data: cData } = await supabase
        .from('cafes')
        .select('id, name, max_kitchens')
        .eq('slug', cafeSlug)
        .single();

      if (!cData) { setIsNotFound(true); setIsLoading(false); return; }

      setCafeId(cData.id);
      setCafeName(cData.name);
      setCafeDataObj(cData);
      
      await fetchKitchenOrders(cData.id);
      setIsLoading(false);
    };

    initKitchen();
  }, [cafeSlug]);

  // 📡 البث الحي للمطبخ + النبض الصامت + رادار مراقبة عدد الشاشات (Presence)
  useEffect(() => {
    if (!isAuthenticated || !cafeDataObj) return;

    fetchKitchenOrders(cafeDataObj.id);

    // 💓 النبض الصامت لحماية الاشتراك
    const heartbeat = setInterval(async () => {
      const liveCheck = await checkCafeSubscription(cafeSlug);
      if (!liveCheck.isValid) setIsSuspended(true);
    }, 60000);

    // 1. الاستماع للطلبات الجديدة المقبولة
    const kitchenChannel = supabase.channel(`kitchen-live-${cafeDataObj.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `cafe_id=eq.${cafeDataObj.id}` }, (payload: any) => {
        fetchKitchenOrders(cafeDataObj.id);
        if (payload.new && payload.new.status === 'accepted') {
          new Audio('/bell.mp3').play().catch(() => {});
        }
      }).subscribe();

    // 2. تتبع وحصر أجهزة المطبخ الحية في الـ SaaS
    let myTabId = sessionStorage.getItem('kitchen_tab_id');
    if (!myTabId) {
      myTabId = Math.random().toString(36).substring(2, 12);
      sessionStorage.setItem('kitchen_tab_id', myTabId);
    }

    const slotChannel = supabase.channel(`kitchen_slots_${cafeDataObj.id}`, {
      config: { presence: { key: myTabId } }
    });

    slotChannel.on('presence', { event: 'sync' }, () => {
      const presenceState = slotChannel.presenceState();
      const maxAllowed = cafeDataObj.max_kitchens || 1;

      if (!presenceState[myTabId]) return; // رسالة الدخول في الطريق

      const activeSessions: { key: string, onlineAt: number }[] = [];
      Object.entries(presenceState).forEach(([key, presences]: [string, any]) => {
        if (presences.length > 0) {
          activeSessions.push({
            key: key,
            onlineAt: new Date(presences[0].online_at || Date.now()).getTime()
          });
        }
      });

      activeSessions.sort((a, b) => a.onlineAt - b.onlineAt);
      const allowedKeys = activeSessions.slice(0, maxAllowed).map(s => s.key);

      // طرد الشاشة المتطفلة الزائدة عن الحد المسموح في الباقة
      if (!allowedKeys.includes(myTabId)) {
        setIsSessionFull(true);
        slotChannel.untrack();
        sessionStorage.removeItem(`kitchen_auth_${cafeSlug}`);
        setIsAuthenticated(false);
      }
    });

    slotChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await slotChannel.track({ online_at: new Date().toISOString() });
      }
    });

    return () => {
      clearInterval(heartbeat);
      supabase.removeChannel(kitchenChannel);
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
      sessionStorage.setItem(`kitchen_auth_${cafeSlug}`, 'true');
      new Audio('/bell.mp3').play().catch(() => {});
    } else {
      setPinInput("");
      alert(t.wrongPin);
    }
  };

  const markOrderReady = async (orderId: string) => {
    const { success } = await cashierUpdateOrderStatus(orderId, 'ready');
    if (success) {
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } else {
      alert(t.updateFail);
    }
  };

  // Language Switcher Component specific to Kitchen styling
  const LanguageToggle = () => (
    <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-full w-max" dir="ltr">
      {LANGUAGES.map(lang => (
        <button
          key={lang}
          onClick={() => setActiveLang(lang)}
          className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${activeLang === lang ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-500 hover:text-white'}`}
        >
          {lang}
        </button>
      ))}
    </div>
  );

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center font-bold text-white">{t.loading}</div>;
  if (isNotFound) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-2xl font-bold">{t.notFoundTitle}</div>;

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-rose-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans" dir={dir}>
        <div className={`absolute top-6 ${activeLang === 'ar' ? 'left-6' : 'right-6'}`}><LanguageToggle /></div>
        <Lock size={64} className="text-rose-500 mb-4 animate-pulse" />
        <h1 className="text-3xl font-black mb-2">{t.suspendedTitle}</h1>
        <p className="text-rose-200/80">{t.suspendedSub}</p>
      </div>
    );
  }

  // ⛔ شاشة منع تجاوز عدد أجهزة المطبخ
  if (isSessionFull) {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans" dir={dir}>
        <div className={`absolute top-6 ${activeLang === 'ar' ? 'left-6' : 'right-6'}`}><LanguageToggle /></div>
        <Lock size={64} className="text-red-500 mb-4 animate-bounce" />
        <h1 className="text-3xl font-black mb-2 tracking-tight">{t.sessionFullTitle}</h1>
        <p className="text-stone-400 max-w-md mb-8 leading-relaxed text-sm">
          {t.sessionFullSub1}{cafeDataObj?.max_kitchens || 1}{t.sessionFullSub2}
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-white text-stone-950 px-8 py-4 rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg"
        >
          {t.retryBtn}
        </button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans" dir={dir}>
        <div className={`absolute top-6 ${activeLang === 'ar' ? 'left-6' : 'right-6'}`}><LanguageToggle /></div>
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] w-full max-w-sm text-center shadow-2xl">
          <div className="bg-amber-500/10 text-amber-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
            <ChefHat size={40} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">{t.kdsZone}</h2>
          <p className="text-slate-400 mb-8 text-xs font-bold">{t.enterPin}</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input type="password" inputMode="numeric" value={pinInput} onChange={(e) => setPinInput(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center text-3xl tracking-[0.5em] font-mono text-white focus:border-amber-500 outline-none" placeholder="••••" autoFocus dir="ltr" />
            <button type="submit" className="py-4 rounded-2xl font-black text-slate-950 bg-amber-500 hover:bg-amber-400 text-lg">{t.loginBtn}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 font-sans select-none" dir={dir}>
      
      {/* هيدر المطبخ الصارم */}
      <header className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between bg-slate-900/80 border border-slate-800 p-6 rounded-3xl gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-amber-500 text-slate-950 rounded-2xl font-black shadow-lg shadow-amber-500/10 shrink-0">
            <Flame size={28} />
          </div>
          <div>
            <span className="text-[10px] font-mono text-amber-400 tracking-widest block uppercase">{t.kdsSub}</span>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">{cafeName} - {t.prepStation}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap shrink-0">
          <LanguageToggle />
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-5 py-2.5 rounded-2xl">
            <Clock className="text-amber-400 animate-spin" size={18} />
            <span className="font-mono font-bold text-sm">{t.preparingNow} <strong className="text-amber-400 text-lg mx-1">{orders.length}</strong></span>
          </div>
        </div>
      </header>

      {/* شبكة بطاقات الطلبات العملاقة */}
      <main>
        {orders.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-slate-800 rounded-[3rem] bg-slate-900/20">
            <CheckCircle2 className="mx-auto text-emerald-500/40 mb-4" size={64} />
            <h2 className="text-2xl font-black text-slate-400">{t.noOrdersTitle}</h2>
            <p className="text-slate-600 text-sm mt-1">{t.noOrdersSub}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {orders.map((ord: any) => {
              const waitingMinutes = Math.floor((Date.now() - new Date(ord.created_at).getTime()) / 60000);
              const isLate = waitingMinutes >= 10; 

              return (
                <div key={ord.id} className={`bg-slate-900 border-2 rounded-[2.5rem] p-6 flex flex-col justify-between shadow-xl transition-all ${isLate ? 'border-rose-500 bg-rose-950/10 animate-pulse' : 'border-slate-800 hover:border-slate-700'}`}>
                  
                  <div>
                    <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-800">
                      <div>
                        <span className="text-xs font-mono text-slate-500 block">#{ord.id.split('-')[0]}</span>
                        <h3 className="text-2xl font-black text-white mt-0.5">
                          {ord.tables?.table_number ? `${t.tablePrefix} ${ord.tables.table_number.replace('table_', '')}` : t.directPos}
                        </h3>
                      </div>
                      <span className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1 ${isLate ? 'bg-rose-500 text-white border-rose-400' : 'bg-slate-950 text-amber-400 border-slate-800'}`} dir="ltr">
                        ⏱️ {waitingMinutes} {t.minsAbbr}
                      </span>
                    </div>

                    <div className="space-y-3 my-6 max-h-[35vh] overflow-y-auto pr-1">
                      {ord.items.map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 text-base font-bold">
                          <span className="text-slate-200 truncate pr-2">{getProductName(item)}</span>
                          <span className="bg-amber-500 text-slate-950 font-black px-3 py-1 rounded-xl text-lg shrink-0" dir="ltr">
                            x{item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => markOrderReady(ord.id)}
                    className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-lg rounded-2xl shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 transition-all mt-4"
                  >
                    <CheckCircle2 size={24} />
                    <span>{t.readyBtn}</span>
                  </button>

                </div>
              );
            })}
          </div>
        )}
      </main>

    </div>
  );
}