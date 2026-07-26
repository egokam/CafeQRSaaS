"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { KeyRound, Mail, Lock, ShieldAlert, Loader2, ArrowRight } from "lucide-react";

// 🛡️ القائمة البيضاء: الإيميل الوحيد المسموح له بالدخول
const ALLOWED_ADMIN = "elotmanikamal607@gmail.com";

export default function SuperOwnerLogin() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [mode, setMode] = useState<"login" | "forgot">("login");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // 1️⃣ الدخول العادي: مع التحقق من الصلاحية
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email !== ALLOWED_ADMIN) {
      setErrorMsg("⛔ وصول مرفوض: هذا الحساب غير مصرح له بالدخول.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg("بيانات الدخول غير صحيحة.");
      setLoading(false);
    } else {
      router.push("/ego-owner-9539");
      router.refresh();
    }
  };

  // 2️⃣ إرسال كود OTP: مع التحقق من الصلاحية
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email !== ALLOWED_ADMIN) {
      setErrorMsg("⛔ وصول مرفوض: غير مصرح لك باستخدام هذا النظام.");
      return;
    }
    
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false }
    });

    setLoading(false);
    if (error) {
      setErrorMsg("مشكلة في الإرسال: تأكد أن الإيميل مسجل في النظام.");
    } else {
      setOtpSent(true);
    }
  };

  // 3️⃣ التحقق من الكود (OTP): مع التحقق من الصلاحية
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email !== ALLOWED_ADMIN) {
      setErrorMsg("⛔ محاولة دخول غير مصرح بها.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: "email",
    });

    if (error) {
      setErrorMsg("الكود خاطئ أو منتهي الصلاحية.");
      setLoading(false);
    } else {
      router.push("/ego-owner-9539");
      router.refresh();
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 py-10 font-sans text-white selection:bg-amber-300/30 selection:text-amber-50" dir="rtl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(251,191,36,0.18),transparent_30%),radial-gradient(circle_at_82%_78%,rgba(99,102,241,0.20),transparent_34%),linear-gradient(135deg,#020617_0%,#09090b_48%,#020617_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,black_28%,transparent_72%)]" />
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-l from-transparent via-amber-200/50 to-transparent" />

      <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 text-right shadow-[0_32px_120px_-36px_rgba(251,191,36,0.42)] backdrop-blur-2xl sm:p-8">
          <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[linear-gradient(145deg,rgba(255,255,255,0.15),rgba(255,255,255,0)_42%,rgba(251,191,36,0.08))]" />
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-amber-300/20 blur-3xl" />

          <div className="relative">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-100/30 bg-gradient-to-br from-amber-200 via-amber-400 to-orange-500 text-zinc-950 shadow-[0_0_44px_-10px_rgba(251,191,36,0.9)]">
                <KeyRound size={32} />
              </div>
              <h1 className="text-3xl font-black tracking-normal text-white/95">EgoDev Portal</h1>
              <p className="mt-2 text-xs font-semibold tracking-normal text-white/45">RESTRICTED ACCESS // EGODEV v3.0</p>
            </div>

            {errorMsg && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-300/20 bg-rose-500/10 p-4 text-xs leading-relaxed text-rose-100 shadow-[0_0_28px_-18px_rgba(244,63,94,0.9)] animate-in fade-in slide-in-from-top-2 duration-300">
                <ShieldAlert size={18} className="mt-0.5 shrink-0 text-rose-300" />
                <span>{errorMsg}</span>
              </div>
            )}

            {mode === "login" && (
              <form onSubmit={handlePasswordLogin} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-white/55">البريد الإلكتروني الإداري</label>
                  <div className="group relative">
                    <Mail size={18} className="absolute left-4 top-4 text-white/35 transition-colors duration-200 group-focus-within:text-amber-200" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-zinc-950/70 py-4 pr-4 pl-12 text-left text-sm font-medium text-white/90 outline-none shadow-inner shadow-black/20 transition-all duration-200 placeholder:text-white/25 hover:border-white/20 focus:border-amber-300/70 focus:bg-zinc-950/85 focus:shadow-[0_0_0_4px_rgba(251,191,36,0.10)]"
                      dir="ltr"
                      placeholder="admin@gmail.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-white/55">كلمة المرور (Master Key)</label>
                  <div className="group relative">
                    <Lock size={18} className="absolute left-4 top-4 text-white/35 transition-colors duration-200 group-focus-within:text-amber-200" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-zinc-950/70 py-4 pr-4 pl-12 text-left text-sm font-medium text-white/90 outline-none shadow-inner shadow-black/20 transition-all duration-200 placeholder:text-white/25 hover:border-white/20 focus:border-amber-300/70 focus:bg-zinc-950/85 focus:shadow-[0_0_0_4px_rgba(251,191,36,0.10)]"
                      dir="ltr"
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-500 py-4 text-sm font-black text-zinc-950 shadow-[0_0_34px_-10px_rgba(251,191,36,0.95)] transition-all duration-200 hover:scale-[1.02] hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100">
                  {loading ? <Loader2 className="animate-spin" size={20}/> : <span>تسجيل الدخول 🔐</span>}
                </button>

                <div className="pt-2 text-center">
                  <button type="button" onClick={() => { setMode("forgot"); setErrorMsg(""); }} className="rounded-full px-4 py-2 text-xs font-semibold text-white/45 transition-all duration-200 hover:bg-white/5 hover:text-amber-200 active:scale-95">
                    نسيت كلمة المرور؟ (الدخول بـ OTP)
                  </button>
                </div>
              </form>
            )}

            {mode === "forgot" && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                <button onClick={() => { setMode("login"); setOtpSent(false); setErrorMsg(""); }} className="mb-4 flex items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-white/45 transition-all duration-200 hover:bg-white/5 hover:text-white active:scale-95">
                  <ArrowRight size={14} /> العودة للدخول
                </button>

                {!otpSent ? (
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <p className="mb-4 text-xs leading-relaxed text-white/55">
                      أدخل بريدك الإلكتروني الإداري لتلقي رمز الدخول (OTP).
                    </p>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-4 text-left text-sm font-medium text-white/90 outline-none shadow-inner shadow-black/20 transition-all duration-200 placeholder:text-white/25 hover:border-white/20 focus:border-amber-300/70 focus:bg-zinc-950/85 focus:shadow-[0_0_0_4px_rgba(251,191,36,0.10)]"
                      dir="ltr"
                      placeholder="admin@gmail.com"
                    />
                    <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 py-4 text-sm font-bold text-white shadow-[0_18px_44px_-28px_rgba(255,255,255,0.55)] transition-all duration-200 hover:scale-[1.02] hover:border-amber-200/30 hover:bg-white/15 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100">
                      {loading ? <Loader2 className="animate-spin" size={18}/> : <span>إرسال كود الدخول 📩</span>}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div className="mb-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-center shadow-[0_0_28px_-20px_rgba(52,211,153,0.9)]">
                      <span className="text-xs font-bold text-emerald-200">تم إرسال كود من 6 أرقام إلى بريدك!</span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full rounded-2xl border border-amber-300/50 bg-zinc-950/75 p-4 text-center text-2xl font-black tracking-normal text-amber-200 outline-none shadow-inner shadow-black/20 transition-all duration-200 placeholder:text-white/20 hover:border-amber-200/70 focus:border-amber-200 focus:shadow-[0_0_0_4px_rgba(251,191,36,0.12)]"
                      dir="ltr"
                    />
                    <button type="submit" disabled={loading} className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 py-4 text-sm font-black text-zinc-950 shadow-[0_0_34px_-12px_rgba(45,212,191,0.85)] transition-all duration-200 hover:scale-[1.02] hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100">
                      {loading ? <Loader2 className="animate-spin" size={18}/> : "تأكيد والدخول للمنصة 🔓"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
