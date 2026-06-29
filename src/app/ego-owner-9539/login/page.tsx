"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { KeyRound, Mail, Lock, ShieldAlert, Loader2, ArrowRight, ArrowLeft } from "lucide-react";

export default function SuperOwnerLogin() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // التحكم في الشاشات: 'login' (كلمة السر) أو 'forgot' (نسيان كلمة السر / OTP)
  const [mode, setMode] = useState<"login" | "forgot">("login");
  
  // المتغيرات
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // 1️⃣ الدخول العادي: الإيميل وكلمة المرور
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg("بيانات الدخول غير صحيحة أو الحساب غير موجود.");
      setLoading(false);
    } else {
      router.push("/ego-owner-9539");
      router.refresh();
    }
  };

  // 2️⃣ إرسال كود OTP للإيميل (في حالة نسيان كلمة المرور)
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setErrorMsg("المرجو إدخال البريد الإلكتروني أولاً.");
    
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false } // حماية: منع إنشاء حساب جديد من هاد الصفحة
    });

    setLoading(false);
    if (error) {
      setErrorMsg("البريد غير مسجل في النظام أو هناك مشكل في الإرسال.");
    } else {
      setOtpSent(true);
    }
  };

  // 3️⃣ التحقق من الكود (OTP) والدخول
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.verifyOtp({
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans selection:bg-amber-500" dir="rtl">
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden text-right">
        
        {/* اللوغو و الهيدر */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-2xl mx-auto flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/10 mb-4">
            <KeyRound size={32} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">EgoDev Portal</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">RESTRICTED ACCESS // EGODEV v3.0</p>
        </div>

        {/* عرض الأخطاء */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3 text-rose-400 text-xs animate-in slide-in-from-top-2">
            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 🟩 الشاشة 1: تسجيل الدخول العادي */}
        {mode === "login" && (
          <form onSubmit={handlePasswordLogin} className="space-y-5 animate-in fade-in zoom-in duration-300">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">البريد الإلكتروني المعتمد</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-3.5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pr-4 pl-11 text-sm text-white font-mono outline-none focus:border-amber-500 text-left transition-colors"
                  dir="ltr"
                  placeholder="admin@egokam.site"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">كلمة المرور (Master Key)</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-3.5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pr-4 pl-11 text-sm text-white font-mono outline-none focus:border-amber-500 text-left transition-colors"
                  dir="ltr"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={20}/> : <span>تسجيل الدخول 🔐</span>}
            </button>

            <div className="text-center pt-2">
              <button type="button" onClick={() => { setMode("forgot"); setErrorMsg(""); }} className="text-xs font-mono text-slate-500 hover:text-amber-400 transition-colors">
                نسيت كلمة المرور؟ (الدخول بـ OTP)
              </button>
            </div>
          </form>
        )}

        {/* 🟧 الشاشة 2: استرجاع الحساب عبر OTP */}
        {mode === "forgot" && (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            
            <button onClick={() => { setMode("login"); setOtpSent(false); setErrorMsg(""); }} className="text-xs text-slate-500 hover:text-white flex items-center gap-1 mb-4 transition-colors">
              <ArrowRight size={14} /> العودة للدخول
            </button>

            {!otpSent ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  أدخل بريدك الإلكتروني الإداري. سنرسل لك رمزاً مكوناً من 6 أرقام لتسجيل الدخول مباشرة بدون كلمة سر.
                </p>
                <div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 px-4 text-sm text-white font-mono outline-none focus:border-amber-500 text-left"
                    dir="ltr"
                    placeholder="admin@egokam.site"
                  />
                </div>
                <button type="submit" disabled={loading} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin" size={18}/> : <span>إرسال كود الدخول 📩</span>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="text-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-4">
                  <span className="text-xs text-emerald-400 font-bold">تم إرسال كود من 6 أرقام إلى بريدك!</span>
                </div>
                <div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full bg-slate-950 border border-amber-500/50 rounded-xl p-4 text-center text-2xl font-black text-amber-400 font-mono tracking-widest outline-none focus:border-amber-400"
                    dir="ltr"
                  />
                </div>
                <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center transition-colors disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin" size={18}/> : "تأكيد والدخول للمنصة 🔓"}
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}