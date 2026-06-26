"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { submitBankTransferReceipt, getPlatformBankDetails } from "../actions/saas";
import { CreditCard, Upload, CheckCircle2, Copy, Clock, AlertCircle, ShieldCheck, Sparkles, Loader2, Landmark } from "lucide-react";

interface BillingTabProps {
  cafeId: string;
  cafeName: string;
}

const PLANS = [
  { id: 'starter', name: 'باقة Starter', price: 150, desc: 'للمقاهي الصغيرة الناشئة', features: ['حد أقصى 25 منتج في المنيو', '1 شاشة كاشير فقط', 'كود QR عادي للطاولات'] },
  { id: 'pro', name: 'باقة Pro ⭐', price: 299, desc: 'الأكثر طلباً للمقاهي النشطة', features: ['منتجات غير محدودة في المنيو', '3 شاشات كاشير في نفس الوقت', 'إشعارات نفاد الباقة عبر واتساب', 'إحصائيات المبيعات'] },
  { id: 'enterprise', name: 'باقة Enterprise', price: 499, desc: 'للسلاسل والمقاهي الكبرى', features: ['كل ميزات باقة Pro', 'شاشات كاشير غير محدودة', 'دومين مخصص (YourCafe.ma)', 'أولوية قصوى في الدعم الفني'] }
];

