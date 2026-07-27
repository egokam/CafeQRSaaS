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
  Gem
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface BillingTabProps {
  cafeId: string;
  cafeName: string;
}

const PLANS = [
  {
    id: "silver",
    name: "Silver",
    target: "Perfect for small & emerging cafes",
    price: "2,000",
    icon: <Shield className="text-slate-500" size={28} />,
    color: "bg-slate-50 text-slate-700 border-slate-200",
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
    price: "2,990",
    icon: <Zap className="text-amber-500" size={28} />,
    color: "bg-amber-50 text-amber-700 border-amber-300 shadow-amber-100",
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
    price: "4,990",
    icon: <Gem className="text-purple-500" size={28} />,
    color: "bg-purple-50 text-purple-700 border-purple-300 shadow-purple-100",
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

export default function BillingTab({ cafeId, cafeName }: BillingTabProps) {
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // جلب الباقة الحالية من قاعدة البيانات
  useEffect(() => {
    const fetchBillingDetails = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("cafes")
          .select("plan_type")
          .eq("id", cafeId)
          .single();

        if (!error && data) {
          setCurrentPlan(data.plan_type || "silver");
        }
      } catch (err) {
        console.error("Error fetching plan:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (cafeId) fetchBillingDetails();
  }, [cafeId]);

  // دالة الترقية الوهمية (تُحدث قاعدة البيانات مباشرة لأغراض الاختبار)
  const handleFakeUpgrade = async (planId: string) => {
    if (planId === currentPlan) return;
    
    setIsProcessing(planId);
    
    // محاكاة تأخير الدفع (ثانية ونصف)
    setTimeout(async () => {
      const { error } = await supabase
        .from("cafes")
        .update({ plan_type: planId })
        .eq("id", cafeId);

      if (!error) {
        setCurrentPlan(planId);
        alert(`تمت الترقية إلى باقة ${planId.toUpperCase()} بنجاح! 🎉\n(هذه ترقية تجريبية لتخطي الدفع)`);
        // إعادة تحميل الصفحة لتحديث القيود في الواجهة
        window.location.reload();
      } else {
        alert("حدث خطأ أثناء ترقية الباقة. حاول مجدداً.");
      }
      setIsProcessing(null);
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300" dir="ltr">
      
      {/* Overview Header */}
      <div className="bg-white p-8 rounded-3xl border border-border shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary/10 text-primary rounded-2xl">
            <CreditCard size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black">{cafeName} Billing & Subscription</h2>
            <p className="text-muted-foreground font-medium text-sm">Manage your cafe's plan and POS hardware limits.</p>
          </div>
        </div>
        
        <div className="bg-muted/30 px-8 py-4 rounded-2xl border text-center min-w-[200px]">
          <span className="block text-xs font-bold text-muted-foreground mb-1">Current Active Plan</span>
          <div className="text-2xl font-black uppercase text-primary tracking-wider">
            {currentPlan || "Silver"}
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isActive = currentPlan === plan.id;
          const isUpgradingThis = isProcessing === plan.id;

          return (
            <div 
              key={plan.id} 
              className={`relative flex flex-col p-8 rounded-3xl border-2 transition-all duration-200 ${
                isActive 
                  ? `${plan.color} shadow-lg scale-[1.02] border-opacity-100` 
                  : "bg-white border-border hover:border-primary/30"
              }`}
            >
              {isActive && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-foreground text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                  Active Plan
                </div>
              )}

              <div className="mb-4 flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-3xl mb-1">{plan.name}</h3>
                  <p className="text-xs font-bold opacity-70 mt-2 max-w-[200px]">
                    {plan.target}
                  </p>
                </div>
                <div className={`p-3 rounded-2xl shadow-sm border border-black/5 ${isActive ? 'bg-white/50' : 'bg-muted/50'}`}>
                  {plan.icon}
                </div>
              </div>

              <div className="mb-8 pb-6 border-b border-black/10">
                <p className="text-sm font-bold opacity-70">
                  <span className="text-4xl font-black">{plan.price}</span> MAD / mo
                </p>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                {plan.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 size={18} className={`shrink-0 mt-0.5 ${isActive ? "opacity-100 text-current" : "text-primary opacity-70"}`} />
                    <span className="text-sm font-bold opacity-90 leading-snug">{feat}</span>
                  </div>
                ))}
              </div>

              <button
                disabled={isActive || isProcessing !== null}
                onClick={() => handleFakeUpgrade(plan.id)}
                className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${
                  isActive 
                    ? "bg-black/5 text-black/40 cursor-not-allowed border border-black/5" 
                    : "bg-foreground text-white hover:opacity-90 active:scale-95 shadow-xl"
                }`}
              >
                {isUpgradingThis ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : isActive ? (
                  "Current Plan"
                ) : (
                  <>Test Upgrade to {plan.name} <ArrowRight size={18} /></>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Invoice History Mockup (Hidden during testing) */}
      <div className="bg-white p-8 rounded-3xl border border-border shadow-sm opacity-50 grayscale select-none pointer-events-none">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
          <h3 className="text-xl font-extrabold flex items-center gap-2">
            <History className="text-muted-foreground" size={24} /> Payment History (Coming Soon)
          </h3>
        </div>
        
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-muted/10 rounded-2xl border border-dashed">
          <AlertCircle size={32} className="mb-3 opacity-20" />
          <p className="font-bold">Real payment integration is under development.</p>
          <p className="text-xs mt-1">For now, use the buttons above to test different plan limits.</p>
        </div>
      </div>

    </div>
  );
}