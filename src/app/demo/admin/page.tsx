"use client";

import { useState } from "react";
import { 
  Plus, Trash2, Image as ImageIcon, Loader2, QrCode, PackageSearch, 
  Printer, Settings, Edit, X, AlertTriangle, CheckCircle2, 
  TrendingUp, DollarSign, History, MonitorSmartphone 
} from "lucide-react";
import QRCode from "react-qr-code";
import { useDemoProducts, useDemoOrders } from "@/lib/demoStore"; 

// 🌟 قاموس التصنيفات (للحفاظ على نفس القيمة في الداتا، مع تغيير العرض فقط)
const CATEGORY_MAP: Record<string, Record<string, string>> = {
  "القهوة": { AR: "القهوة", EN: "Coffee", FR: "Café" },
  "الحلوى": { AR: "الحلوى", EN: "Desserts", FR: "Desserts" },
  "عصائر": { AR: "عصائر", EN: "Juices", FR: "Jus" },
  "مخبوزات": { AR: "مخبوزات", EN: "Bakery", FR: "Boulangerie" }
};
const CATEGORIES = Object.keys(CATEGORY_MAP);

// 🌟 قاموس الترجمات (Translation Dictionary)
const translations = {
  EN: {
    demoBadge: "LIVE SYNC DEMO",
    title: "Admin Control Center",
    subtitle: "Data syncs instantly with kitchen and POS (serverless!)",
    tabMenu: "Menu",
    tabTables: "Tables",
    tabSales: "Sales",
    salesRevenue: "Orders Revenue",
    currency: "MAD",
    totalOrders: "Total Orders",
    orderUnit: "Orders",
    liveSalesLog: "Live Sales Log",
    noOrders: "Create orders from the POS to see them here instantly.",
    table: "Table",
    directPOS: "Direct (POS)",
    addProduct: "Add Product",
    editProduct: "Edit Product",
    nameAr: "Name (Arabic)",
    nameEn: "Name (English)",
    nameFr: "Name (French)",
    priceLabel: "Price",
    categoryLabel: "Category",
    imageLabel: "Image",
    changeImage: "Change Image",
    chooseImage: "Choose Image",
    saving: "Saving...",
    saveChanges: "Save Changes",
    publishProduct: "Publish Product",
    currentProducts: "Current Products",
    confirmDelete: "Confirm deletion?",
    saveSuccess: "Product saved and synced instantly! ✨",
    qrTitle: "QR Generator (Interactive Demo)",
    tableNumber: "Table Number :",
    generateCode: "Generate Code",
    cafeName: "ServeQR Demo"
  },
  FR: {
    demoBadge: "DÉMO EN DIRECT",
    title: "Tableau de Bord ⚙️",
    subtitle: "Synchronisation instantanée avec cuisine et caisse (sans serveur!)",
    tabMenu: "Menu",
    tabTables: "Tables",
    tabSales: "Ventes",
    salesRevenue: "Revenus des Commandes",
    currency: "MAD",
    totalOrders: "Commandes Totales",
    orderUnit: "Commandes",
    liveSalesLog: "Journal des Ventes",
    noOrders: "Créez des commandes depuis la caisse pour les voir ici.",
    table: "Table",
    directPOS: "Direct (Caisse)",
    addProduct: "Ajouter Produit",
    editProduct: "Modifier Produit",
    nameAr: "Nom (Arabe)",
    nameEn: "Nom (Anglais)",
    nameFr: "Nom (Français)",
    priceLabel: "Prix",
    categoryLabel: "Catégorie",
    imageLabel: "Image",
    changeImage: "Changer l'image",
    chooseImage: "Choisir l'image",
    saving: "Enregistrement...",
    saveChanges: "Enregistrer",
    publishProduct: "Publier",
    currentProducts: "Produits Actuels",
    confirmDelete: "Confirmer la suppression ?",
    saveSuccess: "Produit enregistré et synchronisé ! ✨",
    qrTitle: "Générateur QR (Démo Interactive)",
    tableNumber: "Numéro de Table :",
    generateCode: "Générer le Code",
    cafeName: "Démo ServeQR"
  },
  AR: {
    demoBadge: "مزامنة حية (ديمو)",
    title: "لوحة تحكم المدير ⚙️",
    subtitle: "البيانات تتزامن لحظياً مع المطبخ والكاشير (بدون سيرفر!)",
    tabMenu: "المنيو",
    tabTables: "الطاولات",
    tabSales: "المبيعات",
    salesRevenue: "مدخول الطلبات",
    currency: "د.م",
    totalOrders: "إجمالي الطلبات",
    orderUnit: "طلب",
    liveSalesLog: "سجل المبيعات الحي",
    noOrders: "قم بإنشاء طلبات من الكاشير لتظهر هنا فوراً.",
    table: "طاولة",
    directPOS: "مباشر (POS)",
    addProduct: "إضافة منتج",
    editProduct: "تعديل المنتج",
    nameAr: "اسم المنتج (عربي)",
    nameEn: "اسم المنتج (إنجليزي)",
    nameFr: "اسم المنتج (فرنسي)",
    priceLabel: "السعر",
    categoryLabel: "القسم",
    imageLabel: "الصورة",
    changeImage: "تغيير الصورة",
    chooseImage: "اختر صورة",
    saving: "جاري الحفظ...",
    saveChanges: "حفظ التعديل",
    publishProduct: "نشر المنتج",
    currentProducts: "المنتجات المعروضة حالياً",
    confirmDelete: "تأكيد الحذف؟",
    saveSuccess: "تم حفظ المنتج وسينعكس فوراً في الكاشير ومنيو الزبون! ✨",
    qrTitle: "توليد الـ QR (ديمو تفاعلي)",
    tableNumber: "رقم الطاولة :",
    generateCode: "إنشاء الكود",
    cafeName: "ديمو ServeQR"
  }
};

