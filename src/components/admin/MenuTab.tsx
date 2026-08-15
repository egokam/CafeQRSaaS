"use client";

import { useState, useEffect, useRef } from "react";
import { X, Edit, Trash2, AlertCircle, Settings2, Loader2, Image as ImageIcon, Link as LinkIcon, Edit2, Plus, ChevronDown, Check, LayoutGrid, SlidersHorizontal, CheckSquare, CircleDot, PlusSquare, Wand2, Search } from "lucide-react";
import * as Icons from "lucide-react";
import { supabase } from "../../lib/supabase";
import { adminAddProduct, adminUpdateProduct, adminDeleteProduct } from "../../actions/auth";
import { getCategories, addCategory, updateCategory, deleteCategory } from "../../actions/menu";

// القائمة الثابتة للأقسام
const DEFAULT_CATEGORIES = [
  { id: 'cat_promotions', name_en: 'Promotions', name_fr: 'Promotions', name_ar: 'عروض', icon: 'Tag' },
  { id: 'cat_bundles', name_en: 'Bundles', name_fr: 'Packs', name_ar: 'باقات', icon: 'Package' },
  { id: 'cat_patisserie', name_en: 'Patisserie', name_fr: 'Pâtisserie', name_ar: 'حلويات ومعجنات', icon: 'Croissant' },
  { id: 'cat_hot_coffee', name_en: 'Hot Coffee', name_fr: 'Cafés Chauds', name_ar: 'قهوة ساخنة', icon: 'Coffee' },
  { id: 'cat_tea', name_en: 'Tea', name_fr: 'Thé', name_ar: 'شاي', icon: 'CupSoda' },
  { id: 'cat_cold_coffee', name_en: 'Cold Coffee', name_fr: 'Cafés Froids', name_ar: 'قهوة باردة', icon: 'CupSoda' },
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

function CustomDropdown({ value, onChange, options, placeholder, disabled, activeLang }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt: any) => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between border rounded-xl p-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${disabled ? 'bg-muted/50 text-muted-foreground cursor-not-allowed border-transparent' : 'bg-white border-border hover:border-primary/40'} ${activeLang === 'ar' ? 'text-right' : 'text-left'}`}
      >
        <span className={selectedOption ? 'text-foreground font-semibold' : 'text-muted-foreground font-medium'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-border rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] py-1 max-h-60 overflow-auto custom-scrollbar overflow-x-hidden">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center">لا توجد خيارات متاحة</div>
          ) : (
            options.map((opt: any) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`w-full text-start px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${value === opt.value ? 'bg-primary/5 text-primary font-bold' : 'text-foreground hover:bg-muted font-medium'}`}
              >
                {opt.label}
                {value === opt.value && <Check size={16} className="text-primary" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function MenuTab({ cafeId, activeLang, t, products, fetchProducts, maxMenu = 150 }: any) {
  const dir = activeLang === 'ar' ? 'rtl' : 'ltr';

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameFr, setNameFr] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategory, setSubCategory] = useState("");

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

  const [editingCategoryData, setEditingCategoryData] = useState<any>(null);
  const [newSubCat, setNewSubCat] = useState("");

  // حالات البحث
  const [searchQuery, setSearchQuery] = useState("");

  // حالات الإضافات (Modifiers)
  const [availableModifiers, setAvailableModifiers] = useState<any[]>([]);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [showModifiersModal, setShowModifiersModal] = useState(false);
  const [isLoadingModifiers, setIsLoadingModifiers] = useState(false);

  const currentCount = products.length;
  const isDiamond = maxMenu >= 9999;
  const isLimitReached = !isDiamond && currentCount >= maxMenu;
  const usagePercent = isDiamond ? 0 : Math.min(100, (currentCount / maxMenu) * 100);

  useEffect(() => {
    if (cafeId) {
      fetchCategoriesData();
      fetchAvailableModifiers();
    }
  }, [cafeId]);

  useEffect(() => {
    setSubCategory("");
  }, [categoryId]);

  const fetchCategoriesData = async () => {
    setIsLoadingCats(true);
    const res = await getCategories(cafeId);
    if (res.success) setCategories(res.data);
    setIsLoadingCats(false);
  };

  const fetchAvailableModifiers = async () => {
    setIsLoadingModifiers(true);
    const { data } = await supabase
      .from('modifier_groups')
      .select('*')
      .eq('cafe_id', cafeId);
    if (data) setAvailableModifiers(data);
    setIsLoadingModifiers(false);
  };

  const resetForm = () => {
    setEditingId(null); setName(""); setNameEn(""); setNameFr(""); setDescription(""); setPrice(""); setCategoryId("");
    setSubCategory(""); setImageFile(null); setImageUrlInput(""); setPreviewUrl(null); setIsValidImage(false); setImageMode('upload');
    setSelectedModifiers([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIsValidImage(true);
    } else {
      setImageFile(null); setPreviewUrl(null); setIsValidImage(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let url = e.target.value.trim();
    if (url.startsWith('https://unsplash.com/photos/')) {
      const parts = url.split('/');
      const idPart = parts[parts.length - 1];
      const photoId = idPart.split('?')[0].split('-').pop();
      if (photoId) {
        url = `https://source.unsplash.com/${photoId}/800x800`;
      }
    }
    setImageUrlInput(url);
    setPreviewUrl(url);
    setIsValidImage(false);
  };

  const handleAddOrUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cafeId || !name || !price || !categoryId) return alert(t.fillFields || "يرجى تعبئة الحقول الأساسية واختيار القسم.");
    if (!editingId && !isValidImage) return alert(activeLang === 'ar' ? "يرجى إضافة صورة صالحة للمنتج أولاً." : "Please add a valid product image first.");
    if (!editingId && isLimitReached) return alert(activeLang === 'ar' ? "لقد وصلت للحد الأقصى." : "Menu limit reached.");

    setIsUploading(true);
    try {
      let finalImageUrl = undefined;

      if (imageMode === 'upload' && imageFile) {
        const optimizedFile = await compressImageBeforeUpload(imageFile);
        const fileName = `${Date.now()}-${Math.random()}.webp`;
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, optimizedFile);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;

        if (editingId) {
          const oldProduct = products.find((p: any) => p.id === editingId);
          if (oldProduct && oldProduct.image_url && oldProduct.image_url.includes('supabase.co')) {
            const oldFileName = oldProduct.image_url.split('/').pop();
            if (oldFileName) await supabase.storage.from('products').remove([oldFileName]);
          }
        }
      }
      else if (imageMode === 'url' && imageUrlInput && isValidImage) {
        finalImageUrl = imageUrlInput;
        if (editingId) {
          const oldProduct = products.find((p: any) => p.id === editingId);
          if (oldProduct && oldProduct.image_url && oldProduct.image_url.includes('supabase.co')) {
            const oldFileName = oldProduct.image_url.split('/').pop();
            if (oldFileName) await supabase.storage.from('products').remove([oldFileName]);
          }
        }
      }

      const productData: any = {
        name_ar: name, name_en: nameEn, name_fr: nameFr, description_ar: description,
        price: parseFloat(price), category_id: categoryId,
        sub_category: subCategory.trim() !== "" ? subCategory.trim() : null,
        category: "none",
        modifier_ids: selectedModifiers
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
    setSubCategory(product.sub_category || "");
    
    // 🌟 التعديل هنا: قراءة الإضافات من product_modifiers
    setSelectedModifiers(product.product_modifiers?.map((pm: any) => pm.modifier_group_id) || []);

    if (product.image_url) {
      if (product.image_url.includes('supabase.co')) {
        setImageMode('upload'); setImageFile(null); setImageUrlInput("");
      } else {
        setImageMode('url'); setImageUrlInput(product.image_url); setImageFile(null);
      }
      setPreviewUrl(product.image_url); setIsValidImage(true);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleCategory = async (defCat: any, dbId: string | undefined) => {
    setIsTogglingCat(defCat.id);
    try {
      if (dbId) {
        await deleteCategory(dbId);
      } else {
        await addCategory(cafeId, defCat.name_ar, defCat.name_en, defCat.name_fr, defCat.icon, []);
      }
      await fetchCategoriesData();
      fetchProducts(cafeId);
    } catch (error) {
      console.error("Error toggling category:", error);
    } finally {
      setIsTogglingCat(null);
    }
  };

  const handleSaveCategoryEdit = async () => {
    if (!editingCategoryData) return;
    setIsTogglingCat('saving_edit');
    try {
      await updateCategory(
        editingCategoryData.id,
        editingCategoryData.name_ar,
        editingCategoryData.name_en,
        editingCategoryData.name_fr,
        editingCategoryData.icon,
        editingCategoryData.subcategories || []
      );
      await fetchCategoriesData();
      setEditingCategoryData(null);
    } catch (error) {
      console.error("Error updating category", error);
    } finally {
      setIsTogglingCat(null);
    }
  };

  const getCategoryName = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return activeLang === 'ar' ? 'بدون قسم' : 'Uncategorized';
    return activeLang === 'ar' ? cat.name_ar : activeLang === 'fr' ? cat.name_fr : cat.name_en;
  };

  const toggleModifierSelection = (modifierId: string) => {
    setSelectedModifiers(prev => 
      prev.includes(modifierId) ? prev.filter(id => id !== modifierId) : [...prev, modifierId]
    );
  };

  const getModifierIcon = (type: string) => {
    switch (type) {
      case 'single_choice': return <CircleDot size={18} className="text-blue-500" />;
      case 'multiple_choice': return <CheckSquare size={18} className="text-green-500" />;
      case 'incremental': return <PlusSquare size={18} className="text-orange-500" />;
      case 'slider': return <SlidersHorizontal size={18} className="text-red-500" />;
      default: return <Settings2 size={18} className="text-zinc-500" />;
    }
  };

  const selectedCategoryData = categories.find(c => c.id === categoryId);
  const availableSubCategories = selectedCategoryData?.subcategories || [];

  // فلترة المنتجات بناءً على البحث
  const filteredProducts = products.filter((p: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.name_ar && p.name_ar.toLowerCase().includes(q)) ||
      (p.name_en && p.name_en.toLowerCase().includes(q)) ||
      (p.name_fr && p.name_fr.toLowerCase().includes(q))
    );
  });

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
          <div className="space-y-1.5"><label className="block text-sm font-bold text-zinc-700">{t.nameAr}</label><input required type="text" value={name} onChange={(e) => setName(e.target.value)} className={`w-full border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all ${activeLang === 'ar' ? 'text-right' : 'text-left'}`} /></div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><label className="block text-sm font-bold text-zinc-700">EN</label><input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} className={`w-full border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all ${activeLang === 'ar' ? 'text-right' : 'text-left'}`} /></div>
            <div className="space-y-1.5"><label className="block text-sm font-bold text-zinc-700">FR</label><input type="text" value={nameFr} onChange={(e) => setNameFr(e.target.value)} className={`w-full border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all ${activeLang === 'ar' ? 'text-right' : 'text-left'}`} /></div>
          </div>

          <div className="space-y-1.5"><label className="block text-sm font-bold text-zinc-700">{t.descLabel}</label><textarea required value={description} onChange={(e) => setDescription(e.target.value)} className={`w-full border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all ${activeLang === 'ar' ? 'text-right' : 'text-left'}`} rows={2} /></div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5"><label className="block text-sm font-bold text-zinc-700">{t.priceLabel}</label><input required type="number" step="0.5" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all" dir="ltr" /></div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-zinc-700">{t.categoryLabel}</label>
              <CustomDropdown
                value={categoryId}
                onChange={setCategoryId}
                activeLang={activeLang}
                placeholder={activeLang === 'ar' ? 'اختر...' : 'Select...'}
                options={categories.map(cat => ({
                  value: cat.id,
                  label: activeLang === 'ar' ? cat.name_ar : activeLang === 'fr' ? cat.name_fr : cat.name_en
                }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-zinc-700">{activeLang === 'ar' ? 'تصنيف فرعي' : 'Sub-Category'}</label>
              <CustomDropdown
                value={subCategory}
                onChange={setSubCategory}
                activeLang={activeLang}
                disabled={!categoryId || availableSubCategories.length === 0}
                placeholder={availableSubCategories.length === 0 ? (activeLang === 'ar' ? 'غير متاح' : 'N/A') : (activeLang === 'ar' ? 'اختر...' : 'Select...')}
                options={availableSubCategories.map((sub: string) => ({
                  value: sub,
                  label: sub
                }))}
              />
            </div>

            <div className="col-span-1 sm:col-span-3 space-y-1.5 mt-1">
              <label className="block text-sm font-bold text-zinc-700">{activeLang === 'ar' ? 'الإضافات والتعديلات' : 'Modifiers'}</label>
              <div className="flex flex-wrap gap-2 items-center min-h-[46px] border border-border rounded-xl p-2 bg-zinc-50/50">
                  {selectedModifiers.length === 0 && (
                      <span className="text-sm text-zinc-400 px-2 font-medium">{activeLang === 'ar' ? 'لم يتم تعيين أي إضافات' : 'No modifiers assigned'}</span>
                  )}
                  {selectedModifiers.map(id => {
                      const mod = availableModifiers.find(m => m.id === id);
                      if (!mod) return null;
                      return (
                          <span key={id} className="text-xs font-bold bg-white border border-border shadow-sm text-zinc-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                              {getModifierIcon(mod.type)}
                              {activeLang === 'ar' ? mod.name_ar : mod.name_en}
                              <button type="button" onClick={() => setSelectedModifiers(prev => prev.filter(m => m !== id))} className="ml-1 text-zinc-400 hover:text-red-500 transition-colors"><X size={12}/></button>
                          </span>
                      );
                  })}
                  <button type="button" onClick={() => setShowModifiersModal(true)} className="ml-auto flex items-center gap-1.5 text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors">
                      <Wand2 size={14} /> {activeLang === 'ar' ? 'تعيين' : 'Assign'}
                  </button>
              </div>
            </div>
          </div>

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
              <input type="url" placeholder="https://images.unsplash.com/..." value={imageUrlInput} onChange={handleUrlChange} className="w-full border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-left" dir="ltr" />
            )}

            {previewUrl && (
              <div className="relative w-full h-40 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100 flex items-center justify-center mt-2 group">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className={`w-full h-full object-cover transition-opacity duration-300 ${isValidImage ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setIsValidImage(true)}
                  onError={() => { if (imageMode === 'url' && imageUrlInput) setIsValidImage(false); }}
                />
                {!isValidImage && imageMode === 'url' && imageUrlInput && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 bg-red-50/90 backdrop-blur-sm">
                    <AlertCircle size={28} className="mb-2" />
                    <span className="text-xs font-bold text-center px-4 leading-relaxed">
                      {activeLang === 'ar' ? 'الرابط غير صالح أو الصورة محمية.' : 'Invalid link or image is protected.'} <br />
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
        {/* 🌟 إضافة مربع البحث ضمن ترويسة قائمة المنتجات */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b pb-4 gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">{t.currentProducts}</h2>
            <div className="text-sm font-bold text-muted-foreground flex items-center gap-2" dir="ltr">{currentCount} / {isDiamond ? "♾️" : maxMenu}</div>
          </div>
          
          <div className="relative w-full sm:w-72 shrink-0">
            <Search size={16} className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground ${activeLang === 'ar' ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              placeholder={activeLang === 'ar' ? 'بحث عن منتج...' : 'Search products...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full border border-border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all ${activeLang === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
            />
          </div>
        </div>

        {!isDiamond && (
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden mb-6">
            <div className={`h-full rounded-full transition-all duration-500 ${isLimitReached ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${usagePercent}%` }} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-10 text-center text-muted-foreground font-medium text-sm">
              {activeLang === 'ar' ? 'لم يتم العثور على أي منتج يطابق بحثك.' : 'No products match your search.'}
            </div>
          ) : (
            filteredProducts.map((product: any) => (
              <div key={product.id} className="flex gap-4 border border-border/50 p-3 rounded-2xl items-center bg-muted/10">
                {/* 🌟 إصلاح خطأ وسم الصورة (empty src attribute) هنا */}
                <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-muted relative group flex items-center justify-center">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name_ar || 'Product'} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={24} className="text-zinc-400 opacity-50" />
                  )}
                  {product.image_url?.includes('unsplash') && (
                    <div className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-md backdrop-blur-sm" title="Unsplash Link">
                      <LinkIcon size={10} />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold text-sm">{activeLang === 'en' && product.name_en ? product.name_en : activeLang === 'fr' && product.name_fr ? product.name_fr : product.name_ar}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-md truncate max-w-[80px]">
                      {getCategoryName(product.category_id)}
                    </span>
                    {product.sub_category && (
                      <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                        {product.sub_category}
                      </span>
                    )}
                    <p className="text-sm text-primary font-bold w-full mt-1" dir="ltr">{product.price} MAD</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEditClick(product)} className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(product.id, product.image_url)} className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showCatModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col h-[90vh] md:h-[650px]">
            <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-zinc-50 shrink-0">
              <h3 className="text-xl font-black text-zinc-900 flex items-center gap-2">
                <Settings2 className="text-primary" />
                {editingCategoryData ? (activeLang === 'ar' ? 'تعديل القسم والتصنيفات' : 'Edit Category & Sub-categories') : (activeLang === 'ar' ? 'إدارة الأقسام' : 'Manage Categories')}
              </h3>
              <button onClick={() => { setShowCatModal(false); setEditingCategoryData(null); }} className="bg-white shadow-sm border border-zinc-200 text-zinc-500 hover:text-zinc-900 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
              {isLoadingCats ? (
                <div className="flex justify-center items-center h-full"><Loader2 size={32} className="animate-spin text-zinc-400" /></div>
              ) : editingCategoryData ? (
                <div className="space-y-6 max-w-lg mx-auto animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-zinc-700 block">{activeLang === 'ar' ? 'اسم القسم (لغات متعددة)' : 'Category Name (Multi-lang)'}</label>
                    <input placeholder="العربية" value={editingCategoryData.name_ar} onChange={e => setEditingCategoryData({ ...editingCategoryData, name_ar: e.target.value })} className={`w-full border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 ${activeLang === 'ar' ? 'text-right' : 'text-left'}`} />
                    <input placeholder="English" value={editingCategoryData.name_en} onChange={e => setEditingCategoryData({ ...editingCategoryData, name_en: e.target.value })} className={`w-full border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 ${activeLang === 'ar' ? 'text-right' : 'text-left'}`} />
                    <input placeholder="Français" value={editingCategoryData.name_fr} onChange={e => setEditingCategoryData({ ...editingCategoryData, name_fr: e.target.value })} className={`w-full border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 ${activeLang === 'ar' ? 'text-right' : 'text-left'}`} />
                  </div>

                  <div className="space-y-3 bg-muted/30 p-5 rounded-2xl border border-border">
                    <label className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                      <LayoutGrid size={18} className="text-primary" />
                      {activeLang === 'ar' ? 'التصنيفات الفرعية (Sub-Categories)' : 'Sub-Categories'}
                    </label>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={activeLang === 'ar' ? "مثال: Beef، Chicken..." : "e.g., Beef, Chicken..."}
                        value={newSubCat}
                        onChange={e => setNewSubCat(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newSubCat.trim() && !editingCategoryData.subcategories?.includes(newSubCat.trim())) {
                              setEditingCategoryData({ ...editingCategoryData, subcategories: [...(editingCategoryData.subcategories || []), newSubCat.trim()] });
                              setNewSubCat("");
                            }
                          }
                        }}
                        className={`flex-1 border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 ${activeLang === 'ar' ? 'text-right' : 'text-left'}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newSubCat.trim() && !editingCategoryData.subcategories?.includes(newSubCat.trim())) {
                            setEditingCategoryData({ ...editingCategoryData, subcategories: [...(editingCategoryData.subcategories || []), newSubCat.trim()] });
                            setNewSubCat("");
                          }
                        }}
                        className="bg-primary text-white px-4 rounded-xl font-bold hover:bg-primary/90 transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {(!editingCategoryData.subcategories || editingCategoryData.subcategories.length === 0) && (
                        <span className="text-xs text-muted-foreground font-medium">{activeLang === 'ar' ? 'لا توجد تصنيفات فرعية مسجلة.' : 'No sub-categories added.'}</span>
                      )}
                      {editingCategoryData.subcategories?.map((sub: string, index: number) => (
                        <div key={index} className="flex items-center gap-1.5 bg-white border border-border px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">
                          {sub}
                          <button
                            type="button"
                            onClick={() => setEditingCategoryData({
                              ...editingCategoryData,
                              subcategories: editingCategoryData.subcategories.filter((s: string) => s !== sub)
                            })}
                            className="text-muted-foreground hover:text-red-500 transition-colors ml-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveCategoryEdit}
                      disabled={isTogglingCat === 'saving_edit'}
                      className="flex-1 bg-foreground text-white py-3.5 rounded-xl font-bold hover:bg-zinc-800 transition-colors flex justify-center items-center gap-2"
                    >
                      {isTogglingCat === 'saving_edit' ? <Loader2 size={20} className="animate-spin" /> : (activeLang === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}
                    </button>
                    <button
                      onClick={() => setEditingCategoryData(null)}
                      className="flex-1 bg-muted text-foreground py-3.5 rounded-xl font-bold hover:bg-zinc-200 transition-colors"
                    >
                      {activeLang === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {DEFAULT_CATEGORIES.map(defCat => {
                    const dbCategory = categories.find(c => c.name_en === defCat.name_en);
                    const isActive = !!dbCategory;
                    const isProcessing = isTogglingCat === defCat.id;

                    return (
                      <div key={defCat.id} className={`flex items-center justify-between p-4 border rounded-2xl transition-colors ${isActive ? 'border-primary/50 bg-primary/5' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-primary/10 shadow-sm' : 'bg-zinc-100'}`}>
                            <img
                              src={`/icons/${defCat.id}.png`}
                              alt={defCat.name_en}
                              className={`w-7 h-7 object-contain transition-all ${isActive ? 'opacity-100' : 'opacity-40 grayscale'}`}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className={`font-black text-sm ${isActive ? 'text-zinc-900' : 'text-zinc-600'}`}>{activeLang === 'ar' ? defCat.name_ar : activeLang === 'fr' ? defCat.name_fr : defCat.name_en}</span>
                            <span className="text-[10px] font-bold text-zinc-400">{defCat.name_en}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {isActive && !isProcessing && (
                            <button
                              onClick={() => setEditingCategoryData(dbCategory)}
                              className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors shadow-sm"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={isActive} onChange={() => handleToggleCategory(defCat, dbCategory?.id)} disabled={isProcessing} />
                            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            {isProcessing && <Loader2 size={16} className="absolute -left-6 animate-spin text-primary" />}
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🌟 نافذة تعيين الإضافات (Modifiers Modal) */}
      {showModifiersModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-zinc-50 shrink-0">
              <h3 className="text-xl font-black text-zinc-900 flex items-center gap-2">
                <Wand2 className="text-primary" />
                {activeLang === 'ar' ? 'تعيين الإضافات والتعديلات' : 'Assign Modifiers'}
              </h3>
              <button onClick={() => setShowModifiersModal(false)} className="bg-white shadow-sm border border-zinc-200 text-zinc-500 hover:text-zinc-900 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar space-y-4">
              {isLoadingModifiers ? (
                <div className="flex justify-center items-center py-10"><Loader2 size={32} className="animate-spin text-zinc-400" /></div>
              ) : availableModifiers.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 font-medium text-sm">
                  {activeLang === 'ar' ? 'لا توجد أي إضافات معدة مسبقاً. قم بإضافتها من قسم الإضافات أولاً.' : 'No modifiers created yet.'}
                </div>
              ) : (
                availableModifiers.map((mod: any) => {
                  const isSelected = selectedModifiers.includes(mod.id);
                  return (
                    <div 
                      key={mod.id} 
                      onClick={() => toggleModifierSelection(mod.id)}
                      className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 bg-white'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                          {getModifierIcon(mod.type)}
                        </div>
                        <div className="flex flex-col">
                          <span className={`font-bold text-sm ${isSelected ? 'text-primary' : 'text-zinc-900'}`}>
                            {activeLang === 'ar' ? mod.name_ar : mod.name_en}
                          </span>
                          <span className="text-xs font-bold text-zinc-400 uppercase mt-0.5">
                            {mod.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary text-white' : 'border-zinc-300'}`}>
                        {isSelected && <Check size={14} strokeWidth={4} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="p-4 border-t border-zinc-200 bg-zinc-50">
              <button onClick={() => setShowModifiersModal(false)} className="w-full bg-primary text-white py-3.5 rounded-xl font-bold hover:bg-primary/90 transition-transform active:scale-[0.98]">
                {activeLang === 'ar' ? 'تأكيد وحفظ التعيين' : 'Confirm Selection'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}