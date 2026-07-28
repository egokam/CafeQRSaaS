"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { getUltimateDashboardData, forceUpdateCafeSub, provisionNewCafe, updateCafeOwnerCredentials, deleteCafeCompletely } from "../../actions/saas";
import {
  Building2, ShieldCheck, AlertOctagon, Clock, Search,
  ChevronDown, DollarSign, Activity, RefreshCcw, Sprout,
  Copy, Check, Sparkles, LogOut, XCircle, Loader2, ExternalLink
} from "lucide-react";

import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { useTranslations, useLocale } from "next-intl";
import { Cairo } from "next/font/google";
import CafeDossierModal from "@/components/s-admin/CafeDossierModal";

const cairo = Cairo({ subsets: ["arabic"], weight: ["400", "500", "700", "900"] });
const ALLOWED_SUPER_ADMIN = "elotmanikamal607@gmail.com";

export default function UltimateSuperAdminDashboard() {
  const router = useRouter();
  const t = useTranslations("SuperAdminDashboard");
  const locale = useLocale();
  const isArabic = locale === "ar";
  const currentDir = isArabic ? "rtl" : "ltr";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({ cafes: [], receipts: [], stats: {} });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [inspectedCafe, setInspectedCafe] = useState<any | null>(null);

  const [showFactory, setShowFactory] = useState(false);
  const [facName, setFacName] = useState("");
  const [facSlug, setFacSlug] = useState("");
  const [facEmail, setFacEmail] = useState("");
  const [facPass, setFacPass] = useState("CafeSaaS2026!");
  const [facPlan, setFacPlan] = useState("silver");
  const [facTrial, setFacTrial] = useState(14);
  const [facCashierPin, setFacCashierPin] = useState("0000");
  const [facAdminPin, setFacAdminPin] = useState("1234");
  const [facSubmitting, setFacSubmitting] = useState(false);
  const [facResult, setFacResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const loadAll = async (token?: string) => {
    try {
      let currentToken = token;
      if (!currentToken) {
        const { data: { session } } = await supabase.auth.getSession();
        currentToken = session?.access_token;
      }
      if (!currentToken) return;

      const res = await getUltimateDashboardData(currentToken);
      setData(res);
    } catch (error) {
      console.error("Dashboard Load Error:", error);
      alert(t("errors.loadDelay"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;
      if (error || !session || !session.user) { router.replace("/ego-owner-9539/login"); return; }

      if (session.user.email?.toLowerCase() !== ALLOWED_SUPER_ADMIN.toLowerCase()) {
        supabase.auth.signOut();
        alert(t("errors.unauthorized"));
        router.replace("/ego-owner-9539/login");
        return;
      }
      loadAll(session.access_token);
    });

    // 🌟 الحل 4: إزالة `|| !session` لمنع الطرد عند التحديث (Refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (!isMounted) return;
      // لا نطرد المستخدم إلا إذا سجل خروجه بشكل صريح
      if (event === 'SIGNED_OUT') {
        router.replace("/ego-owner-9539/login");
      }
    });

    return () => { isMounted = false; authListener.subscription.unsubscribe(); };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/ego-owner-9539/login");
    router.refresh();
  };

  const handleInspect = (cafe: any) => { setInspectedCafe(cafe); };

  const handleForceSave = async (cafeId: string, newStatus: string, rawDate: string, newPlan: string) => {
    try {
      const isoDate = new Date(rawDate).toISOString();
      const success = await forceUpdateCafeSub(cafeId, newStatus, isoDate, newPlan);

      if (success) {
        alert(t("success.forceUpdate"));

        // 🌟 الحل الجذري للتحديث الوهمي (Optimistic UI Update)
        // نقوم بتحديث البيانات في الواجهة فوراً لتنعكس على الجدول والمفتش
        setData((prevData: any) => {
          const updatedCafes = prevData.cafes.map((c: any) =>
            c.id === cafeId
              ? { ...c, subscription_status: newStatus, subscription_ends_at: isoDate, plan_type: newPlan }
              : c
          );
          return { ...prevData, cafes: updatedCafes };
        });

        setInspectedCafe(null); // إغلاق النافذة
        router.refresh(); // إخبار Next.js بتنظيف الكاش في الخلفية

      } else {
        alert(t("errors.forceUpdateFail"));
      }
    } catch (error) {
      console.error("Date Parsing Error:", error);
      alert(t("errors.forceUpdateFail"));
    }
  };

  const handleUpdateCredentials = async (cafeId: string, authId: string, email: string, pass: string) => {
    if (!email) return alert(t("errors.emailRequired"));
    const res = await updateCafeOwnerCredentials(cafeId, authId, email, pass);
    if (res.success) {
      alert(t("success.credentialsUpdated"));
      loadAll();
    } else {
      alert(t("errors.updateFailPrefix") + res.error);
    }
  };

  const handleDeepDelete = async (cafe: any) => {
    const confirm1 = window.confirm(t("warnings.deepDeleteConfirm1", { cafeName: cafe.name }));
    if (!confirm1) return;

    const confirm2 = window.prompt(t("warnings.deepDeleteConfirm2"));
    if (confirm2 !== "DELETE") return;

    const res = await deleteCafeCompletely(cafe.id, cafe.owner_auth_id);
    if (res.success) {
      alert(t("success.cafeDeleted"));
      setInspectedCafe(null);
      loadAll();
    } else {
      alert(t("errors.deleteFailPrefix") + res.error);
    }
  };

  const handleProvisionCafe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facName || !facSlug || !facEmail) return alert(t("errors.missingFields"));
    setFacSubmitting(true); setFacResult(null);

    const res = await provisionNewCafe({
      name: facName, slug: facSlug, ownerEmail: facEmail, ownerPassword: facPass,
      planType: facPlan, trialDays: Number(facTrial), adminPin: facAdminPin, cashierPin: facCashierPin
    });

    setFacSubmitting(false);
    if (res.success) { setFacResult(res); loadAll(); }
    else alert(res.error || t("errors.provisionFail"));
  };

  const getWhatsAppWelcomeMsg = (res: any) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : "http://localhost:3000";
    return `${t("whatsapp.welcome")}\n\n${t("whatsapp.provisioned", { cafeName: res.cafe.name, trialDays: facTrial })}\n\n${t("whatsapp.linksHeader")}\n${t("whatsapp.adminLink", { url: origin, slug: res.cafe.slug, email: res.credentials.email, password: res.credentials.password })}\n\n${t("whatsapp.cashierLink", { url: origin, slug: res.cafe.slug, pin: res.credentials.cashierPin })}\n\n${t("whatsapp.footer")}`;
  };

  const copyToClipboard = () => {
    if (!facResult) return;
    navigator.clipboard.writeText(getWhatsAppWelcomeMsg(facResult));
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const filteredCafes = data.cafes.filter((c: any) => {
    const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.slug?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.subscription_status === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className={`min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center font-mono relative overflow-hidden ${isArabic ? cairo.className : 'font-sans'}`} dir={currentDir}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.1),transparent_50%)] animate-pulse" />
        <Activity className="animate-spin text-amber-500 mb-6 relative z-10" size={56} />
        <p className="text-sm tracking-widest text-zinc-400 relative z-10 font-bold">{t("ui.verifyingProtocol")}</p>
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen bg-zinc-950 text-zinc-100 selection:bg-amber-500/30 selection:text-amber-100 overflow-x-hidden ${isArabic ? cairo.className : 'font-sans'}`} dir={currentDir}>

      <style dangerouslySetInnerHTML={{
        __html: `
        body { overflow-x: hidden; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(251,191,36,0.06),transparent_40%),radial-gradient(circle_at_82%_78%,rgba(99,102,241,0.06),transparent_40%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]" />

      <div className="relative z-10 p-4 sm:p-6 lg:p-10 max-w-[1400px] mx-auto w-full">

        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-400 shadow-[0_0_20px_-5px_rgba(251,191,36,0.6)]">
                <ShieldCheck size={18} className="text-zinc-950" />
              </div>
              <span className="text-xs font-mono text-amber-400 tracking-[0.2em] uppercase font-bold" dir="ltr">{t("ui.superAdmin")}</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-l from-white to-white/60 tracking-tight" dir="ltr">{t("ui.centralTitle")}</h1>
          </div>

          <div className="flex items-center flex-wrap gap-3 w-full md:w-auto">
            <button onClick={() => { setShowFactory(true); setFacResult(null); }} className="flex-1 md:flex-none group relative overflow-hidden bg-gradient-to-r from-amber-400 to-orange-400 text-zinc-950 font-black px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_30px_-10px_rgba(251,191,36,0.6)] active:scale-95 transition-all text-sm">
              <Sprout size={18} className="transition-transform group-hover:scale-110" /> {t("ui.createNewPlatform")}
            </button>

            <div className="flex items-center gap-3 flex-1 md:flex-none">
              <div className="hidden sm:block"><LanguageSwitcher /></div>
              <button onClick={() => loadAll()} title={t("ui.refreshData")} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 p-3.5 rounded-2xl font-bold transition-all text-zinc-300 backdrop-blur-md hover:border-amber-400/50"><RefreshCcw size={18} /></button>
              <button onClick={handleLogout} title={t("ui.lockPlatform")} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-zinc-900/80 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/50 p-3.5 rounded-2xl font-bold transition-all text-zinc-400 hover:text-rose-400 backdrop-blur-md"><LogOut size={18} /></button>
            </div>
            <div className="w-full sm:hidden block mt-2"><LanguageSwitcher /></div>
          </div>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
          {[
            { label: t("stats.totalCafes"), val: data.stats.total, sub: t("stats.registeredCafe"), icon: Building2, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
            { label: t("stats.activeSubs"), val: data.stats.active, sub: t("stats.currentlyActive"), icon: Check, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
            { label: t("stats.paused"), val: data.stats.paused, sub: t("stats.stopped"), icon: AlertOctagon, color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/20" },
            { label: t("stats.monthlyMrr"), val: data.stats.mrr, sub: t("stats.returns"), icon: DollarSign, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30", glow: true }
          ].map((kpi, i) => (
            <div key={i} className={`relative overflow-hidden bg-zinc-900/40 border ${kpi.border} p-5 sm:p-6 rounded-3xl backdrop-blur-xl shadow-lg transition-transform hover:scale-[1.02]`}>
              {kpi.glow && <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/20 blur-3xl rounded-full pointer-events-none" />}
              <div className="flex justify-between items-center mb-3">
                <span className={`text-[10px] sm:text-xs font-bold font-mono tracking-wider ${kpi.color}`} dir="ltr">{kpi.label}</span>
                <div className={`p-2 rounded-xl ${kpi.bg}`}><kpi.icon size={18} className={kpi.color} /></div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white" dir="ltr">{kpi.val}</span>
                <span className="text-xs font-medium text-zinc-500">{kpi.sub}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-zinc-900/40 p-3 sm:p-4 rounded-[2rem] border border-white/5 backdrop-blur-xl mb-6 shadow-lg">
          <div className="relative w-full xl:w-96">
            <Search className={`absolute ${isArabic ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-zinc-500`} size={18} />
            <input type="text" placeholder={t("ui.searchPlaceholder")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full bg-zinc-950/50 border border-white/10 rounded-2xl py-4 text-sm text-white focus:outline-none focus:border-amber-400/50 focus:bg-zinc-900 transition-all placeholder:text-zinc-600 ${isArabic ? 'pr-12 pl-4' : 'pl-12 pr-4'}`} />
          </div>
          <div className="w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 hide-scrollbar" dir="ltr">
            <div className="flex gap-2 min-w-max p-1.5 bg-zinc-950/50 rounded-2xl border border-white/5">
              {['ALL', 'ACTIVE', 'PAUSED'].map((st) => (
                <button key={st} onClick={() => setStatusFilter(st)} className={`px-4 py-3 rounded-xl text-xs font-bold font-mono whitespace-nowrap transition-all ${statusFilter === st ? 'bg-zinc-800 text-amber-400 shadow-md border border-white/10' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'}`}>
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl w-full">
          <div className="overflow-x-auto hide-scrollbar w-full">
            <table className={`w-full border-collapse whitespace-nowrap ${isArabic ? 'text-right' : 'text-left'}`}>
              <thead>
                <tr className="border-b border-white/5 font-mono text-[10px] sm:text-xs text-zinc-500 uppercase bg-zinc-950/50">
                  <th className="p-5 sm:p-6 font-bold tracking-widest">{t("table.project")}</th>
                  <th className="p-5 sm:p-6 font-bold tracking-widest">{t("table.plan")}</th>
                  <th className="p-5 sm:p-6 font-bold tracking-widest">{t("table.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredCafes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-12 text-center text-zinc-500 font-mono text-xs">{t("table.noData")}</td>
                  </tr>
                ) : filteredCafes.map((cafe: any) => {
                  const st = cafe.subscription_status;
                  return (
                    <tr key={cafe.id} className="hover:bg-zinc-800/40 transition-colors group">
                      <td className="p-5 sm:p-6">
                        <div className="font-extrabold text-white text-sm sm:text-base flex items-center gap-3 mb-1">
                          <span className="truncate max-w-[150px] sm:max-w-xs">{cafe.name}</span>

                          <button
                            onClick={() => handleInspect(cafe)}
                            className="text-zinc-500 hover:text-amber-400 transition-colors shrink-0 outline-none flex items-center"
                            title={t("table.inspectBtn")}
                          >
                            <ExternalLink size={18} strokeWidth={2.5} />
                          </button>
                        </div>
                        <span className="text-[11px] font-mono text-zinc-500" dir="ltr">/{cafe.slug}</span>
                      </td>
                      <td className="p-5 sm:p-6 font-mono text-xs uppercase text-amber-400/90 font-bold">
                        <span className="bg-amber-400/10 px-3 py-1.5 rounded-lg border border-amber-400/20">{cafe.plan_type || 'silver'}</span>
                      </td>
                      <td className="p-5 sm:p-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-bold tracking-widest font-mono uppercase ${st === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : st === 'pending_verification' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`} dir="ltr">
                          {st === 'active' && <ShieldCheck size={14} />}
                          {st === 'pending_verification' && <Clock size={14} />}
                          {st === 'suspended' && <AlertOctagon size={14} />}
                          {st}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CafeDossierModal
        cafe={inspectedCafe}
        onClose={() => setInspectedCafe(null)}
        onForceSave={handleForceSave}
        onUpdateAuth={handleUpdateCredentials}
        onDeepDelete={handleDeepDelete}
        t={t}
        dir={currentDir}
        isArabic={isArabic}
      />

      {showFactory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-zinc-950 border border-white/10 w-full max-w-4xl rounded-[2.5rem] p-6 lg:p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto hide-scrollbar animate-in zoom-in-95 duration-500">
            <button onClick={() => setShowFactory(false)} className={`absolute top-6 ${isArabic ? 'left-6' : 'right-6'} p-2 bg-zinc-900 border border-white/5 rounded-full text-zinc-400 hover:text-white transition-colors`}><XCircle size={24} /></button>
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 text-zinc-950 rounded-2xl flex items-center justify-center shadow-[0_0_30px_-5px_rgba(251,191,36,0.5)]"><Sparkles size={28} /></div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{t("factory.title")}</h2>
                <p className="text-xs sm:text-sm text-zinc-400 font-medium mt-1">{t("factory.subtitle")}</p>
              </div>
            </div>

            {!facResult ? (
              <form onSubmit={handleProvisionCafe} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-mono tracking-wider text-zinc-400 mb-2 font-bold uppercase">{t("factory.cafeNameLabel")}</label>
                    <input required type="text" value={facName} onChange={(e) => setFacName(e.target.value)} className={`w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-4 text-sm text-white font-bold outline-none focus:border-amber-400/50 focus:bg-zinc-900 transition-colors ${isArabic ? 'text-right' : 'text-left'}`} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono tracking-wider text-amber-400 mb-2 font-bold uppercase">{t("factory.slugLabel")}</label>
                    <input required type="text" value={facSlug} onChange={(e) => setFacSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} className="w-full bg-zinc-900/50 border border-amber-500/30 rounded-2xl p-4 text-sm font-mono text-amber-300 font-bold outline-none focus:border-amber-400 focus:bg-zinc-900 text-left transition-colors" dir="ltr" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-mono tracking-wider text-zinc-400 mb-2 font-bold uppercase">{t("factory.ownerEmailLabel")}</label>
                    <input required type="email" value={facEmail} onChange={(e) => setFacEmail(e.target.value)} className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-4 text-sm font-mono text-white outline-none focus:border-amber-400/50 focus:bg-zinc-900 text-left transition-colors" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono tracking-wider text-zinc-400 mb-2 font-bold uppercase">{t("factory.tempPasswordLabel")}</label>
                    <input required type="text" value={facPass} onChange={(e) => setFacPass(e.target.value)} className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-4 text-sm font-mono text-white outline-none focus:border-amber-400/50 focus:bg-zinc-900 text-left transition-colors" dir="ltr" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-zinc-900/30 rounded-3xl border border-white/5">
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-500 mb-2 font-bold uppercase tracking-widest">{t("factory.planTypeLabel")}</label>
                    <select value={facPlan} onChange={(e) => setFacPlan(e.target.value)} className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs font-mono text-white outline-none appearance-none focus:border-amber-400/50" dir="ltr">
                      <option value="silver">Silver (2,000 MAD)</option>
                      <option value="gold">Gold (2,990 MAD)</option>
                      <option value="diamond">Diamond (4,990 MAD)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-500 mb-2 font-bold uppercase tracking-widest">{t("factory.trialDaysLabel")}</label>
                    <input type="number" min="1" max="60" value={facTrial} onChange={(e) => setFacTrial(Number(e.target.value))} className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs font-mono text-center text-amber-400 font-bold outline-none focus:border-amber-400/50" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-500 mb-2 font-bold uppercase tracking-widest">{t("factory.cashierPinLabel")}</label>
                    <input type="text" maxLength={4} value={facCashierPin} onChange={(e) => setFacCashierPin(e.target.value)} className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs font-mono text-center text-emerald-400 font-bold outline-none focus:border-emerald-400/50" dir="ltr" />
                  </div>
                </div>

                <button disabled={facSubmitting} type="submit" className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-black text-base sm:text-lg rounded-2xl shadow-[0_0_30px_-10px_rgba(16,185,129,0.6)] flex items-center justify-center gap-3 mt-4 active:scale-95 transition-all">
                  {facSubmitting ? <Loader2 className="animate-spin" size={24} /> : <><Sprout size={22} /> {t("factory.launchBtn")}</>}
                </button>
              </form>
            ) : (
              <div className="space-y-8 text-center animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] text-4xl font-black">
                  <Check size={40} />
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">{t("factory.successTitle", { cafeName: facResult.cafe.name })}</h3>
                  <p className="text-sm font-mono text-emerald-400 mt-2 bg-emerald-500/10 inline-block px-4 py-1.5 rounded-full border border-emerald-500/20" dir="ltr">Instance URL: /{facResult.cafe.slug}</p>
                </div>

                <div className={`bg-zinc-950 border border-white/10 p-6 rounded-3xl font-mono text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap select-all max-h-[35vh] overflow-y-auto shadow-inner hide-scrollbar ${isArabic ? 'text-right' : 'text-left'}`}>
                  {getWhatsAppWelcomeMsg(facResult)}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button onClick={copyToClipboard} className="w-full sm:w-auto px-8 py-4 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_-5px_rgba(251,191,36,0.5)] transition-transform active:scale-95 text-sm">
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    <span>{copied ? t("ui.copiedSuccess") : t("ui.copyWhatsappBtn")}</span>
                  </button>
                  <button onClick={() => { setShowFactory(false); setFacName(""); setFacSlug(""); setFacEmail(""); }} className="w-full sm:w-auto px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl text-sm transition-colors border border-white/5">
                    {t("factory.closeBtn")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}