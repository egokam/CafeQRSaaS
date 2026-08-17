"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, MessageCircle, Mail, ArrowLeft, Zap, Star, Gem } from "lucide-react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher"; 

const WHATSAPP_NUMBER = "212781991384";
const EMAIL_ADDRESS = "egokam.business@gmail.com";

// قاموس محلي للنصوص الجديدة الخاصة بدورة الدفع لتجنب أخطاء الترجمة المفقودة
const CYCLE_TRANSLATIONS: Record<string, any> = {
  en: { monthly: "Monthly", yearly: "Yearly", free: "2 Months FREE", mo: "mo", yr: "yr" },
  fr: { monthly: "Mensuel", yearly: "Annuel", free: "2 Mois GRATUITS", mo: "mois", yr: "an" },
  ar: { monthly: "شهري", yearly: "سنوي", free: "شهران مجاناً", mo: "شهر", yr: "سنة" }
};

const PLANS_CONFIG = [
  {
    id: "silver",
    icon: Zap,
    popular: false,
    prices: { monthly: "249", yearly: "2,490" },
    theme: "zinc",
    color: "text-zinc-300",
    iconBg: "bg-zinc-800/50 text-zinc-300",
    border: "border-zinc-800",
    hoverBorder: "hover:border-zinc-400/50",
    glow: "from-zinc-400/20 to-transparent",
    btnBase: "bg-zinc-800 text-white",
    btnHover: "group-hover:bg-zinc-700 group-hover:shadow-[0_0_20px_rgba(161,161,170,0.2)]",
  },
  {
    id: "gold",
    icon: Star,
    popular: true,
    prices: { monthly: "399", yearly: "3,990" },
    theme: "amber",
    color: "text-amber-400",
    iconBg: "bg-amber-500/10 text-amber-400",
    border: "border-amber-500/40",
    hoverBorder: "hover:border-amber-400",
    glow: "from-amber-400/25 to-transparent",
    btnBase: "bg-amber-400 text-zinc-950",
    btnHover: "hover:bg-amber-300 group-hover:shadow-[0_0_25px_rgba(251,191,36,0.4)]",
  },
  {
    id: "diamond",
    icon: Gem,
    popular: false,
    prices: { monthly: "799", yearly: "7,990" },
    theme: "cyan",
    color: "text-cyan-400",
    iconBg: "bg-cyan-500/10 text-cyan-400",
    border: "border-zinc-800",
    hoverBorder: "hover:border-cyan-400/50",
    glow: "from-cyan-400/20 to-transparent",
    btnBase: "bg-zinc-800 text-white",
    btnHover: "group-hover:bg-cyan-950 group-hover:text-cyan-400 group-hover:border-cyan-800 border border-transparent group-hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]",
  },
];

