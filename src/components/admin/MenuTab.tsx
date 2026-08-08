"use client";

import { useState } from "react";
import { X, Edit, Trash2, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { adminAddProduct, adminUpdateProduct, adminDeleteProduct } from "../../actions/auth";

const CATEGORY_MAP: Record<string, Record<string, string>> = {
  "القهوة": { ar: "القهوة", en: "Coffee", fr: "Café" },
  "الحلوى": { ar: "الحلوى", en: "Desserts", fr: "Desserts" },
  "عصائر": { ar: "عصائر", en: "Juices", fr: "Jus" },
  "مخبوزات": { ar: "مخبوزات", en: "Bakery", fr: "Boulangerie" }
};
const CATEGORIES = Object.keys(CATEGORY_MAP);

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
        canvas.toBlob((blob) => {
            if (!blob) return reject(new Error("Compression failed"));
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: "image/webp", lastModified: Date.now() }));
          }, "image/webp", 0.75);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function MenuTab({ cafeId, activeLang, t, products, fetchProducts, maxMenu = 150 }: any) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameFr, setNameFr] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("القهوة");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 🌟 استخراج البيانات الحالية للقيود
  const currentCount = products.length;
  const isDiamond = maxMenu >= 9999;
  const isLimitReached = !isDiamond && currentCount >= maxMenu;
  const usagePercent = isDiamond ? 0 : Math.min(100, (currentCount / maxMenu) * 100);

  const resetForm = () => {
    setEditingId(null); setName(""); setNameEn(""); setNameFr(""); setDescription(""); setPrice(""); setImageFile(null);
  };

  const handleAddOrUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeId || !name || !price || (!imageFile && !editingId)) return alert(t.fillFields);
    
    // 🌟 منع تجاوز الحد عند الإضافة الجديدة فقط (السماح بالتعديل)
    if (!editingId && isLimitReached) {
      alert(activeLang === 'ar' ? "لقد وصلت للحد الأقصى للمنتجات المسموح بها في باقتك." : "Menu limit reached. Upgrade your plan.");
      return;
    }

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
          const oldProduct = products.find((p: any) => p.id === editingId);
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
        if (success) alert(t.updatedSuccess); else throw new Error();
      } else {
        productData.cafe_id = cafeId; productData.is_active = true;
        const { success, error: serverError } = await adminAddProduct(productData);
        if (success) alert(t.addedSuccess); else throw new Error(serverError);
      }
      resetForm(); fetchProducts(cafeId);
    } catch (err: any) { alert(t.errorPrefix + (err.message || t.errorPrefix)); } finally { setIsUploading(false); }
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm(t.confirmDelete)) return;
    try {
      if (imageUrl) {
        const fileName = imageUrl.split('/').pop();
        if (fileName) await supabase.storage.from('products').remove([fileName]);
      }
      const { success } = await adminDeleteProduct(id);
      if (success) fetchProducts(cafeId!);
    } catch (err) { alert(t.deleteFailed); }
  };

  const handleEditClick = (product: any) => {
    setEditingId(product.id); setName(product.name_ar || ""); setNameEn(product.name_en || ""); setNameFr(product.name_fr || "");
    setDescription(product.description_ar || ""); setPrice(product.price.toString()); setCategory(product.category); setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-border h-fit relative">
        {editingId && <button onClick={resetForm} className={`absolute top-6 ${activeLang === 'ar' ? 'left-6' : 'right-6'} text-muted-foreground hover:text-red-500`}><X size={24} /></button>}
        
        <h2 className="text-xl font-bold mb-6 border-b pb-4">{editingId ? t.editProduct : t.addProduct}</h2>
        
        {/* 🌟 رسالة تنبيه عند الوصول للحد الأقصى، وتختفي عند التعديل */}
        {!editingId && isLimitReached && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">
                {activeLang === 'ar' ? "الحد الأقصى للمنيو" : "Menu Limit Reached"}
              </h4>
              <p className="text-xs mt-1 opacity-80">
                {activeLang === 'ar' 
                  ? "لا يمكنك إضافة منتجات جديدة. يرجى ترقية باقتك."
                  : "You cannot add new products. Please upgrade your plan."}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleAddOrUpdateProduct} className="space-y-4">
          <div><label className="block text-sm font-bold mb-2">{t.nameAr}</label><input required type="text" value={name} onChange={(e) => setName(e.target.value)} className={`w-full border border-border rounded-xl p-3 bg-muted/30 ${activeLang === 'ar' ? 'text-right' : 'text-left'}`} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-bold mb-2">EN</label><input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} className={`w-full border border-border rounded-xl p-3 bg-muted/30 ${activeLang === 'ar' ? 'text-right' : 'text-left'}`} /></div>
            <div><label className="block text-sm font-bold mb-2">FR</label><input type="text" value={nameFr} onChange={(e) => setNameFr(e.target.value)} className={`w-full border border-border rounded-xl p-3 bg-muted/30 ${activeLang === 'ar' ? 'text-right' : 'text-left'}`} /></div>
          </div>
          <div><label className="block text-sm font-bold mb-2">{t.descLabel}</label><textarea required value={description} onChange={(e) => setDescription(e.target.value)} className={`w-full border border-border rounded-xl p-3 bg-muted/30 ${activeLang === 'ar' ? 'text-right' : 'text-left'}`} rows={2} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-bold mb-2">{t.priceLabel}</label><input required type="number" step="0.5" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border border-border rounded-xl p-3 bg-muted/30" dir="ltr" /></div>
            <div>
              <label className="block text-sm font-bold mb-2">{t.categoryLabel}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={`w-full border border-border rounded-xl p-3 bg-muted/30 ${activeLang === 'ar' ? 'text-right' : 'text-left'}`}>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{CATEGORY_MAP[cat][activeLang]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">{t.imageLabel}</label>
            <div className={`border-2 border-dashed rounded-xl p-4 text-center relative ${!editingId && isLimitReached ? 'border-gray-300 bg-gray-50' : 'border-primary/50 cursor-pointer'}`}>
              <input required={!editingId} disabled={!editingId && isLimitReached} type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className={`absolute inset-0 w-full h-full opacity-0 ${!editingId && isLimitReached ? 'hidden' : 'cursor-pointer'}`} />
              <div className={`font-bold ${!editingId && isLimitReached ? 'text-gray-400' : 'text-primary'}`}>{imageFile ? imageFile.name : editingId ? t.changeImage : t.chooseImage}</div>
            </div>
          </div>
          <button 
            disabled={isUploading || (!editingId && isLimitReached)} 
            type="submit" 
            className={`w-full text-white py-4 rounded-xl font-bold shadow-lg transition-colors ${
              !editingId && isLimitReached 
                ? 'bg-gray-400 cursor-not-allowed' 
                : editingId 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {isUploading ? t.saving : editingId ? t.saveEdit : (!editingId && isLimitReached ? "Locked 🔒" : t.publishProduct)}
          </button>
        </form>
      </div>
      
      <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-border">
        {/* 🌟 الترويسة وشريط التقدم الخاص بالمنتجات */}
        <div className="flex items-center justify-between mb-4 border-b pb-4">
          <h2 className="text-xl font-bold">{t.currentProducts}</h2>
          <div className="text-sm font-bold text-muted-foreground flex items-center gap-2" dir="ltr">
            {currentCount} / {isDiamond ? "♾️" : maxMenu}
          </div>
        </div>
        
        {!isDiamond && (
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden mb-6">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${isLimitReached ? 'bg-red-500' : 'bg-primary'}`} 
              style={{ width: `${usagePercent}%` }} 
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((product: any) => (
            <div key={product.id} className="flex gap-4 border border-border/50 p-3 rounded-2xl items-center bg-muted/10">
              <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-muted"><img src={product.image_url} alt={product.name_ar} className="w-full h-full object-cover" /></div>
              <div className="flex-1">
                <h3 className="font-bold text-sm">
                  {activeLang === 'en' && product.name_en ? product.name_en : activeLang === 'fr' && product.name_fr ? product.name_fr : product.name_ar}
                </h3>
                <p className="text-sm text-primary font-bold" dir="ltr">{product.price} MAD</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEditClick(product)} className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center hover:bg-blue-500 hover:text-white"><Edit size={18} /></button>
                <button onClick={() => handleDelete(product.id, product.image_url)} className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}