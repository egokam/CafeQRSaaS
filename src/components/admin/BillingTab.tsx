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
  Timer
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface BillingTabProps {
  cafeId: string;
  cafeName: string;
  planType?: string | null;
  billingCycle?: string;
  activeLang?: string;
  t?: any;
}

const PLANS = [
  {
    id: "silver",
    name: "Silver",
    target: "Perfect for small & emerging cafes",
    prices: { monthly: "249", yearly: "2,490" },
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
    prices: { monthly: "399", yearly: "3,990" },
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
    prices: { monthly: "799", yearly: "7,990" },
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

export default function BillingTab({ cafeId, cafeName, activeLang, t }: BillingTabProps) {
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [currentCycle, setCurrentCycle] = useState<string>("monthly");
  const [subStatus, setSubStatus] = useState<string>("active");
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<"monthly" | "yearly">("monthly");

  const dir = activeLang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    const fetchBillingDetails = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("cafes")
          .select("plan_type, billing_cycle, subscription_status, subscription_ends_at") 
          .eq("id", cafeId)
          .single();

        if (!error && data) {
          setCurrentPlan(data.plan_type || "silver");
          setCurrentCycle(data.billing_cycle || "monthly");
          setSelectedCycle((data.billing_cycle as "monthly" | "yearly") || "monthly");
          setSubStatus(data.subscription_status || "active");
          
          if (data.subscription_ends_at) {
            const ends = new Date(data.subscription_ends_at);
            const diffDays = Math.ceil((ends.getTime() - Date.now()) / (1000 * 3600 * 24));
            setDaysRemaining(diffDays);
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

  const handleFakeUpgrade = async (planId: string) => {
    if (isInvalidSub) {
      alert("⚠️ Renew your subscription first!");
      return;
    }

    if (planId === currentPlan && selectedCycle === currentCycle) return;
    
    setIsProcessing(planId);
    
    setTimeout(async () => {
      const { error } = await supabase
        .from("cafes")
        .update({ 
          plan_type: planId,
          billing_cycle: selectedCycle
        })
        .eq("id", cafeId);

      if (!error) {
        setCurrentPlan(planId);
        setCurrentCycle(selectedCycle);
        alert(`تمت الترقية إلى باقة ${planId.toUpperCase()} (${selectedCycle}) بنجاح! 🎉\n(هذه ترقية تجريبية لتخطي الدفع)`);
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
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300" dir={dir}>
      
      {isInvalidSub && (
        <div className="bg-rose-50 border-2 border-rose-500/20 p-6 rounded-3xl flex items-start gap-4 animate-in slide-in-from-top-4">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shrink-0">
            <AlertTriangle size={28} />
          </div>
          <div>
            <h3 className="text-xl font-black text-rose-700">Action Required: Subscription Inactive</h3>
            <p className="text-rose-600/80 font-medium mt-1">
              Your subscription is currently <strong className="uppercase">{daysRemaining < 0 ? 'expired' : 'paused'}</strong>. 
              System features, plan changes, and POS devices are temporarily restricted. 
              <strong> Renew your subscription first</strong> to restore full access.
            </p>
          </div>
        </div>
      )}

      {/* Overview Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-border shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary/10 text-primary rounded-2xl shrink-0">
            <CreditCard size={32} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black">{cafeName} Billing & Subscription</h2>
            <p className="text-muted-foreground font-medium text-sm">Manage your cafe's plan and POS hardware limits.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="bg-muted/30 px-5 py-3 rounded-2xl border text-center flex-1 min-w-[120px]">
            <span className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">Current Plan</span>
            <div className="text-lg font-black uppercase text-primary tracking-wider flex items-center justify-center gap-2">
              {currentPlan || "Silver"}
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {currentCycle === 'yearly' ? 'YR' : 'MO'}
              </span>
            </div>
          </div>
          
          <div className={`px-5 py-3 rounded-2xl border text-center flex-1 min-w-[120px] ${isInvalidSub ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <span className={`block text-[10px] font-bold mb-1 uppercase tracking-wider ${isInvalidSub ? 'text-rose-500/70' : 'text-emerald-600/70'}`}>Status</span>
            <div className={`text-lg font-black uppercase tracking-wider ${isInvalidSub ? 'text-rose-600' : 'text-emerald-600'}`}>
              {daysRemaining < 0 ? 'EXPIRED' : subStatus}
            </div>
          </div>

          <div className={`px-5 py-3 rounded-2xl border text-center flex-1 min-w-[120px] ${daysRemaining < 0 ? 'bg-rose-50 border-rose-200' : daysRemaining <= 5 ? 'bg-amber-50 border-amber-200' : 'bg-muted/30'}`}>
            <span className={`block text-[10px] font-bold mb-1 uppercase tracking-wider ${daysRemaining < 0 ? 'text-rose-500/70' : daysRemaining <= 5 ? 'text-amber-600/70' : 'text-muted-foreground'}`}>Time Remaining</span>
            <div className={`text-lg font-black uppercase tracking-wider flex items-center justify-center gap-1.5 ${daysRemaining < 0 ? 'text-rose-600' : daysRemaining <= 5 ? 'text-amber-600' : 'text-primary'}`}>
              <Timer size={16} className="shrink-0" />
              {daysRemaining < 0 ? "0 Days" : `${daysRemaining} Days`}
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 Billing Cycle Toggle */}
      <div className="flex justify-center mt-8 mb-4">
        <div className="bg-white p-1.5 rounded-2xl flex items-center border border-border shadow-sm">
          <button
            onClick={() => setSelectedCycle("monthly")}
            className={`px-8 py-3.5 rounded-xl text-sm font-black transition-all ${
              selectedCycle === "monthly" 
                ? "bg-muted text-foreground shadow-sm border border-border" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setSelectedCycle("yearly")}
            className={`px-8 py-3.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${
              selectedCycle === "yearly" 
                ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
            }`}
          >
            Yearly
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${selectedCycle === "yearly" ? "bg-emerald-200 text-emerald-800" : "bg-emerald-100 text-emerald-600"}`}>
              2 Months FREE
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isActive = currentPlan === plan.id && currentCycle === selectedCycle;
          const isUpgradingThis = isProcessing === plan.id;

          return (
            <div 
              key={plan.id} 
              className={`relative flex flex-col p-8 rounded-3xl border-2 transition-all duration-200 ${
                isActive 
                  ? `${plan.color} shadow-lg scale-[1.02] border-opacity-100` 
                  : "bg-white border-border hover:border-primary/30"
              } ${isInvalidSub ? 'opacity-80 grayscale-[30%]' : ''}`}
            >
              {isActive && (
                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm ${isInvalidSub ? 'bg-rose-500' : 'bg-foreground'}`}>
                  {isInvalidSub ? "INACTIVE PLAN" : "ACTIVE PLAN"}
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
                  <span className="text-4xl font-black">{plan.prices[selectedCycle]}</span> MAD / {selectedCycle === "yearly" ? "yr" : "mo"}
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
                    : isInvalidSub
                    ? "bg-rose-500 text-white hover:bg-rose-600 shadow-xl"
                    : "bg-foreground text-white hover:opacity-90 active:scale-95 shadow-xl"
                }`}
              >
                {isProcessing === plan.id ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : isActive ? (
                  isInvalidSub ? "PLAN LOCKED" : "Current Plan"
                ) : isInvalidSub ? (
                  "Action Locked 🔒"
                ) : (
                  <>Test Upgrade to {plan.name} <ArrowRight size={18} /></>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Invoice History Mockup */}
      <div className="bg-white p-8 rounded-3xl border border-border shadow-sm opacity-50 grayscale select-none pointer-events-none mt-10">
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