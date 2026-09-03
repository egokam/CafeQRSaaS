"use client";

import { useState, useEffect, use, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import * as Icons from "lucide-react";
import { Check, X, Clock, ChefHat, AlertOctagon, Printer, Lock, LogOut, AlertTriangle, Plus, UtensilsCrossed, ShoppingBag, Ban, Hourglass, Loader2, Zap, LayoutGrid } from "lucide-react";
import {
  cashierMarkOutOfStock,
  cashierUpdateOrderStatus,
  createManualCashierOrder,
  getCashierActiveOrders,
  getCashierCafeBySlug,
  getCashierDeviceStatus,
  getCashierWorkspace,
  hasCashierCafeAccess,
  hasCashierEmployeeAccess,
  loginCashierWithDevice,
  pingCashierHeartbeat,
} from "../../../actions/auth";
import {
  logoutCashierShift,
  verifyCashierPin,
} from "../../../actions/employees";
import { checkCafeSubscription } from "../../../actions/saas";

declare global {
  interface Window {
    electron?: {
      printReceipt: (html: string) => Promise<unknown>;
    };
  }
}

const TRANSLATIONS: Record<string, any> = {
  en: {
    loading: "Loading...", notFoundTitle: "404 - Cafe Not Found", suspendedTitle: "Cashier System Suspended 🚫", suspendedSub: "The cafe's subscription has expired. Please renew to resume operations.", sessionFullTitle: "Session Full", sessionFullSub: "This cafe has reached its maximum allowed cashier screens.", pendingTitle: "Device Pending Approval ⏳", pendingSub: "Your device has been registered. Please wait for the admin to approve it.", blockedTitle: "Device Blocked ⛔", blockedSub: "This device is no longer authorized to access the cashier system.", retryBtn: "Retry 🔄", cashierZone: "Cashier Zone", enterPin: "Enter PIN to receive orders", loginBtn: "Login", tempBan: "Temporarily blocked. Please wait a minute.", wrongPin: "Invalid PIN ❌", updateError: "Error updating status.", confirmDisable: "Confirm out of stock for", disabledSuccess: "marked out of stock.", manualPosFail: "Failed to create manual order.", posTerminal: "Live POS Terminal", mainTitle: "Cashier & Order Management 💳", directOrderBtn: "Direct POS Order", quickMenu: "Quick Menu", all: "All", directTicket: "Direct Order Ticket", selectTargetTable: "Select Target Table:", noTables: "No registered tables!", tablePrefix: "Table", clickToAdd: "Click on a product to add it to the ticket", total: "Total:", sending: "Sending...", confirmSend: "Confirm & Send to Kitchen ⚡", noOrdersTitle: "No active orders currently.", noOrdersSub: "Scan QR or click [+ Direct POS Order] above to create a new order", directPosBadge: "Direct (POS)", printBtn: "Print", acceptBtn: "Accept", rejectBtn: "Reject", orderReadyBtn: "Order Ready 🔔", completeBtn: "Force Complete (Fallback)", printTitle: "Kitchen Receipt", orderNoLabel: "Order No:", tableNoLabel: "Table No:"
  },
  fr: {
    loading: "Chargement...", notFoundTitle: "404 - Café Introuvable", suspendedTitle: "Système de Caisse Suspendu 🚫", suspendedSub: "L'abonnement du café a expiré. Veuillez renouveler pour reprendre les opérations.", sessionFullTitle: "Session Pleine", sessionFullSub: "Ce café a atteint son nombre maximum d'écrans de caisse.", pendingTitle: "En Attente d'Approbation ⏳", pendingSub: "Votre appareil est enregistré. Veuillez attendre l'approbation de l'administrateur.", blockedTitle: "Appareil Bloqué ⛔", blockedSub: "Cet appareil n'est plus autorisé à accéder au système de caisse.", retryBtn: "Réessayer 🔄", cashierZone: "Espace Caisse", enterPin: "Entrez le code PIN pour recevoir les commandes", loginBtn: "Connexion", tempBan: "Bloqué temporairement. Veuillez patienter une minute.", wrongPin: "Code PIN invalide ❌", updateError: "Erreur de mise à jour.", confirmDisable: "Confirmer la rupture de stock pour", disabledSuccess: "marqué en rupture de stock.", manualPosFail: "Échec de la création de la commande manuelle.", posTerminal: "Terminal de Caisse", mainTitle: "Caisse & Gestion des Commandes 💳", directOrderBtn: "Nouvelle Commande (POS)", quickMenu: "Menu Rapide", all: "Tout", directTicket: "Ticket de Commande", selectTargetTable: "Sélectionner la table cible :", noTables: "Aucune table enregistrée !", tablePrefix: "Table", clickToAdd: "Cliquez sur un produit pour l'ajouter au ticket", total: "Total :", sending: "Envoi...", confirmSend: "Confirmer & Envoyer en Cuisine ⚡", noOrdersTitle: "Aucune commande active pour le moment.", noOrdersSub: "Scannez le QR ou cliquez sur [+ Nouvelle Commande] pour créer une commande", directPosBadge: "Direct (Caisse)", printBtn: "Imprimer", acceptBtn: "Accepter", rejectBtn: "Refuser", orderReadyBtn: "Commande Prête 🔔", completeBtn: "Clôturer (Manuel)", printTitle: "Ticket Cuisine", orderNoLabel: "N° Cmd :", tableNoLabel: "N° Table :"
  },
  ar: {
    loading: "جاري التحميل...", notFoundTitle: "404 - المقهى غير موجود", suspendedTitle: "نظام الكاشير متوقف مؤقتاً 🚫", suspendedSub: "انتهت صلاحية اشتراك المقهى. يرجى التجديد لاستئناف العمل.", sessionFullTitle: "الجلسة ممتلئة", sessionFullSub: "وصل هذا المقهى للحد الأقصى من شاشات الكاشير المسموحة.", pendingTitle: "الجهاز قيد المراجعة ⏳", pendingSub: "تم إرسال طلب تسجيل هذا الجهاز إلى الإدارة. يرجى انتظار الموافقة.", blockedTitle: "تم حظر هذا الجهاز ⛔", blockedSub: "لا يمكنك استخدام نظام الكاشير من هذا الجهاز بعد الآن.", retryBtn: "إعادة المحاولة 🔄", cashierZone: "منطقة الكاشير", enterPin: "أدخل الرمز السري لاستقبال الطلبات", loginBtn: "دخول", tempBan: "تم حظرك مؤقتاً. يرجى الانتظار دقيقة.", wrongPin: "الرمز غير صحيح ❌", updateError: "خطأ أثناء التحديث.", confirmDisable: "تأكيد إيقاف", disabledSuccess: "تم إيقاف", manualPosFail: "فشل إنشاء الطلب اليدوي.", posTerminal: "Live POS Terminal", mainTitle: "شاشة الكاشير وإدارة الطلبات 💳", directOrderBtn: "تسجيل طلب مباشر (POS)", quickMenu: "المنيو السريع", all: "الجميع", directTicket: "تذكرة الطلب المباشر", selectTargetTable: "اختر الطاولة المستهدفة:", noTables: "لا توجد طاولات مسجلة!", tablePrefix: "طاولة", clickToAdd: "اضغط على منتج لإضافته للتذكرة", total: "الإجمالي:", sending: "جاري الإرسال...", confirmSend: "تأكيد وإرسال للمطبخ ⚡", noOrdersTitle: "لا توجد طلبات نشطة حالياً.", noOrdersSub: "امسح الـ QR أو اضغط على [+ تسجيل طلب مباشر] فوق لإنشاء طلب جديد", directPosBadge: "مباشر (POS)", printBtn: "طباعة", acceptBtn: "قبول", rejectBtn: "رفض", orderReadyBtn: "الطلب جاهز 🔔", completeBtn: "إنهاء يدوي (احتياطي)", printTitle: "تذكرة المطبخ", orderNoLabel: "رقم الطلب:", tableNoLabel: "رقم الطاولة:"
  }
};

const formatMAD = (price: number) => {
  return `${Number(price).toFixed(2)} MAD`;
};

const LANGUAGES = ["en", "fr", "ar"];

const createDeviceId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `dev_${crypto.randomUUID()}`;
  }

  return `dev_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
};

export default function CashierDashboard({ params }: { params: Promise<{ cafeSlug: string }> }) {
  const { cafeSlug } = use(params);

  const [activeLang, setActiveLang] = useState("en");
  const t = TRANSLATIONS[activeLang];
  const dir = activeLang === 'ar' ? 'rtl' : 'ltr';

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTerminalAuthorized, setIsTerminalAuthorized] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [employeeUsername, setEmployeeUsername] = useState("");
  const [employeePin, setEmployeePin] = useState("");
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const [deviceId, setDeviceId] = useState("");
  const [posDeviceId, setPosDeviceId] = useState<string | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<'none' | 'pending' | 'blocked' | 'approved'>('none');
  const [isSessionFull, setIsSessionFull] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const knownOrderIds = useRef<Set<string>>(new Set()); 

  const [cafeId, setCafeId] = useState<string | null>(null);
  const [cafeDataObj, setCafeDataObj] = useState<any>(null);

  const [printOrder, setPrintOrder] = useState<any>(null);
  const printReceiptRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]); 
  const [tables, setTables] = useState<any[]>([]);
  const [showPOS, setShowPOS] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [posCart, setPosCart] = useState<{ [key: string]: any }>({});
  const [posCategory, setPosCategory] = useState<string>("ALL");
  const [isSubmittingPos, setIsSubmittingPos] = useState(false);
  const [modifierProduct, setModifierProduct] = useState<any | null>(null);
  const [posModifierSelections, setPosModifierSelections] = useState<Record<string, number>>({});
  const [modifierSelectionError, setModifierSelectionError] = useState<string | null>(null);

  const lockCopy = activeLang === "ar"
    ? {
        terminalTitle: "تهيئة جهاز الكاشير", terminalSub: "أدخل رمز الجهاز لتسجيل هذا المتصفح. ستحتاج موافقة الإدارة في أول مرة.",
        employeeTitle: "تسجيل دخول الموظف", employeeSub: "أدخل اسم المستخدم ورمز PIN لبدء ورديتك.",
        username: "اسم المستخدم", terminalPin: "رمز الجهاز", lockShift: "قفل الوردية",
      }
    : activeLang === "fr"
      ? {
          terminalTitle: "Configuration du terminal", terminalSub: "Entrez le PIN du terminal pour enregistrer ce navigateur. La première connexion doit être approuvée.",
          employeeTitle: "Connexion employé", employeeSub: "Entrez votre identifiant et PIN pour commencer votre quart.",
          username: "Identifiant", terminalPin: "PIN du terminal", lockShift: "Verrouiller le quart",
        }
      : {
          terminalTitle: "Terminal setup", terminalSub: "Enter the terminal PIN to register this browser. The first connection needs admin approval.",
          employeeTitle: "Employee sign in", employeeSub: "Enter your username and PIN to begin your shift.",
          username: "Username", terminalPin: "Terminal PIN", lockShift: "Lock shift",
        };

  // 🌟 استخراج البيانات والتحليل الذكي لاسم المنتج والإضافات بناءً على اللغة المطلوبة
  const parseProductData = (item: any, lang: string) => {
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

  const fetchOrders = async (cId: string) => {
    const result = await getCashierActiveOrders(cId);

    if (result.success) {
      const data = result.orders;
      let hasNewOrder = false;
      
      setOrders(data);

      data.forEach((o: any) => {
        if (!knownOrderIds.current.has(o.id) && o.status === 'pending') {
          hasNewOrder = true;
        }
        knownOrderIds.current.add(o.id);
      });

      if (hasNewOrder) {
        new Audio('/bell.mp3').play().catch(() => { });
      }
    } else if (result.error === "UNAUTHORIZED_CASHIER_EMPLOYEE") {
      // The admin may have deactivated this person from another screen. End
      // the local shift as soon as the next protected poll detects it.
      void logoutCashierShift(cId);
      setIsAuthenticated(false);
      setEmployeeId(null);
      setEmployeeName("");
      setPosDeviceId(null);
    }
  };

  const fetchCategories = async (cId: string) => {
    const { data } = await supabase.from('menu_categories').select('*').eq('cafe_id', cId).order('created_at', { ascending: true });
    if (data) setCategories(data);
  };

  const loadEmployeeWorkspace = async (cId: string) => {
    const workspace = await getCashierWorkspace(cId);
    if (!workspace.success) return false;

    setProducts(workspace.products);
    setTables(workspace.tables);
    setOrders(workspace.orders);
    workspace.orders.forEach((o: any) => knownOrderIds.current.add(o.id));
    if (workspace.tables.length > 0) setSelectedTableId(workspace.tables[0].id);
    await fetchCategories(cId);
    return true;
  };

  useEffect(() => {
    let storedId = localStorage.getItem(`cafeqr_device_${cafeSlug}`);

    if (!storedId || !storedId.startsWith('dev_')) {
      storedId = createDeviceId();
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

      try {
        const deviceResult = await getCashierDeviceStatus(cafeSlug, storedId);

        if (deviceResult.success) {
          setDeviceStatus(deviceResult.status);

          if (deviceResult.status === 'approved' && await hasCashierCafeAccess(cId)) {
            setIsTerminalAuthorized(true);
            const employeeSession = await hasCashierEmployeeAccess(cId);
            if (employeeSession.success && employeeSession.employee) {
              const loaded = await loadEmployeeWorkspace(cId);
              if (loaded) {
                setEmployeeId(employeeSession.employee.id);
                setEmployeeName(employeeSession.employee.name);
                setPosDeviceId(employeeSession.employee.posDeviceId);
                setIsAuthenticated(true);
              }
            }
          }
        } else {
          console.error("Unable to read cashier device status:", deviceResult.error);
        }
      } catch (err) {
        console.error("Error verifying device session:", err);
      }

      setIsLoading(false);
    };
    initCafe();
  }, [cafeSlug]);

  // Approval happens while the cashier is unauthenticated, so database
  // Realtime cannot be the source of truth here. Poll the scoped server action
  // instead; it works with the hardened RLS policy and also catches a later
  // block/revocation of an active device.
  useEffect(() => {
    if (!deviceId || (!isTerminalAuthorized && deviceStatus !== 'pending')) return;

    let cancelled = false;
    const refreshDeviceStatus = async () => {
      const result = await getCashierDeviceStatus(cafeSlug, deviceId);
      if (cancelled || !result.success) return;

      if (result.status === 'approved') {
        setDeviceStatus('approved');
        return;
      }

      if (result.status === 'pending' || result.status === 'blocked' || result.status === 'none') {
        setDeviceStatus(result.status);
        setIsTerminalAuthorized(false);
        setIsAuthenticated(false);
        setEmployeeId(null);
        setEmployeeName("");
        setPosDeviceId(null);
      }
    };

    void refreshDeviceStatus();
    const interval = window.setInterval(refreshDeviceStatus, isAuthenticated ? 10_000 : 5_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [cafeSlug, deviceId, deviceStatus, isAuthenticated, isTerminalAuthorized]);

  useEffect(() => {
    if (!isAuthenticated || !cafeId) return;

    fetchOrders(cafeId);
    const ordersInterval = setInterval(() => {
      fetchOrders(cafeId);
    }, 5000);

    return () => clearInterval(ordersInterval);
  }, [isAuthenticated, cafeId]);

  // The database uses this heartbeat to route new orders and to reclaim work
  // from a terminal that has gone offline. Polling remains the authoritative
  // delivery fallback if a browser's Realtime subscription is unavailable.
  useEffect(() => {
    if (!isAuthenticated || !posDeviceId) return;

    let cancelled = false;
    const heartbeat = async () => {
      const result = await pingCashierHeartbeat(posDeviceId);
      if (!cancelled && !result.success) {
        console.warn("Cashier heartbeat failed", result.error);
      }
    };

    void heartbeat();
    const interval = window.setInterval(() => { void heartbeat(); }, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isAuthenticated, posDeviceId]);

  // Listen only to this device's routed orders and the NULL fallback bucket.
  // Event data is never rendered directly: the server action applies the
  // session-bound device filter again before replacing local state.
  useEffect(() => {
    if (!isAuthenticated || !cafeId || !posDeviceId) return;

    let scheduled = false;
    const refreshRoutedOrders = () => {
      if (scheduled) return;
      scheduled = true;
      window.setTimeout(() => {
        scheduled = false;
        void fetchOrders(cafeId);
      }, 100);
    };

    const assignedOrdersChannel = supabase
      .channel(`cashier_orders_${cafeId}_${posDeviceId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `assigned_device_id=eq.${posDeviceId}`,
      }, refreshRoutedOrders)
      .subscribe();
    const fallbackOrdersChannel = supabase
      .channel(`cashier_unassigned_orders_${cafeId}_${posDeviceId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "orders",
        filter: "assigned_device_id=is.null",
      }, refreshRoutedOrders)
      .subscribe();

    return () => {
      supabase.removeChannel(assignedOrdersChannel);
      supabase.removeChannel(fallbackOrdersChannel);
    };
  }, [isAuthenticated, cafeId, posDeviceId]);

  useEffect(() => {
    if (!isAuthenticated || !cafeId || !deviceId) return;

    const slotChannel = supabase.channel(`cashier_slots_${cafeId}`, { config: { presence: { key: deviceId } } });
    let shiftClosedForCapacity = false;

    slotChannel.on('presence', { event: 'sync' }, () => {
      const presenceState = slotChannel.presenceState();
      const maxAllowed = Number(cafeDataObj?.max_cashiers) || 1;
      const activeSessions: { key: string, onlineAt: number }[] = [];
      Object.entries(presenceState).forEach(([key, presences]: [string, any]) => {
        if (key.startsWith('dev_') && presences.length > 0 && presences[0].online_at) {
          activeSessions.push({ key, onlineAt: new Date(presences[0].online_at).getTime() });
        }
      });

      // Phoenix emits an initial empty sync before this terminal's `track`
      // message is reflected in the shared state. An empty (or incomplete)
      // state is not evidence that this terminal exceeded the cashier limit.
      // Wait until our own presence is observable before enforcing capacity.
      if (!activeSessions.some((session) => session.key === deviceId)) return;

      activeSessions.sort((a, b) => a.onlineAt - b.onlineAt);
      const allowedKeys = activeSessions.slice(0, maxAllowed).map(s => s.key);
      if (!allowedKeys.includes(deviceId) && !shiftClosedForCapacity) {
        shiftClosedForCapacity = true;
        setIsSessionFull(true);
        setIsAuthenticated(false);
        setEmployeeId(null);
        setEmployeeName("");
        setPosDeviceId(null);
        void logoutCashierShift(cafeId);
      }
    });

    slotChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') await slotChannel.track({ online_at: new Date().toISOString() });
    });

    return () => {
      supabase.removeChannel(slotChannel);
    };
  }, [isAuthenticated, cafeId, deviceId, cafeDataObj?.max_cashiers]);


  const handleTerminalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || !cafeId || !deviceId) return;

    setIsChecking(true);
    const deviceName = `${navigator.platform || 'Unknown'} - ${navigator.userAgent.split(' ')[0] || 'Browser'}`;
    const res = await loginCashierWithDevice(cafeSlug, pinInput, deviceId, deviceName);
    setIsChecking(false);

    if (res.success) {
      setIsTerminalAuthorized(true);
      setDeviceStatus('approved');
      setAttempts(0);
      setPinInput("");
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

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || !cafeId || !isTerminalAuthorized) return;

    setIsChecking(true);
    const result = await verifyCashierPin(cafeId, employeeUsername, employeePin);
    if (!result.success || !result.employee) {
      setIsChecking(false);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setEmployeePin("");
      if (newAttempts >= 5) {
        setIsLocked(true);
        alert(t.tempBan);
        setTimeout(() => { setIsLocked(false); setAttempts(0); }, 60000);
      } else {
        alert(result.error || t.wrongPin);
      }
      return;
    }

    const loaded = await loadEmployeeWorkspace(cafeId);
    setIsChecking(false);
    if (!loaded) {
      await logoutCashierShift(cafeId);
      alert(t.updateError);
      return;
    }

    setEmployeeId(result.employee.id);
    setEmployeeName(result.employee.name);
    setPosDeviceId(result.posDeviceId);
    setEmployeePin("");
    setAttempts(0);
    setIsAuthenticated(true);
  };

  const lockShift = async () => {
    if (cafeId) await logoutCashierShift(cafeId);
    setIsAuthenticated(false);
    setEmployeeId(null);
    setEmployeeName("");
    setPosDeviceId(null);
    setEmployeePin("");
    setShowPOS(false);
    setPosCart({});
  };

  const handlePrintReceipt = (order: any) => {
    setPrintOrder(order);
    window.setTimeout(() => {
      if (window.electron) {
        const receiptHtml = printReceiptRef.current?.outerHTML;

        if (!receiptHtml) {
          console.error("Receipt HTML was not rendered before printing.");
          return;
        }

        const printableReceipt = `<!doctype html>
          <html>
            <head>
              <meta charset="utf-8" />
              <style>
                @page { margin: 0; size: 80mm auto; }
                html, body { margin: 0; background: #fff; color: #000; }
                .print-only, .hidden { display: block !important; }
                .print-only { box-sizing: border-box; width: 80mm; max-width: 80mm; margin: 0 auto; padding: 4mm; font-family: monospace; font-size: 12px; }
                .text-center { text-align: center; }
                .text-left { text-align: left; }
                .text-right { text-align: right; }
                .font-bold { font-weight: 700; }
                .font-extrabold { font-weight: 800; }
                table { width: 100%; border-collapse: collapse; }
                td { vertical-align: top; }
              </style>
            </head>
            <body>${receiptHtml}</body>
          </html>`;

        void window.electron.printReceipt(printableReceipt).catch((error) => {
          console.error("Unable to print receipt:", error);
        });
        return;
      }

      window.print();
    }, 150);
  };

  const updateOrderStatus = async (order: any, newStatus: string) => {
    if (newStatus === 'completed' || newStatus === 'rejected') {
      setOrders(prev => prev.filter(o => o.id !== order.id));
    } else {
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
    }

    const { success } = await cashierUpdateOrderStatus(order.id, newStatus);
    
    if (!success) {
      if (cafeId) fetchOrders(cafeId);
      alert(t.updateError);
      return;
    }

    if (newStatus === 'accepted') {
      handlePrintReceipt(order);
    }
  };

  const markOutOfStock = async (productId: string, productName: string) => {
    if (!confirm(`${t.confirmDisable} "${productName}"?`)) return;
    const { success } = await cashierMarkOutOfStock(productId);
    if (success) alert(`"${productName}" ${t.disabledSuccess}`);
  };

  const modifierOptions = (group: any) => group?.modifier_options || group?.options || [];

  const modifierName = (option: any, lang: string) => {
    if (lang === "ar") return option.name_ar || option.name_en || option.name_fr || "";
    if (lang === "fr") return option.name_fr || option.name_en || option.name_ar || "";
    return option.name_en || option.name_ar || option.name_fr || "";
  };

  const selectedCountForGroup = (group: any, selections: Record<string, number>) => {
    const selected = modifierOptions(group).map((option: any) => Number(selections[option.id] || 0));
    return group.type === "incremental"
      ? selected.reduce((sum: number, quantity: number) => sum + quantity, 0)
      : selected.filter(Boolean).length;
  };

  const validatePosModifierSelections = (product: any, selections: Record<string, number>) => {
    for (const group of product.modifier_groups || []) {
      const selectedCount = selectedCountForGroup(group, selections);
      const min = Math.max(0, Number(group.min_selections || 0));
      const max = Math.max(min, Number(group.max_selections || 0));
      if (selectedCount < min || selectedCount > max) {
        const name = activeLang === "ar"
          ? group.name_ar || group.name_en
          : activeLang === "fr"
            ? group.name_fr || group.name_en || group.name_ar
            : group.name_en || group.name_ar || group.name_fr;
        return activeLang === "ar"
          ? `اختر من ${min} إلى ${max} خيارات في «${name}».`
          : `Select between ${min} and ${max} options for “${name}”.`;
      }
      if ((group.type === "single_choice" || group.type === "slider") && selectedCount > 1) {
        return activeLang === "ar" ? "يسمح باختيار واحد فقط في هذه المجموعة." : "Only one option is allowed in this group.";
      }
    }
    return null;
  };

  const addProductToPos = (product: any, selections: Record<string, number> = {}) => {
    const selectedEntries = Object.entries(selections)
      .filter(([, quantity]) => Number(quantity) > 0)
      .sort(([leftId], [rightId]) => leftId.localeCompare(rightId));
    const selectionsHash = selectedEntries.map(([optionId, quantity]) => `${optionId}:${quantity}`).join("-");
    const cartId = selectionsHash ? `${product.id}-${selectionsHash}` : product.id;
    const allOptions = (product.modifier_groups || []).flatMap((group: any) => modifierOptions(group));
    const selectedOptions = selectedEntries
      .map(([optionId, quantity]) => ({ option: allOptions.find((option: any) => option.id === optionId), quantity: Number(quantity) }))
      .filter((selection): selection is { option: any; quantity: number } => Boolean(selection.option));
    const extrasTotal = selectedOptions.reduce(
      (sum, { option, quantity }) => sum + Number(option.price_adjustment || 0) * quantity,
      0
    );
    const modifierText = (lang: string) => selectedOptions
      .map(({ option, quantity }) => `${modifierName(option, lang)}${quantity > 1 ? ` (x${quantity})` : ""}`)
      .filter(Boolean)
      .join(lang === "ar" ? "، " : ", ");
    const nameWithModifiers = (baseName: string | null | undefined, lang: string) => {
      const selectedText = modifierText(lang);
      return selectedText ? `${baseName || ""} (+ ${selectedText})` : baseName || "";
    };

    setPosCart((previous) => {
      const current = previous[cartId];
      if (current) return { ...previous, [cartId]: { ...current, quantity: current.quantity + 1 } };
      return {
        ...previous,
        [cartId]: {
          id: cartId,
          product_id: product.id,
          name_ar: nameWithModifiers(product.name_ar || product.name_en || product.name_fr, "ar"),
          name_en: nameWithModifiers(product.name_en || product.name_ar || product.name_fr, "en"),
          name_fr: nameWithModifiers(product.name_fr || product.name_en || product.name_ar, "fr"),
          price: Number(product.price) + extrasTotal,
          quantity: 1,
          modifiers: Object.fromEntries(selectedEntries),
        },
      };
    });
  };

  const addToPos = (product: any) => {
    const groups = product.modifier_groups || [];
    if (groups.length > 0) {
      setModifierProduct(product);
      setPosModifierSelections({});
      setModifierSelectionError(null);
      return;
    }
    addProductToPos(product);
  };

  const chooseSingleModifier = (group: any, optionId: string) => {
    setPosModifierSelections((previous) => {
      const next = { ...previous };
      modifierOptions(group).forEach((option: any) => delete next[option.id]);
      next[optionId] = 1;
      return next;
    });
    setModifierSelectionError(null);
  };

  const toggleMultipleModifier = (group: any, optionId: string) => {
    setPosModifierSelections((previous) => {
      const next = { ...previous };
      if (next[optionId]) {
        delete next[optionId];
        return next;
      }
      if (selectedCountForGroup(group, previous) < Number(group.max_selections || 0)) next[optionId] = 1;
      return next;
    });
    setModifierSelectionError(null);
  };

  const changeIncrementalModifier = (group: any, optionId: string, delta: number) => {
    setPosModifierSelections((previous) => {
      const next = { ...previous };
      const current = Number(next[optionId] || 0);
      if (delta > 0 && selectedCountForGroup(group, previous) >= Number(group.max_selections || 0)) return next;
      if (current + delta <= 0) delete next[optionId];
      else next[optionId] = current + delta;
      return next;
    });
    setModifierSelectionError(null);
  };

  const confirmPosModifiers = () => {
    if (!modifierProduct) return;
    const error = validatePosModifierSelections(modifierProduct, posModifierSelections);
    if (error) {
      setModifierSelectionError(error);
      return;
    }
    addProductToPos(modifierProduct, posModifierSelections);
    setModifierProduct(null);
    setPosModifierSelections({});
  };

  const incrementPosCart = (cartId: string) => {
    setPosCart((previous) => {
      const current = previous[cartId];
      return current ? { ...previous, [cartId]: { ...current, quantity: current.quantity + 1 } } : previous;
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

  if (isLoading) return <div className="min-h-screen bg-muted/20 flex items-center justify-center"><div className="w-12 h-12 border-4 border-foreground border-t-transparent rounded-full animate-spin" /></div>;

  if (isNotFound) return <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-6 text-center" dir={dir}><AlertTriangle className="w-16 h-16 text-red-500 mb-4" /><h1 className="text-3xl font-bold">{t.notFoundTitle}</h1></div>;

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-rose-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans" dir={dir}>
        <Lock size={64} className="text-rose-500 mb-4 animate-pulse" />
        <h1 className="text-3xl font-black mb-2">{t.suspendedTitle}</h1>
        <p className="text-rose-200/80 max-w-md text-sm">{t.suspendedSub}</p>
      </div>
    );
  }

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
    const isEmployeeLock = isTerminalAuthorized && deviceStatus === 'approved';
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-6" dir={dir}>
        <div className={`absolute top-6 ${activeLang === 'ar' ? 'left-6' : 'right-6'}`}><LanguageToggle /></div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border w-full max-w-sm text-center">
          <div className="bg-foreground w-20 h-20 rounded-full flex items-center justify-center text-white mx-auto mb-6"><Lock size={36} /></div>
          <h2 className="text-2xl font-extrabold mb-2">{isEmployeeLock ? lockCopy.employeeTitle : lockCopy.terminalTitle}</h2>
          <p className="text-muted-foreground mb-8 text-sm font-bold">{isEmployeeLock ? lockCopy.employeeSub : lockCopy.terminalSub}</p>
          <form onSubmit={isEmployeeLock ? handleEmployeeLogin : handleTerminalLogin} className="flex flex-col gap-4">
            {isEmployeeLock && (
              <input type="text" value={employeeUsername} onChange={(e) => setEmployeeUsername(e.target.value)} autoComplete="username" autoCapitalize="none" maxLength={50} required className="border-2 rounded-2xl p-4 text-center font-bold outline-none" placeholder={lockCopy.username} autoFocus disabled={isChecking} />
            )}
            <input type="password" inputMode="numeric" autoComplete="current-password" value={isEmployeeLock ? employeePin : pinInput} onChange={(e) => isEmployeeLock ? setEmployeePin(e.target.value.replace(/\D/g, "")) : setPinInput(e.target.value.replace(/\D/g, ""))} className="border-2 rounded-2xl p-4 text-center text-3xl tracking-[0.5em] font-mono outline-none" placeholder="••••" autoFocus={!isEmployeeLock} required disabled={isChecking} />
            <button disabled={isChecking} type="submit" className="py-4 rounded-2xl font-bold text-lg text-white bg-foreground hover:opacity-90 disabled:opacity-50">
              {isChecking ? <Loader2 className="animate-spin mx-auto" size={24} /> : t.loginBtn}
            </button>
          </form>
          {!isEmployeeLock && <p className="mt-4 text-[11px] text-muted-foreground">{lockCopy.terminalPin}</p>}
        </div>
      </div>
    );
  }

  const cartItemsArray = Object.values(posCart);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `@media print { .no-print { display: none !important; } .print-only { display: block !important; } @page { margin: 0; size: 80mm auto; } body { background-color: white; margin: 0; } }` }} />

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
            <LanguageToggle />
            <button
              onClick={() => void lockShift()}
              className="border border-border hover:bg-muted px-4 py-3 rounded-2xl font-bold text-sm flex items-center gap-2"
              title={employeeId || undefined}
            >
              <LogOut size={17} /> {lockCopy.lockShift}{employeeName ? ` · ${employeeName}` : ""}
            </button>
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

              <div className={`flex-1 flex flex-col bg-slate-50/60 p-4 sm:p-6 overflow-hidden order-2 ${activeLang === 'ar' ? 'md:order-1' : 'md:order-2'}`}>
                <div className="flex items-center justify-between pb-4 mb-4 border-b">
                  <h3 className="font-black text-xl flex items-center gap-2"><UtensilsCrossed className="text-primary" size={22} /> {t.quickMenu}</h3>
                  
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    <button 
                      onClick={() => setPosCategory('ALL')} 
                      className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${posCategory === 'ALL' ? 'bg-foreground text-white shadow-md' : 'bg-white text-muted-foreground border hover:bg-muted'}`}
                    >
                      <LayoutGrid size={16} className={posCategory === 'ALL' ? "text-primary" : "text-muted-foreground"} /> {t.all}
                    </button>
                    {categories.map(cat => {
                      const IconComponent = (Icons as any)[cat.icon || 'Coffee'] || Icons.Coffee;
                      const catName = activeLang === 'ar' ? cat.name_ar : activeLang === 'fr' ? cat.name_fr : cat.name_en;
                      return (
                        <button 
                          key={cat.id} 
                          onClick={() => setPosCategory(cat.id)} 
                          className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${posCategory === cat.id ? 'bg-foreground text-white shadow-md' : 'bg-white text-muted-foreground border hover:bg-muted'}`}
                        >
                          <IconComponent size={16} className={posCategory === cat.id ? "text-primary" : "text-muted-foreground"} />
                          {catName}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 pr-2 custom-scrollbar content-start auto-rows-max">
                  {products.filter(p => posCategory === 'ALL' || p.category_id === posCategory).map(p => {
                    const { baseName } = parseProductData(p, activeLang);
                    return (
                      <div 
                        key={p.id} 
                        onClick={() => addToPos(p)} 
                        className="bg-white rounded-2xl border border-border overflow-hidden hover:border-primary hover:shadow-md transition-all cursor-pointer flex flex-col group active:scale-95 aspect-square"
                      >
                        <div className="relative h-[65%] w-full bg-muted overflow-hidden shrink-0">
                          <img src={p.image_url} alt={baseName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-primary text-white rounded-full p-2 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform"><Plus size={20} /></div>
                          </div>
                        </div>
                        <div className="h-[35%] p-2 flex flex-col items-center justify-center text-center shrink-0">
                          <h4 className="font-bold text-[10px] sm:text-xs line-clamp-1 w-full leading-tight">{baseName}</h4>
                          <span className="font-black text-primary text-[11px] sm:text-sm mt-0.5 block tracking-tight" dir="ltr">{formatMAD(p.price)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className={`w-full md:w-[400px] lg:w-[450px] bg-white p-6 flex flex-col justify-between order-1 shadow-2xl z-10 ${activeLang === 'ar' ? 'md:order-2 border-r' : 'md:order-1 border-l'}`}>
                <div className="flex flex-col h-full max-h-full overflow-hidden">
                  <div className="flex justify-between items-center mb-6 shrink-0">
                    <h3 className="font-black text-2xl">{t.directTicket}</h3>
                    <button onClick={() => setShowPOS(false)} className="p-2 bg-muted rounded-full hover:bg-gray-200 transition-colors"><X size={20} /></button>
                  </div>

                  <div className="mb-6 shrink-0">
                    <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">{t.selectTargetTable}</label>
                    {tables.length === 0 ? (
                      <div className="p-4 rounded-xl bg-amber-50 text-amber-700 text-sm font-bold border border-amber-200 flex items-center gap-2"><AlertTriangle size={18}/> {t.noTables}</div>
                    ) : (
                      <select value={selectedTableId} onChange={(e) => setSelectedTableId(e.target.value)} className={`w-full p-4 bg-muted/40 border-2 rounded-xl font-bold text-base focus:border-primary outline-none transition-colors ${activeLang === 'ar' ? 'text-right' : 'text-left'}`}>
                        {tables.map(tb => <option key={tb.id} value={tb.id}>{t.tablePrefix} {tb.table_number.replace('table_', '')}</option>)}
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
                      cartItemsArray.map((item: any) => {
                        const { baseName } = parseProductData(item, activeLang);
                        return (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-white border-2 rounded-2xl shadow-sm">
                            <div className="flex-1 truncate pr-3 font-bold text-sm">{baseName}</div>
                            <div className="flex items-center gap-3 shrink-0" dir="ltr">
                              <button onClick={() => decFromPos(item.id)} className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center hover:bg-red-100 hover:text-red-600 font-black text-lg transition-colors">-</button>
                              <span className="w-4 text-center font-black">{item.quantity}</span>
                              <button onClick={() => incrementPosCart(item.id)} className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center font-black text-lg hover:bg-primary/90 transition-colors">+</button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="pt-6 border-t mt-4 shrink-0 bg-white">
                    <div className="flex justify-between items-center mb-6">
                      <span className="font-extrabold text-muted-foreground uppercase tracking-widest text-sm">{t.total}</span>
                      <span className="text-3xl font-black text-primary" dir="ltr">{formatMAD(cartItemsArray.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0))}</span>
                    </div>

                    <button
                      onClick={handleCreateManualOrder}
                      disabled={isSubmittingPos || cartItemsArray.length === 0 || !selectedTableId}
                      className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-950/20 flex items-center justify-center gap-3 transition-all active:scale-95"
                    >
                      {isSubmittingPos ? <Loader2 className="animate-spin" size={24} /> : <><ChefHat size={24}/> {t.confirmSend}</>}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {modifierProduct && (
          <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6" dir={dir}>
            <div className="w-full max-w-2xl max-h-[94vh] bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
              <div className="p-5 sm:p-6 border-b bg-zinc-50 flex justify-between items-start gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-primary mb-1">{activeLang === "ar" ? "تخصيص المنتج" : "Customize item"}</p>
                  <h3 className="text-2xl font-black">{parseProductData(modifierProduct, activeLang).baseName}</h3>
                  <p className="text-sm font-bold text-primary mt-1" dir="ltr">{formatMAD(modifierProduct.price)}</p>
                </div>
                <button onClick={() => { setModifierProduct(null); setPosModifierSelections({}); setModifierSelectionError(null); }} className="p-2 bg-white rounded-full border hover:text-red-500"><X size={20} /></button>
              </div>

              <div className="overflow-y-auto p-5 sm:p-6 space-y-7 custom-scrollbar">
                {(modifierProduct.modifier_groups || []).map((group: any) => {
                  const options = modifierOptions(group);
                  const selectedCount = selectedCountForGroup(group, posModifierSelections);
                  const min = Math.max(0, Number(group.min_selections || 0));
                  const max = Math.max(min, Number(group.max_selections || 0));
                  const groupLabel = modifierName(group, activeLang);
                  return (
                    <section key={group.id} className="border rounded-2xl overflow-hidden">
                      <header className="p-4 bg-muted/40 border-b flex justify-between gap-3 items-center">
                        <div><h4 className="font-black">{groupLabel}</h4><p className="text-[11px] text-muted-foreground font-bold mt-1">{min > 0 ? (activeLang === "ar" ? "مطلوب" : "Required") : (activeLang === "ar" ? "اختياري" : "Optional")} · {min}–{max}</p></div>
                        <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${selectedCount < min || selectedCount > max ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-700"}`} dir="ltr">{selectedCount}/{max}</span>
                      </header>
                      <div className="p-3 space-y-2">
                        {options.map((option: any) => {
                          const quantity = Number(posModifierSelections[option.id] || 0);
                          const selected = quantity > 0;
                          const extra = Number(option.price_adjustment || 0);
                          const disabled = group.type === "multiple_choice" && !selected && selectedCount >= max;
                          if (group.type === "incremental") {
                            return <div key={option.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border bg-white">
                              <div><p className="font-bold text-sm">{modifierName(option, activeLang)}</p>{extra > 0 && <p className="text-xs font-black text-emerald-600 mt-1" dir="ltr">+{formatMAD(extra)}</p>}</div>
                              <div className="flex items-center gap-3" dir="ltr"><button onClick={() => changeIncrementalModifier(group, option.id, -1)} disabled={quantity === 0} className="h-9 w-9 rounded-lg bg-muted font-black text-lg disabled:opacity-30">−</button><span className="w-5 text-center font-black">{quantity}</span><button onClick={() => changeIncrementalModifier(group, option.id, 1)} disabled={selectedCount >= max} className="h-9 w-9 rounded-lg bg-primary text-white font-black text-lg disabled:opacity-30">+</button></div>
                            </div>;
                          }
                          return <button key={option.id} onClick={() => (group.type === "single_choice" || group.type === "slider") ? chooseSingleModifier(group, option.id) : toggleMultipleModifier(group, option.id)} disabled={disabled} className={`w-full p-3 rounded-xl border flex items-center justify-between text-start transition-colors disabled:opacity-40 ${selected ? "border-primary bg-primary/5" : "bg-white hover:border-primary/40"}`}>
                            <span className="flex gap-3 items-center"><span className={`w-5 h-5 shrink-0 border-2 flex items-center justify-center ${group.type === "multiple_choice" ? "rounded-md" : "rounded-full"} ${selected ? "border-primary bg-primary text-white" : "border-zinc-400"}`}>{selected && <Check size={14} strokeWidth={4} />}</span><span className="font-bold text-sm">{modifierName(option, activeLang)}</span></span>
                            {extra > 0 && <span className="text-xs font-black text-emerald-600" dir="ltr">+{formatMAD(extra)}</span>}
                          </button>;
                        })}
                      </div>
                    </section>
                  );
                })}
                {modifierSelectionError && <p className="text-sm font-bold text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl">{modifierSelectionError}</p>}
              </div>

              <div className="p-4 sm:p-5 border-t bg-zinc-50 flex flex-col-reverse sm:flex-row gap-3">
                <button onClick={() => { setModifierProduct(null); setPosModifierSelections({}); setModifierSelectionError(null); }} className="sm:w-1/3 py-3.5 rounded-xl border bg-white font-bold hover:bg-muted">{activeLang === "ar" ? "إلغاء" : "Cancel"}</button>
                <button onClick={confirmPosModifiers} className="sm:flex-1 py-3.5 rounded-xl bg-primary text-white font-black flex justify-center items-center gap-2 hover:bg-primary/90"><Plus size={19} /> {activeLang === "ar" ? "إضافة للتذكرة" : "Add to ticket"}</button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 items-start">
          {orders.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white rounded-[2.5rem] border border-dashed p-10 mt-auto mb-auto">
              <ShoppingBag className="mx-auto text-muted-foreground/30 mb-3" size={48} />
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
                  <button onClick={() => handlePrintReceipt(order)} className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"><Printer size={16} /> {t.printBtn}</button>
                </div>
              </div>

              <div className="space-y-3 mb-8 min-h-[120px]">
                {order.items.map((item: any, idx: number) => {
                  const { baseName, modsList } = parseProductData(item, activeLang);
                  return (
                    <div key={idx} className="flex flex-col bg-muted/20 p-3 rounded-xl border border-border/50">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-start gap-3">
                          <span className="bg-primary text-white w-7 h-7 shrink-0 flex items-center justify-center rounded-lg font-bold text-sm mt-0.5" dir="ltr">x{item.quantity}</span>
                          <div className="flex flex-col">
                            <span className="font-bold text-base text-foreground leading-tight mt-1">{baseName}</span>
                            {modsList.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {modsList.map((mod, i) => (
                                  <span key={i} className="text-[10px] bg-white border border-border shadow-sm px-2 py-0.5 rounded-md text-muted-foreground font-bold leading-tight">
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
                {order.status === 'pending' && (
                  <>
                    <button onClick={() => updateOrderStatus(order, 'accepted')} className="bg-foreground text-white py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 active:scale-95 transition-transform"><Check size={18} /> {t.acceptBtn}</button>
                    <button onClick={() => updateOrderStatus(order, 'rejected')} className="bg-red-50 text-red-600 py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-red-100 transition-colors"><X size={18} /> {t.rejectBtn}</button>
                  </>
                )}

                {order.status === 'accepted' && (
                  <button onClick={() => updateOrderStatus(order, 'ready')} className="col-span-2 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black text-base flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95 transition-all">
                    <ChefHat size={22} /> {t.orderReadyBtn}
                  </button>
                )}

                {order.status === 'ready' && (
                  <button onClick={() => updateOrderStatus(order, 'completed')} className="col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black text-sm flex justify-center items-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95 transition-all opacity-80">
                    <Check size={18} /> {t.completeBtn}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {!cafeDataObj?.is_white_label && (
          <div className="mt-auto pt-12 pb-2 flex flex-col items-center justify-center opacity-40 select-none">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Zap size={14} className="text-amber-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Powered by Qerve</span>
            </div>
          </div>
        )}

      </div>

      {printOrder && (
        <div ref={printReceiptRef} className="print-only hidden font-mono text-black bg-white w-full max-w-[300px] mx-auto p-4 text-sm text-left" dir="ltr">
          <div className="text-center pb-4 border-b-2 border-dashed border-gray-400 mb-4">
            <h2 className="text-2xl font-extrabold mb-1">{cafeDataObj?.name || "Cafe"}</h2>
            <p className="text-xs bg-black text-white py-1 uppercase tracking-widest">{TRANSLATIONS['en'].printTitle}</p>
          </div>
          <div className="mb-4 text-xs space-y-1 font-bold text-left">
            <p>{TRANSLATIONS['en'].tableNoLabel} {printOrder.tables?.table_number?.replace('table_', '') || TRANSLATIONS['en'].directPosBadge}</p>
            <p>{TRANSLATIONS['en'].orderNoLabel} #{printOrder.id.split('-')[0]}</p>
          </div>
          <div className="border-b-2 border-dashed border-gray-400 pb-4 mb-4">
            <table className="w-full text-sm text-left">
              <tbody>
                {printOrder.items.map((item: any, i: number) => {
                  // 🌟 إجبار الترجمة الإنجليزية دائمًا في إيصال المطبخ
                  const { baseName, modsList } = parseProductData(item, "en"); 
                  return (
                    <tr key={i} className="border-b border-gray-200/50 last:border-0">
                      <td className="py-2 pr-2 text-left">
                        <div className="font-bold text-sm leading-tight">{baseName}</div>
                        {modsList.length > 0 && (
                          <div className="text-[10px] text-gray-600 mt-1 leading-tight font-medium">
                            {modsList.map((m: string) => `+ ${m}`).join('  ')}
                          </div>
                        )}
                      </td>
                      <td className="font-extrabold text-base align-top py-2 text-right">x{item.quantity}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="text-center">
            <p className="text-xl font-extrabold" dir="ltr">{formatMAD(printOrder.total_amount)}</p>
          </div>
          
          {!cafeDataObj?.is_white_label && (
            <div className="text-center mt-6 pt-4 border-t-2 border-dashed border-gray-400">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Powered by Qerve</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
