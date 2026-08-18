"use client";

import { useState, useEffect } from "react";
import { 
  History, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ReceiptText, 
  ExternalLink,
  Ban,
  Trash2,
  Loader2,
  X,
  AlertTriangle
} from "lucide-react";
import { getPaymentHistory, clearPaymentHistory } from "@/actions/payment";

interface PaymentHistoryProps {
  cafeId: string;
  activeLang: string;
  dir: string;
}

const TRANSLATIONS = {
  ar: {
    title: "سجل المدفوعات",
    empty: "ستظهر الفواتير والإيصالات السابقة هنا.",
    date: "التاريخ",
    plan: "الباقة",
    amount: "المبلغ",
    status: "الحالة",
    paid: "مقبول / مدفوع",
    pending: "قيد المراجعة",
    rejected: "مرفوض",
    canceled: "ملغى",
    reason: "سبب الرفض:",
    monthly: "شهري",
    yearly: "سنوي",
    viewReceipt: "عرض الإيصال",
    clearHistory: "مسح السجل وإرسال تقرير",
    confirmClear: "هل أنت متأكد من مسح جميع السجلات؟ سيتم إرسال تقرير إلى بريدك الإلكتروني وإلى الإدارة قبل الحذف.",
    clearing: "جاري المسح...",
    clearSuccess: "تم مسح السجل وإرسال التقرير بنجاح.",
    clearError: "حدث خطأ أثناء مسح السجل.",
    cancel: "إلغاء"
  },
  fr: {
    title: "Historique des Paiements",
    empty: "Les factures et reçus apparaîtront ici.",
    date: "Date",
    plan: "Forfait",
    amount: "Montant",
    status: "Statut",
    paid: "Payé / Accepté",
    pending: "En attente",
    rejected: "Rejeté",
    canceled: "Annulé",
    reason: "Raison du rejet :",
    monthly: "Mensuel",
    yearly: "Annuel",
    viewReceipt: "Voir le reçu",
    clearHistory: "Effacer l'historique et envoyer le rapport",
    confirmClear: "Êtes-vous sûr de vouloir effacer tous les enregistrements ? Un rapport sera envoyé à votre adresse e-mail et à l'administration avant la suppression.",
    clearing: "Effacement...",
    clearSuccess: "Historique effacé et rapport envoyé avec succès.",
    clearError: "Une erreur s'est produite lors de l'effacement de l'historique.",
    cancel: "Annuler"
  },
  en: {
    title: "Payment History",
    empty: "Invoices and past receipts will appear here.",
    date: "Date",
    plan: "Plan",
    amount: "Amount",
    status: "Status",
    paid: "Paid / Accepted",
    pending: "Under Review",
    rejected: "Rejected",
    canceled: "Canceled",
    reason: "Rejection reason:",
    monthly: "Monthly",
    yearly: "Yearly",
    viewReceipt: "View Receipt",
    clearHistory: "Clear History & Send Report",
    confirmClear: "Are you sure you want to clear all records? A report will be sent to your email and to the administration before deletion.",
    clearing: "Clearing...",
    clearSuccess: "History cleared and report sent successfully.",
    clearError: "An error occurred while clearing the history.",
    cancel: "Cancel"
  }
};