export default function BillingTab({ cafeId, cafeName }: BillingTabProps) {
  const [loading, setLoading] = useState(true);
  const [subData, setSubData] = useState<any>(null);
  
  // 🌟 حالة جديدة لتخزين بيانات البنك القادمة من الداتا بيز
  const [bankInfo, setBankInfo] = useState({ bank_name: 'CIH BANK', rib: '...', holder_name: '...' });
  
  const [selectedPlanPrice, setSelectedPlanPrice] = useState(299);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    
    // 1. جلب بيانات البنك العالمية + بيانات اشتراك هذا المقهى في نفس الوقت
    const [bankRes, cafeRes] = await Promise.all([
      getPlatformBankDetails(),
      supabase.from('cafes').select('subscription_status, subscription_ends_at, plan_type').eq('id', cafeId).single()
    ]);

    if (bankRes) setBankInfo(bankRes);

    if (cafeRes.data) {
      setSubData(cafeRes.data);
      const plan = PLANS.find(p => p.id === cafeRes.data.plan_type);
      if (plan) setSelectedPlanPrice(plan.price);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, [cafeId]);

  const handleCopyRIB = () => {
    navigator.clipboard.writeText(bankInfo.rib.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUploadAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile || !cafeId) return alert("يرجى اختيار صورة التوصيل البنكي!");

    setIsSubmitting(true);
    try {
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${cafeId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('receipts').upload(fileName, receiptFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(fileName);
      const publicReceiptUrl = urlData.publicUrl;

      const res = await submitBankTransferReceipt(cafeId, publicReceiptUrl, selectedPlanPrice);
      
      if (res.success) {
        alert("تم إرسال إيصال الأداء بنجاح! 🚀\nالمنيو الخاص بكم مفعل الآن، وسيتم مراجعة الإيصال من طرف الإدارة.");
        setReceiptFile(null);
        fetchAllData();
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      alert("حدث خطأ أثناء إرسال الإيصال: " + (err.message || "تأكد من جودة الإنترنت"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-12 text-center font-bold text-muted-foreground animate-pulse">جاري تحميل بيانات التجديد...</div>;

  const isPending = subData?.subscription_status === 'pending_verification';
  const isActive = subData?.subscription_status === 'active';
  const daysLeft = subData?.subscription_ends_at ? Math.max(0, Math.ceil((new Date(subData.subscription_ends_at).getTime() - Date.now()) / (1000 * 3600 * 24))) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 text-foreground" dir="rtl">
      
      <div className={`p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-4 ${isPending ? 'bg-amber-500/10 border-amber-500/30 text-amber-700' : isActive ? 'bg-green-500/10 border-green-500/30 text-green-700' : 'bg-red-500/10 border-red-500/30 text-red-700'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl bg-white shadow-sm ${isPending ? 'text-amber-500' : isActive ? 'text-green-500' : 'text-red-500'}`}>
            {isPending ? <Clock size={28} className="animate-spin" /> : isActive ? <ShieldCheck size={28} /> : <AlertCircle size={28} />}
          </div>
          <div>
            <h3 className="text-xl font-black">
              {isPending ? "الاشتراك قيد المراجعة البنكية ⏳" : isActive ? "الاشتراك نشط ومحمي 🛡️" : "الاشتراك منتهي الصلاحية ⚠️"}
            </h3>
            <p className="text-sm font-medium mt-1 opacity-90">
              {isPending ? "وصلنا إيصال الدفع. المنيو شغال بأمان في انتظار تأكيد البنك." : isActive ? `متبقي على التجديد القادم: ${daysLeft} يوماً` : "الخدمة متوقفة حالياً. يرجى التجديد لإعادة تفعيل المنيو للزبائن."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><Sparkles className="text-primary"/> اختر باقة التجديد</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map(plan => {
              const isSelected = selectedPlanPrice === plan.price;
              return (
                <div key={plan.id} onClick={() => setSelectedPlanPrice(plan.price)} className={`p-5 rounded-3xl border-2 cursor-pointer transition-all flex flex-col justify-between ${isSelected ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' : 'border-border bg-white hover:border-border/80'}`}>
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-black text-sm">{plan.name}</h4>
                      {isSelected && <CheckCircle2 size={18} className="text-primary"/>}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium mb-4">{plan.desc}</p>
                    <div className="text-2xl font-black text-foreground mb-4">{plan.price} <span className="text-xs font-bold text-muted-foreground">MAD/شهر</span></div>
                    <ul className="space-y-2 border-t pt-3">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"/> {feat}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 🌟 معلومات الحساب الديناميكية القادمة من قاعدة البيانات */}
        <div className="bg-white p-6 rounded-3xl border border-border shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-primary"><Landmark size={20}/> التحويل البنكي</h3>
            <div className="bg-muted/40 p-4 rounded-2xl border space-y-3 font-mono">
              <div>
                <span className="text-[10px] text-muted-foreground block font-sans font-bold">البنك المستلم</span>
                <span className="font-black text-sm text-foreground">{bankInfo.bank_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-sans font-bold">اسم المستفيد</span>
                <span className="font-bold text-xs uppercase text-foreground">{bankInfo.holder_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-sans font-bold">رقم الحساب (RIB)</span>
                <div className="flex items-center justify-between mt-1 bg-white p-2 rounded-xl border">
                  <span className="text-xs font-extrabold tracking-wider text-primary truncate mr-2">{bankInfo.rib}</span>
                  <button type="button" onClick={handleCopyRIB} className="p-1.5 bg-muted rounded-lg hover:bg-gray-200 text-foreground transition-colors shrink-0">
                    {copied ? <CheckCircle2 size={16} className="text-green-600"/> : <Copy size={16}/>}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleUploadAndSubmit} className="space-y-4 pt-4 border-t">
            <div className="border-2 border-dashed border-primary/40 hover:border-primary rounded-2xl p-4 text-center cursor-pointer relative transition-colors bg-primary/5">
              <input required type="file" accept="image/*" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <Upload className="mx-auto text-primary mb-1" size={24} />
              <span className="text-xs font-bold text-primary block">{receiptFile ? receiptFile.name : "اضغط لرفع صورة التوصيل الروسي"}</span>
              <span className="text-[10px] text-muted-foreground">PNG, JPG أو PDF</span>
            </div>

            <button disabled={isSubmitting || !receiptFile} type="submit" className="w-full bg-foreground text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-foreground/90 disabled:opacity-50 transition-all">
              {isSubmitting ? <><Loader2 size={18} className="animate-spin"/> جاري إرسال الإيصال...</> : `تأكيد أداء ${selectedPlanPrice} درهم`}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}