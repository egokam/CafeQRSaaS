"use client";

import { useEffect, useState } from "react";
import { Check, Edit2, Globe2, Loader2, Plus, Settings2, Trash2, X } from "lucide-react";
import {
  deleteGlobalModifierGroup,
  getGlobalModifierGroups,
  saveGlobalModifierGroup,
} from "@/actions/saas";

type ModifierType = "single_choice" | "multiple_choice" | "incremental" | "slider";
type ModifierOption = {
  id?: string;
  name_ar: string;
  name_en: string;
  name_fr: string;
  price_adjustment: number;
};

const emptyOption = (): ModifierOption => ({
  name_ar: "",
  name_en: "",
  name_fr: "",
  price_adjustment: 0,
});

export default function GlobalModifiersTab({ onClose }: { onClose?: () => void }) {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameFr, setNameFr] = useState("");
  const [type, setType] = useState<ModifierType>("single_choice");
  const [minSelections, setMinSelections] = useState(0);
  const [maxSelections, setMaxSelections] = useState(1);
  const [options, setOptions] = useState<ModifierOption[]>([]);

  const loadGroups = async () => {
    setLoading(true);
    const result = await getGlobalModifierGroups();
    if (result.success) setGroups(result.groups);
    else alert(result.error || "Unable to load global modifiers.");
    setLoading(false);
  };

  useEffect(() => {
    void loadGroups();
  }, []);

  const resetEditor = () => {
    setEditingId(null);
    setNameAr("");
    setNameEn("");
    setNameFr("");
    setType("single_choice");
    setMinSelections(0);
    setMaxSelections(1);
    setOptions([]);
    setShowEditor(false);
  };

  const editGroup = (group: any) => {
    setEditingId(group.id);
    setNameAr(group.name_ar || "");
    setNameEn(group.name_en || "");
    setNameFr(group.name_fr || "");
    setType(group.type || "single_choice");
    setMinSelections(Number(group.min_selections || 0));
    setMaxSelections(Number(group.max_selections || 1));
    setOptions((group.modifier_options || []).map((option: any) => ({
      id: option.id,
      name_ar: option.name_ar || "",
      name_en: option.name_en || "",
      name_fr: option.name_fr || "",
      price_adjustment: Number(option.price_adjustment || 0),
    })));
    setShowEditor(true);
  };

  const updateOption = (index: number, field: keyof ModifierOption, value: string | number) => {
    setOptions((previous) => previous.map((option, optionIndex) =>
      optionIndex === index ? { ...option, [field]: value } : option
    ));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!nameAr && !nameEn && !nameFr) return alert("Enter a modifier name in at least one language.");
    if (options.length === 0) return alert("Add at least one option.");
    if (minSelections < 0 || maxSelections < minSelections) return alert("Check the minimum and maximum selections.");

    setSaving(true);
    const result = await saveGlobalModifierGroup({
      id: editingId || undefined,
      name_ar: nameAr,
      name_en: nameEn,
      name_fr: nameFr,
      type,
      min_selections: minSelections,
      max_selections: maxSelections,
      options,
    });
    setSaving(false);
    if (!result.success) return alert(result.error || "Unable to save global modifier.");
    resetEditor();
    await loadGroups();
  };

  const removeGroup = async (id: string) => {
    if (!confirm("Delete this global modifier template? Linked products will no longer use it.")) return;
    const result = await deleteGlobalModifierGroup(id);
    if (!result.success) return alert(result.error || "Unable to delete global modifier.");
    await loadGroups();
  };

  return (
    <section className="bg-zinc-950 text-zinc-100 min-h-full p-5 sm:p-8" dir="ltr">
      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center mb-8">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-[0.18em] font-bold"><Globe2 size={15} /> Platform catalog</div>
          <h2 className="text-2xl sm:text-3xl text-white font-black mt-2">Global Modifiers</h2>
          <p className="text-sm text-zinc-400 mt-1">Shared templates that cafe admins may attach to their own products.</p>
        </div>
        <div className="flex gap-3">
          {onClose && <button onClick={onClose} className="px-4 py-3 rounded-xl border border-white/10 text-zinc-300 font-bold hover:bg-zinc-900">Back</button>}
          <button onClick={() => { resetEditor(); setShowEditor(true); }} className="px-5 py-3 rounded-xl bg-amber-400 text-zinc-950 font-black flex items-center justify-center gap-2 hover:bg-amber-300"><Plus size={18} /> New template</button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-amber-400" size={38} /></div>
      ) : groups.length === 0 ? (
        <div className="border border-dashed border-white/15 rounded-3xl p-16 text-center text-zinc-500"><Settings2 size={42} className="mx-auto mb-4" />No global modifiers yet.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {groups.map((group) => (
            <article key={group.id} className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5 shadow-xl">
              <div className="flex justify-between gap-4">
                <div>
                  <h3 className="font-black text-white text-lg">{group.name_en || group.name_ar || group.name_fr}</h3>
                  <p className="text-[11px] font-mono uppercase tracking-wide text-amber-400 mt-1">{String(group.type).replaceAll("_", " ")} · {group.min_selections}–{group.max_selections} selections</p>
                </div>
                <div className="flex h-fit gap-2">
                  <button onClick={() => editGroup(group)} title="Edit" className="p-2 rounded-lg bg-sky-400/10 text-sky-300 hover:bg-sky-400/20"><Edit2 size={16} /></button>
                  <button onClick={() => void removeGroup(group.id)} title="Delete" className="p-2 rounded-lg bg-rose-400/10 text-rose-300 hover:bg-rose-400/20"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-white/10">
                {(group.modifier_options || []).map((option: any) => <span key={option.id} className="px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-bold">{option.name_en || option.name_ar || option.name_fr}{Number(option.price_adjustment) > 0 && <b className="ml-1.5 text-emerald-400">+{option.price_adjustment} MAD</b>}</span>)}
              </div>
            </article>
          ))}
        </div>
      )}

      {showEditor && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex p-4 items-center justify-center">
          <form onSubmit={save} className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white text-zinc-900 shadow-2xl">
            <header className="sticky top-0 z-10 bg-zinc-50 p-5 sm:p-6 border-b flex justify-between items-center">
              <div><h3 className="font-black text-xl">{editingId ? "Edit global modifier" : "New global modifier"}</h3><p className="text-xs text-zinc-500 mt-1">This template will be read-only for cafe administrators.</p></div>
              <button type="button" onClick={resetEditor} className="p-2 rounded-full bg-white border text-zinc-500 hover:text-rose-500"><X size={20} /></button>
            </header>
            <div className="p-5 sm:p-6 space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: "Arabic", value: nameAr, setValue: setNameAr },
                  { label: "English", value: nameEn, setValue: setNameEn },
                  { label: "French", value: nameFr, setValue: setNameFr },
                ].map(({ label, value, setValue }) => <label key={label} className="text-sm font-bold">Name ({label})<input value={value} onChange={(event) => setValue(event.target.value)} className="mt-2 w-full rounded-xl border p-3 font-normal outline-none focus:border-amber-500" /></label>)}
              </div>
              <div className="grid sm:grid-cols-3 gap-4 rounded-2xl bg-zinc-50 border p-4">
                <label className="text-sm font-bold">Type<select value={type} onChange={(event) => setType(event.target.value as ModifierType)} className="mt-2 w-full rounded-xl border p-3 bg-white font-normal"><option value="single_choice">Single choice</option><option value="multiple_choice">Multiple choice</option><option value="incremental">Incremental</option><option value="slider">Slider</option></select></label>
                <label className="text-sm font-bold">Minimum<input type="number" min="0" max="50" value={minSelections} onChange={(event) => setMinSelections(Number(event.target.value))} className="mt-2 w-full rounded-xl border p-3 bg-white font-normal" /></label>
                <label className="text-sm font-bold">Maximum<input type="number" min="0" max="50" value={maxSelections} onChange={(event) => setMaxSelections(Number(event.target.value))} className="mt-2 w-full rounded-xl border p-3 bg-white font-normal" /></label>
              </div>
              <div>
                <div className="flex justify-between items-center mb-3"><h4 className="font-black">Options</h4><button type="button" onClick={() => setOptions((previous) => [...previous, emptyOption()])} className="rounded-lg px-3 py-2 bg-zinc-900 text-white text-xs font-bold flex gap-1.5 items-center"><Plus size={14} /> Add option</button></div>
                <div className="space-y-3">
                  {options.map((option, index) => <div key={option.id || index} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_130px_42px] gap-2 rounded-xl border bg-zinc-50 p-3 items-end">
                    <label className="text-[10px] font-bold text-zinc-500">AR<input value={option.name_ar} onChange={(event) => updateOption(index, "name_ar", event.target.value)} className="mt-1 w-full rounded-lg border p-2 text-sm text-zinc-900" /></label>
                    <label className="text-[10px] font-bold text-zinc-500">EN<input value={option.name_en} onChange={(event) => updateOption(index, "name_en", event.target.value)} className="mt-1 w-full rounded-lg border p-2 text-sm text-zinc-900" /></label>
                    <label className="text-[10px] font-bold text-zinc-500">FR<input value={option.name_fr} onChange={(event) => updateOption(index, "name_fr", event.target.value)} className="mt-1 w-full rounded-lg border p-2 text-sm text-zinc-900" /></label>
                    <label className="text-[10px] font-bold text-zinc-500">+ MAD<input type="number" min="0" step="0.5" value={option.price_adjustment} onChange={(event) => updateOption(index, "price_adjustment", Number(event.target.value))} className="mt-1 w-full rounded-lg border p-2 text-sm text-zinc-900" /></label>
                    <button type="button" onClick={() => setOptions((previous) => previous.filter((_, optionIndex) => optionIndex !== index))} className="h-10 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100"><Trash2 size={16} className="mx-auto" /></button>
                  </div>)}
                </div>
              </div>
            </div>
            <footer className="sticky bottom-0 bg-zinc-50 p-5 border-t"><button disabled={saving || options.length === 0} className="w-full rounded-xl py-3.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-zinc-950 font-black flex justify-center gap-2">{saving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />} Save global template</button></footer>
          </form>
        </div>
      )}
    </section>
  );
}