export default function PaymentHistory({ cafeId, activeLang, dir }: PaymentHistoryProps) {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const t = TRANSLATIONS[activeLang as keyof typeof TRANSLATIONS] || TRANSLATIONS.en;

  const fetchHistory = async () => {
    setIsLoading(true);
    const res = await getPaymentHistory(cafeId);
    if (res.success) {
      setReceipts(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!cafeId) return;

    void fetchHistory();
  }, [cafeId]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "paid":
        return { color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <CheckCircle2 size={16} />, label: t.paid };
      case "pending":
        return { color: "bg-amber-100 text-amber-700 border-amber-200", icon: <Clock size={16} />, label: t.pending };
      case "rejected":
        return { color: "bg-rose-100 text-rose-700 border-rose-200", icon: <XCircle size={16} />, label: t.rejected };
      case "canceled":
        return { color: "bg-zinc-100 text-zinc-600 border-zinc-200", icon: <Ban size={16} />, label: t.canceled };
      default:
        return { color: "bg-zinc-100 text-zinc-600 border-zinc-200", icon: <AlertCircle size={16} />, label: status };
    }
  };

  const handleClearHistoryClick = () => {
    setShowClearModal(true);
  };

  const executeClearHistory = async () => {
    setIsClearing(true);
    const res = await clearPaymentHistory(cafeId);
    
    if (res.success) {
      alert(t.clearSuccess);
      setReceipts([]);
      setShowClearModal(false);
    } else {
      alert(t.clearError + " " + res.error);
    }
    setIsClearing(false);
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm mt-10 animate-in fade-in duration-500" dir={dir}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 border-b border-zinc-100 gap-4">
        <h3 className="text-xl font-extrabold flex items-center gap-2 text-zinc-900">
          <History className="text-primary" size={24} /> {t.title}
        </h3>

        {receipts.length > 0 && (
          <button 
            onClick={handleClearHistoryClick}
            disabled={isClearing}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
          >
            {isClearing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            {isClearing ? t.clearing : t.clearHistory}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <div className="w-8 h-8 bg-zinc-200 rounded-full mb-2"></div>
            <div className="h-4 w-32 bg-zinc-200 rounded-full"></div>
          </div>
        </div>
      ) : receipts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
          <ReceiptText size={32} className="mb-3 text-zinc-300" />
          <p className="font-bold">{t.empty}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {receipts.map((receipt) => {
            const statusConfig = getStatusConfig(receipt.status);
            const formattedDate = new Intl.DateTimeFormat(activeLang === 'ar' ? 'ar-MA' : activeLang === 'fr' ? 'fr-FR' : 'en-GB', {
              dateStyle: 'medium',
              timeStyle: 'medium',
            }).format(new Date(receipt.uploaded_at));

            return (
              <div key={receipt.id} className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 sm:p-5 hover:border-zinc-300 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-black text-zinc-900 capitalize tracking-wide">
                      {receipt.requested_plan}
                    </span>
                    <span className="text-[10px] font-bold bg-zinc-200/50 text-zinc-600 px-2.5 py-1 rounded-md uppercase">
                      {receipt.requested_cycle === 'yearly' ? t.yearly : t.monthly}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs font-bold text-zinc-500">
                    <span className="flex items-center gap-1.5"><Clock size={14}/> {formattedDate}</span>
                    <span className="hidden sm:inline text-zinc-300">|</span>
                    <span className="flex items-center gap-1.5 text-zinc-700">
                      <span className="text-base font-black" dir="ltr">{receipt.amount} MAD</span>
                    </span>
                  </div>
                  
                  {receipt.status === 'rejected' && receipt.rejection_reason && (
                    <div className="mt-3 text-xs bg-rose-50 border border-rose-100 text-rose-700 p-2.5 rounded-lg inline-block font-medium">
                      <span className="font-black mr-1 rtl:ml-1">{t.reason}</span> {receipt.rejection_reason}
                    </div>
                  )}
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 border-t sm:border-t-0 border-zinc-200 pt-3 sm:pt-0">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${statusConfig.color}`}>
                    {statusConfig.icon}
                    {statusConfig.label}
                  </div>
                  
                  {receipt.receipt_url && (
                    <a 
                      href={receipt.receipt_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs font-bold bg-zinc-900 text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 flex items-center gap-1.5 transition-colors"
                    >
                      <ReceiptText size={14} /> {t.viewReceipt}
                    </a>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {showClearModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200" dir={dir}>
            <button 
              onClick={() => setShowClearModal(false)} 
              disabled={isClearing}
              className={`absolute top-6 ${activeLang === 'ar' ? 'left-6' : 'right-6'} text-zinc-400 hover:text-zinc-700 bg-zinc-100 hover:bg-zinc-200 p-2 rounded-full transition-colors`}
            >
              <X size={20} />
            </button>
            
            <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-6 mx-auto border border-rose-200/50">
              <AlertTriangle size={36} />
            </div>
            
            <h2 className="text-2xl font-black text-center mb-4 text-zinc-900">
              {t.clearHistory}
            </h2>
            
            <p className="text-zinc-500 text-center text-sm font-bold leading-relaxed mb-8">
              {t.confirmClear}
            </p>
            
            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => setShowClearModal(false)} 
                disabled={isClearing}
                className="flex-1 py-4 font-bold rounded-2xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
              >
                {t.cancel}
              </button>
              <button 
                onClick={executeClearHistory} 
                disabled={isClearing}
                className="flex-1 py-4 font-bold rounded-2xl bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20 active:scale-95 flex justify-center items-center gap-2"
              >
                {isClearing ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                {isClearing ? t.clearing : t.clearHistory}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
