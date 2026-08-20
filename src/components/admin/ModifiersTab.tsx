"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Loader2, Check, X, CircleDot, CheckSquare, PlusSquare, SlidersHorizontal, Settings2 } from "lucide-react";
import { deleteAdminModifierGroup, getAdminModifierGroups, saveAdminModifierGroup } from "../../actions/menu";

type ModifierType = 'single_choice' | 'multiple_choice' | 'incremental' | 'slider';

export default function ModifiersTab({ cafeId, activeLang }: { cafeId: string, activeLang: "en" | "fr" | "ar" }) {
  const dir = activeLang === 'ar' ? 'rtl' : 'ltr';

  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameFr, setNameFr] = useState("");
  const [type, setType] = useState<ModifierType>('single_choice');
  const [minSelections, setMinSelections] = useState(0);
  const [maxSelections, setMaxSelections] = useState(1);
  
  const [options, setOptions] = useState<{ id?: string, name_ar: string, name_en: string, name_fr: string, price_adjustment: number }[]>([]);

  useEffect(() => {
    fetchModifierGroups();
  }, [cafeId]);

  const fetchModifierGroups = async () => {
    setIsLoading(true);
    const result = await getAdminModifierGroups(cafeId);
    if (result.success) setGroups(result.groups);
    setIsLoading(false);
  };

  const resetForm = () => {
    setEditingGroupId(null);
    setNameAr(""); setNameEn(""); setNameFr("");
    setType('single_choice');
    setMinSelections(0); setMaxSelections(1);
    setOptions([]);
    setShowModal(false);
  };

  const handleEdit = (group: any) => {
    if (group.is_global) return;
    setEditingGroupId(group.id);
    setNameAr(group.name_ar || "");
    setNameEn(group.name_en || "");
    setNameFr(group.name_fr || "");
    setType(group.type);
    setMinSelections(group.min_selections);
    setMaxSelections(group.max_selections);
    setOptions(group.modifier_options || []);
    setShowModal(true);
  };

  const handleAddOption = () => {
    setOptions([...options, { name_ar: "", name_en: "", name_fr: "", price_adjustment: 0 }]);
  };

  const updateOption = (index: number, field: string, value: any) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr && !nameEn && !nameFr) return alert(activeLang === 'ar' ? 'يرجى إدخال اسم المجموعة بلغة واحدة على الأقل.' : 'Please enter group name in at least one language.');
    if (options.length === 0) return alert(activeLang === 'ar' ? 'يرجى إدخال خيار واحد على الأقل.' : 'Please enter at least one option.');

    setIsSaving(true);
    try {
      const groupData = {
        id: editingGroupId || undefined,
        name_ar: nameAr,
        name_en: nameEn,
        name_fr: nameFr,
        type,
        min_selections: minSelections,
        max_selections: maxSelections,
        options,
      };

      const result = await saveAdminModifierGroup(cafeId, groupData);
      if (!result.success) throw new Error(result.error);

      resetForm();
      fetchModifierGroups();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const group = groups.find((item) => item.id === id);
    if (group?.is_global) return;
    if (!confirm(activeLang === 'ar' ? 'هل أنت متأكد من حذف هذه المجموعة؟' : 'Are you sure you want to delete this group?')) return;
    try {
      const result = await deleteAdminModifierGroup(cafeId, id);
      if (!result.success) throw new Error(result.error);
      fetchModifierGroups();
    } catch (err: any) {
      alert("Error deleting: " + err.message);
    }
  };

  const getIcon = (t: string) => {
    switch (t) {
      case 'single_choice': return <CircleDot size={20} className="text-blue-500" />;
      case 'multiple_choice': return <CheckSquare size={20} className="text-green-500" />;
      case 'incremental': return <PlusSquare size={20} className="text-orange-500" />;
      case 'slider': return <SlidersHorizontal size={20} className="text-red-500" />;
      default: return <Settings2 size={20} className="text-zinc-500" />;
    }
  };

  const getTypeLabel = (t: string) => {
    if (activeLang === 'ar') {
      switch (t) {
        case 'single_choice': return 'اختيار فردي إجباري';
        case 'multiple_choice': return 'إضافات متعددة (مربعات)';
        case 'incremental': return 'تزايدي (أزرار + / -)';
        case 'slider': return 'شريط مستويات (Slider)';
      }
    }
    return t.replace('_', ' ').toUpperCase();
  };

  return (
    <div dir={dir} className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-zinc-900">{activeLang === 'ar' ? 'قوالب الإضافات والتعديلات' : 'Modifier Templates'}</h2>
          <p className="text-muted-foreground text-sm mt-1">{activeLang === 'ar' ? 'قم بإنشاء وتجهيز الإضافات هنا لتتمكن من تعيينها للمنتجات لاحقاً.' : 'Create modifiers here to assign them to products.'}</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-primary text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-transform active:scale-95"
        >
          <Plus size={18} /> {activeLang === 'ar' ? 'إنشاء جديد' : 'Create New'}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-zinc-400" size={40} /></div>
      ) : groups.length === 0 ? (
        <div className="bg-white border border-dashed border-zinc-300 rounded-3xl p-16 text-center">
          <Settings2 size={48} className="mx-auto text-zinc-300 mb-4" />
          <h3 className="text-lg font-bold text-zinc-600">{activeLang === 'ar' ? 'لا توجد إضافات بعد' : 'No modifiers created yet'}</h3>
          <p className="text-sm text-zinc-400 mt-2">{activeLang === 'ar' ? 'انقر على "إنشاء جديد" للبدء.' : 'Click "Create New" to start.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map(group => (
            <div key={group.id} className="bg-white border border-border p-5 rounded-2xl shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="bg-zinc-50 p-2.5 rounded-xl border border-border">{getIcon(group.type)}</div>
                  <div>
                    <h3 className="font-bold text-zinc-900 text-lg">{group.name_ar || group.name_en || group.name_fr}</h3>
                    <span className="text-xs font-bold text-zinc-400 flex items-center gap-2">{getTypeLabel(group.type)} {group.is_global && <span className="text-[10px] uppercase tracking-wide text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Global · Read only</span>}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button disabled={group.is_global} title={group.is_global ? "Global modifiers are managed by the platform" : "Edit"} onClick={() => handleEdit(group)} className="text-blue-500 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors disabled:opacity-35 disabled:cursor-not-allowed"><Edit2 size={16} /></button>
                  <button disabled={group.is_global} title={group.is_global ? "Global modifiers are managed by the platform" : "Delete"} onClick={() => handleDelete(group.id)} className="text-red-500 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors disabled:opacity-35 disabled:cursor-not-allowed"><Trash2 size={16} /></button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-100">
                {group.modifier_options?.map((opt: any) => (
                  <span key={opt.id} className="bg-zinc-100 text-zinc-600 text-xs font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1.5">
                    {opt.name_ar || opt.name_en || opt.name_fr}
                    {Number(opt.price_adjustment) > 0 && <span className="text-green-600">+{opt.price_adjustment}MAD</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* نافذة الإنشاء/التعديل */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-zinc-50 shrink-0 rounded-t-3xl">
              <h3 className="text-xl font-black">{editingGroupId ? (activeLang === 'ar' ? 'تعديل الإضافة' : 'Edit Modifier') : (activeLang === 'ar' ? 'إنشاء إضافة جديدة' : 'Create New Modifier')}</h3>
              <button onClick={resetForm} className="text-zinc-400 hover:text-red-500 bg-white p-2 rounded-full border shadow-sm"><X size={20} /></button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* بيانات المجموعة */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">{activeLang === 'ar' ? 'الاسم (عربي)' : 'Name (AR)'}</label>
                  <input value={nameAr} onChange={e => setNameAr(e.target.value)} className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">{activeLang === 'ar' ? 'الاسم (EN)' : 'Name (EN)'}</label>
                  <input value={nameEn} onChange={e => setNameEn(e.target.value)} className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 outline-none" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">{activeLang === 'ar' ? 'الاسم (FR)' : 'Name (FR)'}</label>
                  <input value={nameFr} onChange={e => setNameFr(e.target.value)} className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 outline-none" dir="ltr" />
                </div>
              </div>

              {/* سلوك المجموعة */}
              <div className="bg-muted p-5 rounded-2xl border space-y-4">
                <label className="text-sm font-bold flex items-center gap-2"><Settings2 size={18}/> {activeLang === 'ar' ? 'المنطق والسلوك' : 'Logic & Behavior'}</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500">{activeLang === 'ar' ? 'النوع (الشكل)' : 'Type'}</label>
                    <select value={type} onChange={e => setType(e.target.value as ModifierType)} className="w-full border rounded-xl p-3 bg-white outline-none">
                      <option value="single_choice">{activeLang === 'ar' ? 'اختيار فردي (Radio)' : 'Single Choice (Radio)'}</option>
                      <option value="multiple_choice">{activeLang === 'ar' ? 'اختيارات متعددة (Checkbox)' : 'Multiple Choice (Checkbox)'}</option>
                      <option value="incremental">{activeLang === 'ar' ? 'تزايدي (Stepper +/-)' : 'Incremental (Stepper)'}</option>
                      <option value="slider">{activeLang === 'ar' ? 'شريط مستويات (Slider)' : 'Slider'}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500">{activeLang === 'ar' ? 'الحد الأدنى للاختيار (0 = اختياري)' : 'Min Selections (0 = Optional)'}</label>
                    <input type="number" min="0" value={minSelections} onChange={e => setMinSelections(Number(e.target.value))} className="w-full border rounded-xl p-3 bg-white outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500">{activeLang === 'ar' ? 'الحد الأقصى' : 'Max Limit'}</label>
                    <input type="number" min="1" value={maxSelections} onChange={e => setMaxSelections(Number(e.target.value))} className="w-full border rounded-xl p-3 bg-white outline-none" />
                  </div>
                </div>
                {type === 'single_choice' && <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg font-bold">الخيار الفردي يجب أن يكون الحد الأدنى له 1 (إجباري) والحد الأقصى 1.</p>}
              </div>

              {/* خيارات المجموعة */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold">{activeLang === 'ar' ? 'الخيارات المتاحة (Options)' : 'Available Options'}</label>
                  <button type="button" onClick={handleAddOption} className="text-xs bg-zinc-900 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-zinc-800 flex items-center gap-1"><Plus size={14}/> {activeLang === 'ar' ? 'إضافة خيار' : 'Add Option'}</button>
                </div>
                
                {options.length === 0 ? (
                  <div className="border-2 border-dashed border-zinc-200 rounded-xl p-8 text-center text-zinc-400 text-sm font-bold">
                    {activeLang === 'ar' ? 'لا توجد خيارات مضافة.' : 'No options added.'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {options.map((opt, i) => (
                      <div key={i} className="flex flex-col md:flex-row gap-3 items-end bg-zinc-50 p-4 rounded-xl border border-zinc-200 shadow-sm">
                        
                        {/* حقول لغات الخيار */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 w-full">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-500">الاسم (AR)</label>
                            <input value={opt.name_ar} onChange={e => updateOption(i, 'name_ar', e.target.value)} className="w-full border p-2 text-sm rounded-lg outline-none focus:border-primary" placeholder="مثال: جبنة إضافية" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-500">Name (EN)</label>
                            <input value={opt.name_en} onChange={e => updateOption(i, 'name_en', e.target.value)} className="w-full border p-2 text-sm rounded-lg outline-none focus:border-primary" placeholder="e.g. Extra Cheese" dir="ltr" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-500">Nom (FR)</label>
                            <input value={opt.name_fr} onChange={e => updateOption(i, 'name_fr', e.target.value)} className="w-full border p-2 text-sm rounded-lg outline-none focus:border-primary" placeholder="ex. Supplément fromage" dir="ltr" />
                          </div>
                        </div>

                        {/* السعر وزر الحذف */}
                        <div className="flex items-end gap-2 w-full md:w-auto">
                          <div className="w-full sm:w-28 shrink-0 space-y-1">
                            <label className="text-[10px] font-bold text-zinc-500">السعر (+)</label>
                            <div className="relative">
                              <input type="number" step="0.5" min="0" value={opt.price_adjustment} onChange={e => updateOption(i, 'price_adjustment', Number(e.target.value))} className="w-full border p-2 pr-10 text-sm rounded-lg outline-none focus:border-primary" dir="ltr" />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400">MAD</span>
                            </div>
                          </div>
                          <button type="button" onClick={() => removeOption(i)} className="bg-red-50 text-red-500 p-2.5 rounded-lg hover:bg-red-100 transition-colors shrink-0 flex justify-center"><Trash2 size={18}/></button>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>
            
            <div className="p-4 border-t bg-zinc-50 shrink-0 rounded-b-3xl">
              <button onClick={handleSave} disabled={isSaving || options.length === 0} className="w-full bg-primary text-white py-3.5 rounded-xl font-bold hover:bg-primary/90 transition-transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
                {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Check size={20}/>}
                {activeLang === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
