"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "../../../lib/supabase";
import { 
  Plus, Trash2, Image as ImageIcon, Loader2, QrCode, PackageSearch, 
  Printer, Lock, Settings, Edit, X, AlertTriangle, CheckCircle2, 
  CreditCard, TrendingUp, DollarSign, History, Calendar, MonitorSmartphone,
  MessageCircle, KeyRound 
} from "lucide-react";
import QRCode from "react-qr-code";
import {
  adminAddProduct,
  adminCheckOrAddTable,
  adminDeleteProduct,
  adminUpdateProduct,
  getAdminCafeBySlug,
  getAdminMonthlySales,
  getAdminProducts,
  hasAdminCafeAccess,
  signInAdminWithEmail,
  updateCafeSettings,
  getAdminTables,
  adminDeleteTable,
} from "../../../actions/auth";
import BillingTab from "../../../components/BillingTab";

const TRANSLATIONS: Record<string, any> = {
  en: {
    loading: "Loading...",
    notFoundTitle: "404 - Cafe Not Found",
    notFoundSub: "Sorry, the link you are trying to access is invalid.",
    loginTitle: "Admin Login",
    otpTitle: "Enter Verification Code",
    resetTitle: "New Password",
    loginSub: "Log in to manage your project account",
    otpSub: "A secret code has been sent to your email",
    resetSub: "Please enter your new account password",
    emailLabel: "Email Address",
    emailPlaceholder: "owner@cafe.ma",
    passwordLabel: "Password",
    authLoading: "Authenticating...",
    loginBtn: "Login to Platform 🚀",
    forgotPassword: "Forgot Password?",
    otpLabel: "Secret Code (OTP)",
    verifying: "Verifying...",
    verifyBtn: "Verify Code ✅",
    backToLogin: "Back to Login",
    newPasswordLabel: "New Password",
    newPasswordPlaceholder: "Enter a strong password...",
    saving: "Saving...",
    saveLoginBtn: "Save Login 💾",
    supportText: "To change the admin email, please contact support.",
    supportBtn: "Contact via WhatsApp",
    accessDenied: "⛔ Access Denied: This email is not authorized to manage this cafe.",
    invalidLogin: "Invalid login credentials ❌",
    noOwnerEmail: "Sorry, no registered email found for this cafe's owner.",
    otpSent: "Password recovery code sent to: ",
    sendError: "Error sending: ",
    invalidOtp: "Invalid or expired code ❌",
    passwordUpdateFail: "Failed to update password: ",
    passwordUpdateSuccess: "Password changed successfully! You can now log in 🔓",
    adminDashboard: "Admin Dashboard ⚙️",
    totalControl: "Total Cafe Control",
    tabMenu: "Menu",
    tabTables: "Tables",
    tabSales: "Monthly Sales 📈",
    tabSettings: "Settings",
    tabBilling: "Billing & Sub 💳",
    currentMonthIncome: "Current Month Income",
    completedOrders: "Completed Orders",
    avgCustomerSpend: "Average Customer Spend",
    salesLogTitle: "Sales Log for",
    salesLogSub: "Paid and delivered orders only",
    refreshLog: "Refresh Log",
    calculatingIncome: "Calculating income...",
    noSalesMonth: "No completed sales this month yet.",
    table: "Table",
    directPos: "Direct (POS)",
    connectedDevices: "Connected Devices",
    liveMonitoring: "Live monitoring of the active fleet in the cafe.",
    cashierSlot: "Cashier 💳",
    cafeSettings: "Cafe Settings & Controls",
    cafeNameLabel: "Cafe Name",
    maxCashierLabel: "Max Cashier Screens",
    adminPinLabel: "Update Backup Admin PIN",
    leaveEmptyToKeep: "Leave empty to keep current",
    staffPinLabel: "Update Cashier PIN",
    saveChangesBtn: "Save Changes 💾",
    settingsSaved: "Settings saved!",
    settingsSaveError: "Error saving settings.",
    addProduct: "Add Product",
    editProduct: "Edit Product",
    nameAr: "Product Name (Arabic)",
    descLabel: "Description",
    priceLabel: "Price",
    categoryLabel: "Category",
    imageLabel: "Image",
    changeImage: "Change Image",
    chooseImage: "Choose Image",
    publishProduct: "Publish Product",
    saveEdit: "Save Changes",
    currentProducts: "Current Products",
    fillFields: "Please fill in all required fields!",
    updatedSuccess: "Updated successfully!",
    addedSuccess: "Added successfully!",
    errorPrefix: "Error: ",
    confirmDelete: "Confirm deletion?",
    deleteFailed: "Failed to delete",
    qrTitle: "Register Tables & Generate QR",
    qrSub: "Enter table number to register it in the system and generate its code.",
    tableNumLabel: "Table Number :",
    processing: "Processing...",
    generateQrBtn: "Generate Code & Save Table",
    scanToOrder: "Scan code to order your drink ☕",
    printBtn: "Print Code",
    qrError: "Error checking/adding table from server. Please try again.",
    deleteWarningTitle: "Delete Table Confirmation",
    deleteWarningDesc: "Warning: This table and all its related orders and sales will be permanently deleted. This action cannot be undone.",
    understandCheckbox: "I understand that this action is irreversible.",
    cancelBtn: "Cancel",
    confirmDeleteBtn: "Confirm Deletion"
  },
  fr: {
    loading: "Chargement...",
    notFoundTitle: "404 - Café introuvable",
    notFoundSub: "Désolé, le lien que vous essayez d'accéder est invalide.",
    loginTitle: "Connexion Admin",
    otpTitle: "Code de vérification",
    resetTitle: "Nouveau mot de passe",
    loginSub: "Connectez-vous pour gérer votre projet",
    otpSub: "Un code secret a été envoyé à votre email",
    resetSub: "Veuillez entrer votre nouveau mot de passe",
    emailLabel: "Adresse Email",
    emailPlaceholder: "owner@cafe.ma",
    passwordLabel: "Mot de passe",
    authLoading: "Authentification...",
    loginBtn: "Accéder à la plateforme 🚀",
    forgotPassword: "Mot de passe oublié ?",
    otpLabel: "Code secret (OTP)",
    verifying: "Vérification...",
    verifyBtn: "Vérifier le code ✅",
    backToLogin: "Retour à la connexion",
    newPasswordLabel: "Nouveau mot de passe",
    newPasswordPlaceholder: "Entrez un mot de passe fort...",
    saving: "Enregistrement...",
    saveLoginBtn: "Enregistrer 💾",
    supportText: "Pour modifier l'email, contactez le support.",
    supportBtn: "Contacter via WhatsApp",
    accessDenied: "⛔ Accès refusé : Cet email n'est pas autorisé à gérer ce café.",
    invalidLogin: "Identifiants invalides ❌",
    noOwnerEmail: "Désolé, aucun email enregistré trouvé pour ce propriétaire.",
    otpSent: "Code de récupération envoyé à : ",
    sendError: "Erreur d'envoi : ",
    invalidOtp: "Code invalide ou expiré ❌",
    passwordUpdateFail: "Échec de la mise à jour : ",
    passwordUpdateSuccess: "Mot de passe modifié ! Vous pouvez vous connecter 🔓",
    adminDashboard: "Tableau de Bord ⚙️",
    totalControl: "Contrôle total du café",
    tabMenu: "Menu",
    tabTables: "Tables",
    tabSales: "Ventes mensuelles 📈",
    tabSettings: "Paramètres",
    tabBilling: "Facturation 💳",
    currentMonthIncome: "Revenus du mois",
    completedOrders: "Commandes terminées",
    avgCustomerSpend: "Dépense moyenne",
    salesLogTitle: "Journal des ventes de",
    salesLogSub: "Commandes payées et livrées uniquement",
    refreshLog: "Actualiser",
    calculatingIncome: "Calcul des revenus...",
    noSalesMonth: "Aucune vente terminée ce mois-ci.",
    table: "Table",
    directPos: "Direct (Caisse)",
    connectedDevices: "Appareils Connectés",
    liveMonitoring: "Surveillance en direct de la flotte active.",
    cashierSlot: "Caisse 💳",
    cafeSettings: "Paramètres du Café",
    cafeNameLabel: "Nom du Café",
    maxCashierLabel: "Écrans Caisse Max",
    adminPinLabel: "Mettre à jour le code PIN Admin",
    leaveEmptyToKeep: "Laisser vide pour conserver",
    staffPinLabel: "Mettre à jour le PIN Caisse",
    saveChangesBtn: "Enregistrer 💾",
    settingsSaved: "Paramètres enregistrés !",
    settingsSaveError: "Erreur d'enregistrement.",
    addProduct: "Ajouter un Produit",
    editProduct: "Modifier le Produit",
    nameAr: "Nom du Produit (Arabe)",
    descLabel: "Description",
    priceLabel: "Prix",
    categoryLabel: "Catégorie",
    imageLabel: "Image",
    changeImage: "Changer l'image",
    chooseImage: "Choisir l'image",
    publishProduct: "Publier",
    saveEdit: "Enregistrer",
    currentProducts: "Produits Actuels",
    fillFields: "Veuillez remplir tous les champs !",
    updatedSuccess: "Mis à jour avec succès !",
    addedSuccess: "Ajouté avec succès !",
    errorPrefix: "Erreur : ",
    confirmDelete: "Confirmer la suppression ?",
    deleteFailed: "Échec de la suppression",
    qrTitle: "Enregistrer les Tables & Générer QR",
    qrSub: "Entrez le numéro de la table pour générer son code.",
    tableNumLabel: "Numéro de Table :",
    processing: "Traitement...",
    generateQrBtn: "Générer et Enregistrer",
    scanToOrder: "Scannez pour commander ☕",
    printBtn: "Imprimer le Code",
    qrError: "Erreur serveur. Veuillez réessayer.",
    deleteWarningTitle: "Confirmation de suppression",
    deleteWarningDesc: "Avertissement : Cette table ainsi que toutes les commandes et ventes associées seront définitivement supprimées. Cette action est irréversible.",
    understandCheckbox: "Je comprends que cette action est irréversible.",
    cancelBtn: "Annuler",
    confirmDeleteBtn: "Confirmer la suppression"
  },
  ar: {
    loading: "جاري التحميل...",
    notFoundTitle: "404 - المقهى غير موجود",
    notFoundSub: "عذراً، الرابط الذي تحاول الوصول إليه غير صحيح.",
    loginTitle: "تسجيل دخول الإدارة",
    otpTitle: "أدخل رمز التحقق",
    resetTitle: "كلمة مرور جديدة",
    loginSub: "قم بتسجيل الدخول للتحكم في حساب مشروعك",
    otpSub: "تم إرسال رمز سري إلى بريدك الإلكتروني",
    resetSub: "يرجى كتابة كلمة المرور الجديدة لحسابك",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "owner@cafe.ma",
    passwordLabel: "كلمة المرور",
    authLoading: "جاري المصادقة...",
    loginBtn: "دخول للمنصة 🚀",
    forgotPassword: "هل نسيت كلمة المرور؟",
    otpLabel: "الرمز السري (OTP)",
    verifying: "جاري التحقق...",
    verifyBtn: "التحقق من الرمز ✅",
    backToLogin: "العودة لتسجيل الدخول",
    newPasswordLabel: "كلمة المرور الجديدة",
    newPasswordPlaceholder: "أدخل كلمة مرور قوية...",
    saving: "جاري الحفظ...",
    saveLoginBtn: "حفظ الدخول 💾",
    supportText: "لتعديل البريد الإلكتروني للإدارة، يرجى التواصل مع الدعم الفني.",
    supportBtn: "تواصل عبر واتساب",
    accessDenied: "⛔ وصول مرفوض: هذا البريد غير مصرح له بإدارة هذا المقهى.",
    invalidLogin: "بيانات الدخول غير صحيحة ❌",
    noOwnerEmail: "عذراً، لم يتم العثور على بريد إلكتروني مسجل لمالك هذا المقهى.",
    otpSent: "تم إرسال رمز استعادة كلمة المرور إلى: ",
    sendError: "حدث خطأ أثناء الإرسال: ",
    invalidOtp: "الرمز غير صحيح أو منتهي الصلاحية ❌",
    passwordUpdateFail: "فشل تحديث كلمة المرور: ",
    passwordUpdateSuccess: "تم تغيير كلمة المرور بنجاح! يمكنك الآن الدخول للمنصة 🔓",
    adminDashboard: "لوحة تحكم المدير ⚙️",
    totalControl: "التحكم الشامل في المقهى",
    tabMenu: "المنيو",
    tabTables: "الطاولات",
    tabSales: "المبيعات الشهرية 📈",
    tabSettings: "الإعدادات",
    tabBilling: "الاشتراك والأداء 💳",
    currentMonthIncome: "مدخول الشهر الحالي",
    completedOrders: "الطلبات المنجزة بنجاح",
    avgCustomerSpend: "متوسط صرف الزبون",
    salesLogTitle: "سجل مبيعات شهر",
    salesLogSub: "الطلبات المدفوعة والمستلمة فقط",
    refreshLog: "تحديث السجل",
    calculatingIncome: "جاري حساب المداخيل...",
    noSalesMonth: "لا توجد مبيعات مكتملة في هذا الشهر حتى الآن.",
    table: "طاولة",
    directPos: "مباشر (POS)",
    connectedDevices: "الأجهزة المتصلة الآن",
    liveMonitoring: "مراقبة حية للأسطول النشط في المقهى.",
    cashierSlot: "الكاشير 💳",
    cafeSettings: "إعدادات وضوابط المقهى",
    cafeNameLabel: "اسم المقهى",
    maxCashierLabel: "الحد الأقصى لشاشات الكاشير",
    adminPinLabel: "تحديث رمز المدير البديل (PIN)",
    leaveEmptyToKeep: "اتركه فارغاً للإبقاء على القديم",
    staffPinLabel: "تحديث رمز الكاشير (PIN)",
    saveChangesBtn: "حفظ التغييرات 💾",
    settingsSaved: "تم حفظ الإعدادات!",
    settingsSaveError: "حدث خطأ أثناء الحفظ.",
    addProduct: "إضافة منتج",
    editProduct: "تعديل المنتج",
    nameAr: "اسم المنتج (عربي)",
    descLabel: "الوصف",
    priceLabel: "السعر",
    categoryLabel: "القسم",
    imageLabel: "الصورة",
    changeImage: "تغيير الصورة",
    chooseImage: "اختر صورة",
    publishProduct: "نشر المنتج",
    saveEdit: "حفظ التعديل",
    currentProducts: "المنتجات المعروضة حالياً",
    fillFields: "يرجى تعبئة الحقول!",
    updatedSuccess: "تم التحديث!",
    addedSuccess: "تمت الإضافة!",
    errorPrefix: "خطأ: ",
    confirmDelete: "تأكيد الحذف؟",
    deleteFailed: "فشل الحذف",
    qrTitle: "تسجيل الطاولات وتوليد الـ QR",
    qrSub: "أدخل رقم الطاولة لتسجيلها في النظام وتوليد الكود الخاص بها.",
    tableNumLabel: "رقم الطاولة :",
    processing: "جاري المعالجة...",
    generateQrBtn: "إنشاء الكود وحفظ الطاولة",
    scanToOrder: "امسح الكود لطلب مشروبك ☕",
    printBtn: "طباعة الكود",
    qrError: "حدث خطأ أثناء فحص/إضافة الطاولة من السيرفر. يرجى المحاولة.",
    deleteWarningTitle: "تأكيد حذف الطاولة",
    deleteWarningDesc: "تحذير: سيتم حذف هذه الطاولة وجميع الطلبات والمبيعات المرتبطة بها نهائياً، ولا يمكن التراجع عن هذا الإجراء.",
    understandCheckbox: "أفهم أن هذا الإجراء نهائي ولا يمكن التراجع عنه.",
    cancelBtn: "إلغاء",
    confirmDeleteBtn: "تأكيد الحذف"
  }
};

