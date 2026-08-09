"use client";

import { useState, useEffect, use, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import {
  QrCode, PackageSearch, Lock, Settings, AlertTriangle,
  CreditCard, TrendingUp, Laptop, KeyRound, MessageCircle, Bell, Send, Loader2
} from "lucide-react";

import {
  getAdminCafeBySlug,
  getAdminMonthlySales,
  signInAdminWithEmail,
  getAdminTables
} from "../../../actions/auth";
import { sendSupportTicket } from "@/actions/support";

// Isolated Tab Components
import MenuTab from "../../../components/admin/MenuTab";
import TablesTab from "../../../components/admin/TablesTab";
import SalesTab from "../../../components/admin/SalesTab";
import DevicesTab from "../../../components/admin/DevicesTab";
import SettingsTab from "../../../components/admin/SettingsTab";
import BillingTab from "@/components/admin/BillingTab";

const TRANSLATIONS: Record<string, any> = {
  en: { 
    loading: "Loading...", notFoundTitle: "404 - Cafe Not Found", notFoundSub: "Sorry, the link you are trying to access is invalid.", loginTitle: "Admin Login", otpTitle: "Enter Verification Code", resetTitle: "New Password", loginSub: "Log in to manage your project account", otpSub: "A secret code has been sent to your email", resetSub: "Please enter your new account password", emailLabel: "Email Address", emailPlaceholder: "owner@cafe.ma", passwordLabel: "Password", authLoading: "Authenticating...", loginBtn: "Login to Platform 🚀", forgotPassword: "Forgot Password?", otpLabel: "Secret Code (OTP)", verifying: "Verifying...", verifyBtn: "Verify Code ✅", backToLogin: "Back to Login", newPasswordLabel: "New Password", newPasswordPlaceholder: "Enter a strong password...", saving: "Saving...", saveLoginBtn: "Save Login 💾", supportText: "To change the admin email, please contact support.", supportBtn: "Contact via WhatsApp", accessDenied: "⛔ Access Denied: This email is not authorized to manage this cafe.", invalidLogin: "Invalid login credentials ❌", noOwnerEmail: "Sorry, no registered email found for this cafe's owner.", otpSent: "Password recovery code sent to: ", sendError: "Error sending: ", invalidOtp: "Invalid or expired code ❌", passwordUpdateFail: "Failed to update password: ", passwordUpdateSuccess: "Password changed successfully! You can now log in 🔓", adminDashboard: "Admin Dashboard ⚙️", totalControl: "Total Cafe Control", tabMenu: "Menu", tabTables: "Tables", tabSales: "Monthly Sales 📈", tabSettings: "Settings", tabBilling: "Billing & Sub 💳", tabDevices: "Hardware & POS 💻", currentMonthIncome: "Current Month Income", completedOrders: "Completed Orders", avgCustomerSpend: "Average Customer Spend", salesLogTitle: "Sales Log for", salesLogSub: "Paid and delivered orders only", refreshLog: "Refresh Log", calculatingIncome: "Calculating income...", noSalesMonth: "No completed sales this month yet.", table: "Table", directPos: "Direct (POS)", connectedDevices: "Connected Devices", liveMonitoring: "Live monitoring of the active fleet in the cafe.", cashierSlot: "Cashier 💳", cafeSettings: "Cafe Settings & Controls", cafeNameLabel: "Cafe Name", maxCashierLabel: "Max Cashier Screens", adminPinLabel: "Update Backup Admin PIN", leaveEmptyToKeep: "Leave empty to keep current", staffPinLabel: "Update Cashier PIN", saveChangesBtn: "Save Changes 💾", settingsSaved: "Settings saved!", settingsSaveError: "Error saving settings.", addProduct: "Add Product", editProduct: "Edit Product", nameAr: "Product Name (Arabic)", descLabel: "Description", priceLabel: "Price", categoryLabel: "Category", imageLabel: "Image", changeImage: "Change Image", chooseImage: "Choose Image", publishProduct: "Publish Product", saveEdit: "Save Changes", currentProducts: "Current Products", fillFields: "Please fill in all required fields!", updatedSuccess: "Updated successfully!", addedSuccess: "Added successfully!", errorPrefix: "Error: ", confirmDelete: "Confirm deletion?", deleteFailed: "Failed to delete", qrTitle: "Register Tables & Generate QR", qrSub: "Enter table number to register it in the system and generate its code.", tableNumLabel: "Table Number :", processing: "Processing...", generateQrBtn: "Generate Code & Save Table", scanToOrder: "Scan code to order your drink ☕", printBtn: "Print Code", qrError: "Error checking/adding table from server. Please try again.", deleteWarningTitle: "Delete Table Confirmation", deleteWarningDesc: "Warning: This table and all its related orders and sales will be permanently deleted. This action cannot be undone.", understandCheckbox: "I understand that this action is irreversible.", cancelBtn: "Cancel", confirmDeleteBtn: "Confirm Deletion", upgradeToGold: "Upgrade to Gold", analyticsLocked: "Advanced analytics are locked on your current plan. Please upgrade to the Gold plan to access these features.", pendingDevices: "Pending Approval", approvedDevices: "Approved Devices", blockedDevices: "Blocked Devices", approveBtn: "Approve", blockBtn: "Block", deleteBtn: "Delete", noDevices: "No devices found in this category.",
    supportChatTitle: "Support & Notifications", noMessages: "No messages currently.", writeMessage: "Write your message to support..."
  },
  fr: { 
    loading: "Chargement...", notFoundTitle: "404 - Café introuvable", notFoundSub: "Désolé, le lien que vous essayez d'accéder est invalide.", loginTitle: "Connexion Admin", otpTitle: "Code de vérification", resetTitle: "Nouveau mot de passe", loginSub: "Connectez-vous pour gérer votre projet", otpSub: "Un code secret a été envoyé à votre email", resetSub: "Veuillez entrer votre nouveau mot de passe", emailLabel: "Adresse Email", emailPlaceholder: "owner@cafe.ma", passwordLabel: "Mot de passe", authLoading: "Authentification...", loginBtn: "Accéder à la plateforme 🚀", forgotPassword: "Mot de passe oublié ?", otpLabel: "Code secret (OTP)", verifying: "Vérification...", verifyBtn: "Vérifier le code ✅", backToLogin: "Retour à la connexion", newPasswordLabel: "Nouveau mot de passe", newPasswordPlaceholder: "Entrez un mot de passe fort...", saving: "Enregistrement...", saveLoginBtn: "Enregistrer 💾", supportText: "Pour modifier l'email, contactez le support.", supportBtn: "Contacter via WhatsApp", accessDenied: "⛔ Accès refusé : Cet email n'est pas autorisé à gérer ce café.", invalidLogin: "Identifiants invalides ❌", noOwnerEmail: "Désolé, aucun email enregistré trouvé pour ce propriétaire.", otpSent: "Code de récupération envoyé à : ", sendError: "Erreur d'envoi : ", invalidOtp: "Code invalide ou expiré ❌", passwordUpdateFail: "Échec de la mise à jour : ", passwordUpdateSuccess: "Mot de passe modifié ! Vous pouvez vous connecter 🔓", adminDashboard: "Tableau de Bord ⚙️", totalControl: "Contrôle total du café", tabMenu: "Menu", tabTables: "Tables", tabSales: "Ventes mensuelles 📈", tabSettings: "Paramètres", tabBilling: "Facturation 💳", tabDevices: "Appareils Caisse 💻", currentMonthIncome: "Revenus du mois", completedOrders: "Commandes terminées", avgCustomerSpend: "Dépense moyenne", salesLogTitle: "Journal des ventes de", salesLogSub: "Commandes payées et livrées uniquement", refreshLog: "Actualiser", calculatingIncome: "Calcul des revenus...", noSalesMonth: "Aucune vente terminée ce mois-ci.", table: "Table", directPos: "Direct (Caisse)", connectedDevices: "Appareils Connectés", liveMonitoring: "Surveillance en direct de la flotte active.", cashierSlot: "Caisse 💳", cafeSettings: "Paramètres du Café", cafeNameLabel: "Nom du Café", maxCashierLabel: "Écrans Caisse Max", adminPinLabel: "Mettre à jour le code PIN Admin", leaveEmptyToKeep: "Laisser vide pour conserver", staffPinLabel: "Mettre à jour le PIN Caisse", saveChangesBtn: "Enregistrer 💾", settingsSaved: "Paramètres enregistrés !", settingsSaveError: "Erreur d'enregistrement.", addProduct: "Ajouter un Produit", editProduct: "Modifier le Produit", nameAr: "Nom du Produit (Arabe)", descLabel: "Description", priceLabel: "Prix", categoryLabel: "Catégorie", imageLabel: "Image", changeImage: "Changer l'image", chooseImage: "Choisir l'image", publishProduct: "Publier", saveEdit: "Enregistrer", currentProducts: "Produits Actuels", fillFields: "Veuillez remplir tous les champs !", updatedSuccess: "Mis à jour avec succès !", addedSuccess: "Ajouté avec succès !", errorPrefix: "Erreur : ", confirmDelete: "Confirmer la suppression ?", deleteFailed: "Échec de la suppression", qrTitle: "Enregistrer les Tables & Générer QR", qrSub: "Entrez le numéro de la table pour générer son code.", tableNumLabel: "Numéro de Table :", processing: "Traitement...", generateQrBtn: "Générer et Enregistrer", scanToOrder: "Scannez pour commander ☕", printBtn: "Imprimer le Code", qrError: "Erreur serveur. Veuillez réessayer.", deleteWarningTitle: "Confirmation de suppression", deleteWarningDesc: "Avertissement : Cette table ainsi que toutes les commandes et ventes associées seront définitivement supprimées. Cette action est irréversible.", understandCheckbox: "Je comprends que cette action est irréversible.", cancelBtn: "Annuler", confirmDeleteBtn: "Confirmer la suppression", upgradeToGold: "Passer à l'offre Or", analyticsLocked: "Les analyses avancées sont verrouillées sur votre forfait actuel. Veuillez passer au forfait Or pour accéder à ces fonctionnalités.", pendingDevices: "En attente d'approbation", approvedDevices: "Appareils Approuvés", blockedDevices: "Appareils Bloqués", approveBtn: "Approuver", blockBtn: "Bloquer", deleteBtn: "Supprimer", noDevices: "Aucun appareil trouvé dans cette catégorie.",
    supportChatTitle: "Support et Notifications", noMessages: "Aucun message pour le moment.", writeMessage: "Écrivez votre message..."
  },
  ar: { 
    loading: "جاري التحميل...", notFoundTitle: "404 - المقهى غير موجود", notFoundSub: "عذراً، الرابط الذي تحاول الوصول إليه غير صحيح.", loginTitle: "تسجيل دخول الإدارة", otpTitle: "أدخل رمز التحقق", resetTitle: "كلمة مرور جديدة", loginSub: "قم بتسجيل الدخول للتحكم في حساب مشروعك", otpSub: "تم إرسال رمز سري إلى بريدك الإلكتروني", resetSub: "يرجى كتابة كلمة المرور الجديدة لحسابك", emailLabel: "البريد الإلكتروني", emailPlaceholder: "owner@cafe.ma", passwordLabel: "كلمة المرور", authLoading: "جاري المصادقة...", loginBtn: "دخول للمنصة 🚀", forgotPassword: "هل نسيت كلمة المرور؟", otpLabel: "الرمز السري (OTP)", verifying: "جاري التحقق...", verifyBtn: "التحقق من الرمز ✅", backToLogin: "العودة لتسجيل الدخول", newPasswordLabel: "كلمة المرور الجديدة", newPasswordPlaceholder: "أدخل كلمة مرور قوية...", saving: "جاري الحفظ...", saveLoginBtn: "حفظ الدخول 💾", supportText: "لتعديل البريد الإلكتروني للإدارة، يرجى التواصل مع الدعم الفني.", supportBtn: "تواصل عبر واتساب", accessDenied: "⛔ وصول مرفوض: هذا البريد غير مصرح له بإدارة هذا المقهى.", invalidLogin: "بيانات الدخول غير صحيحة ❌", noOwnerEmail: "عذراً، لم يتم العثور على بريد إلكتروني مسجل لمالك هذا المقهى.", otpSent: "تم إرسال رمز استعادة كلمة المرور إلى: ", sendError: "حدث خطأ أثناء الإرسال: ", invalidOtp: "الرمز غير صحيح أو منتهي الصلاحية ❌", passwordUpdateFail: "فشل تحديث كلمة المرور: ", passwordUpdateSuccess: "تم تغيير كلمة المرور بنجاح! يمكنك الآن الدخول للمنصة 🔓", adminDashboard: "لوحة تحكم المدير ⚙️", totalControl: "التحكم الشامل في المقهى", tabMenu: "المنيو", tabTables: "الطاولات", tabSales: "المبيعات الشهرية 📈", tabSettings: "الإعدادات", tabBilling: "الاشتراك والأداء 💳", tabDevices: "الأجهزة والكاشير 💻", currentMonthIncome: "مدخول الشهر الحالي", completedOrders: "الطلبات المنجزة بنجاح", avgCustomerSpend: "متوسط صرف الزبون", salesLogTitle: "سجل مبيعات شهر", salesLogSub: "الطلبات المدفوعة والمستلمة فقط", refreshLog: "تحديث السجل", calculatingIncome: "جاري حساب المداخيل...", noSalesMonth: "لا توجد مبيعات مكتملة في هذا الشهر حتى الآن.", table: "طاولة", directPos: "مباشر (POS)", connectedDevices: "الأجهزة المتصلة الآن", liveMonitoring: "مراقبة حية للأسطول النشط في المقهى.", cashierSlot: "الكاشير 💳", cafeSettings: "إعدادات وضوابط المقهى", cafeNameLabel: "اسم المقهى", maxCashierLabel: "الحد الأقصى لشاشات الكاشير", adminPinLabel: "تحديث رمز المدير البديل (PIN)", leaveEmptyToKeep: "اتركه فارغاً للإبقاء على القديم", staffPinLabel: "تحديث رمز الكاشير (PIN)", saveChangesBtn: "حفظ التغييرات 💾", settingsSaved: "تم حفظ الإعدادات!", settingsSaveError: "حدث خطأ أثناء الحفظ.", addProduct: "إضافة منتج", editProduct: "تعديل المنتج", nameAr: "اسم المنتج (عربي)", descLabel: "الوصف", priceLabel: "السعر", categoryLabel: "القسم", imageLabel: "الصورة", changeImage: "تغيير الصورة", chooseImage: "اختر صورة", publishProduct: "نشر المنتج", saveEdit: "حفظ التعديل", currentProducts: "المنتجات المعروضة حالياً", fillFields: "يرجى تعبئة الحقول!", updatedSuccess: "تم التحديث!", addedSuccess: "تمت الإضافة!", errorPrefix: "خطأ: ", confirmDelete: "تأكيد الحذف؟", deleteFailed: "فشل الحذف", qrTitle: "تسجيل الطاولات وتوليد الـ QR", qrSub: "أدخل رقم الطاولة لتسجيلها في النظام وتوليد الكود الخاص بها.", tableNumLabel: "رقم الطاولة :", processing: "جاري المعالجة...", generateQrBtn: "إنشاء الكود وحفظ الطاولة", scanToOrder: "امسح الكود لطلب مشروبك ☕", printBtn: "طباعة الكود", qrError: "حدث خطأ أثناء فحص/إضافة الطاولة من السيرفر. يرجى المحاولة.", deleteWarningTitle: "تأكيد حذف الطاولة", deleteWarningDesc: "تحذير: سيتم حذف هذه الطاولة وجميع الطلبات والمبيعات المرتبطة بها نهائياً، ولا يمكن التراجع عن هذا الإجراء.", understandCheckbox: "أفهم أن هذا الإجراء نهائي ولا يمكن التراجع عنه.", cancelBtn: "إلغاء", confirmDeleteBtn: "تأكيد الحذف", upgradeToGold: "قم بالترقية للباقة الذهبية", analyticsLocked: "التحليلات المتقدمة غير متاحة في باقتك الحالية. قم بالترقية للباقة الذهبية لفتح هذه الميزات.", pendingDevices: "أجهزة قيد المراجعة", approvedDevices: "الأجهزة المعتمدة", blockedDevices: "الأجهزة المحظورة", approveBtn: "موافقة", blockBtn: "حظر", deleteBtn: "حذف", noDevices: "لا توجد أجهزة في هذه القائمة.",
    supportChatTitle: "الدعم الفني والإشعارات", noMessages: "لا توجد رسائل حالياً.", writeMessage: "اكتب رسالتك للدعم..."
  }
};

const TAB_TO_HASH: Record<string, string> = {
  products: "menu",
  qr: "tables",
  sales: "sales",
  devices: "devices",
  settings: "settings",
  billing: "billing",
};

const HASH_TO_TAB: Record<string, string> = {
  "#menu": "products",
  "#products": "products",
  "#tables": "qr",
  "#qr": "qr",
  "#sales": "sales",
  "#devices": "devices",
  "#settings": "settings",
  "#billing": "billing",
};

const LANGUAGES = ["en", "fr", "ar"];

export default function AdminDashboard({ params }: { params: Promise<{ cafeSlug: string }> }) {
  const { cafeSlug } = use(params);

  const [activeLang, setActiveLang] = useState("en");
  const t = TRANSLATIONS[activeLang];
  const dir = activeLang === 'ar' ? 'rtl' : 'ltr';

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  const [authMode, setAuthMode] = useState<"login" | "otp" | "reset">("login");
  const [otpInput, setOtpInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");

  const [cafeName, setCafeName] = useState("");
  const [activeCashiers, setActiveCashiers] = useState(0);

  const [planType, setPlanType] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<string>("monthly");
  const [maxCashiers, setMaxCashiers] = useState("1");
  const [maxTables, setMaxTables] = useState(30);
  const [maxMenu, setMaxMenu] = useState(150);
  const [isWhiteLabel, setIsWhiteLabel] = useState(false);

  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState<any[]>([]);
  const [cafeId, setCafeId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  const [monthlyOrders, setMonthlyOrders] = useState<any[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [isLoadingSales, setIsLoadingSales] = useState(false);

  const [tablesList, setTablesList] = useState<any[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);

  const [devicesList, setDevicesList] = useState<any[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

  const [messages, setMessages] = useState<any[]>([]);
  const [supportInput, setSupportInput] = useState("");
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const [showMsgDropdown, setShowMsgDropdown] = useState(false);
  const [hasUnreadMsg, setHasUnreadMsg] = useState(false);

  // 🌟 Refs for auto-scroll and click-outside tracking
  const dropdownRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isDropdownOpen = useRef(showMsgDropdown);

  const switchTab = (tab: string) => {
    setActiveTab(tab);
    const hash = TAB_TO_HASH[tab] || tab;
    window.location.hash = hash;
    if (tab === 'sales' && cafeId) fetchMonthlySales(cafeId);
    if (tab === 'devices' && cafeId) fetchDevices(cafeId);
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash && HASH_TO_TAB[hash]) {
        const targetTab = HASH_TO_TAB[hash];
        setActiveTab(targetTab);
        if (targetTab === 'sales' && cafeId) fetchMonthlySales(cafeId);
        if (targetTab === 'devices' && cafeId) fetchDevices(cafeId);
      }
    };

    if (window.location.hash && HASH_TO_TAB[window.location.hash]) {
      setActiveTab(HASH_TO_TAB[window.location.hash]);
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [cafeId]);

  const fetchTables = async (cId: string) => {
    setIsLoadingTables(true);
    const res = await getAdminTables(cId);
    if (res.success) setTablesList(res.tables);
    setIsLoadingTables(false);
  };

  const fetchDevices = async (cId: string) => {
    setIsLoadingDevices(true);
    try {
      const { data } = await supabase.from("pos_devices").select("*").eq("cafe_id", cId).order("created_at", { ascending: false });
      if (data) setDevicesList(data);
    } catch (err) {} finally { setIsLoadingDevices(false); }
  };

  const fetchProducts = async (cId: string) => {
    try {
      const { data } = await supabase.from("products").select("*").eq("cafe_id", cId).order("created_at", { ascending: false });
      if (data) setProducts(data);
    } catch (err) {}
  };

  const fetchMonthlySales = async (cId: string) => {
    if (planType === 'silver' || planType === 'starter') return;
    setIsLoadingSales(true);
    const res = await getAdminMonthlySales(cId);
    if (res.success) {
      setMonthlyOrders(res.orders);
      const total = res.orders.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);
      setMonthlyIncome(total);
    }
    setIsLoadingSales(false);
  };

  useEffect(() => {
    const initAdmin = async () => {
      setIsLoading(true);
      const cafeRes = await getAdminCafeBySlug(cafeSlug);

      if (!cafeRes.success || !cafeRes.cafe) { setIsNotFound(true); setIsLoading(false); return; }

      const cafeData = cafeRes.cafe;
      setCafeId(cafeData.id); 
      setPlanType(cafeData.plan_type);
      
      if (cafeData.name) setCafeName(cafeData.name);
      
      if (cafeData.billing_cycle) setBillingCycle(cafeData.billing_cycle);
      if (cafeData.max_cashiers) setMaxCashiers(cafeData.max_cashiers.toString());
      if (cafeData.max_tables) setMaxTables(cafeData.max_tables);
      if (cafeData.max_menu_items) setMaxMenu(cafeData.max_menu_items);
      if (cafeData.is_white_label !== undefined) setIsWhiteLabel(cafeData.is_white_label);

      if (cafeData.owner_email) {
        setOwnerEmail(cafeData.owner_email);
        const sessionKey = `admin_auth_${cafeSlug}`;
        if (sessionStorage.getItem(sessionKey) === 'true') {
          const { data: { user } } = await supabase.auth.getUser();
          if (user && user.email?.toLowerCase() === cafeData.owner_email.toLowerCase()) {
            setIsAuthenticated(true);
            await Promise.all([
              fetchProducts(cafeData.id),
              cafeData.plan_type !== 'silver' && cafeData.plan_type !== 'starter' ? fetchMonthlySales(cafeData.id) : Promise.resolve(),
              fetchTables(cafeData.id),
              fetchDevices(cafeData.id)
            ]);
          } else {
            sessionStorage.removeItem(sessionKey); await supabase.auth.signOut(); setIsAuthenticated(false);
          }
        }
      }
      setIsLoading(false);
    };
    initAdmin();
  }, [cafeSlug]);

  useEffect(() => {
    if (!cafeId || !isAuthenticated) return;

    const slotsTopic = `cashier_slots_${cafeId}`;
    const devicesTopic = `admin_devices_live_${cafeId}`;
    const adminKey = `admin_${Math.random().toString(36).substring(2, 10)}`;

    supabase.getChannels().forEach(c => {
      if (c.topic === `realtime:${slotsTopic}` || c.topic === `realtime:${devicesTopic}`) supabase.removeChannel(c);
    });

    const cashierChannel = supabase.channel(slotsTopic, { config: { presence: { key: adminKey } } });

    const updateLiveCount = () => {
      const state = cashierChannel.presenceState();
      let liveCount = 0;
      Object.keys(state).forEach((key) => { if (key.startsWith('dev_') && state[key].length > 0) liveCount++; });
      setActiveCashiers(liveCount);
    };

    cashierChannel
      .on('presence', { event: 'sync' }, updateLiveCount)
      .on('presence', { event: 'join' }, updateLiveCount)
      .on('presence', { event: 'leave' }, updateLiveCount)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await cashierChannel.track({ role: 'admin_dashboard', online_at: new Date().toISOString() });
          updateLiveCount();
        }
      });

    const devicesChannel = supabase.channel(devicesTopic).on('postgres_changes', { event: '*', schema: 'public', table: 'pos_devices', filter: `cafe_id=eq.${cafeId}` }, () => { fetchDevices(cafeId); }).subscribe();

    return () => { cashierChannel.untrack(); supabase.removeChannel(cashierChannel); supabase.removeChannel(devicesChannel); };
  }, [cafeId, isAuthenticated]);

  // 🌟 Sync ref and scroll on dropdown open
  useEffect(() => {
    isDropdownOpen.current = showMsgDropdown;
    if (showMsgDropdown) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [showMsgDropdown]);

  // 🌟 Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🌟 Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMsgDropdown(false);
      }
    };
    if (showMsgDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMsgDropdown]);

  // 🌟 Supabase Realtime for Messages (Removed showMsgDropdown from dependencies)
  useEffect(() => {
    if (!cafeId || !isAuthenticated) return;

    const fetchMessages = async () => {
      const { data } = await supabase.from("admin_messages").select("*").eq("cafe_id", cafeId).order("created_at", { ascending: true });
      if (data) {
        setMessages(data);
        const unread = data.some(m => m.sender === 'super_admin' && !m.is_read);
        setHasUnreadMsg(unread);
      }
    };
    fetchMessages();

    const messagesChannel = supabase.channel(`support_${cafeId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_messages", filter: `cafe_id=eq.${cafeId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        if (payload.new.sender === 'super_admin' && !isDropdownOpen.current) {
          setHasUnreadMsg(true);
        }
      }).subscribe();

    return () => { supabase.removeChannel(messagesChannel); };
  }, [cafeId, isAuthenticated]);

  const handleOpenMessages = async () => {
    setShowMsgDropdown(!showMsgDropdown);
    if (!showMsgDropdown && hasUnreadMsg) {
      await supabase.from("admin_messages").update({ is_read: true }).eq("cafe_id", cafeId).eq("sender", "super_admin").eq("is_read", false);
      setHasUnreadMsg(false);
    }
  };

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportInput.trim() || !cafeId) return;
    setIsSendingSupport(true);
    await sendSupportTicket({ cafeId, cafeName, message: supportInput, planType: planType || "unknown" });
    setSupportInput("");
    setIsSendingSupport(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput || !cafeId) return;
    if (emailInput.toLowerCase() !== ownerEmail.toLowerCase()) { alert(t.accessDenied); return; }
    setIsChecking(true);
    const res = await signInAdminWithEmail(emailInput, passwordInput);
    setIsChecking(false);

    if (res.success) {
      if (res.session?.access_token && res.session?.refresh_token) {
        await supabase.auth.setSession({ access_token: res.session.access_token, refresh_token: res.session.refresh_token });
      }
      setIsAuthenticated(true);
      sessionStorage.setItem(`admin_auth_${cafeSlug}`, 'true');
      await Promise.all([
        fetchProducts(cafeId),
        planType !== 'silver' && planType !== 'starter' ? fetchMonthlySales(cafeId) : Promise.resolve(),
        fetchTables(cafeId), fetchDevices(cafeId)
      ]);
    } else alert(res.error || t.invalidLogin);
  };

  const handleAutoRecovery = async () => {
    if (!ownerEmail) { alert(t.noOwnerEmail); return; }
    setIsChecking(true);
    const { error } = await supabase.auth.resetPasswordForEmail(ownerEmail);
    setIsChecking(false);
    if (!error) {
      setAuthMode("otp");
      const maskedEmail = ownerEmail.replace(/^(.)(.*)(.@.*)$/, (_, a, b, c) => a + b.replace(/./g, '*') + c);
      alert(`${t.otpSent}${maskedEmail} 📩`);
    } else alert(t.sendError + error.message);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput || !ownerEmail) return;
    setIsChecking(true);
    const { error } = await supabase.auth.verifyOtp({ email: ownerEmail, token: otpInput, type: 'recovery' });
    setIsChecking(false);
    if (error) alert(t.invalidOtp); else setAuthMode("reset");
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput) return;
    setIsChecking(true);
    const { error } = await supabase.auth.updateUser({ password: newPasswordInput });
    setIsChecking(false);

    if (error) alert(t.passwordUpdateFail + error.message);
    else {
      const loginRes = await signInAdminWithEmail(ownerEmail, newPasswordInput);
      if (!loginRes.success) { alert(loginRes.error || t.invalidLogin); return; }
      if (loginRes.session?.access_token && loginRes.session?.refresh_token) {
        await supabase.auth.setSession({ access_token: loginRes.session.access_token, refresh_token: loginRes.session.refresh_token });
      }
      alert(t.passwordUpdateSuccess); setIsAuthenticated(true); sessionStorage.setItem(`admin_auth_${cafeSlug}`, 'true'); setAuthMode("login");
      if (cafeId) {
        await Promise.all([
          fetchProducts(cafeId),
          planType !== 'silver' && planType !== 'starter' ? fetchMonthlySales(cafeId) : Promise.resolve(),
          fetchTables(cafeId), fetchDevices(cafeId)
        ]);
      }
    }
  };

  const LanguageToggle = () => (
    <div className="flex bg-muted/60 p-1 rounded-full w-max border" dir="ltr">
      {LANGUAGES.map(lang => (
        <button key={lang} onClick={() => setActiveLang(lang)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-colors ${activeLang === lang ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          {lang}
        </button>
      ))}
    </div>
  );

  if (isLoading) return <div className="p-10 text-center font-bold">{t.loading}</div>;

  if (isNotFound) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-6 text-center" dir={dir}>
        <div className="absolute top-6 right-6"><LanguageToggle /></div>
        <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-6 border border-red-200"><AlertTriangle className="w-12 h-12 text-red-500" /></div>
        <h1 className="text-4xl font-extrabold text-foreground mb-4">{t.notFoundTitle}</h1>
        <p className="text-muted-foreground text-lg max-w-md font-medium">{t.notFoundSub}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-6" dir={dir}>
        <div className="absolute top-6 right-6"><LanguageToggle /></div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-border w-full max-w-md text-center">
          {authMode === "reset" ? (<div className="bg-emerald-500/10 w-20 h-20 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto mb-6 shadow-inner"><KeyRound size={36} /></div>) : (<div className="bg-primary/10 w-20 h-20 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6 shadow-inner"><Lock size={36} /></div>)}
          <h2 className="text-2xl font-black mb-2 tracking-tight"> {authMode === "login" && t.loginTitle} {authMode === "otp" && t.otpTitle} {authMode === "reset" && t.resetTitle} </h2>
          <p className="text-muted-foreground mb-8 text-sm font-bold"> {authMode === "login" && t.loginSub} {authMode === "otp" && t.otpSub} {authMode === "reset" && t.resetSub} </p>
          {authMode === "login" && (
            <form onSubmit={handleLogin} className={`flex flex-col gap-4 ${activeLang === 'ar' ? 'text-right' : 'text-left'}`}>
              <div><label className="block text-xs font-bold text-muted-foreground mb-1.5 px-1">{t.emailLabel}</label><input required type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="w-full border-2 border-border rounded-2xl p-4 text-left font-mono text-sm focus:border-primary outline-none bg-muted/20 transition-colors" placeholder={t.emailPlaceholder} autoFocus disabled={isChecking} dir="ltr" /></div>
              <div><label className="block text-xs font-bold text-muted-foreground mb-1.5 px-1">{t.passwordLabel}</label><input required type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full border-2 border-border rounded-2xl p-4 text-left font-mono text-sm focus:border-primary outline-none bg-muted/20 transition-colors" placeholder="••••••••" disabled={isChecking} dir="ltr" /></div>
              <button disabled={isChecking} type="submit" className="py-4 rounded-2xl font-black text-base text-white bg-foreground hover:opacity-90 mt-2 shadow-xl transition-all active:scale-95">{isChecking ? t.authLoading : t.loginBtn}</button>
              <button type="button" onClick={handleAutoRecovery} disabled={isChecking} className="text-xs text-primary font-bold mt-3 hover:underline text-center block w-full disabled:opacity-50">{t.forgotPassword}</button>
            </form>
          )}
          {authMode === "otp" && (
            <form onSubmit={handleVerifyOtp} className={`flex flex-col gap-4 animate-in fade-in zoom-in duration-300 ${activeLang === 'ar' ? 'text-right' : 'text-left'}`}>
              <div><label className="block text-xs font-bold text-muted-foreground mb-1.5 px-1">{t.otpLabel}</label><input required type="text" value={otpInput} onChange={(e) => setOtpInput(e.target.value)} className="w-full border-2 border-border rounded-2xl p-4 text-center font-mono text-2xl tracking-[0.5em] focus:border-primary outline-none bg-muted/20 transition-colors" placeholder="••••••" autoFocus disabled={isChecking} maxLength={6} dir="ltr" /></div>
              <button disabled={isChecking || otpInput.length < 6} type="submit" className="py-4 rounded-2xl font-black text-base text-white bg-primary hover:opacity-90 mt-2 shadow-xl transition-all active:scale-95 disabled:opacity-50">{isChecking ? t.verifying : t.verifyBtn}</button>
              <button type="button" onClick={() => setAuthMode("login")} className="text-xs text-muted-foreground font-bold mt-3 hover:underline text-center block w-full">{t.backToLogin}</button>
            </form>
          )}
          {authMode === "reset" && (
            <form onSubmit={handleSetNewPassword} className={`flex flex-col gap-4 animate-in fade-in zoom-in duration-300 ${activeLang === 'ar' ? 'text-right' : 'text-left'}`}>
              <div><label className="block text-xs font-bold text-muted-foreground mb-1.5 px-1">{t.newPasswordLabel}</label><input required type="text" value={newPasswordInput} onChange={(e) => setNewPasswordInput(e.target.value)} className={`w-full border-2 border-emerald-500/50 rounded-2xl p-4 font-mono text-sm focus:border-emerald-500 outline-none bg-emerald-50 transition-colors ${activeLang === 'ar' ? 'text-right' : 'text-left'}`} placeholder={t.newPasswordPlaceholder} autoFocus disabled={isChecking} dir="auto" /></div>
              <button disabled={isChecking || newPasswordInput.length < 6} type="submit" className="py-4 rounded-2xl font-black text-base text-white bg-emerald-500 hover:bg-emerald-600 mt-2 shadow-xl transition-all active:scale-95 disabled:opacity-50">{isChecking ? t.saving : t.saveLoginBtn}</button>
            </form>
          )}
          <div className="mt-8 pt-6 border-t border-border flex flex-col items-center gap-3">
            <p className="text-xs text-muted-foreground font-bold">{t.supportText}</p>
            <a href="https://wa.me/212781991384" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 py-3.5 rounded-2xl font-bold text-sm transition-colors"><MessageCircle size={20} />{t.supportBtn}</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 p-6 md:p-12 font-sans" dir={dir}>
      <header className="mb-8 flex flex-col xl:flex-row xl:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-border gap-4 relative z-50">
        <div><h1 className="text-3xl font-extrabold text-foreground">{t.adminDashboard}</h1><p className="text-muted-foreground mt-1">{t.totalControl}</p></div>
        
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <LanguageToggle />
            
            {/* Dropdown Container Ref */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleOpenMessages}
                className={`relative p-2.5 rounded-full border transition-colors ${hasUnreadMsg ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'}`}
              >
                <Bell size={18} className={hasUnreadMsg ? "animate-pulse" : ""} />
                {hasUnreadMsg && (
                  <span className="absolute top-0 right-0 flex h-3 w-3 -mt-1 -mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  </span>
                )}
              </button>

              {showMsgDropdown && (
                <div className={`absolute top-full mt-3 w-80 sm:w-96 bg-white border border-border shadow-2xl rounded-2xl flex flex-col z-[100] animate-in fade-in slide-in-from-top-4 overflow-hidden ${dir === 'rtl' ? 'left-0' : 'right-0'}`} style={{ height: '450px' }}>
                  <div className="bg-muted/50 p-4 border-b font-black flex items-center gap-2">
                    <MessageCircle size={18} className="text-primary"/> {t.supportChatTitle}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
                    {messages.length === 0 ? (
                      <div className="m-auto text-xs font-bold text-muted-foreground text-center">{t.noMessages}</div>
                    ) : (
                      messages.map(msg => (
                        <div key={msg.id} className={`max-w-[85%] p-3 rounded-xl text-sm font-medium ${msg.sender === 'cafe_admin' ? 'bg-primary text-primary-foreground self-end rounded-tr-none' : 'bg-muted text-foreground self-start rounded-tl-none border border-border'}`}>
                          {msg.message_text}
                          <div className={`text-[9px] mt-1 opacity-60 ${msg.sender === 'cafe_admin' ? 'text-right' : 'text-left'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))
                    )}
                    {/* Auto-scroll target */}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSendSupport} className="p-3 bg-muted/30 border-t flex gap-2">
                    <input 
                      type="text" value={supportInput} onChange={(e) => setSupportInput(e.target.value)}
                      placeholder={t.writeMessage} disabled={isSendingSupport}
                      className="flex-1 bg-white border border-border rounded-xl px-3 text-sm outline-none focus:border-primary disabled:opacity-50"
                    />
                    <button type="submit" disabled={isSendingSupport || !supportInput.trim()} className="bg-primary text-primary-foreground p-3 rounded-xl disabled:opacity-50 active:scale-95 transition-all">
                      {isSendingSupport ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className={dir === 'rtl' ? 'rotate-180' : ''}/>}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap bg-muted p-1 rounded-xl gap-1">
            <button onClick={() => switchTab('products')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm ${activeTab === 'products' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}><PackageSearch size={18} /> {t.tabMenu}</button>
            <button onClick={() => switchTab('qr')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm ${activeTab === 'qr' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}><QrCode size={18} /> {t.tabTables}</button>
            <button onClick={() => switchTab('sales')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm ${activeTab === 'sales' ? 'bg-white text-emerald-600 shadow-sm' : 'text-muted-foreground'}`}><TrendingUp size={18} /> {t.tabSales}</button>
            <button onClick={() => switchTab('devices')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm ${activeTab === 'devices' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}><Laptop size={18} /> {t.tabDevices}</button>
            <button onClick={() => switchTab('settings')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm ${activeTab === 'settings' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}><Settings size={18} /> {t.tabSettings}</button>
            <button onClick={() => switchTab('billing')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm ${activeTab === 'billing' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}><CreditCard size={18} /> {t.tabBilling}</button>
          </div>
        </div>
      </header>

      {activeTab === 'products' && <MenuTab cafeId={cafeId!} activeLang={activeLang} t={t} products={products} fetchProducts={fetchProducts} maxMenu={maxMenu} />}
      {activeTab === 'qr' && <TablesTab cafeId={cafeId!} cafeSlug={cafeSlug} cafeName={cafeName} activeLang={activeLang} t={t} tablesList={tablesList} setTablesList={setTablesList} fetchTables={fetchTables} isLoadingTables={isLoadingTables} maxTables={maxTables} />}
      {activeTab === 'sales' && <SalesTab cafeId={cafeId!} activeLang={activeLang} t={t} planType={planType} monthlyOrders={monthlyOrders} monthlyIncome={monthlyIncome} isLoadingSales={isLoadingSales} fetchMonthlySales={fetchMonthlySales} setActiveTab={switchTab} />}
      {activeTab === 'devices' && <DevicesTab cafeId={cafeId!} activeLang={activeLang} t={t} devicesList={devicesList} fetchDevices={fetchDevices} isLoadingDevices={isLoadingDevices} maxCashiers={maxCashiers} />}
      {activeTab === 'settings' && <SettingsTab cafeId={cafeId!} activeLang={activeLang} t={t} cafeName={cafeName} setCafeName={setCafeName} maxCashiers={maxCashiers} activeCashiers={activeCashiers} planType={planType} billingCycle={billingCycle} maxTables={maxTables} maxMenu={maxMenu} />}
      {activeTab === 'billing' && <BillingTab cafeId={cafeId!} cafeName={cafeName} planType={planType} billingCycle={billingCycle} activeLang={activeLang} t={t} />}
    </div>
  );
}