"use client";

import { useState, useEffect } from "react";
import { X, Edit, Trash2, AlertCircle, Settings2, Loader2, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import * as Icons from "lucide-react"; 
import { supabase } from "../../lib/supabase";
import { adminAddProduct, adminUpdateProduct, adminDeleteProduct } from "../../actions/auth";
import { getCategories, addCategory, deleteCategory } from "../../actions/menu";

// القائمة الثابتة للأقسام
const DEFAULT_CATEGORIES = [
  { id: 'cat_patisserie', name_en: 'Patisserie', name_fr: 'Pâtisserie', name_ar: 'حلويات ومعجنات', icon: 'Croissant' },
  { id: 'cat_hot_drinks', name_en: 'Hot Drinks', name_fr: 'Boissons Chaudes', name_ar: 'مشروبات ساخنة', icon: 'Coffee' },
  { id: 'cat_tea', name_en: 'Tea', name_fr: 'Thé', name_ar: 'شاي', icon: 'CupSoda' },
  { id: 'cat_cold_drinks', name_en: 'Cold Drinks', name_fr: 'Boissons Froides', name_ar: 'مشروبات باردة', icon: 'CupSoda' },
  { id: 'cat_soft_drinks', name_en: 'Soft Drinks', name_fr: 'Boissons Gazeuses', name_ar: 'مشروبات غازية', icon: 'GlassWater' },
  { id: 'cat_juices', name_en: 'Juices', name_fr: 'Jus', name_ar: 'عصائر', icon: 'GlassWater' },
  { id: 'cat_milkshakes', name_en: 'Milkshakes', name_fr: 'Milkshakes', name_ar: 'ميلك شيك', icon: 'CupSoda' },
  { id: 'cat_smoothies', name_en: 'Smoothies', name_fr: 'Smoothies', name_ar: 'سموثي', icon: 'GlassWater' },
  { id: 'cat_breakfasts', name_en: 'Breakfasts', name_fr: 'Petits Déjeuners', name_ar: 'فطور', icon: 'Coffee' },
  { id: 'cat_sandwiches', name_en: 'Sandwiches', name_fr: 'Sandwiches', name_ar: 'ساندويتشات', icon: 'Sandwich' },
  { id: 'cat_paninis', name_en: 'Paninis', name_fr: 'Paninis', name_ar: 'بانيني', icon: 'Sandwich' },
  { id: 'cat_tacos', name_en: 'Tacos', name_fr: 'Tacos', name_ar: 'طاكوس', icon: 'Sandwich' },
  { id: 'cat_burgers', name_en: 'Burgers', name_fr: 'Burgers', name_ar: 'برجر', icon: 'Sandwich' },
  { id: 'cat_pizzas', name_en: 'Pizzas', name_fr: 'Pizzas', name_ar: 'بيتزا', icon: 'Pizza' },
  { id: 'cat_fried_chicken', name_en: 'Fried Chicken', name_fr: 'Poulet Frit', name_ar: 'دجاج مقلي', icon: 'Utensils' },
  { id: 'cat_salads', name_en: 'Salads', name_fr: 'Salades', name_ar: 'سلطات', icon: 'Leaf' },
  { id: 'cat_plats', name_en: 'Plates', name_fr: 'Plats', name_ar: 'أطباق', icon: 'Utensils' },
  { id: 'cat_desserts', name_en: 'Desserts', name_fr: 'Desserts', name_ar: 'تحلية', icon: 'CakeSlice' }
];

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
  const dir = activeLang === 'ar' ? 'rtl' : 'ltr';
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameFr, setNameFr] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  
  // 🌟 حالات الصور الجديدة
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isValidImage, setIsValidImage] = useState(false);

  const [isUploading, setIsUploading] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingCats, setIsLoadingCats] = useState(true);
  const [showCatModal, setShowCatModal] = useState(false);
  const [isTogglingCat, setIsTogglingCat] = useState<string | null>(null);

  const currentCount = products.length;
  const isDiamond = maxMenu >= 9999;
  const isLimitReached = !isDiamond && currentCount >= maxMenu;
  const usagePercent = isDiamond ? 0 : Math.min(100, (currentCount / maxMenu) * 100);

  useEffect(() => {
    if (cafeId) fetchCategoriesData();
  }, [cafeId]);

  const fetchCategoriesData = async () => {
    setIsLoadingCats(true);
    const res = await getCategories(cafeId);
    if (res.success) setCategories(res.data);
    setIsLoadingCats(false);
  };

  const resetForm = () => {
    setEditingId(null); setName(""); setNameEn(""); setNameFr(""); setDescription(""); setPrice(""); setCategoryId(""); 
    setImageFile(null); setImageUrlInput(""); setPreviewUrl(null); setIsValidImage(false); setImageMode('upload');
  };

  // 🌟 التعامل مع تغيير نوع الصورة (رفع من الجهاز)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIsValidImage(true);
    } else {
      setImageFile(null);
      setPreviewUrl(null);
      setIsValidImage(false);
    }
  };

  // 🌟 التعامل مع تغيير نوع الصورة (رابط)
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrlInput(url);
    setPreviewUrl(url);
    setIsValidImage(false); // سيتم تغييره لـ true إذا نجح وسم <img> في تحميله
  };

  const handleAddOrUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق الأساسي
    if (!cafeId || !name || !price || !categoryId) {
      return alert(t.fillFields || "يرجى تعبئة الحقول الأساسية واختيار القسم.");
    }

    // التحقق من صحة الصورة (يجب أن يكون هناك صورة صالحة للجديد، أو منتج معدل)
    if (!editingId && !isValidImage) {
      return alert(activeLang === 'ar' ? "يرجى إضافة صورة صالحة للمنتج أولاً." : "Please add a valid product image first.");
    }
    
    if (!editingId && isLimitReached) {
      alert(activeLang === 'ar' ? "لقد وصلت للحد الأقصى." : "Menu limit reached.");
      return;
    }

    setIsUploading(true);
    try {
      let finalImageUrl = undefined;

      // أ) إذا كان الوضع "رفع صورة" وهناك ملف
      if (imageMode === 'upload' && imageFile) {
        const optimizedFile = await compressImageBeforeUpload(imageFile);
        const fileName = `${Date.now()}-${Math.random()}.webp`;
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, optimizedFile);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;

        // مسح الصورة القديمة إذا كان هناك تعديل وكانت مرفوعة مسبقاً
        if (editingId) {
          const oldProduct = products.find((p: any) => p.id === editingId);
          if (oldProduct && oldProduct.image_url && oldProduct.image_url.includes('supabase.co')) {
            const oldFileName = oldProduct.image_url.split('/').pop();
            if (oldFileName) await supabase.storage.from('products').remove([oldFileName]);
          }
        }
      } 
      // ب) إذا كان الوضع "رابط جاهز"
      else if (imageMode === 'url' && imageUrlInput && isValidImage) {
        finalImageUrl = imageUrlInput;

        // مسح الصورة القديمة من التخزين (إذا كان مسارها القديم مرفوعاً وعدّلناه إلى رابط خارجي)
        if (editingId) {
          const oldProduct = products.find((p: any) => p.id === editingId);
          if (oldProduct && oldProduct.image_url && oldProduct.image_url.includes('supabase.co')) {
            const oldFileName = oldProduct.image_url.split('/').pop();
            if (oldFileName) await supabase.storage.from('products').remove([oldFileName]);
          }
        }
      }

      const productData: any = { 
        name_ar: name, 
        name_en: nameEn, 
        name_fr: nameFr, 
        description_ar: description, 
        price: parseFloat(price), 
        category_id: categoryId,
        category: "none" 
      };
      
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
    } catch (err: any) { 
      alert(t.errorPrefix + (err.message || "Error")); 
    } finally { 
      setIsUploading(false); 
    }
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm(t.confirmDelete)) return;
    try {
      if (imageUrl && imageUrl.includes('supabase.co')) {
        const fileName = imageUrl.split('/').pop();
        if (fileName) await supabase.storage.from('products').remove([fileName]);
      }
      const { success } = await adminDeleteProduct(id);
      if (success) fetchProducts(cafeId!);
    } catch (err) { alert(t.deleteFailed); }
  };

  const handleEditClick = (product: any) => {
    setEditingId(product.id); 
    setName(product.name_ar || ""); 
    setNameEn(product.name_en || ""); 
    setNameFr(product.name_fr || "");
    setDescription(product.description_ar || ""); 
    setPrice(product.price.toString()); 
    setCategoryId(product.category_id || "");
    
    // إعداد الصورة في التعديل
    if (product.image_url) {
      if (product.image_url.includes('supabase.co')) {
        setImageMode('upload');
        setImageFile(null);
        setImageUrlInput("");
      } else {
        setImageMode('url');
        setImageUrlInput(product.image_url);
        setImageFile(null);
      }
      setPreviewUrl(product.image_url);
      setIsValidImage(true);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleCategory = async (defCat: any, dbId: string | undefined) => {
    setIsTogglingCat(defCat.id);
    try {
      if (dbId) {
        await deleteCategory(dbId);
      } else {
        await addCategory(cafeId, defCat.name_ar, defCat.name_en, defCat.name_fr, defCat.icon);
      }
      await fetchCategoriesData();
      fetchProducts(cafeId);
    } catch (error) {
      console.error("Error toggling category:", error);
    } finally {
      setIsTogglingCat(null);
    }
  };

  const getCategoryName = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return activeLang === 'ar' ? 'بدون قسم' : 'Uncategorized';
    return activeLang === 'ar' ? cat.name_ar : activeLang === 'fr' ? cat.name_fr : cat.name_en;
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.HelpCircle;
    return <IconComponent size={20} />;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" dir={dir}>
      <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-border h-fit relative">
        {editingId && <button onClick={resetForm} className={`absolute top-6 ${activeLang === 'ar' ? 'left-6' : 'right-6'} text-muted-foreground hover:text-red-500 transition-colors bg-red-50 p-1.5 rounded-full`}><X size={20} /></button>}
        
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold">{editingId ? t.editProduct : t.addProduct}</h2>
          <button 
            onClick={() => setShowCatModal(true)}
            type="button"
            className="text-xs bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-colors shadow-sm"
          >
            <Settings2 size={14} /> 
            {activeLang === 'ar' ? 'الأقسام' : 'Categories'}
          </button>
        </div>
        
        {!editingId && isLimitReached && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">{activeLang === 'ar' ? "الحد الأقصى للمنيو" : "Menu Limit Reached"}</h4>
              <p className="text-xs mt-1 opacity-80">{activeLang === 'ar' ? "لا يمكنك إضافة منتجات جديدة." : "Limit reached."}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleAddOrUpdateProduct} className="space-y-5">
          <div className="space-y-1.5"><label className="block text-sm font-bold">{t.nameAr}</label><input required type="text" value={name} onChange={(e) => setName(e.target.value)} className={`w-full border border-border rounded-xl p-3 bg-muted/30 focus:bg-white transition-colors ${activeLang === 'ar' ? 'text-right' : 'text-left'}`} /></div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><label className="block text-sm font-bold">EN</label><input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} className={`w-full border border-border rounded-xl p-3 bg-muted/30 focus:bg-white transition-colors ${activeLang === 'ar' ? 'text-right' : 'text-left'}`} /></div>
            <div className="space-y-1.5"><label className="block text-sm font-bold">FR</label><input type="text" value={nameFr} onChange={(e) => setNameFr(e.target.value)} className={`w-full border border-border rounded-xl p-3 bg-muted/30 focus:bg-white transition-colors ${activeLang === 'ar' ? 'text-right' : 'text-left'}`} /></div>
          </div>
          
          <div className="space-y-1.5"><label className="block text-sm font-bold">{t.descLabel}</label><textarea required value={description} onChange={(e) => setDescription(e.target.value)} className={`w-full border border-border rounded-xl p-3 bg-muted/30 focus:bg-white transition-colors ${activeLang === 'ar' ? 'text-right' : 'text-left'}`} rows={2} /></div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><label className="block text-sm font-bold">{t.priceLabel}</label><input required type="number" step="0.5" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border border-border rounded-xl p-3 bg-muted/30 focus:bg-white transition-colors" dir="ltr" /></div>
            <div className="space-y-1.5">
              <label className="block text-sm font-bold">{t.categoryLabel}</label>
              <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={`w-full border border-border rounded-xl p-3 bg-muted/30 focus:bg-white transition-colors ${activeLang === 'ar' ? 'text-right' : 'text-left'}`}>
                <option value="" disabled>{activeLang === 'ar' ? 'اختر القسم...' : 'Select Category...'}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{activeLang === 'ar' ? cat.name_ar : activeLang === 'fr' ? cat.name_fr : cat.name_en}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* 🌟 نظام الصور الجديد (Upload vs URL) + المعاينة */}
          <div className="space-y-3 bg-zinc-50 border border-zinc-200 p-4 rounded-2xl">
            <label className="block text-sm font-bold text-zinc-800">{activeLang === 'ar' ? 'صورة المنتج' : 'Product Image'}</label>
            
            <div className="flex bg-zinc-200/50 p-1 rounded-xl">
              <button type="button" onClick={() => { setImageMode('upload'); setPreviewUrl(imageFile ? URL.createObjectURL(imageFile) : (editingId ? previewUrl : null)); setIsValidImage(!!imageFile || !!editingId); }} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg transition-all ${imageMode === 'upload' ? 'bg-white shadow-sm text-primary' : 'text-zinc-500'}`}>
                <ImageIcon size={14} /> {activeLang === 'ar' ? 'رفع من الجهاز' : 'Upload File'}
              </button>
              <button type="button" onClick={() => { setImageMode('url'); setPreviewUrl(imageUrlInput || null); setIsValidImage(false); }} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg transition-all ${imageMode === 'url' ? 'bg-white shadow-sm text-primary' : 'text-zinc-500'}`}>
                <LinkIcon size={14} /> {activeLang === 'ar' ? 'رابط جاهز' : 'Image URL'}
              </button>
            </div>

            {imageMode === 'upload' ? (
              <div className={`border-2 border-dashed rounded-xl p-4 text-center relative transition-colors ${!editingId && isLimitReached ? 'border-zinc-300 bg-zinc-100' : 'border-primary/40 hover:bg-primary/5 cursor-pointer bg-white'}`}>
                <input disabled={!editingId && isLimitReached} type="file" accept="image/*" onChange={handleFileChange} className={`absolute inset-0 w-full h-full opacity-0 ${!editingId && isLimitReached ? 'hidden' : 'cursor-pointer'}`} />
                <div className={`font-bold text-xs ${!editingId && isLimitReached ? 'text-zinc-400' : 'text-primary'}`}>{imageFile ? imageFile.name : editingId ? (activeLang === 'ar' ? 'تغيير الصورة المرفوعة' : 'Change uploaded image') : (activeLang === 'ar' ? 'اضغط لاختيار صورة' : 'Click to choose image')}</div>
              </div>
            ) : (
              <input type="url" placeholder="https://images.unsplash.com/..." value={imageUrlInput} onChange={handleUrlChange} className="w-full border border-zinc-200 rounded-xl p-3 text-sm focus:border-primary outline-none transition-colors text-left" dir="ltr" />
            )}

            {/* صندوق المعاينة الفورية */}
            {previewUrl && (
              <div className="relative w-full h-40 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100 flex items-center justify-center mt-2 group">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className={`w-full h-full object-cover transition-opacity duration-300 ${isValidImage ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setIsValidImage(true)}
                  onError={() => {
                    if (imageMode === 'url' && imageUrlInput) setIsValidImage(false);
                  }}
                />
                
                {/* رسالة الخطأ إذا كان الرابط لا يعمل */}
                {!isValidImage && imageMode === 'url' && imageUrlInput && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 bg-red-50/90 backdrop-blur-sm">
                    <AlertCircle size={28} className="mb-2" />
                    <span className="text-xs font-bold text-center px-4 leading-relaxed">
                      {activeLang === 'ar' ? 'الرابط غير صالح أو الصورة محمية.' : 'Invalid link or image is protected.'} <br/> 
                      {activeLang === 'ar' ? 'تأكد من نسخه بشكل صحيح.' : 'Make sure to copy it correctly.'}
                    </span>
                  </div>
                )}
                
                {isValidImage && (
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded font-bold backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                    {activeLang === 'ar' ? 'معاينة الصورة' : 'Image Preview'}
                  </div>
                )}
              </div>
            )}
          </div>

          <button disabled={isUploading || (!editingId && isLimitReached) || (!editingId && !isValidImage)} type="submit" className={`w-full text-white py-4 rounded-xl font-bold shadow-lg transition-transform active:scale-[0.98] flex justify-center items-center gap-2 ${isUploading || (!editingId && isLimitReached) || (!editingId && !isValidImage) ? 'bg-zinc-400 cursor-not-allowed shadow-none' : editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-primary hover:bg-primary/90'}`}>
            {isUploading ? <Loader2 className="animate-spin" size={20} /> : editingId ? t.saveEdit : (!editingId && isLimitReached ? "Locked 🔒" : t.publishProduct)}
          </button>
        </form>
      </div>
      
      <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-border">
        <div className="flex items-center justify-between mb-4 border-b pb-4">
          <h2 className="text-xl font-bold">{t.currentProducts}</h2>
          <div className="text-sm font-bold text-muted-foreground flex items-center gap-2" dir="ltr">{currentCount} / {isDiamond ? "♾️" : maxMenu}</div>
        </div>
        {!isDiamond && (
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden mb-6">
            <div className={`h-full rounded-full transition-all duration-500 ${isLimitReached ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${usagePercent}%` }} />
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((product: any) => (
            <div key={product.id} className="flex gap-4 border border-border/50 p-3 rounded-2xl items-center bg-muted/10">
              <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-muted relative group">
                <img src={product.image_url} alt={product.name_ar} className="w-full h-full object-cover" />
                {product.image_url.includes('unsplash') && (
                  <div className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-md backdrop-blur-sm" title="Unsplash Link">
                    <LinkIcon size={10} />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm">{activeLang === 'en' && product.name_en ? product.name_en : activeLang === 'fr' && product.name_fr ? product.name_fr : product.name_ar}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-md">{getCategoryName(product.category_id)}</span>
                  <p className="text-sm text-primary font-bold" dir="ltr">{product.price} MAD</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEditClick(product)} className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"><Edit size={18} /></button>
                <button onClick={() => handleDelete(product.id, product.image_url)} className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCatModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col h-[90vh] md:h-[600px]">
            
            <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
              <h3 className="text-xl font-black text-zinc-900 flex items-center gap-2">
                <Settings2 className="text-primary" /> {activeLang === 'ar' ? 'إدارة الأقسام' : 'Manage Categories'}
              </h3>
              <button onClick={() => setShowCatModal(false)} className="bg-white shadow-sm border border-zinc-200 text-zinc-500 hover:text-zinc-900 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
              {isLoadingCats ? (
                <div className="flex justify-center items-center h-full"><Loader2 size={32} className="animate-spin text-zinc-400" /></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {DEFAULT_CATEGORIES.map(defCat => {
                    const dbCategory = categories.find(c => c.name_en === defCat.name_en);
                    const isActive = !!dbCategory;
                    const isProcessing = isTogglingCat === defCat.id;

                    return (
                      <div key={defCat.id} className={`flex items-center justify-between p-4 border rounded-2xl transition-colors ${isActive ? 'border-primary/50 bg-primary/5' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-primary text-white shadow-md' : 'bg-zinc-100 text-zinc-400'}`}>
                            {renderIcon(defCat.icon)}
                          </div>
                          <div className="flex flex-col">
                            <span className={`font-black text-sm ${isActive ? 'text-zinc-900' : 'text-zinc-600'}`}>{activeLang === 'ar' ? defCat.name_ar : activeLang === 'fr' ? defCat.name_fr : defCat.name_en}</span>
                            <span className="text-[10px] font-bold text-zinc-400">{defCat.name_en}</span>
                          </div>
                        </div>
                        
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={isActive} onChange={() => handleToggleCategory(defCat, dbCategory?.id)} disabled={isProcessing} />
                          <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          {isProcessing && <Loader2 size={16} className="absolute -left-6 animate-spin text-primary" />}
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}