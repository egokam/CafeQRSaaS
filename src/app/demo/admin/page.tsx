"use client";

import { useState } from "react";
import { 
  Plus, Trash2, Image as ImageIcon, Loader2, QrCode, PackageSearch, 
  Printer, Settings, Edit, X, AlertTriangle, CheckCircle2, 
  TrendingUp, DollarSign, History, MonitorSmartphone 
} from "lucide-react";
import QRCode from "react-qr-code";
import { useDemoProducts, useDemoOrders } from "@/lib/demoStore"; // المسار ديال الملف اللي صاوبنا

const CATEGORIES = ["القهوة", "الحلوى", "عصائر", "مخبوزات"];

export default function AdminDemoDashboard() {
  const cafeName = "مقهى ديمو كافي كيو آر";
  const [activeTab, setActiveTab] = useState("products"); 
  
  // 🌟 استدعاء الداتا الحية المشتركة
  const { products, updateProducts } = useDemoProducts();
  const { orders } = useDemoOrders();
  
  // حساب مداخيل الديمو
  const completedOrders = orders.filter(o => o.status === "completed" || o.status === "pending"); // في الديمو غنحسبو كلشي
  const monthlyIncome = completedOrders.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);

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

  const resetForm = () => {
    setEditingId(null); setName(""); setNameEn(""); setNameFr(""); setDescription(""); setPrice(""); setImageFile(null);
  };

  const handleAddOrUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    setTimeout(() => {
      const imageUrl = imageFile ? URL.createObjectURL(imageFile) : (editingId ? products.find(p => p.id === editingId)?.image_url : "https://via.placeholder.com/400");
      
      const productData = { 
        id: editingId || Math.random().toString(36).substring(7), 
        name_ar: name, 
        name_en: nameEn, 
        name_fr: nameFr, 
        description_ar: description, 
        price: parseFloat(price), 
        category: category,
        image_url: imageUrl
      };

      if (editingId) {
        updateProducts(products.map(p => p.id === editingId ? productData : p));
      } else {
        updateProducts([productData, ...products]);
      }
      resetForm();
      setIsUploading(false);
      alert("تم حفظ المنتج وسينعكس فوراً في الكاشير ومنيو الزبون! ✨");
    }, 400);
  };

  const handleDelete = (id: string) => {
    if (!confirm("تأكيد الحذف؟")) return;
    updateProducts(products.filter(p => p.id !== id));
  };

  const handleEditClick = (product: any) => {
    setEditingId(product.id); setName(product.name_ar || ""); setNameEn(product.name_en || ""); setNameFr(product.name_fr || "");
    setDescription(product.description_ar || ""); setPrice(product.price.toString()); setCategory(product.category); setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerateSmartQR = () => {
    if (!tableNum) return;
    setIsGeneratingQr(true);
    setQrReady(false);
    
    setTimeout(() => {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://cafeqr.egokam.site';
      setQrUrl(`${baseUrl}/demo/client`);
      setQrReady(true);
      setIsGeneratingQr(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-muted/20 p-6 md:p-12 font-sans" dir="rtl">
      <style dangerouslySetInnerHTML={{__html: `@media print { body * { visibility: hidden; } #qr-print-area, #qr-print-area * { visibility: visible; } #qr-print-area { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 100%; text-align: center; } }`}} />

      <header className="mb-8 flex flex-col xl:flex-row xl:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-emerald-500/30 gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl">LIVE SYNC DEMO</div>
        <div><h1 className="text-3xl font-extrabold text-foreground">لوحة تحكم المدير ⚙️</h1><p className="text-muted-foreground mt-1">البيانات تتزامن لحظياً مع المطبخ والكاشير (بدون سيرفر!)</p></div>
        <div className="flex flex-wrap bg-muted p-1 rounded-xl gap-1">
          <button onClick={() => setActiveTab('products')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm ${activeTab === 'products' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}><PackageSearch size={18} /> المنيو</button>
          <button onClick={() => setActiveTab('qr')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm ${activeTab === 'qr' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}><QrCode size={18} /> الطاولات</button>
          <button onClick={() => setActiveTab('sales')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm ${activeTab === 'sales' ? 'bg-white text-emerald-600 shadow-sm' : 'text-muted-foreground'}`}><TrendingUp size={18} /> المبيعات</button>
        </div>
      </header>

      {activeTab === 'sales' && (
        <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground block">مدخول الطلبات</span>
                <h3 className="text-3xl font-black text-emerald-600 mt-1">{monthlyIncome.toFixed(2)} <span className="text-sm font-bold text-muted-foreground">MAD</span></h3>
              </div>
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0"><DollarSign size={28}/></div>
            </div>

            <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground block">إجمالي الطلبات</span>
                <h3 className="text-3xl font-black text-foreground mt-1">{completedOrders.length} <span className="text-sm font-bold text-muted-foreground">طلب</span></h3>
              </div>
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shrink-0"><CheckCircle2 size={28}/></div>
            </div>
          </div>

          <div className="bg-white p-6 lg:p-8 rounded-3xl border shadow-sm">
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
              <h3 className="font-extrabold text-xl">سجل المبيعات الحي</h3>
            </div>
            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {completedOrders.length === 0 ? <p className="text-center text-muted-foreground font-bold py-10">قم بإنشاء طلبات من الكاشير لتظهر هنا فوراً.</p> : null}
              {completedOrders.map((ord) => (
                <div key={ord.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/15 border rounded-2xl gap-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black shrink-0 text-lg">✓</div>
                    <div>
                      <div className="font-extrabold text-sm flex items-center gap-2">
                        <span>طاولة {ord.tables?.table_number?.replace('table_', '') || 'مباشر (POS)'}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">#{ord.id}</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-bold mt-1 leading-relaxed">
                        {ord.items.map((it:any) => `${it.quantity}x ${it.name_ar}`).join(' + ')}
                      </div>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <span className="text-base font-black text-emerald-600 font-mono">{Number(ord.total_amount).toFixed(2)} MAD</span>
                  </div>
                </div>
              ))}
            </div>
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
              <div><label className="block text-sm font-bold mb-2">السعر</label><input required type="number" step="0.5" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border border-border rounded-xl p-3 bg-muted/30" /></div>
              <div><label className="block text-sm font-bold mb-2">القسم</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-border rounded-xl p-3 bg-muted/30">{CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
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
                    <button onClick={() => handleDelete(product.id)} className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white"><Trash2 size={18} /></button>
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
          <h2 className="text-2xl font-bold mb-2">توليد الـ QR (ديمو تفاعلي)</h2>
          
          <div className="flex flex-col w-full max-w-sm gap-4 mb-8 mt-6">
            <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl w-full border">
              <label className="font-bold text-lg whitespace-nowrap">رقم الطاولة :</label>
              <input type="number" value={tableNum} onChange={(e) => {setTableNum(e.target.value); setQrReady(false);}} className="border rounded-xl p-3 w-full text-center font-bold text-xl bg-white focus:outline-primary" min="1"/>
            </div>
            <button onClick={handleGenerateSmartQR} disabled={isGeneratingQr || !tableNum} className="bg-primary text-white py-4 rounded-2xl font-bold flex justify-center items-center gap-2">
              {isGeneratingQr ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />} إنشاء الكود
            </button>
          </div>

          {qrReady && (
            <>
              <div id="qr-print-area" className="bg-white p-10 rounded-3xl border-4 border-foreground w-full max-w-md animate-in zoom-in duration-300">
                <h3 className="text-3xl font-extrabold mb-2">{cafeName}</h3>
                <p className="text-lg font-bold text-primary mb-8 border-b-2 pb-4">طاولة رقم {tableNum}</p>
                <div className="p-4 inline-block"><QRCode value={qrUrl} size={220} level="H" /></div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}