const CATEGORY_MAP: Record<string, Record<string, string>> = {
  "القهوة": { ar: "القهوة", en: "Coffee", fr: "Café" },
  "الحلوى": { ar: "الحلوى", en: "Desserts", fr: "Desserts" },
  "عصائر": { ar: "عصائر", en: "Juices", fr: "Jus" },
  "مخبوزات": { ar: "مخبوزات", en: "Bakery", fr: "Boulangerie" }
};
const CATEGORIES = Object.keys(CATEGORY_MAP);

const LANGUAGES = ["en", "fr", "ar"];

const compressImageBeforeUpload = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800; 
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Compression failed"));
            const compressedFile = new File(
              [blob], 
              file.name.replace(/\.[^/.]+$/, "") + ".webp", 
              { type: "image/webp", lastModified: Date.now() }
            );
            resolve(compressedFile);
          },
          "image/webp",
          0.75 
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

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
  const [newAdminPin, setNewAdminPin] = useState("");
  const [newCashierPin, setNewCashierPin] = useState("");
  
  const [maxCashiers, setMaxCashiers] = useState("2"); 
  
  const [activeCashiers, setActiveCashiers] = useState(0);

  const [activeTab, setActiveTab] = useState("products"); 
  const [products, setProducts] = useState<any[]>([]);
  const [cafeId, setCafeId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  const [monthlyOrders, setMonthlyOrders] = useState<any[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [isLoadingSales, setIsLoadingSales] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameFr, setNameFr] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("القهوة");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [tableNum, setTableNum] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [qrReady, setQrReady] = useState(false);

  const [tablesList, setTablesList] = useState<any[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);

  // 🌟 Modal States
  const [tableToDelete, setTableToDelete] = useState<string | null>(null);
  const [deleteUnderstood, setDeleteUnderstood] = useState(false);
  const [isDeletingTable, setIsDeletingTable] = useState(false);

  const fetchTables = async (cId: string) => {
    setIsLoadingTables(true);
    const res = await getAdminTables(cId);
    if (res.success) setTablesList(res.tables);
    setIsLoadingTables(false);
  };

  const openDeleteModal = (tableId: string) => {
    setTableToDelete(tableId);
    setDeleteUnderstood(false);
  };

  const closeDeleteModal = () => {
    setTableToDelete(null);
    setDeleteUnderstood(false);
  };

  const confirmDeleteTable = async () => {
    if (!tableToDelete || !deleteUnderstood) return;
    
    setIsDeletingTable(true);
    
    // Optimistic Update
    setTablesList(prev => prev.filter(t => t.id !== tableToDelete));

    const res = await adminDeleteTable(tableToDelete);
    
    if (!res.success) {
      alert(t.deleteFailed);
      if (cafeId) fetchTables(cafeId); // Revert on fail
    }

    setIsDeletingTable(false);
    closeDeleteModal();
  };

  const fetchProducts = async (cId: string) => {
    try {
      // 🔥 جلب مباشر وفوري من قاعدة البيانات يتخطى أي خطأ في السيرفر
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("cafe_id", cId)
        .order("created_at", { ascending: false }); // يجلب الأحدث أولاً

      if (error) {
        console.error("🚨 Supabase Fetch Error:", error.message);
        return;
      }

      if (data) {
        setProducts(data); // وضع المنتجات في الواجهة فوراً
      }
    } catch (err) {
      console.error("Fetch Products Catch:", err);
    }
  };

  const fetchMonthlySales = async (cId: string) => {
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
      
      if (!cafeRes.success || !cafeRes.cafe) {
        setIsNotFound(true);
        setIsLoading(false);
        return;
      }

      const cafeData = cafeRes.cafe;

      setCafeId(cafeData.id);
      if (cafeData.name) setCafeName(cafeData.name);
      if (cafeData.max_cashiers) setMaxCashiers(cafeData.max_cashiers.toString());
      
      if (cafeData.owner_email) {
        setOwnerEmail(cafeData.owner_email);
        
        const sessionKey = `admin_auth_${cafeSlug}`;
        if (sessionStorage.getItem(sessionKey) === 'true') {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user && user.email?.toLowerCase() === cafeData.owner_email.toLowerCase()) {
            setIsAuthenticated(true);
            await Promise.all([
              fetchProducts(cafeData.id),
              fetchMonthlySales(cafeData.id),
              fetchTables(cafeData.id)
            ]);
          } else {
            sessionStorage.removeItem(sessionKey);
            await supabase.auth.signOut();
            setIsAuthenticated(false);
          }
        }
      }
      setIsLoading(false);
    };
    initAdmin();
  }, [cafeSlug]);

  useEffect(() => {
    if (!cafeId || !isAuthenticated) return;

    const cashierChannel = supabase.channel(`cashier_slots_${cafeId}`);
    cashierChannel.on('presence', { event: 'sync' }, () => {
      const state = cashierChannel.presenceState();
      setActiveCashiers(Object.keys(state).length);
    }).subscribe();

    return () => {
      supabase.removeChannel(cashierChannel);
    };
  }, [cafeId, isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput || !cafeId) return;

    if (emailInput.toLowerCase() !== ownerEmail.toLowerCase()) {
      alert(t.accessDenied);
      return;
    }

    setIsChecking(true);
    const res = await signInAdminWithEmail(emailInput, passwordInput);
    setIsChecking(false);

    if (res.success) {
      if (res.session?.access_token && res.session?.refresh_token) {
        await supabase.auth.setSession({
          access_token: res.session.access_token,
          refresh_token: res.session.refresh_token,
        });
      }

      setIsAuthenticated(true);
      sessionStorage.setItem(`admin_auth_${cafeSlug}`, 'true');
      await Promise.all([
        fetchProducts(cafeId),
        fetchMonthlySales(cafeId),
        fetchTables(cafeId)
      ]);
    } else {
      alert(res.error || t.invalidLogin);
    }
  };

  const handleAutoRecovery = async () => {
    if (!ownerEmail) {
      alert(t.noOwnerEmail);
      return;
    }
    setIsChecking(true);
    const { error } = await supabase.auth.resetPasswordForEmail(ownerEmail);
    setIsChecking(false);
    
    if (!error) { 
      setAuthMode("otp"); 
      const maskedEmail = ownerEmail.replace(/^(.)(.*)(.@.*)$/, (_, a, b, c) => a + b.replace(/./g, '*') + c);
      alert(`${t.otpSent}${maskedEmail} 📩`); 
    } else {
      alert(t.sendError + error.message);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput || !ownerEmail) return;

    setIsChecking(true);
    const { error } = await supabase.auth.verifyOtp({
      email: ownerEmail,
      token: otpInput,
      type: 'recovery', 
    });
    setIsChecking(false);

    if (error) {
      alert(t.invalidOtp);
    } else {
      setAuthMode("reset");
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput) return;
    
    setIsChecking(true);
    const { error } = await supabase.auth.updateUser({ password: newPasswordInput });
    setIsChecking(false);

    if (error) {
      alert(t.passwordUpdateFail + error.message);
    } else {
      const loginRes = await signInAdminWithEmail(ownerEmail, newPasswordInput);
      if (!loginRes.success) {
        alert(loginRes.error || t.invalidLogin);
        return;
      }
      if (loginRes.session?.access_token && loginRes.session?.refresh_token) {
        await supabase.auth.setSession({
          access_token: loginRes.session.access_token,
          refresh_token: loginRes.session.refresh_token,
        });
      }

      alert(t.passwordUpdateSuccess);
      setIsAuthenticated(true);
      sessionStorage.setItem(`admin_auth_${cafeSlug}`, 'true');
      setAuthMode("login");
      if (cafeId) {
        await Promise.all([
          fetchProducts(cafeId),
          fetchMonthlySales(cafeId),
          fetchTables(cafeId)
        ]);
      }
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeId) return;
    setIsChecking(true);
    
    const { success } = await updateCafeSettings(cafeId, cafeName, newAdminPin, newCashierPin, Number(maxCashiers), 0);
    
    setIsChecking(false);
    if (success) { alert(t.settingsSaved); setNewAdminPin(""); setNewCashierPin(""); }
    else alert(t.settingsSaveError);
  };

  const resetForm = () => {
    setEditingId(null); setName(""); setNameEn(""); setNameFr(""); setDescription(""); setPrice(""); setImageFile(null);
  };

  const handleAddOrUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeId || !name || !price || (!imageFile && !editingId)) return alert(t.fillFields);
    setIsUploading(true);
    try {
      let finalImageUrl = undefined;
      
      if (imageFile) {
        const optimizedFile = await compressImageBeforeUpload(imageFile);
        const fileName = `${Date.now()}-${Math.random()}.webp`; 

        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, optimizedFile);
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;

        if (editingId) {
          const oldProduct = products.find(p => p.id === editingId);
          if (oldProduct && oldProduct.image_url) {
            const oldFileName = oldProduct.image_url.split('/').pop();
            if (oldFileName) await supabase.storage.from('products').remove([oldFileName]);
          }
        }
      }
      
      const productData: any = { name_ar: name, name_en: nameEn, name_fr: nameFr, description_ar: description, price: parseFloat(price), category: category };
      if (finalImageUrl) productData.image_url = finalImageUrl;

      if (editingId) {
        const { success } = await adminUpdateProduct(editingId, productData);
        if (success) alert(t.updatedSuccess); else throw new Error();
      } else {
        productData.cafe_id = cafeId; productData.is_active = true;
        const { success } = await adminAddProduct(productData);
        if (success) alert(t.addedSuccess); else throw new Error();
      }
      resetForm(); fetchProducts(cafeId);
    } catch (err: any) { alert(t.errorPrefix + (err.message || t.errorPrefix)); } finally { setIsUploading(false); }
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm(t.confirmDelete)) return;
    try {
      if (imageUrl) {
        const fileName = imageUrl.split('/').pop();
        if (fileName) await supabase.storage.from('products').remove([fileName]);
      }
      const { success } = await adminDeleteProduct(id);
      if (success) fetchProducts(cafeId!);
    } catch (err) { alert(t.deleteFailed); }
  };

  const handleEditClick = (product: any) => {
    setEditingId(product.id); setName(product.name_ar || ""); setNameEn(product.name_en || ""); setNameFr(product.name_fr || "");
    setDescription(product.description_ar || ""); setPrice(product.price.toString()); setCategory(product.category); setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerateSmartQR = async () => {
    if (!tableNum || !cafeId) return;
    setIsGeneratingQr(true);
    setQrReady(false);
    const formattedTableNumber = `table_${tableNum}`;

    const { success } = await adminCheckOrAddTable(cafeId, formattedTableNumber);
    
    if (success) {
      const baseUrl = window.location.origin;
      setQrUrl(`${baseUrl}/${cafeSlug}/${formattedTableNumber}`);
      setQrReady(true);
      fetchTables(cafeId);
    } else {
      alert(t.qrError);
    }
    
    setIsGeneratingQr(false);
  };

  const handlePrint = () => { window.print(); };

  const LanguageToggle = () => (
    <div className="flex bg-muted/60 p-1 rounded-full w-max border" dir="ltr">
      {LANGUAGES.map(lang => (
        <button
          key={lang}
          onClick={() => setActiveLang(lang)}
          className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-colors ${activeLang === lang ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
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
          
          {authMode === "reset" ? (
            <div className="bg-emerald-500/10 w-20 h-20 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto mb-6 shadow-inner"><KeyRound size={36} /></div>
          ) : (
            <div className="bg-primary/10 w-20 h-20 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6 shadow-inner"><Lock size={36} /></div>
          )}
          
          <h2 className="text-2xl font-black mb-2 tracking-tight">
            {authMode === "login" && t.loginTitle}
            {authMode === "otp" && t.otpTitle}
            {authMode === "reset" && t.resetTitle}
          </h2>
          <p className="text-muted-foreground mb-8 text-sm font-bold">
            {authMode === "login" && t.loginSub}
            {authMode === "otp" && t.otpSub}
            {authMode === "reset" && t.resetSub}
          </p>
          
          {authMode === "login" && (
            <form onSubmit={handleLogin} className={`flex flex-col gap-4 ${activeLang === 'ar' ? 'text-right' : 'text-left'}`}>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 px-1">{t.emailLabel}</label>
                <input required type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="w-full border-2 border-border rounded-2xl p-4 text-left font-mono text-sm focus:border-primary outline-none bg-muted/20 transition-colors" placeholder={t.emailPlaceholder} autoFocus disabled={isChecking} dir="ltr" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 px-1">{t.passwordLabel}</label>
                <input required type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full border-2 border-border rounded-2xl p-4 text-left font-mono text-sm focus:border-primary outline-none bg-muted/20 transition-colors" placeholder="••••••••" disabled={isChecking} dir="ltr" />
              </div>
              <button disabled={isChecking} type="submit" className="py-4 rounded-2xl font-black text-base text-white bg-foreground hover:opacity-90 mt-2 shadow-xl transition-all active:scale-95">
                {isChecking ? t.authLoading : t.loginBtn}
              </button>
              
              <button type="button" onClick={handleAutoRecovery} disabled={isChecking} className="text-xs text-primary font-bold mt-3 hover:underline text-center block w-full disabled:opacity-50">
                {t.forgotPassword}
              </button>
            </form>
          )}

          {authMode === "otp" && (
            <form onSubmit={handleVerifyOtp} className={`flex flex-col gap-4 animate-in fade-in zoom-in duration-300 ${activeLang === 'ar' ? 'text-right' : 'text-left'}`}>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 px-1">{t.otpLabel}</label>
                <input 
                  required 
                  type="text" 
                  value={otpInput} 
                  onChange={(e) => setOtpInput(e.target.value)} 
                  className="w-full border-2 border-border rounded-2xl p-4 text-center font-mono text-2xl tracking-[0.5em] focus:border-primary outline-none bg-muted/20 transition-colors" 
                  placeholder="••••••" 
                  autoFocus 
                  disabled={isChecking} 
                  maxLength={6} 
                  dir="ltr"
                />
              </div>
              <button disabled={isChecking || otpInput.length < 6} type="submit" className="py-4 rounded-2xl font-black text-base text-white bg-primary hover:opacity-90 mt-2 shadow-xl transition-all active:scale-95 disabled:opacity-50">
                {isChecking ? t.verifying : t.verifyBtn}
              </button>
              
              <button type="button" onClick={() => setAuthMode("login")} className="text-xs text-muted-foreground font-bold mt-3 hover:underline text-center block w-full">
                {t.backToLogin}
              </button>
            </form>
          )}

          {authMode === "reset" && (
            <form onSubmit={handleSetNewPassword} className={`flex flex-col gap-4 animate-in fade-in zoom-in duration-300 ${activeLang === 'ar' ? 'text-right' : 'text-left'}`}>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 px-1">{t.newPasswordLabel}</label>
                <input 
                  required 
                  type="text" 
                  value={newPasswordInput} 
                  onChange={(e) => setNewPasswordInput(e.target.value)} 
                  className={`w-full border-2 border-emerald-500/50 rounded-2xl p-4 font-mono text-sm focus:border-emerald-500 outline-none bg-emerald-50 transition-colors ${activeLang === 'ar' ? 'text-right' : 'text-left'}`} 
                  placeholder={t.newPasswordPlaceholder} 
                  autoFocus 
                  disabled={isChecking} 
                  dir="auto"
                />
              </div>
              <button disabled={isChecking || newPasswordInput.length < 6} type="submit" className="py-4 rounded-2xl font-black text-base text-white bg-emerald-500 hover:bg-emerald-600 mt-2 shadow-xl transition-all active:scale-95 disabled:opacity-50">
                {isChecking ? t.saving : t.saveLoginBtn}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-border flex flex-col items-center gap-3">
            <p className="text-xs text-muted-foreground font-bold">{t.supportText}</p>
            <a 
              href="https://wa.me/212781991384" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center justify-center gap-2 w-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 py-3.5 rounded-2xl font-bold text-sm transition-colors"
            >
              <MessageCircle size={20} />
              {t.supportBtn}
            </a>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 p-6 md:p-12 font-sans" dir={dir}>
      <style dangerouslySetInnerHTML={{__html: `@media print { body * { visibility: hidden; } #qr-print-area, #qr-print-area * { visibility: visible; } #qr-print-area { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 100%; text-align: center; } }`}} />

      <header className="mb-8 flex flex-col xl:flex-row xl:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-border gap-4">
        <div><h1 className="text-3xl font-extrabold text-foreground">{t.adminDashboard}</h1><p className="text-muted-foreground mt-1">{t.totalControl}</p></div>
        <div className="flex items-center gap-4 flex-wrap">
          <LanguageToggle />
          <div className="flex flex-wrap bg-muted p-1 rounded-xl gap-1">
            <button onClick={() => setActiveTab('products')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm ${activeTab === 'products' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}><PackageSearch size={18} /> {t.tabMenu}</button>
            <button onClick={() => setActiveTab('qr')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm ${activeTab === 'qr' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}><QrCode size={18} /> {t.tabTables}</button>
            
            <button onClick={() => { setActiveTab('sales'); cafeId && fetchMonthlySales(cafeId); }} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm ${activeTab === 'sales' ? 'bg-white text-emerald-600 shadow-sm' : 'text-muted-foreground'}`}>
              <TrendingUp size={18} /> {t.tabSales}
            </button>

            <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm ${activeTab === 'settings' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}><Settings size={18} /> {t.tabSettings}</button>
            <button onClick={() => setActiveTab('billing')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm ${activeTab === 'billing' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}><CreditCard size={18} /> {t.tabBilling}</button>
          </div>
        </div>
      </header>

      {activeTab === 'sales' && (
        <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground block">{t.currentMonthIncome}</span>
                <h3 className="text-3xl font-black text-emerald-600 mt-1">{monthlyIncome.toFixed(2)} <span className="text-sm font-bold text-muted-foreground">MAD</span></h3>
              </div>
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0"><DollarSign size={28}/></div>
            </div>

            <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground block">{t.completedOrders}</span>
                <h3 className="text-3xl font-black text-foreground mt-1">{monthlyOrders.length} <span className="text-sm font-bold text-muted-foreground">{t.tabMenu === 'Menu' ? 'Orders' : 'طلب'}</span></h3>
              </div>
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shrink-0"><CheckCircle2 size={28}/></div>
            </div>

            <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground block">{t.avgCustomerSpend}</span>
                <h3 className="text-3xl font-black text-primary mt-1">
                  {monthlyOrders.length > 0 ? (monthlyIncome / monthlyOrders.length).toFixed(2) : "0.00"} <span className="text-sm font-bold text-muted-foreground">MAD</span>
                </h3>
              </div>
              <div className="p-4 bg-primary/10 text-primary rounded-2xl shrink-0"><TrendingUp size={28}/></div>
            </div>
          </div>

          <div className="bg-white p-6 lg:p-8 rounded-3xl border shadow-sm">
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
              <div>
                <h3 className="font-extrabold text-xl">{t.salesLogTitle} {new Date().toLocaleString(activeLang === 'ar' ? 'ar-MA' : activeLang === 'fr' ? 'fr-FR' : 'en-US', { month: 'long' })}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t.salesLogSub}</p>
              </div>
              <button onClick={() => cafeId && fetchMonthlySales(cafeId)} className="p-2.5 bg-muted rounded-xl hover:bg-gray-200 text-xs font-bold flex items-center gap-1.5 transition-colors">
                <History size={16}/> {t.refreshLog}
              </button>
            </div>

            {isLoadingSales ? (
              <div className="py-12 text-center font-bold text-muted-foreground">{t.calculatingIncome}</div>
            ) : monthlyOrders.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground border-2 border-dashed rounded-2xl font-bold">
                {t.noSalesMonth}
              </div>
            ) : (
              <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                {monthlyOrders.map((ord) => (
                  <div key={ord.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/15 border rounded-2xl gap-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black shrink-0 text-lg">✓</div>
                      <div>
                        <div className="font-extrabold text-sm flex items-center gap-2">
                          <span>{t.table} {ord.tables?.table_number?.replace('table_', '') || t.directPos}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">#{ord.id.split('-')[0]}</span>
                        </div>
                        <div className="text-xs text-muted-foreground font-bold mt-1 leading-relaxed">
                          {ord.items.map((it:any) => `${it.quantity}x ${activeLang === 'en' && it.name_en ? it.name_en : activeLang === 'fr' && it.name_fr ? it.name_fr : it.name_ar}`).join(' + ')}
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                      <span className="text-base font-black text-emerald-600 font-mono">{Number(ord.total_amount).toFixed(2)} MAD</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{new Date(ord.created_at).toLocaleString(activeLang === 'ar' ? 'ar-MA' : activeLang === 'fr' ? 'fr-FR' : 'en-US')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
          
          <div className="bg-white p-6 rounded-3xl border border-border shadow-sm flex flex-col sm:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="font-extrabold text-lg mb-1 flex items-center gap-2">
                <MonitorSmartphone className="text-primary"/> {t.connectedDevices}
              </h3>
              <p className="text-xs text-muted-foreground font-bold">{t.liveMonitoring}</p>
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
              <div className="flex-1 sm:flex-none text-center px-6 py-4 bg-muted/20 border rounded-2xl">
                <span className="block text-xs font-bold text-muted-foreground mb-1">{t.cashierSlot}</span>
                <div className="flex items-baseline justify-center gap-1" dir="ltr">
                  <span className={`text-3xl font-black ${activeCashiers > 0 ? 'text-emerald-500 animate-pulse' : 'text-slate-300'}`}>
                    {activeCashiers}
                  </span>
                  <span className="text-sm font-bold text-muted-foreground">/ {maxCashiers}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 lg:p-10 rounded-3xl shadow-sm border border-border">
            <h2 className="text-2xl font-bold mb-6 border-b pb-4">{t.cafeSettings}</h2>
            <form onSubmit={handleUpdateSettings} className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2">{t.cafeNameLabel}</label>
                <input type="text" required value={cafeName} onChange={(e) => setCafeName(e.target.value)} className={`w-full border border-border rounded-xl p-3 bg-muted/30 font-bold ${activeLang === 'ar' ? 'text-right' : 'text-left'}`} />
              </div>
              
              <div>
                <label className="block text-xs font-bold mb-1 text-primary">{t.maxCashierLabel}</label>
                <input type="number" min="1" max="10" required value={maxCashiers} onChange={(e) => setMaxCashiers(e.target.value)} className="w-full border-2 border-primary/30 rounded-xl p-3 bg-primary/5 font-bold text-xl text-center focus:border-primary outline-none" dir="ltr" />
              </div>

              <div className="pt-4 border-t border-border/50">
                <label className="block text-sm font-bold mb-2">{t.adminPinLabel}</label>
                <input type="text" value={newAdminPin} onChange={(e) => setNewAdminPin(e.target.value)} className="w-full border border-border rounded-xl p-3 bg-muted/30 font-mono text-center" placeholder={t.leaveEmptyToKeep} dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">{t.staffPinLabel}</label>
                <input type="text" value={newCashierPin} onChange={(e) => setNewCashierPin(e.target.value)} className="w-full border border-border rounded-xl p-3 bg-muted/30 font-mono text-center tracking-widest" placeholder="••••" dir="ltr" />
              </div>
              
              <button disabled={isChecking} type="submit" className="w-full bg-foreground text-white py-4 rounded-2xl font-black mt-4 shadow-xl active:scale-95 transition-all">
                {isChecking ? t.saving : t.saveChangesBtn}
              </button>
            </form>
          </div>
          
        </div>
      )}

      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-border h-fit relative">
            {editingId && <button onClick={resetForm} className={`absolute top-6 ${activeLang === 'ar' ? 'left-6' : 'right-6'} text-muted-foreground hover:text-red-500`}><X size={24} /></button>}
            <h2 className="text-xl font-bold mb-6 border-b pb-4">{editingId ? t.editProduct : t.addProduct}</h2>
            <form onSubmit={handleAddOrUpdateProduct} className="space-y-4">
              <div><label className="block text-sm font-bold mb-2">{t.nameAr}</label><input required type="text" value={name} onChange={(e) => setName(e.target.value)} className={`w-full border border-border rounded-xl p-3 bg-muted/30 ${activeLang === 'ar' ? 'text-right' : 'text-left'}`} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold mb-2">EN</label><input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} className={`w-full border border-border rounded-xl p-3 bg-muted/30 ${activeLang === 'ar' ? 'text-right' : 'text-left'}`} /></div>
                <div><label className="block text-sm font-bold mb-2">FR</label><input type="text" value={nameFr} onChange={(e) => setNameFr(e.target.value)} className={`w-full border border-border rounded-xl p-3 bg-muted/30 ${activeLang === 'ar' ? 'text-right' : 'text-left'}`} /></div>
              </div>
              <div><label className="block text-sm font-bold mb-2">{t.descLabel}</label><textarea required value={description} onChange={(e) => setDescription(e.target.value)} className={`w-full border border-border rounded-xl p-3 bg-muted/30 ${activeLang === 'ar' ? 'text-right' : 'text-left'}`} rows={2} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold mb-2">{t.priceLabel}</label><input required type="number" step="0.5" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border border-border rounded-xl p-3 bg-muted/30" dir="ltr" /></div>
                <div>
                  <label className="block text-sm font-bold mb-2">{t.categoryLabel}</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={`w-full border border-border rounded-xl p-3 bg-muted/30 ${activeLang === 'ar' ? 'text-right' : 'text-left'}`}>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{CATEGORY_MAP[cat][activeLang]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">{t.imageLabel}</label>
                <div className="border-2 border-dashed border-primary/50 rounded-xl p-4 text-center cursor-pointer relative"><input required={!editingId} type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0" /><div className="text-primary font-bold">{imageFile ? imageFile.name : editingId ? t.changeImage : t.chooseImage}</div></div>
              </div>
              <button disabled={isUploading} type="submit" className={`w-full text-white py-4 rounded-xl font-bold shadow-lg ${editingId ? 'bg-blue-500' : 'bg-primary'}`}>{isUploading ? t.saving : editingId ? t.saveEdit : t.publishProduct}</button>
            </form>
          </div>
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-border">
            <h2 className="text-xl font-bold mb-6 border-b pb-4">{t.currentProducts}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map(product => (
                <div key={product.id} className="flex gap-4 border border-border/50 p-3 rounded-2xl items-center bg-muted/10">
                  <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-muted"><img src={product.image_url} alt={product.name_ar} className="w-full h-full object-cover" /></div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">
                      {activeLang === 'en' && product.name_en ? product.name_en : activeLang === 'fr' && product.name_fr ? product.name_fr : product.name_ar}
                    </h3>
                    <p className="text-sm text-primary font-bold" dir="ltr">{product.price} MAD</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditClick(product)} className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center hover:bg-blue-500 hover:text-white"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(product.id, product.image_url)} className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'qr' && (
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-border flex flex-col items-center max-w-2xl mx-auto mt-10 text-center">
          <div className="bg-primary/10 p-4 rounded-full text-primary mb-4"><QrCode size={48} /></div>
          <h2 className="text-2xl font-bold mb-2">{t.qrTitle}</h2>
          <p className="text-muted-foreground mb-6 text-sm">{t.qrSub}</p>
          
          <div className="flex flex-col w-full max-w-sm gap-4 mb-8">
            <div className={`flex items-center gap-4 bg-muted/30 p-4 rounded-2xl w-full border ${activeLang === 'ar' ? 'flex-row' : 'flex-row'}`}>
              <label className="font-bold text-lg whitespace-nowrap">{t.tableNumLabel}</label>
              <input type="number" value={tableNum} onChange={(e) => {setTableNum(e.target.value); setQrReady(false);}} className="border rounded-xl p-3 w-full text-center font-bold text-xl bg-white focus:outline-primary" min="1" dir="ltr"/>
            </div>
            <button onClick={handleGenerateSmartQR} disabled={isGeneratingQr || !tableNum} className="bg-primary text-white py-4 rounded-2xl font-bold flex justify-center items-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {isGeneratingQr ? <><Loader2 className="animate-spin" size={20} /> {t.processing}</> : <><CheckCircle2 size={20} /> {t.generateQrBtn}</>}
            </button>
          </div>

          {qrReady && (
            <>
              <div id="qr-print-area" className="bg-white p-10 rounded-3xl border-4 border-foreground w-full max-w-md animate-in zoom-in duration-300">
                <h3 className="text-3xl font-extrabold mb-2">{cafeName || "Cafe"}</h3>
                <p className="text-lg font-bold text-primary mb-8 border-b-2 pb-4">{t.table} {tableNum}</p>
                <div className="p-4 inline-block"><QRCode value={qrUrl} size={220} level="H" /></div>
                <p className="mt-8 text-lg font-bold">{t.scanToOrder}</p>
              </div>
              <button onClick={handlePrint} className="mt-8 bg-foreground text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-3 text-lg hover:scale-105 transition-transform"><Printer size={24} /> {t.printBtn}</button>
            </>
          )}

          <div className="w-full mt-16 pt-8 border-t border-border/50 animate-in fade-in duration-500">
            <h3 className="text-xl font-extrabold mb-6 flex items-center justify-center gap-2">
              {activeLang === 'ar' ? 'الطاولات المسجلة حالياً' : activeLang === 'fr' ? 'Tables Enregistrées' : 'Registered Tables'} 
              <span className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full font-black">{tablesList.length}</span>
            </h3>
            
            {isLoadingTables ? (
              <div className="flex justify-center p-6"><Loader2 className="animate-spin text-primary" size={32} /></div>
            ) : tablesList.length === 0 ? (
              <p className="text-muted-foreground text-sm font-bold bg-muted/20 p-6 rounded-2xl border border-dashed">
                {activeLang === 'ar' ? 'لا توجد طاولات مسجلة بعد.' : 'No tables registered yet.'}
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {tablesList.map(t => (
                  <div key={t.id} className="bg-muted/10 border border-border/50 rounded-2xl p-4 flex justify-between items-center hover:bg-muted/30 transition-colors shadow-sm">
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase">{activeLang === 'ar' ? 'طاولة' : 'Table'}</span>
                      <span className="font-black text-2xl text-foreground font-mono">{t.table_number.replace('table_', '')}</span>
                    </div>
                    <button 
                      onClick={() => openDeleteModal(t.id)} 
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2.5 rounded-xl transition-all active:scale-90"
                      title={activeLang === 'ar' ? 'حذف الطاولة' : 'Delete Table'}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {activeTab === 'billing' && (
        <BillingTab cafeId={cafeId!} cafeName={cafeName} />
      )}

      {/* 🛑 Delete Confirmation Modal Overlay */}
      {tableToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={closeDeleteModal} className="absolute top-6 right-6 text-muted-foreground hover:text-foreground bg-muted/50 p-2 rounded-full transition-colors">
              <X size={20} />
            </button>
            
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle size={32} />
            </div>
            
            <h2 className="text-2xl font-black text-center mb-4">{t.deleteWarningTitle}</h2>
            <p className="text-muted-foreground text-center text-sm font-bold leading-relaxed mb-8">
              {t.deleteWarningDesc}
            </p>

            <label className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl cursor-pointer mb-8 hover:bg-red-100/50 transition-colors">
              <input 
                type="checkbox" 
                checked={deleteUnderstood} 
                onChange={(e) => setDeleteUnderstood(e.target.checked)}
                className="mt-1 w-5 h-5 accent-red-500 cursor-pointer"
              />
              <span className="text-sm font-bold text-red-900 leading-snug select-none">
                {t.understandCheckbox}
              </span>
            </label>

            <div className="flex gap-3">
              <button onClick={closeDeleteModal} disabled={isDeletingTable} className="flex-1 py-4 font-bold rounded-2xl bg-muted text-foreground hover:bg-muted/80 transition-colors">
                {t.cancelBtn}
              </button>
              <button 
                onClick={confirmDeleteTable} 
                disabled={!deleteUnderstood || isDeletingTable} 
                className="flex-1 py-4 font-bold rounded-2xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
              >
                {isDeletingTable ? <Loader2 className="animate-spin" size={20} /> : t.confirmDeleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}