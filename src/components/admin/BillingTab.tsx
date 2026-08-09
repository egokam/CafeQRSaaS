"use client";

import { useState, useEffect } from "react";
import { 
  CreditCard, 
  CheckCircle2, 
  Zap, 
  Shield, 
  ArrowRight, 
  Loader2, 
  History,
  AlertCircle,
  Gem,
  AlertTriangle,
  Timer,
  X,
  Copy,
  Check,
  UploadCloud,
  Banknote,
  Clock
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { sendTelegramReceipt } from "@/actions/payment";

interface BillingTabProps {
  cafeId: string;
  cafeName: string;
  planType?: string | null;
  billingCycle?: string;
  activeLang?: string;
  t?: any;
}

const BANK_INFO = {
  bankName: "CIH BANK",
  rib: "230 041 5408548211022800 94",
  holder: "KAMAL EL OTMANI",
};

export default function BillingTab({ cafeId, cafeName, activeLang = 'en', t }: BillingTabProps) {
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [currentCycle, setCurrentCycle] = useState<string>("monthly");
  const [subStatus, setSubStatus] = useState<string>("active");
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [hasPendingReceipt, setHasPendingReceipt] = useState(false);
  const [pendingReceiptId, setPendingReceiptId] = useState<string | null>(null); // 🌟 تتبع الإيصال المعلق
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCycle, setSelectedCycle] = useState<"monthly" | "yearly">("monthly");

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  const dir = activeLang === 'ar' ? 'rtl' : 'ltr';

  const translations = {
    ar: {
      billingAndSub: "الفوترة والاشتراك",
      manageDesc: "إدارة باقة المقهى وحدود أجهزة نقطة البيع (POS).",
      currentPlan: "الباقة الحالية",
      status: "الحالة",
      timeRemaining: "الوقت المتبقي",
      expired: "منتهي",
      active: "نشط",
      paused: "موقوف",
      pending: "قيد المراجعة",
      days: "أيام",
      monthly: "شهري",
      yearly: "سنوي",
      freeMonths: "شهران مجاناً",
      inactiveTitle: "تم إيقاف الاشتراك (إيصال مرفوض)",
      inactiveDesc: "لقد تم رفض الإيصال الأخير الذي قمت برفعه وإيقاف حسابك كلياً.",
      rejectionReason: "سبب الرفض الموضح من الإدارة:",
      uploadCorrect: "يرجى اختيار باقة وإعادة رفع إيصال تحويل فوري صحيح لإعادة التفعيل.",
      pendingRequestTitle: "طلبك قيد المراجعة ⏳",
      pendingRequestDesc: "لقد قمت برفع إيصال دفع وهو الآن قيد المراجعة من طرف الإدارة. حالة حسابك الحالية ستبقى كما هي حتى يتم الرد على طلبك.",
      inactivePlan: "باقة غير مفعلة",
      activePlan: "الباقة النشطة",
      mo: "شهر",
      yr: "سنة",
      currentPlanBtn: "الباقة الحالية",
      upgradeTo: "طلب الاشتراك في",
      paymentHistory: "سجل المدفوعات",
      invoicesAppearHere: "ستظهر الفواتير هنا.",
      warningTitle: "تنبيه الاشتراك",
      warningDesc: "تقديم طلب باقة جديدة سيضيف المدة لاشتراكك إذا تم قبوله. هل تريد المتابعة؟",
      cancel: "إلغاء",
      proceed: "نعم، المتابعة للدفع",
      bankTransfer: "الدفع عبر التحويل البنكي",
      transferDesc: "قم بالتحويل ثم ارفع الإيصال لإرسال طلب التفعيل للإدارة.",
      instantWarning: "لضمان قبول طلبك بسرعة، يجب أن يكون التحويل بنكياً فورياً (Virement Instantané).",
      amountReq: "المبلغ المطلوب:",
      bank: "البنك:",
      beneficiary: "المستفيد:",
      copyRib: "نسخ RIB",
      copied: "تم النسخ",
      screenshot: "صورة إيصال التحويل (Screenshot):",
      changeImg: "تغيير الصورة",
      uploadHere: "اضغط هنا لرفع صورة الإيصال",
      confirmSend: "تأكيد وإرسال الإيصال للإدارة",
      successMsg: "✅ تم استلام الإيصال! طلبك الآن قيد المراجعة.",
      errorMsg: "حدث خطأ أثناء معالجة الإيصال: ",
      alreadyPending: "لديك طلب تفعيل قيد المراجعة بالفعل. يرجى انتظار رد الإدارة قبل تقديم طلب جديد.",
      cancelRequest: "إلغاء الطلب المعلق",
      cancelConfirm: "هل أنت متأكد من إلغاء طلب التفعيل المعلق؟ لتتمكن من اختيار باقة أخرى؟"
    },
    fr: {
      billingAndSub: "Facturation et Abonnement",
      manageDesc: "Gérez le forfait de votre café et les limites des terminaux POS.",
      currentPlan: "Forfait Actuel",
      status: "Statut",
      timeRemaining: "Temps Restant",
      expired: "EXPIRÉ",
      active: "ACTIF",
      paused: "SUSPENDU",
      pending: "EN ATTENTE",
      days: "Jours",
      monthly: "Mensuel",
      yearly: "Annuel",
      freeMonths: "2 Mois GRATUITS",
      inactiveTitle: "Abonnement suspendu (Reçu rejeté)",
      inactiveDesc: "Le dernier reçu que vous avez téléchargé a été rejeté et votre compte a été totalement suspendu.",
      rejectionReason: "Raison du rejet par l'administration :",
      uploadCorrect: "Veuillez choisir un forfait et télécharger un reçu valide pour réactiver.",
      pendingRequestTitle: "Demande en cours d'examen ⏳",
      pendingRequestDesc: "Vous avez soumis un reçu. Le statut actuel de votre compte restera inchangé jusqu'à ce que l'administration valide votre demande.",
      inactivePlan: "FORFAIT INACTIF",
      activePlan: "FORFAIT ACTIF",
      mo: "mois",
      yr: "an",
      currentPlanBtn: "Forfait Actuel",
      upgradeTo: "Demander",
      paymentHistory: "Historique des Paiements",
      invoicesAppearHere: "Les factures apparaîtront ici.",
      warningTitle: "Avertissement d'abonnement",
      warningDesc: "Soumettre une nouvelle demande ajoutera la durée à votre abonnement si accepté. Voulez-vous continuer ?",
      cancel: "Annuler",
      proceed: "Oui, Payer",
      bankTransfer: "Paiement par Virement Bancaire",
      transferDesc: "Effectuez le virement puis téléchargez le reçu pour l'envoyer à l'administration.",
      instantWarning: "Pour garantir une acceptation rapide, le virement doit être instantané.",
      amountReq: "Montant requis :",
      bank: "Banque :",
      beneficiary: "Bénéficiaire :",
      copyRib: "Copier RIB",
      copied: "Copié",
      screenshot: "Capture d'écran du reçu :",
      changeImg: "Changer l'image",
      uploadHere: "Cliquez ici pour télécharger le reçu",
      confirmSend: "Confirmer et envoyer à l'administration",
      successMsg: "✅ Reçu téléchargé ! Votre demande est en cours d'examen.",
      errorMsg: "Une erreur s'est produite : ",
      alreadyPending: "Vous avez déjà une demande en attente. Veuillez patienter la réponse de l'administration.",
      cancelRequest: "Annuler la demande en attente",
      cancelConfirm: "Êtes-vous sûr de vouloir annuler cette demande en attente ?"
    },
    en: {
      billingAndSub: "Billing & Subscription",
      manageDesc: "Manage your cafe's plan and POS hardware limits.",
      currentPlan: "Current Plan",
      status: "Status",
      timeRemaining: "Time Remaining",
      expired: "EXPIRED",
      active: "ACTIVE",
      paused: "PAUSED",
      pending: "PENDING",
      days: "Days",
      monthly: "Monthly",
      yearly: "Yearly",
      freeMonths: "2 Months FREE",
      inactiveTitle: "Subscription Paused (Receipt Rejected)",
      inactiveDesc: "Your last receipt was rejected and your account was suspended.",
      rejectionReason: "Rejection reason from administration:",
      uploadCorrect: "Please choose a plan and re-upload a valid receipt to reactivate.",
      pendingRequestTitle: "Request Under Review ⏳",
      pendingRequestDesc: "Your uploaded receipt is being reviewed. Your current account status remains unchanged until approved.",
      inactivePlan: "INACTIVE PLAN",
      activePlan: "ACTIVE PLAN",
      mo: "mo",
      yr: "yr",
      currentPlanBtn: "Current Plan",
      upgradeTo: "Request",
      paymentHistory: "Payment History",
      invoicesAppearHere: "Invoices will appear here.",
      warningTitle: "Subscription Notice",
      warningDesc: "Submitting a new request will add duration to your sub if accepted. Proceed?",
      cancel: "Cancel",
      proceed: "Yes, Proceed",
      bankTransfer: "Bank Transfer Payment",
      transferDesc: "Transfer the amount then upload the receipt to submit to admin.",
      instantWarning: "For fast approval, the transfer MUST be an instant bank transfer.",
      amountReq: "Amount Required:",
      bank: "Bank:",
      beneficiary: "Beneficiary:",
      copyRib: "Copy RIB",
      copied: "Copied",
      screenshot: "Transfer Receipt (Screenshot):",
      changeImg: "Change Image",
      uploadHere: "Click here to upload receipt",
      confirmSend: "Confirm & Submit to Admin",
      successMsg: "✅ Receipt uploaded! Request under review.",
      errorMsg: "An error occurred: ",
      alreadyPending: "You already have a pending activation request. Please wait for the administration's response.",
      cancelRequest: "Cancel pending request",
      cancelConfirm: "Are you sure you want to cancel this pending request to choose another plan?"
    }
  };

  const l = translations[activeLang as keyof typeof translations] || translations.en;

  const PLANS = [
    {
      id: "silver",
      name: "Silver",
      target: "Perfect for small & emerging cafes",
      prices: { monthly: "249", yearly: "2,490" },
      icon: <Shield className="text-zinc-500" size={28} />,
      color: "bg-zinc-50 text-zinc-800 border-zinc-200",
      features: [
        "Unlimited QR orders with 0% commission",
        "1 POS Terminal to manage all tables centrally",
        "Automatic Kitchen Printing upon POS order confirmation",
        "Secure Staff PINs to track cashier shifts safely",
        "Instant menu updates (No more reprinting costs)",
        "Daily revenue tracking & simple dashboard"
      ]
    },
    {
      id: "gold",
      name: "Gold",
      target: "For busy cafes needing kitchen sync",
      prices: { monthly: "399", yearly: "3,990" },
      icon: <Zap className="text-amber-500" size={28} />,
      color: "bg-amber-50 text-amber-800 border-amber-300 shadow-amber-100/50",
      features: [
        "All Silver features, plus:",
        "Up to 3 POS Terminals to speed up checkout lines",
        "Insights to identify best-selling items & peak hours",
        "Priority WhatsApp support for quick fixes"
      ]
    },
    {
      id: "diamond",
      name: "Diamond",
      target: "For franchises & large operations",
      prices: { monthly: "799", yearly: "7,990" },
      icon: <Gem className="text-cyan-500" size={28} />,
      color: "bg-cyan-50 text-cyan-800 border-cyan-300 shadow-cyan-100/50",
      features: [
        "All Gold features, plus:",
        "Unlimited POS terminals & kitchen printers",
        "Custom domain branding (e.g., menu.yourcafe.ma)",
        "Done-for-you full menu data entry & system setup",
        "Multi-branch architecture ready",
        "24/7 direct phone & WhatsApp emergency hotline"
      ]
    }
  ];

  useEffect(() => {
    const fetchBillingDetails = async () => {
      setIsLoading(true);
      try {
        const { data: cafeData, error: cafeError } = await supabase
          .from("cafes")
          .select("plan_type, billing_cycle, subscription_status, subscription_ends_at") 
          .eq("id", cafeId)
          .single();

        if (!cafeError && cafeData) {
          setCurrentPlan(cafeData.plan_type || "silver");
          setCurrentCycle(cafeData.billing_cycle || "monthly");
          setSelectedCycle((cafeData.billing_cycle as "monthly" | "yearly") || "monthly");
          setSubStatus(cafeData.subscription_status || "active");
          
          if (cafeData.subscription_ends_at) {
            const ends = new Date(cafeData.subscription_ends_at);
            const diffDays = Math.ceil((ends.getTime() - Date.now()) / (1000 * 3600 * 24));
            setDaysRemaining(diffDays);
          }
        }

        // 🌟 فحص إذا كان هناك إيصال معلق
        const { data: pendingReceipts } = await supabase
          .from("payment_receipts")
          .select("id, requested_plan, requested_cycle")
          .eq("cafe_id", cafeId)
          .eq("status", "pending")
          .order("created_at", { ascending: false });
          
        if (pendingReceipts && pendingReceipts.length > 0) {
          const receipt = pendingReceipts[0];
          
          // 🌟 الحل الذكي: التنظيف التلقائي إذا تم التفعيل اليدوي المطابق من طرف السوبر أدمن
          if (
            cafeData?.subscription_status === "active" && 
            cafeData?.plan_type === receipt.requested_plan && 
            cafeData?.billing_cycle === receipt.requested_cycle
          ) {
            await supabase.from("payment_receipts").update({ status: "paid" }).eq("id", receipt.id);
            setHasPendingReceipt(false);
            setPendingReceiptId(null);
          } else {
            setHasPendingReceipt(true);
            setPendingReceiptId(receipt.id);
          }
        } else {
          setHasPendingReceipt(false);
          setPendingReceiptId(null);
        }

        if (cafeData?.subscription_status === "paused") {
          const { data: rejectedReceipt } = await supabase
            .from("payment_receipts")
            .select("rejection_reason")
            .eq("cafe_id", cafeId)
            .eq("status", "rejected")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
            
          if (rejectedReceipt?.rejection_reason) {
            setRejectionReason(rejectedReceipt.rejection_reason);
          }
        }
      } catch (err) {
        console.error("Error fetching plan:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (cafeId) fetchBillingDetails();
  }, [cafeId]);

  const isInvalidSub = subStatus === "paused" || daysRemaining < 0;

  // 🌟 دالة إلغاء الطلب المعلق
  const handleCancelRequest = async () => {
    if (!pendingReceiptId) return;
    if (!confirm(l.cancelConfirm)) return;
    
    setIsUploading(true);
    try {
      await supabase.from("payment_receipts").update({ status: "canceled" }).eq("id", pendingReceiptId);
      setHasPendingReceipt(false);
      setPendingReceiptId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleInitiateUpgrade = (planId: string) => {
    if (hasPendingReceipt) {
      alert(l.alreadyPending);
      return;
    }

    if (planId === currentPlan && selectedCycle === currentCycle) return;
    setPendingPlanId(planId);

    if (daysRemaining > 0) {
      setShowWarningModal(true);
    } else {
      setShowCheckoutModal(true);
    }
  };

  const proceedToCheckout = () => {
    setShowWarningModal(false);
    setShowCheckoutModal(true);
  };

  const handleCopyRib = () => {
    navigator.clipboard.writeText(BANK_INFO.rib.replace(/\s+/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUploadAndSubmit = async () => {
    if (hasPendingReceipt) {
      alert(l.alreadyPending);
      return;
    }

    if (!file || !pendingPlanId) return;
    setIsUploading(true);

    try {
      const selectedPlanData = PLANS.find(p => p.id === pendingPlanId);
      const amountStr = selectedPlanData?.prices[selectedCycle].replace(/,/g, '') || "0";
      const amountNum = parseInt(amountStr);

      const fileExt = file.name.split('.').pop();
      const fileName = `${cafeId}_${Date.now()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(filePath);
      const receiptUrl = publicUrlData.publicUrl;

      const { data: receiptData, error: dbError } = await supabase.from("payment_receipts").insert({
        cafe_id: cafeId,
        amount: amountNum,
        receipt_url: receiptUrl,
        bank_name: BANK_INFO.bankName,
        status: "pending",
        requested_plan: pendingPlanId,
        requested_cycle: selectedCycle
      }).select("id").single();

      if (dbError) throw dbError;

      try {
        await sendTelegramReceipt({
          receiptId: receiptData?.id || "N/A",
          cafeId: cafeId,
          cafeName: cafeName,
          amount: amountNum,
          receiptUrl: receiptUrl,
          planId: pendingPlanId,
          billingCycle: selectedCycle
        });
      } catch (tgError) {
        console.error("Telegram notification failed:", tgError);
      }

      alert(l.successMsg);
      window.location.reload();

    } catch (err: any) {
      alert(l.errorMsg + err.message);
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="animate-spin text-zinc-900" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300" dir={dir}>
      
      {/* 🌟 إشعار الطلب المعلق مع زر الإلغاء */}
      {hasPendingReceipt && (
        <div className="bg-indigo-50/80 border-2 border-indigo-500/20 p-6 rounded-3xl flex items-start gap-4 shadow-sm animate-in slide-in-from-top-4 relative">
          <button 
             disabled={isUploading}
             onClick={handleCancelRequest}
             className={`absolute top-4 ${dir === 'rtl' ? 'left-4' : 'right-4'} p-2 text-indigo-400 hover:text-indigo-700 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-full transition-colors disabled:opacity-50`}
             title={l.cancelRequest}
          >
             <X size={16} />
          </button>
          
          <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl shrink-0">
            <Clock size={28} className="animate-pulse" />
          </div>
          <div className="pr-8 rtl:pr-0 rtl:pl-8">
            <h3 className="text-xl font-black text-indigo-700">{l.pendingRequestTitle}</h3>
            <p className="text-indigo-700/80 font-medium mt-1">
              {l.pendingRequestDesc}
            </p>
          </div>
        </div>
      )}

      {subStatus === "paused" && rejectionReason && !hasPendingReceipt && (
        <div className="bg-rose-50/80 border-2 border-rose-500/20 p-6 rounded-3xl flex flex-col sm:flex-row items-start gap-4 shadow-sm animate-in slide-in-from-top-4">
          <div className="p-3 bg-rose-500/10 text-rose-600 rounded-2xl shrink-0">
            <AlertTriangle size={28} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-black text-rose-700">{l.inactiveTitle}</h3>
            <p className="text-rose-600/80 font-medium mt-1 mb-3">
              {l.inactiveDesc}
            </p>
            <div className="bg-white/80 p-4 rounded-xl border border-rose-100">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-1">{l.rejectionReason}</span>
              <p className="text-rose-800 font-bold font-mono">"{rejectionReason}"</p>
            </div>
            <p className="text-xs text-rose-500/80 mt-3 font-bold">
              {l.uploadCorrect}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-zinc-100 text-zinc-800 rounded-2xl shrink-0">
            <CreditCard size={32} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900">{cafeName} {l.billingAndSub}</h2>
            <p className="text-zinc-500 font-medium text-sm">{l.manageDesc}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="bg-zinc-50 px-5 py-3 rounded-2xl border border-zinc-200 text-center flex-1 min-w-[120px]">
            <span className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">{l.currentPlan}</span>
            <div className="text-lg font-black uppercase text-zinc-800 tracking-wider flex items-center justify-center gap-2">
              {currentPlan || "Silver"}
              <span className="text-[10px] bg-zinc-200/50 text-zinc-600 px-2 py-0.5 rounded-full">
                {currentCycle === 'yearly' ? 'YR' : 'MO'}
              </span>
            </div>
          </div>
          
          <div className={`px-5 py-3 rounded-2xl border text-center flex-1 min-w-[120px] ${isInvalidSub ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <span className={`block text-[10px] font-bold mb-1 uppercase tracking-wider ${isInvalidSub ? 'text-rose-400' : 'text-emerald-500'}`}>{l.status}</span>
            <div className={`text-lg font-black uppercase tracking-wider ${isInvalidSub ? 'text-rose-600' : 'text-emerald-600'}`}>
              {daysRemaining < 0 ? l.expired : subStatus === 'active' ? l.active : l.paused}
            </div>
          </div>

          <div className={`px-5 py-3 rounded-2xl border text-center flex-1 min-w-[120px] ${daysRemaining < 0 ? 'bg-rose-50 border-rose-200' : daysRemaining <= 5 ? 'bg-amber-50 border-amber-200' : 'bg-zinc-50 border-zinc-200'}`}>
            <span className={`block text-[10px] font-bold mb-1 uppercase tracking-wider ${daysRemaining < 0 ? 'text-rose-400' : daysRemaining <= 5 ? 'text-amber-500' : 'text-zinc-400'}`}>{l.timeRemaining}</span>
            <div className={`text-lg font-black uppercase tracking-wider flex items-center justify-center gap-1.5 ${daysRemaining < 0 ? 'text-rose-600' : daysRemaining <= 5 ? 'text-amber-600' : 'text-zinc-800'}`}>
              <Timer size={16} className="shrink-0" />
              {daysRemaining < 0 ? `0 ${l.days}` : `${daysRemaining} ${l.days}`}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-8 mb-4">
        <div className="bg-white p-1.5 rounded-2xl flex items-center border border-zinc-200 shadow-sm">
          <button
            onClick={() => setSelectedCycle("monthly")}
            className={`px-8 py-3.5 rounded-xl text-sm font-black transition-all ${
              selectedCycle === "monthly" 
                ? "bg-zinc-100 text-zinc-900 shadow-sm border border-zinc-200/50" 
                : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-50 border border-transparent"
            }`}
          >
            {l.monthly}
          </button>
          <button
            onClick={() => setSelectedCycle("yearly")}
            className={`px-8 py-3.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${
              selectedCycle === "yearly" 
                ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200" 
                : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-50 border border-transparent"
            }`}
          >
            {l.yearly}
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${selectedCycle === "yearly" ? "bg-emerald-200 text-emerald-800" : "bg-emerald-100 text-emerald-600"}`}>
              {l.freeMonths}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isActive = currentPlan === plan.id && currentCycle === selectedCycle;
          const isDisabled = hasPendingReceipt || (isActive && subStatus === "active");

          return (
            <div 
              key={plan.id} 
              className={`relative flex flex-col p-8 rounded-3xl border-2 transition-all duration-300 ${
                isActive 
                  ? `${plan.color} scale-[1.02] border-opacity-100` 
                  : "bg-white border-zinc-100 hover:border-zinc-300 hover:shadow-md"
              } ${(isInvalidSub || hasPendingReceipt) ? 'opacity-80 grayscale-[30%]' : ''}`}
            >
              {isActive && (
                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm ${isInvalidSub ? 'bg-rose-500' : 'bg-zinc-900'}`}>
                  {isInvalidSub ? l.inactivePlan : l.activePlan}
                </div>
              )}

              <div className="mb-4 flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-3xl mb-1 text-zinc-900">{plan.name}</h3>
                  <p className="text-xs font-bold text-zinc-500 mt-2 max-w-[200px]">
                    {plan.target}
                  </p>
                </div>
                <div className={`p-3 rounded-2xl shadow-sm border ${isActive ? 'bg-white/50 border-black/5' : 'bg-zinc-50 border-zinc-100'}`}>
                  {plan.icon}
                </div>
              </div>

              <div className="mb-8 pb-6 border-b border-zinc-200/60">
                <p className="text-sm font-bold text-zinc-500">
                  <span className="text-4xl font-black text-zinc-900">{plan.prices[selectedCycle]}</span> MAD / {selectedCycle === "yearly" ? l.yr : l.mo}
                </p>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                {plan.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 size={18} className={`shrink-0 mt-0.5 ${isActive ? "text-zinc-700" : "text-zinc-400"}`} />
                    <span className={`text-sm font-bold leading-snug ${isActive ? 'text-zinc-800' : 'text-zinc-600'}`}>{feat}</span>
                  </div>
                ))}
              </div>

              <button
                disabled={isDisabled}
                onClick={() => handleInitiateUpgrade(plan.id)}
                className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${
                  isDisabled
                    ? "bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200" 
                    : "bg-zinc-900 text-white hover:bg-zinc-800 active:scale-95 shadow-lg shadow-zinc-900/10"
                }`}
              >
                {hasPendingReceipt ? (
                  l.pending
                ) : isActive && subStatus === "active" ? (
                   l.currentPlanBtn
                ) : (
                  <>{l.upgradeTo} {plan.name} <ArrowRight size={18} className={dir === 'rtl' ? 'rotate-180' : ''} /></>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-zinc-50 p-8 rounded-3xl border border-zinc-200 shadow-sm opacity-60 select-none mt-10">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-200">
          <h3 className="text-xl font-extrabold flex items-center gap-2 text-zinc-800">
            <History className="text-zinc-400" size={24} /> {l.paymentHistory}
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500 bg-zinc-100/50 rounded-2xl border border-dashed border-zinc-300">
          <AlertCircle size={32} className="mb-3 text-zinc-300" />
          <p className="font-bold">{l.invoicesAppearHere}</p>
        </div>
      </div>

      {showWarningModal && pendingPlanId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200" dir={dir}>
            <button 
              onClick={() => { setShowWarningModal(false); setPendingPlanId(null); }} 
              className={`absolute top-6 ${activeLang === 'ar' ? 'left-6' : 'right-6'} text-zinc-400 hover:text-zinc-700 bg-zinc-100 hover:bg-zinc-200 p-2 rounded-full transition-colors`}
            >
              <X size={20} />
            </button>
            
            <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-6 mx-auto border border-amber-200/50">
              <AlertTriangle size={36} />
            </div>
            
            <h2 className="text-2xl font-black text-center mb-4 text-zinc-900">
              {l.warningTitle}
            </h2>
            
            <p className="text-zinc-500 text-center text-sm font-bold leading-relaxed mb-8">
              {l.warningDesc}
            </p>
            
            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => { setShowWarningModal(false); setPendingPlanId(null); }} 
                className="flex-1 py-4 font-bold rounded-2xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
              >
                {l.cancel}
              </button>
              <button 
                onClick={proceedToCheckout} 
                className="flex-1 py-4 font-bold rounded-2xl bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 active:scale-95"
              >
                {l.proceed}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCheckoutModal && pendingPlanId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto" dir={dir}>
            <button 
              onClick={() => { setShowCheckoutModal(false); setPendingPlanId(null); setFile(null); }} 
              className={`absolute top-6 ${activeLang === 'ar' ? 'left-6' : 'right-6'} text-zinc-400 hover:text-zinc-700 bg-zinc-100 hover:bg-zinc-200 p-2 rounded-full transition-colors`}
            >
              <X size={20} />
            </button>
            
            <div className={`border-b border-zinc-100 pb-4 mb-6 ${activeLang === 'ar' ? 'pl-8' : 'pr-8'}`}>
              <h3 className="text-xl sm:text-2xl font-black text-zinc-900 flex items-center gap-2">
                <Banknote className="text-emerald-500" /> {l.bankTransfer}
              </h3>
              <p className="text-sm text-zinc-500 font-bold mt-1">
                {l.transferDesc}
              </p>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 p-4 rounded-2xl text-sm font-bold flex items-start gap-3 mb-6">
              <AlertCircle size={24} className="shrink-0 mt-0.5 text-indigo-500" />
              <p>{l.instantWarning}</p>
            </div>

            <div className="space-y-6">
              <div className="bg-zinc-50 p-4 rounded-2xl flex justify-between items-center border border-zinc-200">
                <span className="text-sm font-bold text-zinc-500">{l.amountReq}</span>
                <span className="text-2xl font-black text-zinc-900" dir="ltr">
                  {PLANS.find(p => p.id === pendingPlanId)?.prices[selectedCycle]} MAD
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold text-zinc-500 px-1">
                  <span>{l.bank} {BANK_INFO.bankName}</span>
                  <span>{l.beneficiary} {BANK_INFO.holder}</span>
                </div>

                <div className="relative">
                  <div className="w-full bg-zinc-900 text-white p-4 rounded-xl font-mono text-sm sm:text-base font-bold flex justify-between items-center tracking-wider" dir="ltr">
                    <span className="truncate pr-2">{BANK_INFO.rib}</span>
                    <button
                      onClick={handleCopyRib}
                      type="button"
                      className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                      {copied ? l.copied : l.copyRib}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-zinc-500">{l.screenshot}</label>
                <div className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${file ? 'border-emerald-500 bg-emerald-50/50' : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50 hover:bg-zinc-100'}`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="receipt-upload"
                  />
                  <label htmlFor="receipt-upload" className="cursor-pointer flex flex-col items-center gap-3 w-full">
                    {file ? (
                      <>
                        <CheckCircle2 className="text-emerald-500" size={36} />
                        <span className="text-sm font-bold text-emerald-700 truncate max-w-[250px]">{file.name}</span>
                        <span className="text-xs text-emerald-600/70 font-bold underline">{l.changeImg}</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="text-zinc-400" size={36} />
                        <span className="text-sm font-bold text-zinc-600">{l.uploadHere}</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <button
                disabled={!file || isUploading}
                onClick={handleUploadAndSubmit}
                className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-zinc-900/20 mt-4"
              >
                {isUploading ? <Loader2 className="animate-spin" size={20} /> : l.confirmSend}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}