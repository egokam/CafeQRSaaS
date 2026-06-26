"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "../../../lib/supabase";
import { 
  Plus, Trash2, Image as ImageIcon, Loader2, QrCode, PackageSearch, 
  Printer, Lock, Settings, Edit, X, AlertTriangle, CheckCircle2, 
  CreditCard, TrendingUp, DollarSign, History, Calendar 
} from "lucide-react";
import QRCode from "react-qr-code";
import { verifyPin, sendRecoveryEmail, verifyOtpAndUpdatePins, updateCafeSettings, adminAddProduct, adminUpdateProduct, adminDeleteProduct } from "../../../actions/auth";
import BillingTab from "../../../components/BillingTab";

const CATEGORIES = ["القهوة", "الحلوى", "عصائر", "مخبوزات"];

export default function AdminDashboard({ params }: { params: Promise<{ cafeSlug: string }> }) {
  const { cafeSlug } = use(params);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(1);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryOtp, setRecoveryOtp] = useState("");
  
  const [cafeName, setCafeName] = useState("");
  const [newAdminPin, setNewAdminPin] = useState("");
  const [newCashierPin, setNewCashierPin] = useState("");
  const [maxCashiers, setMaxCashiers] = useState("2"); 

  const [activeTab, setActiveTab] = useState("products"); 
  const [products, setProducts] = useState<any[]>([]);
  const [cafeId, setCafeId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  // 🌟 حالات الإحصائيات والمبيعات الشهرية
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

  // 🌟 دالة جلب مبيعات الشهر الحالي بالضبط
  const fetchMonthlySales = async (cId: string) => {
    setIsLoadingSales(true);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data, error } = await supabase
      .from('orders')
      .select('*, tables(table_number)')
      .eq('cafe_id', cId)
      .eq('status', 'completed') // الطلبات المنتهية فقط
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
    const sessionKey = `admin_auth_${cafeSlug}`;
    if (sessionStorage.getItem(sessionKey) === 'true') setIsAuthenticated(true);

    const initAdmin = async () => {
      setIsLoading(true);
      const { data: cafeData } = await supabase.from('cafes').select('id, name, max_cashiers').eq('slug', cafeSlug).single();
      
      if (!cafeData) {
        setIsNotFound(true);
        setIsLoading(false);
        return;
      }

      setCafeId(cafeData.id);
      if (cafeData.name) setCafeName(cafeData.name);
      if (cafeData.max_cashiers) setMaxCashiers(cafeData.max_cashiers.toString());
      
      await Promise.all([
        fetchProducts(cafeData.id),
        fetchMonthlySales(cafeData.id) // جلب المبيعات مع البداية
      ]);

      setIsLoading(false);
    };
    initAdmin();
  }, [cafeSlug]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || !cafeId) return;

    setIsChecking(true);
    const isValid = await verifyPin(cafeId, "admin", pinInput);
    setIsChecking(false);

    if (isValid) {
      setIsAuthenticated(true);
      sessionStorage.setItem(`admin_auth_${cafeSlug}`, 'true');
      setAttempts(0);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPinInput("");
      
      if (newAttempts >= 5) {
        setIsLocked(true);
        alert("تم حظرك مؤقتاً. يرجى الانتظار دقيقة.");
        setTimeout(() => { setIsLocked(false); setAttempts(0); }, 60000);
      } else alert(`الرمز غير صحيح ❌`);
    }
  };

  const handleSendRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChecking(true);
    const { success } = await sendRecoveryEmail(recoveryEmail);
    setIsChecking(false);
    if (success) { setRecoveryStep(2); alert("تم إرسال الرمز للإيميل."); }
    else alert("خطأ في الإرسال.");
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeId) return;
    setIsChecking(true);
    const { success, error } = await verifyOtpAndUpdatePins(recoveryEmail, recoveryOtp, cafeId, newAdminPin, newCashierPin);
    setIsChecking(false);
    if (success) { alert("تم إعادة التعيين بنجاح!"); setIsRecovering(false); setRecoveryStep(1); }
    else alert(error || "رمز خاطئ");
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeId) return;
    setIsChecking(true);
    const { success } = await updateCafeSettings(cafeId, cafeName, newAdminPin, newCashierPin, Number(maxCashiers));
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
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, imageFile);
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

    try {
      const { data: existingTable } = await supabase.from('tables').select('id').eq('cafe_id', cafeId).eq('table_number', formattedTableNumber).single();
      if (!existingTable) {
        const { error: insertError } = await supabase.from('tables').insert([{ cafe_id: cafeId, table_number: formattedTableNumber }]);
        if (insertError) throw insertError;
      }
      const baseUrl = window.location.origin;
      setQrUrl(`${baseUrl}/${cafeSlug}/${formattedTableNumber}`);
      setQrReady(true);
    } catch (error) { alert("حدث خطأ أثناء فحص/إضافة الطاولة."); } 
    finally { setIsGeneratingQr(false); }
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
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-border w-full max-w-sm text-center">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center text-primary mx-auto mb-6"><Lock size={32} /></div>
          <h2 className="text-2xl font-extrabold mb-2">{isRecovering ? "استعادة الرمز" : "منطقة الإدارة"}</h2>
          <p className="text-muted-foreground mb-8 text-sm">{isRecovering ? "أدخل بريدك" : "يرجى إدخال الرمز السري"}</p>
          {!isRecovering ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <input type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} className="border-2 border-border rounded-xl p-4 text-center text-2xl tracking-[0.5em] focus:outline-primary" placeholder="••••" autoFocus disabled={isLocked || isChecking} />
              <button disabled={isChecking || isLocked} type="submit" className="py-4 rounded-xl font-bold text-white bg-primary hover:bg-primary/90">{isChecking ? "تحقق..." : "دخول"}</button>
              <button type="button" onClick={() => setIsRecovering(true)} className="text-sm text-primary font-bold mt-2 hover:underline">هل نسيت الرمز؟</button>
            </form>
          ) : recoveryStep === 1 ? (
            <form onSubmit={handleSendRecovery} className="flex flex-col gap-4">
              <input type="email" required value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)} className="border-2 border-border rounded-xl p-4 text-center focus:outline-primary" placeholder="admin@example.com" />
              <button type="submit" className="py-4 rounded-xl font-bold text-white bg-primary">إرسال كود التحقق</button>
              <button type="button" onClick={() => setIsRecovering(false)} className="text-sm text-muted-foreground font-bold mt-2">إلغاء</button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndReset} className="flex flex-col gap-3">
              <input required type="text" value={recoveryOtp} onChange={(e) => setRecoveryOtp(e.target.value)} className="border border-border rounded-xl p-3 text-center" placeholder="كود الإيميل" />
              <input required type="text" value={newAdminPin} onChange={(e) => setNewAdminPin(e.target.value)} className="border border-border rounded-xl p-3 text-center" placeholder="رمز المدير الجديد" />
              <input required type="text" value={newCashierPin} onChange={(e) => setNewCashierPin(e.target.value)} className="border border-border rounded-xl p-3 text-center" placeholder="رمز الكاشير الجديد" />
              <button type="submit" className="py-4 mt-2 rounded-xl font-bold text-white bg-green-500">تحديث الرموز</button>
            </form>
          )}
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
          
          {/* 🌟 التبويب الجديد للإحصائيات */}
          <button onClick={() => { setActiveTab('sales'); cafeId && fetchMonthlySales(cafeId); }} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm ${activeTab === 'sales' ? 'bg-white text-emerald-600 shadow-sm' : 'text-muted-foreground'}`}>
            <TrendingUp size={18} /> المبيعات الشهرية 📈
          </button>

          <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm ${activeTab === 'settings' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}><Settings size={18} /> الإعدادات</button>
          <button onClick={() => setActiveTab('billing')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm ${activeTab === 'billing' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}><CreditCard size={18} /> الاشتراك والأداء 💳</button>
        </div>
      </header>

      {/* 🌟 محتوى التبويب الجديد: المبيعات الشهرية */}
      {activeTab === 'sales' && (
        <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-200">
          
          {/* بطاقات المداخيل العلوية */}
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

          {/* جدول مبيعات الشهر */}
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
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black shrink-0 text-lg">
                        ✓
                      </div>
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
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-border max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 border-b pb-4">إعدادات المقهى</h2>
          <form onSubmit={handleUpdateSettings} className="space-y-5">
            <div><label className="block text-sm font-bold mb-2">اسم المقهى</label><input type="text" required value={cafeName} onChange={(e) => setCafeName(e.target.value)} className="w-full border border-border rounded-xl p-3 bg-muted/30" /></div>
            <div>
              <label className="block text-sm font-bold mb-1 text-primary">العدد الأقصى لجلسات الكاشير المسموحة</label>
              <input type="number" min="1" max="10" required value={maxCashiers} onChange={(e) => setMaxCashiers(e.target.value)} className="w-full border-2 border-primary/30 rounded-xl p-3 bg-primary/5 font-bold text-lg" />
              <span className="text-xs text-muted-foreground">تمنع هذه الميزة دخول أي كاشير إضافي إذا كان العدد ممتلئاً.</span>
            </div>
            <div className="pt-4 border-t border-border/50"><label className="block text-sm font-bold mb-2">رمز المدير الجديد (اختياري)</label><input type="text" value={newAdminPin} onChange={(e) => setNewAdminPin(e.target.value)} className="w-full border border-border rounded-xl p-3 bg-muted/30" placeholder="اتركه فارغاً" /></div>
            <div><label className="block text-sm font-bold mb-2">رمز الكاشير الجديد (اختياري)</label><input type="text" value={newCashierPin} onChange={(e) => setNewCashierPin(e.target.value)} className="w-full border border-border rounded-xl p-3 bg-muted/30" placeholder="اتركه فارغاً" /></div>
            <button disabled={isChecking} type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-bold mt-6 shadow-lg">{isChecking ? "حفظ..." : "حفظ التغييرات"}</button>
          </form>
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