type LangType = "AR" | "FR" | "EN";

export default function AdminDemoDashboard() {
  // 🌟 إعدادات اللغة الافتراضية
  const [lang, setLang] = useState<LangType>("EN");
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState("products"); 
  
  const { products, updateProducts } = useDemoProducts();
  const { orders } = useDemoOrders();
  
  const completedOrders = orders.filter(o => o.status === "completed" || o.status === "pending");
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

  const getProductName = (p: any) => {
    if (lang === "AR") return p.name_ar;
    if (lang === "FR") return p.name_fr || p.name_en || p.name_ar;
    return p.name_en || p.name_ar;
  };

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
      alert(t.saveSuccess);
    }, 400);
  };

  const handleDelete = (id: string) => {
    if (!confirm(t.confirmDelete)) return;
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

  const dir = lang === "AR" ? "rtl" : "ltr";

  return (
    <div className="min-h-screen bg-muted/20 p-6 md:p-12 font-sans" dir={dir}>
      <style dangerouslySetInnerHTML={{__html: `@media print { body * { visibility: hidden; } #qr-print-area, #qr-print-area * { visibility: visible; } #qr-print-area { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 100%; text-align: center; } }`}} />

      <header className="mb-8 flex flex-col xl:flex-row xl:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-emerald-500/30 gap-4 relative overflow-hidden">
        <div className={`absolute top-0 ${lang === "AR" ? "left-0 rounded-br-xl" : "right-0 rounded-bl-xl"} bg-emerald-500 text-white text-[10px] font-black px-3 py-1`}>
          {t.demoBadge}
        </div>
        
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">{t.title}</h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap shrink-0">
          {/* 🌟 Language Switcher 🌟 */}
          <div className="flex bg-muted/60 p-1 rounded-full w-max border">
            {(["AR", "FR", "EN"] as LangType[]).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${lang === l ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap bg-muted p-1 rounded-xl gap-1">
            <button onClick={() => setActiveTab('products')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm ${activeTab === 'products' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}><PackageSearch size={18} /> {t.tabMenu}</button>
            <button onClick={() => setActiveTab('qr')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm ${activeTab === 'qr' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}><QrCode size={18} /> {t.tabTables}</button>
            <button onClick={() => setActiveTab('sales')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm ${activeTab === 'sales' ? 'bg-white text-emerald-600 shadow-sm' : 'text-muted-foreground'}`}><TrendingUp size={18} /> {t.tabSales}</button>
          </div>
        </div>
      </header>

      {activeTab === 'sales' && (
        <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground block">{t.salesRevenue}</span>
                <h3 className="text-3xl font-black text-emerald-600 mt-1">{monthlyIncome.toFixed(2)} <span className="text-sm font-bold text-muted-foreground">MAD</span></h3>
              </div>
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0"><DollarSign size={28}/></div>
            </div>

            <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-muted-foreground block">{t.totalOrders}</span>
                <h3 className="text-3xl font-black text-foreground mt-1">{completedOrders.length} <span className="text-sm font-bold text-muted-foreground">{t.orderUnit}</span></h3>
              </div>
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shrink-0"><CheckCircle2 size={28}/></div>
            </div>
          </div>

          <div className="bg-white p-6 lg:p-8 rounded-3xl border shadow-sm">
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
              <h3 className="font-extrabold text-xl">{t.liveSalesLog}</h3>
            </div>
            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {completedOrders.length === 0 ? <p className="text-center text-muted-foreground font-bold py-10">{t.noOrders}</p> : null}
              {completedOrders.map((ord) => (
                <div key={ord.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/15 border rounded-2xl gap-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black shrink-0 text-lg">✓</div>
                    <div>
                      <div className="font-extrabold text-sm flex items-center gap-2">
                        <span>{t.table} {ord.tables?.table_number?.replace('table_', '') || t.directPOS}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">#{ord.id}</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-bold mt-1 leading-relaxed">
                        {ord.items.map((it:any) => `${it.quantity}x ${getProductName(it)}`).join(' + ')}
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
            {editingId && <button onClick={resetForm} className={`absolute top-6 ${lang === "AR" ? "left-6" : "right-6"} text-muted-foreground hover:text-red-500`}><X size={24} /></button>}
            <h2 className="text-xl font-bold mb-6 border-b pb-4">{editingId ? t.editProduct : t.addProduct}</h2>
            <form onSubmit={handleAddOrUpdateProduct} className="space-y-4">
              <div><label className="block text-sm font-bold mb-2">{t.nameAr}</label><input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-border rounded-xl p-3 bg-muted/30" /></div>
              <div><label className="block text-sm font-bold mb-2">{t.nameEn}</label><input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="w-full border border-border rounded-xl p-3 bg-muted/30" /></div>
              <div><label className="block text-sm font-bold mb-2">{t.nameFr}</label><input type="text" value={nameFr} onChange={(e) => setNameFr(e.target.value)} className="w-full border border-border rounded-xl p-3 bg-muted/30" /></div>
              
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-bold mb-2">{t.priceLabel}</label><input required type="number" step="0.5" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border border-border rounded-xl p-3 bg-muted/30" /></div>
                <div>
                  <label className="block text-sm font-bold mb-2">{t.categoryLabel}</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-border rounded-xl p-3 bg-muted/30">
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{CATEGORY_MAP[cat][lang]}</option>)}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-2">{t.imageLabel}</label>
                <div className="border-2 border-dashed border-primary/50 rounded-xl p-4 text-center cursor-pointer relative"><input required={!editingId} type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0" /><div className="text-primary font-bold">{imageFile ? imageFile.name : editingId ? t.changeImage : t.chooseImage}</div></div>
              </div>
              <button disabled={isUploading} type="submit" className={`w-full text-white py-4 rounded-xl font-bold shadow-lg ${editingId ? 'bg-blue-500' : 'bg-primary'}`}>{isUploading ? t.saving : editingId ? t.saveChanges : t.publishProduct}</button>
            </form>
          </div>
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-border">
            <h2 className="text-xl font-bold mb-6 border-b pb-4">{t.currentProducts}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map(product => (
                <div key={product.id} className="flex gap-4 border border-border/50 p-3 rounded-2xl items-center bg-muted/10">
                  <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-muted"><img src={product.image_url} alt={getProductName(product)} className="w-full h-full object-cover" /></div>
                  <div className="flex-1"><h3 className="font-bold text-sm">{getProductName(product)}</h3><p className="text-sm text-primary font-bold">{product.price} MAD</p></div>
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
          <h2 className="text-2xl font-bold mb-2">{t.qrTitle}</h2>
          
          <div className="flex flex-col w-full max-w-sm gap-4 mb-8 mt-6">
            <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl w-full border">
              <label className="font-bold text-lg whitespace-nowrap">{t.tableNumber}</label>
              <input type="number" value={tableNum} onChange={(e) => {setTableNum(e.target.value); setQrReady(false);}} className="border rounded-xl p-3 w-full text-center font-bold text-xl bg-white focus:outline-primary" min="1"/>
            </div>
            <button onClick={handleGenerateSmartQR} disabled={isGeneratingQr || !tableNum} className="bg-primary text-white py-4 rounded-2xl font-bold flex justify-center items-center gap-2">
              {isGeneratingQr ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />} {t.generateCode}
            </button>
          </div>

          {qrReady && (
            <>
              <div id="qr-print-area" className="bg-white p-10 rounded-3xl border-4 border-foreground w-full max-w-md animate-in zoom-in duration-300">
                <h3 className="text-3xl font-extrabold mb-2">{t.cafeName}</h3>
                <p className="text-lg font-bold text-primary mb-8 border-b-2 pb-4">{t.table} {tableNum}</p>
                <div className="p-4 inline-block"><QRCode value={qrUrl} size={220} level="H" /></div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
