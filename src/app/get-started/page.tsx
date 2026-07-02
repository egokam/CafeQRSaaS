"use client";

import { motion } from "framer-motion";
import { Check, MessageCircle, Mail, Star, Crown, Store, ArrowLeft } from "lucide-react";
import Link from "next/link";

const WHATSAPP_NUMBER = "212781991384";
const EMAIL_ADDRESS = "egokam.business@gmail.com";

const PLANS = [
  {
    id: "starter",
    name: "Starter Plan",
    target: "For small & emerging cafes",
    price: "150",
    icon: Store,
    popular: false,
    color: "text-zinc-400",
    border: "border-white/10 hover:border-zinc-500",
    glow: "",
    features: [
      "Up to 25 menu items",
      "1 POS terminal",
      "Standard QR codes for tables",
    ],
  },
  {
    id: "pro",
    name: "Pro Plan",
    target: "Most popular for active cafes",
    price: "299",
    icon: Star,
    popular: true,
    color: "text-amber-400",
    border: "border-amber-500/50 hover:border-amber-400",
    glow: "shadow-[0_0_40px_rgba(251,191,36,0.15)]",
    features: [
      "Unlimited menu items",
      "Up to 3 POS terminals",
      "WhatsApp subscription alerts",
      "Sales analytics & insights",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise Plan",
    target: "For franchises & large cafes",
    price: "499",
    icon: Crown,
    popular: false,
    color: "text-emerald-400",
    border: "border-white/10 hover:border-emerald-500",
    glow: "",
    features: [
      "Everything in Pro",
      "Unlimited POS terminals",
      "Custom domain (YourCafe.ma)",
      "Priority 24/7 technical support",
    ],
  },
];

export default function GetStartedPage() {
  const handleWhatsAppClick = (planName: string) => {
    const text = encodeURIComponent(`Hi, I'm interested in the ${planName} for CafeQR. Could you provide more details?`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-amber-500/30 pt-12 pb-32 overflow-hidden">
      
      {/* 🌟 Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-20">
          <Link href="/" className="text-zinc-500 hover:text-amber-400 transition-colors text-sm font-semibold flex items-center justify-center gap-2 mb-12 w-fit mx-auto">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black tracking-tight mb-4"
          >
            Ready to upgrade? <span className="text-amber-400">Choose your plan.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-lg max-w-2xl mx-auto"
          >
            An all-in-one POS, Kitchen Display, and QR ordering system. Join the cafes serving their guests faster and smarter.
          </motion.p>
        </div>

        {/* 🌟 3D Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto perspective-[1000px]">
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, rotateX: 20, y: 50 }}
              animate={{ opacity: 1, rotateX: 0, y: 0 }}
              transition={{ delay: index * 0.15, type: "spring", stiffness: 100 }}
              whileHover={{ 
                scale: 1.05, 
                translateY: -10,
                rotateY: index === 0 ? -5 : index === 2 ? 5 : 0, 
                zIndex: 50 
              }}
              className={`relative flex flex-col bg-white/[0.02] backdrop-blur-xl border-2 rounded-[2.5rem] p-8 transition-colors duration-300 ${plan.border} ${plan.glow}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-zinc-950 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-amber-400/20">
                  <Star size={14} className="fill-zinc-950" /> Most Popular
                </div>
              )}

              <div className="mb-8 text-center border-b border-white/10 pb-8">
                <div className={`w-14 h-14 mx-auto bg-white/5 rounded-2xl flex items-center justify-center mb-6 ${plan.color}`}>
                  <plan.icon size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-zinc-400 text-sm font-medium h-10">{plan.target}</p>
                <div className="mt-6 flex items-end justify-center gap-1">
                  <span className="text-5xl font-black tracking-tight">{plan.price}</span>
                  <span className="text-zinc-500 font-bold mb-2 text-lg">MAD/mo</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm font-semibold text-zinc-300">
                    <Check size={20} className="text-amber-400 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handleWhatsAppClick(plan.name)}
                className={`w-full py-4 rounded-2xl font-black transition-transform active:scale-95 flex justify-center items-center gap-2 ${
                  plan.popular 
                    ? "bg-amber-400 text-zinc-950 hover:bg-amber-300 shadow-lg shadow-amber-400/20" 
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <MessageCircle size={20} />
                Get Started
              </button>
            </motion.div>
          ))}
        </div>

        {/* 🌟 Contact Direct Actions */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-24 text-center border-t border-white/10 pt-16 max-w-3xl mx-auto"
        >
          <h3 className="text-2xl font-bold mb-4">Need help choosing or have custom requirements?</h3>
          <p className="text-zinc-400 mb-8">Contact us directly and we'll have your system ready in under 24 hours.</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-[#25D366]/20"
            >
              <MessageCircle size={24} />
              Chat on WhatsApp
            </a>
            
            <a 
              href={`mailto:${EMAIL_ADDRESS}?subject=CafeQR Inquiry`}
              className="w-full sm:w-auto px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95 border border-zinc-700"
            >
              <Mail size={24} />
              Send an Email
            </a>
          </div>
        </motion.div>

      </div>
    </div>
  );
}