export default function GetStartedPage() {
  const t = useTranslations("GetStarted");
  const locale = useLocale();
  const ct = CYCLE_TRANSLATIONS[locale] || CYCLE_TRANSLATIONS.en;
  
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const handleWhatsAppClick = (planId: string) => {
    const planName = t(`plans.${planId}.name`);
    const text = encodeURIComponent(t("whatsappMessage", { plan: planName }) + ` (${billingCycle})`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank");
  };

  return (
    /* 🛑 تم إزالة font-sans ليرث الخط الأصلي، وتغيير overflow-hidden إلى overflow-x-hidden لتجنب المشاكل العمودية */
    <div className="min-h-screen bg-zinc-950 text-zinc-50 selection:bg-amber-500/30 pt-6 pb-24 overflow-x-hidden relative">
      
      {/* 🌟 Background Gradient */}
      <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-zinc-900/60 via-zinc-950/20 to-transparent pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        
        {/* Top Navigation Bar */}
        <div className="flex justify-between items-center mb-16 pt-4">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-50 transition-colors text-sm font-medium bg-zinc-900/40 px-5 py-2.5 rounded-full border border-white/5 hover:border-white/10 hover:bg-zinc-800/60 backdrop-blur-md">
            <ArrowLeft size={16} className="rtl:rotate-180" /> {t("backToHome")}
          </Link>
          
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
          </div>
        </div>
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6"
          >
            {t("titleBefore")} <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 drop-shadow-sm">
              {t("titleHighlight")}
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-medium"
          >
            {t("description")}
          </motion.p>
        </div>

        {/* 🌟 Billing Cycle Toggle */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-12"
        >
          <div className="bg-zinc-900/50 p-1.5 rounded-2xl flex items-center border border-white/5 backdrop-blur-sm">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-8 py-3.5 rounded-xl text-sm font-black transition-all ${
                billingCycle === "monthly" 
                  ? "bg-zinc-800 text-white shadow-sm border border-white/10" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent"
              }`}
            >
              {ct.monthly}
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 sm:px-8 py-3.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${
                billingCycle === "yearly" 
                  ? "bg-amber-500/10 text-amber-400 shadow-sm border border-amber-500/20" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent"
              }`}
            >
              {ct.yearly}
              <span className={`px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap ${billingCycle === "yearly" ? "bg-amber-500/20 text-amber-300" : "bg-zinc-800 text-zinc-400"}`}>
                {ct.free}
              </span>
            </button>
          </div>
        </motion.div>

        {/* 🌟 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch mt-8">
          {PLANS_CONFIG.map((plan, index) => {
            const features = t.raw(`plans.${plan.id}.features`) as string[];

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 + 0.3, ease: "easeOut" }}
                /* 🛑 تم إزالة overflow-hidden من هنا لكي لا تُقص كلمة الأكثر طلباً */
                className={`group relative flex flex-col bg-zinc-900/40 backdrop-blur-md border rounded-[2.5rem] p-8 lg:p-10 transition-all duration-500 hover:-translate-y-2 ${plan.border} ${plan.hoverBorder}`}
              >
                {/* ✨ Glow Effect Inside Card on Hover */}
                {/* 🛑 تم وضع الـ overflow-hidden هنا فقط لحماية الإضاءة من الخروج عن الإطار المربع */}
                <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none">
                  <div className={`absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br ${plan.glow} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                </div>

                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-400 text-zinc-950 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_20px_rgba(251,191,36,0.3)] z-20 whitespace-nowrap">
                    <Star size={14} className="fill-zinc-950" /> {t("mostPopular")}
                  </div>
                )}

                {/* Content Wrapper */}
                <div className="relative z-10 flex flex-col h-full">
                  {/* Plan Header */}
                  <div className="mb-8 text-center sm:text-start">
                    <div className={`w-14 h-14 mx-auto sm:mx-0 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 ${plan.iconBg}`}>
                      <plan.icon size={28} strokeWidth={2.5} />
                    </div>
                    <h3 className={`text-2xl font-bold mb-2 transition-colors duration-300 group-hover:${plan.color}`}>
                      {t(`plans.${plan.id}.name`)}
                    </h3>
                    <p className="text-zinc-400 text-sm font-medium h-10 leading-relaxed">
                      {t(`plans.${plan.id}.target`)}
                    </p>
                    
                    <div className="mt-8 flex items-baseline justify-center sm:justify-start gap-1.5">
                      <span className="text-4xl md:text-5xl font-black tracking-tight text-white">
                        {plan.prices[billingCycle]}
                      </span>
                      <span className="text-zinc-500 font-semibold text-sm">
                        MAD / {billingCycle === 'yearly' ? ct.yr : ct.mo}
                      </span>
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-4 mb-10 flex-1">
                    {features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm font-medium text-zinc-300 leading-relaxed">
                        <Check 
                          size={18} 
                          className={`shrink-0 mt-0.5 transition-colors duration-300 ${plan.popular ? 'text-amber-400' : 'text-zinc-500 group-hover:' + plan.color}`} 
                          strokeWidth={2.5} 
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button 
                    onClick={() => handleWhatsAppClick(plan.id)}
                    className={`w-full py-4 rounded-2xl font-bold transition-all duration-300 active:scale-[0.98] flex justify-center items-center gap-2 ${plan.btnBase} ${plan.btnHover}`}
                  >
                    <MessageCircle size={18} />
                    {t("choosePlan", { plan: t(`plans.${plan.id}.name`) })}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 🌟 Professional Contact Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-32 text-center border-t border-white/5 pt-16 max-w-3xl mx-auto"
        >
          <h3 className="text-2xl font-bold text-white mb-3">{t("contact.title")}</h3>
          <p className="text-zinc-400 mb-10 text-lg">{t("contact.description")}</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] shadow-lg shadow-[#25D366]/10 hover:shadow-[#25D366]/30"
            >
              <MessageCircle size={20} />
              {t("contact.whatsapp")}
            </a>
            
            <a 
              href={`mailto:${EMAIL_ADDRESS}?subject=ServeQR Enterprise Inquiry`}
              className="w-full sm:w-auto px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] border border-white/10 hover:border-white/20"
            >
              <Mail size={20} />
              {t("contact.email")}
            </a>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
