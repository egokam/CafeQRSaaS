"use client";

import { useState, useEffect } from "react";
import { getUltimateDashboardData, forceUpdateCafeSub, provisionNewCafe, updateCafeOwnerCredentials } from "../../actions/saas";
import { 
  Building2, Receipt, ShieldCheck, AlertOctagon, Clock, Search, 
  ExternalLink, Calendar, CheckCircle2, XCircle, ChevronLeft, 
  DollarSign, Activity, Layers, RefreshCcw, Filter,
  Plus, Sprout, Copy, Check, Sparkles, UserCog // 👈 أضفنا UserCog هنا
} from "lucide-react";

export default function UltimateSuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({ cafes: [], receipts: [], stats: {} });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  // 🌟 النافذة الجانبية للتفتيش العميق (Deep Inspector)
  const [inspectedCafe, setInspectedCafe] = useState<any | null>(null);
  const [newDateInput, setNewDateInput] = useState("");
  const [newStatusInput, setNewStatusInput] = useState("");

  // 🌟 حالات تعديل حساب المالك (Auth Credentials)
  const [editOwnerEmail, setEditOwnerEmail] = useState("");
  const [editOwnerPassword, setEditOwnerPassword] = useState("");
  const [isUpdatingAuth, setIsUpdatingAuth] = useState(false);

  // 🌟 حالات معمل تفريخ المقاهي (SaaS Provisioning Factory)
  const [showFactory, setShowFactory] = useState(false);
  const [facName, setFacName] = useState("");
  const [facSlug, setFacSlug] = useState("");
  const [facEmail, setFacEmail] = useState("");
  const [facPass, setFacPass] = useState("CafeSaaS2026!");
  const [facPlan, setFacPlan] = useState("pro");
  const [facTrial, setFacTrial] = useState(14);
  const [facCashierPin, setFacCashierPin] = useState("0000");
  const [facAdminPin, setFacAdminPin] = useState("1234");
  const [facSubmitting, setFacSubmitting] = useState(false);
  const [facResult, setFacResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    const res = await getUltimateDashboardData();
    setData(res);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const handleInspect = (cafe: any) => {
    setInspectedCafe(cafe);
    setNewDateInput(cafe.subscription_ends_at ? cafe.subscription_ends_at.split('T')[0] : "");
    setNewStatusInput(cafe.subscription_status || "active");
    // تعبئة إيميل المالك الحالي لتسهيل التعديل
    setEditOwnerEmail(cafe.owner_email || "");
    setEditOwnerPassword("");
  };

  const handleForceSave = async () => {
    if (!inspectedCafe || !newDateInput) return;
    const isoDate = new Date(newDateInput).toISOString();
    const success = await forceUpdateCafeSub(inspectedCafe.id, newStatusInput, isoDate);
    if (success) {
      alert("تم فرض التحديث بنجاح! 🚀");
      loadAll();
      setInspectedCafe(null);
    } else {
      alert("فشل التحديث السري.");
    }
  };

  // 🔐 دالة تحديث حساب المالك (إيميل وباسورد)
  const handleUpdateCredentials = async () => {
    if (!inspectedCafe || !inspectedCafe.owner_auth_id) {
      return alert("هذا المقهى لا يملك حساب مصادقة مربوط به (Auth ID مفقود)!");
    }
    if (!editOwnerEmail) return alert("البريد الإلكتروني مطلوب!");

    setIsUpdatingAuth(true);
    const res = await updateCafeOwnerCredentials(inspectedCafe.id, inspectedCafe.owner_auth_id, editOwnerEmail, editOwnerPassword);
    setIsUpdatingAuth(false);

    if (res.success) {
      alert("تم تغيير بيانات دخول المالك بنجاح! 🔐");
      setEditOwnerPassword(""); // تصفير حقل الباسورد للأمان
      loadAll();
    } else {
      alert("فشل التحديث: " + res.error);
    }
  };

  // 🌟 دالة إطلاق الخادم ونشر المقهى في قاعدة البيانات
  const handleProvisionCafe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facName || !facSlug || !facEmail) return alert("يرجى إدخال الحقول الأساسية!");
    setFacSubmitting(true);
    setFacResult(null);

    const res = await provisionNewCafe({
      name: facName, 
      slug: facSlug, 
      ownerEmail: facEmail, 
      ownerPassword: facPass,
      planType: facPlan, 
      trialDays: Number(facTrial), 
      adminPin: facAdminPin, 
      cashierPin: facCashierPin
    });

    setFacSubmitting(false);
    if (res.success) {
      setFacResult(res);
      loadAll(); // تحديث عداد الـ KPIs في الخلفية
    } else {
      alert(res.error || "حدث خطأ أثناء التفريخ");
    }
  };

  // توليد رسالة واتساب المالك
  const getWhatsAppWelcomeMsg = (res: any) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : "http://localhost:3000";
    return `مرحباً بك في منصة EgoCafe SaaS ☕🚀

لقد تم تجهيز نظام مقهاكم "${res.cafe.name}" بنجاح! باقة التجربة المجانية مفعّلة لمدة ${facTrial} يوماً.

🔗 روابط واجهاتكم الخاصة:
1️⃣ لوحة التحكم الإدارية (لأصحاب المشروع):
${origin}/${res.cafe.slug}/admin
▪️ البريد الإلكتروني: ${res.credentials.email}
▪️ كلمة المرور: ${res.credentials.password}

2️⃣ شاشة الكاشير والطلبات:
${origin}/${res.cafe.slug}/cashier
▪️ الرمز السري (PIN): ${res.credentials.cashierPin}

3️⃣ شاشة المطبخ (KDS):
${origin}/${res.cafe.slug}/kitchen
▪️ الرمز السري (PIN): ${res.credentials.cashierPin}

*(يرجى تسجيل الدخول للإدارة وتغيير كلمة المرور والرموز فوراً)*`;
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
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center font-mono">
        <Activity className="animate-spin text-amber-500 mb-4" size={48} />
        <p className="text-sm tracking-widest text-slate-400">LOADING EGODEV INFRASTRECTURE...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-10 font-sans selection:bg-amber-500 selection:text-black" dir="rtl">
      
      {/* 🌟 الهيدر البانورامي مع زر التفريخ الملكي */}
      <header className="max-w-7xl mx-auto mb-8 pb-6 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"/>
            <span className="text-xs font-mono text-emerald-400 tracking-wider uppercase">Master Control Center v3.0</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black mt-1 text-white tracking-tight">المنصة الشاملة للمستثمر 👁️</h1>
        </div>
        
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button 
            onClick={() => { setShowFactory(true); setFacResult(null); }} 
            className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black px-6 py-3 rounded-2xl flex items-center gap-2 shadow-xl shadow-amber-500/10 active:scale-95 transition-all text-sm"
          >
            <Sprout size={18} /> تفريخ مقهى جديد 🌱
          </button>
          <button onClick={loadAll} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-4 py-3 rounded-2xl font-bold text-sm transition-all text-slate-300">
            <RefreshCcw size={18} />
          </button>
        </div>
      </header>

      {/* 🌟 شبكة المؤشرات الحيوية (KPIs) */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-sm">
          <div className="flex justify-between items-center text-slate-400 mb-2"><span className="text-xs font-bold font-mono">TOTAL CAFES</span><Building2 size={20} className="text-blue-400"/></div>
          <div className="text-3xl font-black">{data.stats.total} <span className="text-xs font-normal text-slate-500">مقهى</span></div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-sm">
          <div className="flex justify-between items-center text-slate-400 mb-2"><span className="text-xs font-bold font-mono">ACTIVE SUBS</span><ShieldCheck size={20} className="text-emerald-400"/></div>
          <div className="text-3xl font-black text-emerald-400">{data.stats.active}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-sm">
          <div className="flex justify-between items-center text-slate-400 mb-2"><span className="text-xs font-bold font-mono">SUSPENDED / KILL</span><AlertOctagon size={20} className="text-rose-500"/></div>
          <div className="text-3xl font-black text-rose-500">{data.stats.suspended}</div>
        </div>
        <div className="bg-gradient-to-br from-amber-500/10 via-slate-900/60 to-slate-900/60 border border-amber-500/30 p-6 rounded-3xl backdrop-blur-sm relative overflow-hidden">
          <div className="flex justify-between items-center text-amber-400/80 mb-2"><span className="text-xs font-bold font-mono tracking-wider">MONTHLY MRR</span><DollarSign size={20} className="text-amber-400"/></div>
          <div className="text-3xl font-black text-amber-400">{data.stats.mrr} <span className="text-xs font-bold">MAD</span></div>
        </div>
      </div>

      {/* 🌟 نافذة معمل تفريخ المقاهي (SaaS Provisioning Factory Modal) */}
      {showFactory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-[2.5rem] p-6 lg:p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto text-right">
            <button onClick={() => setShowFactory(false)} className="absolute top-6 left-6 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><XCircle size={20}/></button>
            
            <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20"><Sparkles size={26}/></div>
              <div>
                <h2 className="text-2xl font-black text-white">معمل تفريخ المنصات (SaaS Factory)</h2>
                <p className="text-xs text-slate-400 font-bold mt-0.5">تجهيز ونشر بيئة عمل متكاملة لمقهى جديد في ثوانٍ</p>
              </div>
            </div>

            {!facResult ? (
              <form onSubmit={handleProvisionCafe} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5 font-bold">اسم المقهى التجاري</label>
                    <input required type="text" placeholder="مثال: مقهى الأطلس" value={facName} onChange={(e) => setFacName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white font-bold outline-none focus:border-amber-500 transition-colors"/>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-amber-400 mb-1.5 font-bold">الرابط المختصر (Slug اللاتيني)</label>
                    <input required type="text" placeholder="atlas-cafe" value={facSlug} onChange={(e) => setFacSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} className="w-full bg-slate-950 border border-amber-500/40 rounded-xl p-3 text-sm font-mono text-amber-300 font-bold outline-none focus:border-amber-500 text-left transition-colors" dir="ltr"/>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5 font-bold">البريد الإلكتروني للمالك (Supabase Auth)</label>
                    <input required type="email" placeholder="owner@cafe.ma" value={facEmail} onChange={(e) => setFacEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm font-mono text-white outline-none focus:border-amber-500 text-left transition-colors" dir="ltr"/>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5 font-bold">كلمة المرور المؤقتة للمالك</label>
                    <input required type="text" value={facPass} onChange={(e) => setFacPass(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm font-mono text-white outline-none focus:border-amber-500 text-left transition-colors" dir="ltr"/>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1 font-bold">نوع الباقة</label>
                    <select value={facPlan} onChange={(e) => setFacPlan(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-white outline-none"><option value="starter">Starter (150)</option><option value="pro">Pro (299)</option><option value="enterprise">Enterprise (499)</option></select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1 font-bold">فترة التجربة (أيام)</label>
                    <input type="number" min="1" max="60" value={facTrial} onChange={(e) => setFacTrial(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-center text-amber-400 font-bold outline-none"/>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1 font-bold">PIN الطاقم</label>
                    <input type="text" maxLength={4} value={facCashierPin} onChange={(e) => setFacCashierPin(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-center text-emerald-400 font-bold outline-none"/>
                  </div>
                </div>

                <button disabled={facSubmitting} type="submit" className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-2 mt-4 active:scale-95 transition-all">
                  {facSubmitting ? "جاري التجهيز ونشر الخوادم..." : "🚀 إطلاق المقهى وحقن القواعد في السحابة"}
                </button>
              </form>
            ) : (
              <div className="space-y-6 text-center animate-in zoom-in duration-200">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 text-2xl font-black">✓</div>
                <div>
                  <h3 className="text-2xl font-black text-white">تم نشر خوادم "{facResult.cafe.name}" بنجاح!</h3>
                  <p className="text-xs font-mono text-emerald-400 mt-1">Instance URL: /{facResult.cafe.slug}</p>
                </div>
                
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl text-right font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-all max-h-[30vh] overflow-y-auto">
                  {getWhatsAppWelcomeMsg(facResult)}
                </div>

                <div className="flex gap-3">
                  <button onClick={copyToClipboard} className="flex-1 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 text-sm">
                    {copied ? <Check size={18}/> : <Copy size={18}/>}
                    <span>{copied ? "تم النسخ بنجاح!" : "نسخ رسالة الترحيب للواتساب 📲"}</span>
                  </button>
                  <button onClick={() => { setShowFactory(false); setFacName(""); setFacSlug(""); setFacEmail(""); }} className="px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs">إغلاق</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto space-y-6">
        
        {/* 🌟 أدوات الفلترة والبحث */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 rounded-3xl border border-slate-800/80">
          <div className="relative w-full sm:w-80">
            <Search className="absolute right-4 top-3.5 text-slate-500" size={18} />
            <input type="text" placeholder="بحث باسم المقهى أو الـ Slug..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-11 pl-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors" />
          </div>
          <div className="flex gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 w-full sm:w-auto overflow-x-auto">
            {['ALL', 'ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED'].map((st) => (
              <button key={st} onClick={() => setStatusFilter(st)} className={`px-4 py-2 rounded-xl text-xs font-bold font-mono whitespace-nowrap transition-all ${statusFilter === st ? 'bg-slate-800 text-amber-400 shadow-md' : 'text-slate-400 hover:text-white'}`}>
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* 🌟 جدول القيادة العام */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" dir="rtl">
              <thead>
                <tr className="border-b border-slate-800 font-mono text-[11px] text-slate-400 uppercase bg-slate-950/60">
                  <th className="p-5">المقهى</th>
                  <th className="p-5">الباقة</th>
                  <th className="p-5">الحالة الحقيقية</th>
                  <th className="p-5">انتهاء الصلاحية</th>
                  <th className="p-5">النشاط (منتج/طلب)</th>
                  <th className="p-5 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredCafes.map((cafe: any) => {
                  const ends = cafe.subscription_ends_at ? new Date(cafe.subscription_ends_at) : new Date();
                  const diffDays = Math.ceil((ends.getTime() - Date.now()) / (1000 * 3600 * 24));
                  const st = cafe.subscription_status;

                  return (
                    <tr key={cafe.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="p-5">
                        <div className="font-extrabold text-white text-base flex items-center gap-2">
                          <span>{cafe.name}</span>
                          <a href={`/${cafe.slug}/admin`} title="الدخول للوحة تحكم المقهى" target="_blank" className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-amber-400 transition-opacity"><ExternalLink size={14}/></a>
                        </div>
                        <span className="text-xs font-mono text-slate-500">/{cafe.slug}</span>
                      </td>
                      <td className="p-5 font-mono text-xs uppercase text-amber-400/90 font-bold">{cafe.plan_type || 'pro'}</td>
                      <td className="p-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${st === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : st === 'pending_verification' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                          {st === 'active' && <ShieldCheck size={14}/>}
                          {st === 'pending_verification' && <Clock size={14}/>}
                          {st === 'suspended' && <AlertOctagon size={14}/>}
                          {st}
                        </span>
                      </td>
                      <td className="p-5 font-mono">
                        <div className="font-bold">{ends.toISOString().split('T')[0]}</div>
                        <div className={`text-[11px] ${diffDays < 0 ? 'text-rose-400 font-bold' : diffDays <= 5 ? 'text-amber-400' : 'text-slate-500'}`}>
                          {diffDays < 0 ? `منتهي منذ ${Math.abs(diffDays)} يوم` : `متبقي ${diffDays} يوم`}
                        </div>
                      </td>
                      <td className="p-5 font-mono text-xs text-slate-400">
                        📦 {cafe.products?.[0]?.count || 0} | 🛒 {cafe.orders?.[0]?.count || 0}
                      </td>
                      <td className="p-5 text-center">
                        <button onClick={() => handleInspect(cafe)} className="bg-slate-800 hover:bg-amber-500 hover:text-black text-slate-200 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm">
                          تفتيش الأرشيف 📂
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 🌟 المفتش العميق الجانبي (Deep Inspector Drawer) */}
      {inspectedCafe && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-slate-900 border-r border-slate-800 h-full overflow-y-auto p-6 lg:p-8 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex justify-between items-center pb-6 border-b border-slate-800 mb-6">
                <div>
                  <span className="text-xs font-mono text-amber-400 uppercase">Cafe Deep Dossier</span>
                  <h2 className="text-2xl font-black text-white mt-1">{inspectedCafe.name}</h2>
                </div>
                <button onClick={() => setInspectedCafe(null)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-400"><ChevronLeft size={20}/></button>
              </div>

              {/* 🔐 تعديل حساب المالك (Auth Credentials) */}
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 mb-6 space-y-4">
                <h4 className="text-sm font-bold text-emerald-400 uppercase font-mono tracking-wider flex items-center gap-2">
                  <UserCog size={18} /> إدارة حساب المالك (Auth)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">البريد الإلكتروني الجديد</label>
                    <input type="email" value={editOwnerEmail} onChange={(e) => setEditOwnerEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-mono text-white focus:outline-emerald-500 text-left" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">كلمة المرور الجديدة</label>
                    <input type="text" placeholder="اتركه فارغاً للتجاهل" value={editOwnerPassword} onChange={(e) => setEditOwnerPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-mono text-white focus:outline-emerald-500 text-left placeholder:text-slate-600" dir="ltr" />
                  </div>
                </div>
                <button disabled={isUpdatingAuth} onClick={handleUpdateCredentials} className="w-full py-3 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 font-bold rounded-xl text-sm transition-all active:scale-95 shadow-sm border border-emerald-500/20 disabled:opacity-50">
                  {isUpdatingAuth ? "جاري تحديث الحساب..." : "تحديث بيانات الدخول 🔐"}
                </button>
              </div>

              {/* تحكم الطوارئ اليدوي (God Overrides) */}
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 mb-8 space-y-4">
                <h4 className="text-sm font-bold text-amber-400 uppercase font-mono tracking-wider">⚡ تجاوزات النظام اليدوية (God Overrides)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">فرض تاريخ انتهاء جديد</label>
                    <input type="date" value={newDateInput} onChange={(e) => setNewDateInput(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-mono text-white focus:outline-amber-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">تغيير الحالة إجبارياً</label>
                    <select value={newStatusInput} onChange={(e) => setNewStatusInput(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm font-mono text-white focus:outline-amber-500">
                      <option value="active">ACTIVE (شغال)</option>
                      <option value="pending_verification">PENDING (مهلة)</option>
                      <option value="suspended">SUSPENDED (إعدام)</option>
                    </select>
                  </div>
                </div>
                <button onClick={handleForceSave} className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm transition-transform active:scale-95 shadow-lg shadow-amber-500/10">
                  حفظ التجاوز الملكي 💾
                </button>
              </div>

              {/* أرشيف الإيصالات التاريخية */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2 font-mono"><Receipt size={16} className="text-blue-400"/> الأرشيف التاريخي للإيصالات البنكية</h4>
                
                {(() => {
                  const cafeReceipts = data.receipts.filter((r: any) => r.cafe_id === inspectedCafe.id);
                  if (cafeReceipts.length === 0) return <p className="text-xs text-slate-500 font-mono italic">لا يوجد أرشيف بنكي لهذا المقهى.</p>;

                  return cafeReceipts.map((rec: any) => (
                    <div key={rec.id} className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 overflow-hidden border border-slate-700 shrink-0">
                          <img src={rec.receipt_url} alt="receipt" className="w-full h-full object-cover"/>
                        </div>
                        <div>
                          <div className="font-mono text-sm font-black text-white">{rec.amount} MAD</div>
                          <div className="text-[10px] font-mono text-slate-500">{new Date(rec.uploaded_at).toLocaleString('ar-MA')}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${rec.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : rec.status === 'rejected' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {rec.status}
                        </span>
                        <a href={rec.receipt_url} target="_blank" rel="noreferrer" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"><ExternalLink size={14}/></a>
                      </div>
                    </div>
                  ));
                })()}
              </div>

            </div>
            
            <div className="pt-6 border-t border-slate-800 text-center font-mono text-[10px] text-slate-600 uppercase">
              EgoCafe Core Database ID: {inspectedCafe.id} | Owner Auth ID: {inspectedCafe.owner_auth_id}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}