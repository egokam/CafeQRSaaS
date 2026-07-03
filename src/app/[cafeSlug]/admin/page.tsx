"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "../../../lib/supabase";
import { 
  Plus, Trash2, Image as ImageIcon, Loader2, QrCode, PackageSearch, 
  Printer, Lock, Settings, Edit, X, AlertTriangle, CheckCircle2, 
  CreditCard, TrendingUp, DollarSign, History, Calendar, MonitorSmartphone,
  MessageCircle, KeyRound // 🌟 إضافة أيقونة المفتاح
} from "lucide-react";
import QRCode from "react-qr-code";
import { signInAdminWithEmail, updateCafeSettings, adminAddProduct, adminUpdateProduct, adminDeleteProduct, adminCheckOrAddTable } from "../../../actions/auth";
import BillingTab from "../../../components/BillingTab";

const CATEGORIES = ["القهوة", "الحلوى", "عصائر", "مخبوزات"];

const compressImageBeforeUpload = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800; 
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Compression failed"));
            const compressedFile = new File(
              [blob], 
              file.name.replace(/\.[^/.]+$/, "") + ".webp", 
              { type: "image/webp", lastModified: Date.now() }
            );
            resolve(compressedFile);
          },
          "image/webp",
          0.75 
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function AdminDashboard({ params }: { params: Promise<{ cafeSlug: string }> }) {
  const { cafeSlug } = use(params);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  
  // 🌟 نظام المراحل الجديد: login | otp | reset
  const [authMode, setAuthMode] = useState<"login" | "otp" | "reset">("login");
  const [otpInput, setOtpInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  
  const [cafeName, setCafeName] = useState("");
  const [newAdminPin, setNewAdminPin] = useState("");
  const [newCashierPin, setNewCashierPin] = useState("");
  
  const [maxCashiers, setMaxCashiers] = useState("2"); 
  const [maxKitchens, setMaxKitchens] = useState("1"); 
  
  const [activeCashiers, setActiveCashiers] = useState(0);
  const [activeKitchens, setActiveKitchens] = useState(0);

  const [activeTab, setActiveTab] = useState("products"); 
  const [products, setProducts] = useState<any[]>([]);
  const [cafeId, setCafeId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  const [monthlyOrders, setMonthlyOrders] = useState<any[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [isLoadingSales, setIsLoadingSales] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameFr, setNameFr] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("القهوة");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [tableNum, setTableNum] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [qrReady, setQrReady] = useState(false);

  const fetchProducts = async (cId: string) => {
    const { data } = await supabase.from('products').select('*').eq('cafe_id', cId);
    if (data) setProducts(data.reverse());
  };

  const fetchMonthlySales = async (cId: string) => {
    setIsLoadingSales(true);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data, error } = await supabase
      .from('orders')
      .select('*, tables(table_number)')
      .eq('cafe_id', cId)
      .eq('status', 'completed')
      .gte('created_at', startOfMonth)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMonthlyOrders(data);
      const total = data.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);
      setMonthlyIncome(total);
    }
    setIsLoadingSales(false);
  };

  useEffect(() => {
    const initAdmin = async () => {
      setIsLoading(true);
      const { data: cafeData } = await supabase.from('cafes').select('*').eq('slug', cafeSlug).single();
      
      if (!cafeData) {
        setIsNotFound(true);
        setIsLoading(false);
        return;
      }

      setCafeId(cafeData.id);
      if (cafeData.name) setCafeName(cafeData.name);
      if (cafeData.max_cashiers) setMaxCashiers(cafeData.max_cashiers.toString());
      if (cafeData.max_kitchens) setMaxKitchens(cafeData.max_kitchens.toString());
      
      // 🌟 حفظ إيميل المالك والتحقق الصارم من الجلسة
      if (cafeData.owner_email) {
        setOwnerEmail(cafeData.owner_email);
        
        const sessionKey = `admin_auth_${cafeSlug}`;
        if (sessionStorage.getItem(sessionKey) === 'true') {
          const { data: { user } } = await supabase.auth.getUser();
          
          // 🛡️ الحارس الأمني: التأكد أن المستخدم الحالي هو المالك الفعلي
          if (user && user.email?.toLowerCase() === cafeData.owner_email.toLowerCase()) {
            setIsAuthenticated(true);
          } else {
            sessionStorage.removeItem(sessionKey);
            await supabase.auth.signOut();
            setIsAuthenticated(false);
          }
        }
      }
      
      await Promise.all([
        fetchProducts(cafeData.id),
        fetchMonthlySales(cafeData.id)
      ]);

      setIsLoading(false);
    };
    initAdmin();
  }, [cafeSlug]);

  useEffect(() => {
    if (!cafeId || !isAuthenticated) return;

    const cashierChannel = supabase.channel(`cashier_slots_${cafeId}`);
    cashierChannel.on('presence', { event: 'sync' }, () => {
      const state = cashierChannel.presenceState();
      setActiveCashiers(Object.keys(state).length);
    }).subscribe();

    const kitchenChannel = supabase.channel(`kitchen_slots_${cafeId}`);
    kitchenChannel.on('presence', { event: 'sync' }, () => {
      const state = kitchenChannel.presenceState();
      setActiveKitchens(Object.keys(state).length);
    }).subscribe();

    return () => {
      supabase.removeChannel(cashierChannel);
      supabase.removeChannel(kitchenChannel);
    };
  }, [cafeId, isAuthenticated]);

  // 1️⃣ تسجيل الدخول مع الحماية الصارمة
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput || !cafeId) return;

    // 🛡️ المنع المباشر: إذا كتب إيميل آخر غير إيميل المقهى
    if (emailInput.toLowerCase() !== ownerEmail.toLowerCase()) {
      alert("⛔ وصول مرفوض: هذا البريد غير مصرح له بإدارة هذا المقهى.");
      return;
    }

    setIsChecking(true);
    const res = await signInAdminWithEmail(emailInput, passwordInput);
    setIsChecking(false);

    if (res.success) {
      setIsAuthenticated(true);
      sessionStorage.setItem(`admin_auth_${cafeSlug}`, 'true');
    } else {
      alert(res.error || "بيانات الدخول غير صحيحة ❌");
    }
  };

  // 2️⃣ إرسال كود OTP لاستعادة كلمة المرور
  const handleAutoRecovery = async () => {
    if (!ownerEmail) {
      alert("عذراً، لم يتم العثور على بريد إلكتروني مسجل لمالك هذا المقهى.");
      return;
    }
    
    setIsChecking(true);
    // نستخدم resetPassword مباشرة لضمان تشغيل قالب الاستعادة
    const { error } = await supabase.auth.resetPasswordForEmail(ownerEmail);
    setIsChecking(false);
    
    if (!error) { 
      setAuthMode("otp"); // الانتقال لمرحلة الـ OTP
      const maskedEmail = ownerEmail.replace(/^(.)(.*)(.@.*)$/, (_, a, b, c) => a + b.replace(/./g, '*') + c);
      alert(`تم إرسال رمز استعادة كلمة المرور إلى: ${maskedEmail} 📩`); 
    } else {
      alert("حدث خطأ أثناء الإرسال: " + error.message);
    }
  };

  // 3️⃣ التحقق من كود الـ OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput || !ownerEmail) return;

    setIsChecking(true);
    const { error } = await supabase.auth.verifyOtp({
      email: ownerEmail,
      token: otpInput,
      type: 'recovery', 
    });
    setIsChecking(false);

    if (error) {
      alert("الرمز غير صحيح أو منتهي الصلاحية ❌");
    } else {
      setAuthMode("reset"); // الانتقال لمرحلة تعيين باسورد جديد
    }
  };

  // 4️⃣ تعيين الباسورد الجديد في الداتابيز
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput) return;
    
    setIsChecking(true);
    const { error } = await supabase.auth.updateUser({
      password: newPasswordInput
    });
    setIsChecking(false);

    if (error) {
      alert("فشل تحديث كلمة المرور: " + error.message);
    } else {
      alert("تم تغيير كلمة المرور بنجاح! يمكنك الآن الدخول للمنصة 🔓");
      setIsAuthenticated(true);
      sessionStorage.setItem(`admin_auth_${cafeSlug}`, 'true');
      setAuthMode("login");
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeId) return;
    setIsChecking(true);
    const { success } = await updateCafeSettings(cafeId, cafeName, newAdminPin, newCashierPin, Number(maxCashiers), Number(maxKitchens));
    setIsChecking(false);
    if (success) { alert("تم حفظ الإعدادات!"); setNewAdminPin(""); setNewCashierPin(""); }
    else alert("حدث خطأ أثناء الحفظ.");
  };

  const resetForm = () => {
    setEditingId(null); setName(""); setNameEn(""); setNameFr(""); setDescription(""); setPrice(""); setImageFile(null);
  };

  const handleAddOrUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeId || !name || !price || (!imageFile && !editingId)) return alert("يرجى تعبئة الحقول!");
    setIsUploading(true);
    try {
      let finalImageUrl = undefined;
      
      if (imageFile) {
        const optimizedFile = await compressImageBeforeUpload(imageFile);
        const fileName = `${Date.now()}-${Math.random()}.webp`; 

        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, optimizedFile);
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;

        if (editingId) {
          const oldProduct = products.find(p => p.id === editingId);
          if (oldProduct && oldProduct.image_url) {
            const oldFileName = oldProduct.image_url.split('/').pop();
            if (oldFileName) await supabase.storage.from('products').remove([oldFileName]);
          }
        }
      }
      
      const productData: any = { name_ar: name, name_en: nameEn, name_fr: nameFr, description_ar: description, price: parseFloat(price), category: category };
      if (finalImageUrl) productData.image_url = finalImageUrl;

      if (editingId) {
        const { success } = await adminUpdateProduct(editingId, productData);
        if (success) alert("تم التحديث!"); else throw new Error();
      } else {
        productData.cafe_id = cafeId; productData.is_active = true;
        const { success } = await adminAddProduct(productData);
        if (success) alert("تمت الإضافة!"); else throw new Error();
      }
      resetForm(); fetchProducts(cafeId);
    } catch (err: any) { alert("خطأ: " + (err.message || "فشل التخزين")); } finally { setIsUploading(false); }
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm("تأكيد الحذف؟")) return;
    try {
      if (imageUrl) {
        const fileName = imageUrl.split('/').pop();
        if (fileName) await supabase.storage.from('products').remove([fileName]);
      }
      const { success } = await adminDeleteProduct(id);
      if (success) fetchProducts(cafeId!);
    } catch (err) { alert("فشل الحذف"); }
  };

  const handleEditClick = (product: any) => {
    setEditingId(product.id); setName(product.name_ar || ""); setNameEn(product.name_en || ""); setNameFr(product.name_fr || "");
    setDescription(product.description_ar || ""); setPrice(product.price.toString()); setCategory(product.category); setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerateSmartQR = async () => {
    if (!tableNum || !cafeId) return;
    setIsGeneratingQr(true);
    setQrReady(false);
    const formattedTableNumber = `table_${tableNum}`;

    const { success } = await adminCheckOrAddTable(cafeId, formattedTableNumber);
    
    if (success) {
      const baseUrl = window.location.origin;
      setQrUrl(`${baseUrl}/${cafeSlug}/${formattedTableNumber}`);
      setQrReady(true);
    } else {
      alert("حدث خطأ أثناء فحص/إضافة الطاولة من السيرفر. يرجى المحاولة.");
    }
    
    setIsGeneratingQr(false);
  };

  const handlePrint = () => { window.print(); };

  if (isLoading) return <div className="p-10 text-center font-bold">جاري التحميل...</div>;

  if (isNotFound) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-6 border border-red-200"><AlertTriangle className="w-12 h-12 text-red-500" /></div>
        <h1 className="text-4xl font-extrabold text-foreground mb-4">404 - المقهى غير موجود</h1>
        <p className="text-muted-foreground text-lg max-w-md font-medium">عذراً، الرابط الذي تحاول الوصول إليه غير صحيح.</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-6" dir="rtl">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-border w-full max-w-md text-center">
          
          {authMode === "reset" ? (
            <div className="bg-emerald-500/10 w-20 h-20 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto mb-6 shadow-inner"><KeyRound size={36} /></div>
          ) : (
            <div className="bg-primary/10 w-20 h-20 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6 shadow-inner"><Lock size={36} /></div>
          )}
          
          <h2 className="text-2xl font-black mb-2 tracking-tight">
            {authMode === "login" && "تسجيل دخول الإدارة"}
            {authMode === "otp" && "أدخل رمز التحقق"}
            {authMode === "reset" && "كلمة مرور جديدة"}
          </h2>
          <p className="text-muted-foreground mb-8 text-sm font-bold">
            {authMode === "login" && "قم بتسجيل الدخول للتحكم في حساب مشروعك"}
            {authMode === "otp" && "تم إرسال رمز سري إلى بريدك الإلكتروني"}
            {authMode === "reset" && "يرجى كتابة كلمة المرور الجديدة لحسابك"}
          </p>
          
          {/* 🌟 تبديل الفورم بناءً على حالة الـ Auth Mode */}
          {authMode === "login" && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4 text-right">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 pr-1">البريد الإلكتروني</label>
                <input required type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="w-full border-2 border-border rounded-2xl p-4 text-left font-mono text-sm focus:border-primary outline-none bg-muted/20 transition-colors" placeholder="owner@cafe.ma" autoFocus disabled={isChecking} />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 pr-1">كلمة المرور</label>
                <input required type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full border-2 border-border rounded-2xl p-4 text-left font-mono text-sm focus:border-primary outline-none bg-muted/20 transition-colors" placeholder="••••••••" disabled={isChecking} />
              </div>
              <button disabled={isChecking} type="submit" className="py-4 rounded-2xl font-black text-base text-white bg-foreground hover:opacity-90 mt-2 shadow-xl transition-all active:scale-95">
                {isChecking ? "جاري المصادقة..." : "دخول للمنصة 🚀"}
              </button>
              
              <button type="button" onClick={handleAutoRecovery} disabled={isChecking} className="text-xs text-primary font-bold mt-3 hover:underline text-center block w-full disabled:opacity-50">
                هل نسيت كلمة المرور؟
              </button>
            </form>
          )}

          {authMode === "otp" && (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4 text-right animate-in fade-in zoom-in duration-300">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 pr-1">الرمز السري (OTP)</label>
                <input 
                  required 
                  type="text" 
                  value={otpInput} 
                  onChange={(e) => setOtpInput(e.target.value)} 
                  className="w-full border-2 border-border rounded-2xl p-4 text-center font-mono text-2xl tracking-[0.5em] focus:border-primary outline-none bg-muted/20 transition-colors" 
                  placeholder="••••••" 
                  autoFocus 
                  disabled={isChecking} 
                  maxLength={6} 
                />
              </div>
              <button disabled={isChecking || otpInput.length < 6} type="submit" className="py-4 rounded-2xl font-black text-base text-white bg-primary hover:opacity-90 mt-2 shadow-xl transition-all active:scale-95 disabled:opacity-50">
                {isChecking ? "جاري التحقق..." : "التحقق من الرمز ✅"}
              </button>
              
              <button type="button" onClick={() => setAuthMode("login")} className="text-xs text-muted-foreground font-bold mt-3 hover:underline text-center block w-full">
                العودة لتسجيل الدخول
              </button>
            </form>
          )}

          {authMode === "reset" && (
            <form onSubmit={handleSetNewPassword} className="flex flex-col gap-4 text-right animate-in fade-in zoom-in duration-300">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 pr-1">كلمة المرور الجديدة</label>
                <input 
                  required 
                  type="text" 
                  value={newPasswordInput} 
                  onChange={(e) => setNewPasswordInput(e.target.value)} 
                  className="w-full border-2 border-emerald-500/50 rounded-2xl p-4 text-left font-mono text-sm focus:border-emerald-500 outline-none bg-emerald-50 transition-colors" 
                  placeholder="أدخل كلمة مرور قوية..." 
                  autoFocus 
                  disabled={isChecking} 
                />
              </div>
              <button disabled={isChecking || newPasswordInput.length < 6} type="submit" className="py-4 rounded-2xl font-black text-base text-white bg-emerald-500 hover:bg-emerald-600 mt-2 shadow-xl transition-all active:scale-95 disabled:opacity-50">
                {isChecking ? "جاري الحفظ..." : "حفظ الدخول 💾"}
              </button>
            </form>
          )}

          {/* 🌟 زر التواصل مع الدعم الفني عبر الواتساب لتغيير الإيميل */}
          <div className="mt-8 pt-6 border-t border-border flex flex-col items-center gap-3">
            <p className="text-xs text-muted-foreground font-bold">لتعديل البريد الإلكتروني للإدارة، يرجى التواصل مع الدعم الفني.</p>
            <a 
              href="https://wa.me/212781991384" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center justify-center gap-2 w-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 py-3.5 rounded-2xl font-bold text-sm transition-colors"
            >
              <MessageCircle size={20} />
              تواصل عبر واتساب
            </a>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 p-6 md:p-12 font-sans" dir="rtl">
      <style dangerouslySetInnerHTML={{__html: `@media print { body * { visibility: hidden; } #qr-print-area, #qr-print-area * { visibility: visible; } #qr-print-area { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 100%; text-align: center; } }`}} />

      <header className="mb-8 flex flex-col xl:flex-row xl:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-border gap-4">
        <div><h1 className="text-3xl font-extrabold text-foreground">لوحة تحكم المدير ⚙️</h1><p className="text-muted-foreground mt-1">التحكم الشامل في المقهى</p></div>
        <div className="flex flex-wrap bg-muted p-1 rounded-xl gap-1">
          <button onClick={() => setActiveTab('products')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm ${activeTab === 'products' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}><PackageSearch size={18} /> المنيو</button>
          <button onClick={() => setActiveTab('qr')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm ${activeTab === 'qr' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}><QrCode size={18} /> الطاولات</button>
          
          <button onClick={() => { setActiveTab('sales'); cafeId && fetchMonthlySales(cafeId); }} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm ${activeTab === 'sales' ? 'bg-white text-emerald-600 shadow-sm' : 'text-muted-foreground'}`}>
            <TrendingUp size={18} /> المبيعات الشهرية 📈
          </button>

          <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm ${activeTab === 'settings' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}><Settings size={18} /> الإعدادات</button>
          <button onClick={() => setActiveTab('billing')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm ${activeTab === 'billing' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}><CreditCard size={18} /> الاشتراك والأداء 💳</button>
        </div>
      </header>

      {/* باقي الأقسام تبدأ من هنا (المبيعات، الإعدادات، المنتجات، QR، الخ) -- لا تغيير فيها */}
      
      {activeTab === 'sales' && (
        <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground block">مدخول الشهر الحالي</span>
                <h3 className="text-3xl font-black text-emerald-600 mt-1">{monthlyIncome.toFixed(2)} <span className="text-sm font-bold text-muted-foreground">MAD</span></h3>
              </div>
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0"><DollarSign size={28}/></div>
            </div>

            <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground block">الطلبات المنجزة بنجاح</span>
                <h3 className="text-3xl font-black text-foreground mt-1">{monthlyOrders.length} <span className="text-sm font-bold text-muted-foreground">طلب</span></h3>
              </div>
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shrink-0"><CheckCircle2 size={28}/></div>
            </div>

            <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground block">متوسط صرف الزبون</span>
                <h3 className="text-3xl font-black text-primary mt-1">
                  {monthlyOrders.length > 0 ? (monthlyIncome / monthlyOrders.length).toFixed(2) : "0.00"} <span className="text-sm font-bold text-muted-foreground">MAD</span>
                </h3>
              </div>
              <div className="p-4 bg-primary/10 text-primary rounded-2xl shrink-0"><TrendingUp size={28}/></div>
            </div>
          </div>

          <div className="bg-white p-6 lg:p-8 rounded-3xl border shadow-sm">
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
              <div>
                <h3 className="font-extrabold text-xl">سجل مبيعات شهر {new Date().toLocaleString('ar-MA', { month: 'long' })}</h3>
                <p className="text-xs text-muted-foreground mt-1">الطلبات المدفوعة والمستلمة فقط</p>
              </div>
              <button onClick={() => cafeId && fetchMonthlySales(cafeId)} className="p-2.5 bg-muted rounded-xl hover:bg-gray-200 text-xs font-bold flex items-center gap-1.5 transition-colors">
                <History size={16}/> تحديث السجل
              </button>
            </div>

            {isLoadingSales ? (
              <div className="py-12 text-center font-bold text-muted-foreground">جاري حساب المداخيل...</div>
            ) : monthlyOrders.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground border-2 border-dashed rounded-2xl font-bold">
                لا توجد مبيعات مكتملة في هذا الشهر حتى الآن.
              </div>
            ) : (
              <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                {monthlyOrders.map((ord) => (
                  <div key={ord.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/15 border rounded-2xl gap-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black shrink-0 text-lg">✓</div>
                      <div>
                        <div className="font-extrabold text-sm flex items-center gap-2">
                          <span>طاولة {ord.tables?.table_number?.replace('table_', '') || 'مباشر (POS)'}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">#{ord.id.split('-')[0]}</span>
                        </div>
                        <div className="text-xs text-muted-foreground font-bold mt-1 leading-relaxed">
                          {ord.items.map((it:any) => `${it.quantity}x ${it.name_ar}`).join(' + ')}
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                      <span className="text-base font-black text-emerald-600 font-mono">{Number(ord.total_amount).toFixed(2)} MAD</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{new Date(ord.created_at).toLocaleString('ar-MA')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
          
          <div className="bg-white p-6 rounded-3xl border border-border shadow-sm flex flex-col sm:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="font-extrabold text-lg mb-1 flex items-center gap-2">
                <MonitorSmartphone className="text-primary"/> الأجهزة المتصلة الآن
              </h3>
              <p className="text-xs text-muted-foreground font-bold">مراقبة حية للأسطول النشط في المقهى.</p>
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
              <div className="flex-1 sm:flex-none text-center px-6 py-4 bg-muted/20 border rounded-2xl">
                <span className="block text-xs font-bold text-muted-foreground mb-1">الكاشير 💳</span>
                <div className="flex items-baseline justify-center gap-1" dir="ltr">
                  <span className={`text-3xl font-black ${activeCashiers > 0 ? 'text-emerald-500 animate-pulse' : 'text-slate-300'}`}>
                    {activeCashiers}
                  </span>
                  <span className="text-sm font-bold text-muted-foreground">/ {maxCashiers}</span>
                </div>
              </div>
              <div className="flex-1 sm:flex-none text-center px-6 py-4 bg-muted/20 border rounded-2xl">
                <span className="block text-xs font-bold text-muted-foreground mb-1">المطبخ 👨‍🍳</span>
                <div className="flex items-baseline justify-center gap-1" dir="ltr">
                  <span className={`text-3xl font-black ${activeKitchens > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-300'}`}>
                    {activeKitchens}
                  </span>
                  <span className="text-sm font-bold text-muted-foreground">/ {maxKitchens}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 lg:p-10 rounded-3xl shadow-sm border border-border">
            <h2 className="text-2xl font-bold mb-6 border-b pb-4">إعدادات وضوابط المقهى</h2>
            <form onSubmit={handleUpdateSettings} className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2">اسم المقهى</label>
                <input type="text" required value={cafeName} onChange={(e) => setCafeName(e.target.value)} className="w-full border border-border rounded-xl p-3 bg-muted/30 font-bold" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 text-primary">الحد الأقصى لشاشات الكاشير</label>
                  <input type="number" min="1" max="10" required value={maxCashiers} onChange={(e) => setMaxCashiers(e.target.value)} className="w-full border-2 border-primary/30 rounded-xl p-3 bg-primary/5 font-bold text-xl text-center focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-amber-600">الحد الأقصى لشاشات المطبخ</label>
                  <input type="number" min="1" max="10" required value={maxKitchens} onChange={(e) => setMaxKitchens(e.target.value)} className="w-full border-2 border-amber-500/30 rounded-xl p-3 bg-amber-500/5 font-bold text-xl text-center focus:border-amber-500 outline-none" />
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <label className="block text-sm font-bold mb-2">تحديث رمز المدير البديل (PIN)</label>
                <input type="text" value={newAdminPin} onChange={(e) => setNewAdminPin(e.target.value)} className="w-full border border-border rounded-xl p-3 bg-muted/30 font-mono text-center" placeholder="اتركه فارغاً للإبقاء على القديم" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">تحديث رمز الكاشير والمطبخ (PIN)</label>
                <input type="text" value={newCashierPin} onChange={(e) => setNewCashierPin(e.target.value)} className="w-full border border-border rounded-xl p-3 bg-muted/30 font-mono text-center tracking-widest" placeholder="••••" />
              </div>
              
              <button disabled={isChecking} type="submit" className="w-full bg-foreground text-white py-4 rounded-2xl font-black mt-4 shadow-xl active:scale-95 transition-all">
                {isChecking ? "جاري الحفظ..." : "حفظ التغييرات 💾"}
              </button>
            </form>
          </div>
          
        </div>
      )}

      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-border h-fit relative">
            {editingId && <button onClick={resetForm} className="absolute top-6 left-6 text-muted-foreground hover:text-red-500"><X size={24} /></button>}
            <h2 className="text-xl font-bold mb-6 border-b pb-4">{editingId ? "تعديل المنتج" : "إضافة منتج"}</h2>
            <form onSubmit={handleAddOrUpdateProduct} className="space-y-4">
              <div><label className="block text-sm font-bold mb-2">اسم المنتج (عربي)</label><input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-border rounded-xl p-3 bg-muted/30" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold mb-2">EN</label><input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="w-full border border-border rounded-xl p-3 bg-muted/30" /></div>
                <div><label className="block text-sm font-bold mb-2">FR</label><input type="text" value={nameFr} onChange={(e) => setNameFr(e.target.value)} className="w-full border border-border rounded-xl p-3 bg-muted/30" /></div>
              </div>
              <div><label className="block text-sm font-bold mb-2">الوصف</label><textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-border rounded-xl p-3 bg-muted/30" rows={2} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold mb-2">السعر</label><input required type="number" step="0.5" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border border-border rounded-xl p-3 bg-muted/30" /></div>
                <div><label className="block text-sm font-bold mb-2">القسم</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-border rounded-xl p-3 bg-muted/30">{CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">الصورة</label>
                <div className="border-2 border-dashed border-primary/50 rounded-xl p-4 text-center cursor-pointer relative"><input required={!editingId} type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0" /><div className="text-primary font-bold">{imageFile ? imageFile.name : editingId ? "تغيير الصورة" : "اختر صورة"}</div></div>
              </div>
              <button disabled={isUploading} type="submit" className={`w-full text-white py-4 rounded-xl font-bold shadow-lg ${editingId ? 'bg-blue-500' : 'bg-primary'}`}>{isUploading ? "حفظ..." : editingId ? "حفظ التعديل" : "نشر المنتج"}</button>
            </form>
          </div>
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-border">
            <h2 className="text-xl font-bold mb-6 border-b pb-4">المنتجات المعروضة حالياً</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map(product => (
                <div key={product.id} className="flex gap-4 border border-border/50 p-3 rounded-2xl items-center bg-muted/10">
                  <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-muted"><img src={product.image_url} alt={product.name_ar} className="w-full h-full object-cover" /></div>
                  <div className="flex-1"><h3 className="font-bold text-sm">{product.name_ar}</h3><p className="text-sm text-primary font-bold">{product.price} MAD</p></div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditClick(product)} className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center hover:bg-blue-500 hover:text-white"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(product.id, product.image_url)} className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'qr' && (
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-border flex flex-col items-center max-w-2xl mx-auto mt-10 text-center">
          <div className="bg-primary/10 p-4 rounded-full text-primary mb-4"><QrCode size={48} /></div>
          <h2 className="text-2xl font-bold mb-2">تسجيل الطاولات وتوليد الـ QR</h2>
          <p className="text-muted-foreground mb-6 text-sm">أدخل رقم الطاولة لتسجيلها في النظام وتوليد الكود الخاص بها.</p>
          
          <div className="flex flex-col w-full max-w-sm gap-4 mb-8">
            <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl w-full border">
              <label className="font-bold text-lg whitespace-nowrap">رقم الطاولة :</label>
              <input type="number" value={tableNum} onChange={(e) => {setTableNum(e.target.value); setQrReady(false);}} className="border rounded-xl p-3 w-full text-center font-bold text-xl bg-white focus:outline-primary" min="1"/>
            </div>
            <button onClick={handleGenerateSmartQR} disabled={isGeneratingQr || !tableNum} className="bg-primary text-white py-4 rounded-2xl font-bold flex justify-center items-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {isGeneratingQr ? <><Loader2 className="animate-spin" size={20} /> جاري المعالجة...</> : <><CheckCircle2 size={20} /> إنشاء الكود وحفظ الطاولة</>}
            </button>
          </div>

          {qrReady && (
            <>
              <div id="qr-print-area" className="bg-white p-10 rounded-3xl border-4 border-foreground w-full max-w-md animate-in zoom-in duration-300">
                <h3 className="text-3xl font-extrabold mb-2">{cafeName || "المقهى"}</h3>
                <p className="text-lg font-bold text-primary mb-8 border-b-2 pb-4">طاولة رقم {tableNum}</p>
                <div className="p-4 inline-block"><QRCode value={qrUrl} size={220} level="H" /></div>
                <p className="mt-8 text-lg font-bold">امسح الكود لطلب مشروبك ☕</p>
              </div>
              <button onClick={handlePrint} className="mt-8 bg-foreground text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-3 text-lg hover:scale-105 transition-transform"><Printer size={24} /> طباعة الكود</button>
            </>
          )}
        </div>
      )}

      {activeTab === 'billing' && (
        <BillingTab cafeId={cafeId!} cafeName={cafeName} />
      )}

    </div>
  );
}