"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, Pencil, Plus, Power, Trash2, Users } from "lucide-react";
import {
  createEmployee,
  deleteEmployee,
  getCafeEmployees,
  type Employee,
  updateEmployee,
} from "../../actions/employees";

type EmployeesTabProps = {
  cafeId: string;
  activeLang: string;
};

const copy = (language: string) => {
  if (language === "ar") {
    return {
      title: "الموظفون والكاشير",
      subtitle: "لكل موظف حساب مستقل لتتبع الطلبات والورديات.",
      add: "إضافة موظف",
      edit: "تعديل الموظف",
      name: "الاسم",
      username: "اسم المستخدم",
      pin: "رمز PIN",
      pinHint: "4 إلى 12 رقمًا",
      newPinHint: "اتركه فارغًا للإبقاء على الرمز الحالي",
      save: "حفظ",
      cancel: "إلغاء",
      active: "نشط",
      inactive: "موقوف",
      deactivate: "إيقاف",
      activate: "تفعيل",
      delete: "حذف",
      noEmployees: "لم تتم إضافة موظفين بعد.",
      reload: "إعادة المحاولة",
      deleteConfirm: "هل تريد حذف هذا الموظف؟ ستبقى الطلبات السابقة محفوظة دون حذف.",
      loadError: "تعذر تحميل الموظفين",
    };
  }
  if (language === "fr") {
    return {
      title: "Employés & caissiers", subtitle: "Chaque employé utilise son propre PIN pour suivre les quarts.",
      add: "Ajouter un employé", edit: "Modifier l’employé", name: "Nom", username: "Identifiant",
      pin: "Code PIN", pinHint: "4 à 12 chiffres", newPinHint: "Laisser vide pour conserver le PIN",
      save: "Enregistrer", cancel: "Annuler", active: "Actif", inactive: "Désactivé",
      deactivate: "Désactiver", activate: "Activer", delete: "Supprimer", noEmployees: "Aucun employé pour le moment.",
      reload: "Réessayer", deleteConfirm: "Supprimer cet employé ? Les anciennes commandes seront conservées.",
      loadError: "Impossible de charger les employés",
    };
  }
  return {
    title: "Employees & Cashiers", subtitle: "Each employee uses a personal PIN so orders and shifts are traceable.",
    add: "Add employee", edit: "Edit employee", name: "Name", username: "Username", pin: "PIN",
    pinHint: "4–12 digits", newPinHint: "Leave blank to keep the current PIN", save: "Save", cancel: "Cancel",
    active: "Active", inactive: "Inactive", deactivate: "Deactivate", activate: "Activate", delete: "Delete",
    noEmployees: "No employees have been added yet.", reload: "Try again",
    deleteConfirm: "Delete this employee? Historical orders will be kept.", loadError: "Unable to load employees",
  };
};

export default function EmployeesTab({ cafeId, activeLang }: EmployeesTabProps) {
  const t = copy(activeLang);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");

  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getCafeEmployees(cafeId);
    if (result.success) setEmployees(result.employees);
    else setError(result.error || t.loadError);
    setIsLoading(false);
  }, [cafeId, t.loadError]);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  const resetForm = () => {
    setEditing(null);
    setName("");
    setUsername("");
    setPin("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    const result = editing
      ? await updateEmployee(cafeId, editing.id, { name, username, ...(pin ? { pin } : {}) })
      : await createEmployee(cafeId, { name, username, pin });
    setIsSaving(false);
    if (!result.success) {
      setError(result.error || "Unable to save employee");
      return;
    }
    resetForm();
    await loadEmployees();
  };

  const edit = (employee: Employee) => {
    setEditing(employee);
    setName(employee.name);
    setUsername(employee.username);
    setPin("");
    setError(null);
  };

  const changeActive = async (employee: Employee) => {
    setIsSaving(true);
    const result = await updateEmployee(cafeId, employee.id, { is_active: !employee.is_active });
    setIsSaving(false);
    if (!result.success) setError(result.error || "Unable to update employee");
    else await loadEmployees();
  };

  const remove = async (employee: Employee) => {
    if (!confirm(t.deleteConfirm)) return;
    setIsSaving(true);
    const result = await deleteEmployee(cafeId, employee.id);
    setIsSaving(false);
    if (!result.success) setError(result.error || "Unable to delete employee");
    else {
      if (editing?.id === employee.id) resetForm();
      await loadEmployees();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200" dir={activeLang === "ar" ? "rtl" : "ltr"}>
      <div className="bg-white border rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="text-primary" /> {t.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <button onClick={() => { resetForm(); setError(null); }} className="inline-flex items-center justify-center gap-2 py-3 px-4 bg-foreground text-white rounded-xl font-bold text-sm">
          <Plus size={17} /> {t.add}
        </button>
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 flex gap-3 text-sm">
          <AlertCircle className="shrink-0" size={19} /> <span>{error}</span>
        </div>
      )}

      <form onSubmit={submit} className="bg-white border rounded-3xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-[1fr_1fr_180px_auto] gap-3 items-end">
        <label className="text-sm font-bold space-y-1.5"><span>{t.name}</span><input required value={name} onChange={(e) => setName(e.target.value)} maxLength={100} className="block w-full p-3 rounded-xl border bg-muted/20" /></label>
        <label className="text-sm font-bold space-y-1.5"><span>{t.username}</span><input required value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} maxLength={50} autoCapitalize="none" className="block w-full p-3 rounded-xl border bg-muted/20" /></label>
        <label className="text-sm font-bold space-y-1.5"><span>{t.pin}</span><input required={!editing} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} inputMode="numeric" pattern="[0-9]{4,12}" minLength={pin ? 4 : undefined} maxLength={12} type="password" placeholder={editing ? t.newPinHint : t.pinHint} className="block w-full p-3 rounded-xl border bg-muted/20" /></label>
        <div className="flex gap-2">
          {editing && <button type="button" onClick={resetForm} disabled={isSaving} className="py-3 px-4 rounded-xl border font-bold text-sm">{t.cancel}</button>}
          <button disabled={isSaving} className="min-w-24 py-3 px-4 bg-primary text-white rounded-xl font-bold text-sm disabled:opacity-50">{isSaving ? <Loader2 size={17} className="animate-spin mx-auto" /> : t.save}</button>
        </div>
      </form>

      <div className="bg-white border rounded-3xl shadow-sm overflow-hidden">
        {isLoading ? <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" size={34} /></div> : employees.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground font-bold">{t.noEmployees}<button onClick={() => void loadEmployees()} className="block mx-auto mt-3 text-primary">{t.reload}</button></div>
        ) : (
          <div className="divide-y">
            {employees.map((employee) => (
              <div key={employee.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div><p className="font-bold">{employee.name}</p><p className="text-xs text-muted-foreground mt-1">@{employee.username}</p></div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${employee.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{employee.is_active ? t.active : t.inactive}</span>
                  <button onClick={() => edit(employee)} disabled={isSaving} title={t.edit} className="p-2.5 rounded-xl border hover:bg-muted disabled:opacity-50"><Pencil size={16} /></button>
                  <button onClick={() => void changeActive(employee)} disabled={isSaving} title={employee.is_active ? t.deactivate : t.activate} className="p-2.5 rounded-xl border hover:bg-muted disabled:opacity-50"><Power size={16} className={employee.is_active ? "text-amber-600" : "text-emerald-600"} /></button>
                  <button onClick={() => void remove(employee)} disabled={isSaving} title={t.delete} className="p-2.5 rounded-xl border text-rose-600 hover:bg-rose-50 disabled:opacity-50"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
