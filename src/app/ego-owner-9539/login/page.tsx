"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInSuperAdmin, sendSuperAdminOtp, verifySuperAdminOtp } from "@/actions/auth";
import { KeyRound, Mail, Lock, ShieldAlert, Loader2, ArrowRight, Fingerprint, ChevronRight } from "lucide-react";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher"; 

// 🌟 استدعاء أدوات الترجمة واللغة
import { useTranslations, useLocale } from "next-intl";
import { Cairo } from "next/font/google";

// 🌟 استدعاء الخط العربي للواجهة (سيعمل فقط مع اللغة العربية)
const cairo = Cairo({ subsets: ["arabic"], weight: ["400", "500", "700", "900"] });

const ALLOWED_ADMIN = "elotmanikamal607@gmail.com";

export default function SuperOwnerLogin() {
  const router = useRouter();
  
  // 🌟 تهيئة الترجمة واللغة
  const t = useTranslations("SuperAdminLogin");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const currentDir = isArabic ? "rtl" : "ltr";
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [mode, setMode] = useState<"login" | "forgot">("login");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.toLowerCase() !== ALLOWED_ADMIN.toLowerCase()) {
      setErrorMsg(t("errors.unauthorized"));
      return;
    }
    setLoading(true); setErrorMsg("");
    const result = await signInSuperAdmin(email, password);
    if (!result.success) { setErrorMsg(t("errors.invalidLogin")); setLoading(false); }
    else { router.push("/ego-owner-9539"); router.refresh(); }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.toLowerCase() !== ALLOWED_ADMIN.toLowerCase()) { setErrorMsg(t("errors.unauthorized")); return; }
    setLoading(true); setErrorMsg("");
    const result = await sendSuperAdminOtp(email);
    setLoading(false);
    if (!result.success) setErrorMsg(t("errors.sendOtpFailed"));
    else setOtpSent(true);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.toLowerCase() !== ALLOWED_ADMIN.toLowerCase()) { setErrorMsg(t("errors.unauthorized")); return; }
    setLoading(true); setErrorMsg("");
    const result = await verifySuperAdminOtp(email, otpCode);
    if (!result.success) { setErrorMsg(t("errors.invalidOtp")); setLoading(false); }
    else { router.push("/ego-owner-9539"); router.refresh(); }
  };

  return (
    // 🌟 دمج الخط العربي في الواجهة فقط إذا كانت اللغة عربية
    <div 
      className={`min-h-screen w-full flex flex-col lg:flex-row bg-zinc-950 text-white selection:bg-amber-400/30 selection:text-amber-100 overflow-x-hidden ${isArabic ? cairo.className : 'font-sans'}`}
      dir={currentDir}
    >
      
      <style dangerouslySetInnerHTML={{ __html: `body { overflow-x: hidden; }` }} />

      <div className={`absolute top-6 z-50 ${isArabic ? 'left-6' : 'right-6'}`}>
        <LanguageSwitcher />
      </div>
      
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between p-16 border-white/5" style={{ borderRightWidth: isArabic ? '0px' : '1px', borderLeftWidth: isArabic ? '1px' : '0px' }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(251,191,36,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-400 flex items-center justify-center shadow-[0_0_30px_-5px_rgba(251,191,36,0.6)]">
            <KeyRound size={20} className="text-zinc-950" />
          </div>
          <span className="text-xl font-bold tracking-widest text-white/90">EgoDev<span className="text-amber-400">.</span></span>
        </div>

        <div className="relative z-10 max-w-xl" dir="ltr">
          <h1 
            className="text-6xl xl:text-7xl font-black tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-6"
            dangerouslySetInnerHTML={{ __html: t("ui.masterControl") }}
          />
          <p className="text-lg text-zinc-400 font-medium leading-relaxed border-l-2 border-amber-400/50 pl-4">
            {t("ui.gatewayDesc")}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-xs font-mono text-zinc-500" dir="ltr">
          <Fingerprint size={16} />
          <span>{t("ui.sysVer")}</span>
          <span className="w-1 h-1 rounded-full bg-zinc-700" />
          <span className="text-emerald-400/80 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {t("ui.operational")}
          </span>
        </div>
      </div>

      <div className="w-full lg:w-[45%] min-h-screen relative flex items-center justify-center p-6 sm:p-12 overflow-x-hidden">
        <div className="absolute inset-0 lg:hidden bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.12),transparent_60%)]" />
        
        <div className="w-full max-w-[420px] relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className="bg-zinc-900/40 border border-white/10 rounded-[2.5rem] p-8 sm:p-10 backdrop-blur-2xl shadow-[0_0_80px_-20px_rgba(0,0,0,0.5)]">
            
            <div className="lg:hidden flex flex-col items-center justify-center mb-8">
              <div className="h-16 w-16 mb-4 rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center shadow-[0_0_40px_-10px_rgba(251,191,36,0.6)]">
                <KeyRound size={28} className="text-zinc-950" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-wide">{t("ui.portalTitle")}</h2>
              <p className="text-xs text-amber-400/80 font-mono mt-2">{t("ui.restrictedAccess")}</p>
            </div>

            {errorMsg && (
              <div className="mb-8 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm leading-relaxed text-rose-200 shadow-[0_0_30px_-15px_rgba(244,63,94,0.5)] animate-in fade-in zoom-in-95 duration-300">
                <ShieldAlert size={20} className="mt-0.5 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {mode === "login" && (
              <form onSubmit={handlePasswordLogin} className={`space-y-6 animate-in fade-in ${isArabic ? 'slide-in-from-right-8' : 'slide-in-from-left-8'} duration-500`}>
                <div className="space-y-1.5">
                  <label className={`text-xs font-bold text-zinc-400 ${isArabic ? 'mr-2' : 'ml-2'}`}>{t("ui.emailLabel")}</label>
                  <div className="group relative">
                    <Mail size={20} className={`absolute ${isArabic ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-zinc-500 transition-colors duration-300 group-focus-within:text-amber-400`} />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full rounded-2xl border border-white/5 bg-zinc-950/50 py-4 text-sm font-medium text-white outline-none transition-all duration-300 placeholder:text-zinc-700 hover:border-white/10 hover:bg-zinc-900/80 focus:border-amber-400/50 focus:bg-zinc-900 focus:shadow-[0_0_0_4px_rgba(251,191,36,0.1)] ${isArabic ? 'pl-4 pr-12 text-left' : 'pr-4 pl-12 text-left'}`} dir="ltr" placeholder={t("ui.emailPlaceholder")}/>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-bold text-zinc-400 ${isArabic ? 'mr-2' : 'ml-2'}`}>{t("ui.passwordLabel")}</label>
                  <div className="group relative">
                    <Lock size={20} className={`absolute ${isArabic ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-zinc-500 transition-colors duration-300 group-focus-within:text-amber-400`} />
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full rounded-2xl border border-white/5 bg-zinc-950/50 py-4 text-sm font-medium text-white outline-none transition-all duration-300 placeholder:text-zinc-700 hover:border-white/10 hover:bg-zinc-900/80 focus:border-amber-400/50 focus:bg-zinc-900 focus:shadow-[0_0_0_4px_rgba(251,191,36,0.1)] ${isArabic ? 'pl-4 pr-12 text-left' : 'pr-4 pl-12 text-left'}`} dir="ltr" placeholder={t("ui.passwordPlaceholder")}/>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full group relative overflow-hidden rounded-2xl bg-amber-400 py-4 text-sm font-black text-zinc-950 transition-all duration-300 hover:bg-amber-300 hover:shadow-[0_0_40px_-10px_rgba(251,191,36,0.8)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-amber-400 disabled:hover:shadow-none">
                  <span className={`relative z-10 flex items-center justify-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    {loading ? <Loader2 className="animate-spin" size={20}/> : <>{t("ui.loginBtn")} <ChevronRight size={18} className={`transition-transform ${isArabic ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} /></>}
                  </span>
                </button>

                <div className="pt-2 text-center">
                  <button type="button" onClick={() => { setMode("forgot"); setErrorMsg(""); }} className="text-xs font-bold text-zinc-500 underline decoration-zinc-800 underline-offset-4 transition-colors hover:text-amber-400 hover:decoration-amber-400/50">
                    {t("ui.forgotBtn")}
                  </button>
                </div>
              </form>
            )}

            {mode === "forgot" && (
              <div className={`animate-in fade-in ${isArabic ? 'slide-in-from-left-8' : 'slide-in-from-right-8'} duration-500`}>
                <button onClick={() => { setMode("login"); setOtpSent(false); setErrorMsg(""); }} className="mb-8 flex items-center gap-2 text-xs font-bold text-zinc-400 transition-colors hover:text-white">
                  <ArrowRight size={16} className={isArabic ? '' : 'rotate-180'} /> {t("ui.backBtn")}
                </button>

                {!otpSent ? (
                  <form onSubmit={handleSendOTP} className="space-y-6">
                    <div className="space-y-1.5">
                      <label className={`text-xs font-bold text-zinc-400 ${isArabic ? 'mr-2' : 'ml-2'}`}>{t("ui.otpAuthLabel")}</label>
                      <div className="group relative">
                        <Mail size={20} className={`absolute ${isArabic ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-zinc-500 transition-colors duration-300 group-focus-within:text-white`} />
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full rounded-2xl border border-white/5 bg-zinc-950/50 py-4 text-sm font-medium text-white outline-none transition-all duration-300 placeholder:text-zinc-700 hover:border-white/10 hover:bg-zinc-900/80 focus:border-white/30 focus:bg-zinc-900 focus:shadow-[0_0_0_4px_rgba(255,255,255,0.05)] ${isArabic ? 'pl-4 pr-12 text-left' : 'pr-4 pl-12 text-left'}`} dir="ltr" placeholder={t("ui.emailPlaceholder")}/>
                      </div>
                    </div>
                    
                    <button type="submit" disabled={loading} className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 text-sm font-bold text-white transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_30px_-10px_rgba(255,255,255,0.2)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
                      {loading ? <Loader2 className="animate-spin mx-auto" size={20}/> : t("ui.sendOtpBtn")}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
                      <span className="text-xs font-bold text-emerald-400">{t("ui.otpSentMsg")}</span>
                    </div>
                    
                    <input type="text" required maxLength={6} placeholder={t("ui.otpPlaceholder")} value={otpCode} onChange={(e) => setOtpCode(e.target.value)} className="w-full rounded-2xl border border-emerald-300/50 bg-zinc-950/80 p-5 text-center text-3xl font-black tracking-[0.5em] text-emerald-400 outline-none transition-all duration-300 placeholder:text-zinc-800 focus:border-emerald-400 focus:shadow-[0_0_0_4px_rgba(52,211,153,0.15)]" dir="ltr"/>
                    
                    <button type="submit" disabled={loading} className="w-full group rounded-2xl bg-emerald-500 py-4 text-sm font-black text-zinc-950 transition-all duration-300 hover:bg-emerald-400 hover:shadow-[0_0_40px_-10px_rgba(52,211,153,0.8)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
                      {loading ? <Loader2 className="animate-spin mx-auto" size={20}/> : t("ui.verifyOtpBtn")}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
          
          <div className="mt-8 text-center text-[10px] font-medium text-zinc-600 lg:hidden" dir="ltr">
            {t("ui.footer", { year: new Date().getFullYear() })}
          </div>
        </div>
      </div>
    </div>
  );
}
