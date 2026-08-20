"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { assertAdminCafeAccess, assertSuperAdminAccess } from "./auth"; // 🔒 استيراد قفل الملاك

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

type CafePlan = "starter" | "silver" | "gold" | "diamond";

type CafePlanLimits = {
  max_cashiers: number;
  max_tables: number;
  max_menu_items: number;
  is_white_label: boolean;
  max_kitchens: number;
};

type CafeUpdatePayload = Record<string, string | number | boolean>;
type ModifierType = "single_choice" | "multiple_choice" | "incremental" | "slider";
type GlobalModifierOptionInput = {
  id?: unknown;
  name_ar?: unknown;
  name_en?: unknown;
  name_fr?: unknown;
  price_adjustment?: unknown;
};
type GlobalModifierGroupInput = {
  id?: unknown;
  name_ar?: unknown;
  name_en?: unknown;
  name_fr?: unknown;
  type?: unknown;
  min_selections?: unknown;
  max_selections?: unknown;
  options?: unknown;
};

const MODIFIER_TYPES = new Set<ModifierType>([
  "single_choice",
  "multiple_choice",
  "incremental",
  "slider",
]);

const modifierText = (value: unknown, label: string) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.trim().length > 255) throw new Error(`Invalid ${label}`);
  return value.trim() || null;
};

function sanitizeGlobalModifier(input: GlobalModifierGroupInput) {
  if (typeof input.type !== "string" || !MODIFIER_TYPES.has(input.type as ModifierType)) {
    throw new Error("Invalid modifier type");
  }
  const min = Number(input.min_selections);
  const max = Number(input.max_selections);
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max < min || max > 50) {
    throw new Error("Invalid modifier selection limits");
  }
  if (!Array.isArray(input.options) || input.options.length === 0 || input.options.length > 100) {
    throw new Error("A modifier group needs between 1 and 100 options");
  }

  const name_ar = modifierText(input.name_ar, "modifier name_ar");
  const name_en = modifierText(input.name_en, "modifier name_en");
  const name_fr = modifierText(input.name_fr, "modifier name_fr");
  if (!name_ar && !name_en && !name_fr) throw new Error("Modifier group name is required");

  const options = input.options.map((rawOption) => {
    if (!rawOption || typeof rawOption !== "object") throw new Error("Invalid modifier option");
    const option = rawOption as GlobalModifierOptionInput;
    const price_adjustment = Number(option.price_adjustment ?? 0);
    if (!Number.isFinite(price_adjustment) || price_adjustment < 0) throw new Error("Invalid modifier option price");
    const optionNameAr = modifierText(option.name_ar, "option name_ar");
    const optionNameEn = modifierText(option.name_en, "option name_en");
    const optionNameFr = modifierText(option.name_fr, "option name_fr");
    if (!optionNameAr && !optionNameEn && !optionNameFr) throw new Error("Modifier option name is required");
    return { name_ar: optionNameAr, name_en: optionNameEn, name_fr: optionNameFr, price_adjustment };
  });

  return {
    name_ar,
    name_en,
    name_fr,
    type: input.type as ModifierType,
    min_selections: min,
    max_selections: max,
    options,
  };
}

type SupabaseLoggableError = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
  status?: number | string;
  stack?: string;
};

const PLAN_LIMITS: Record<CafePlan, CafePlanLimits> = {
  starter: { max_cashiers: 1, max_tables: 30, max_menu_items: 150, is_white_label: false, max_kitchens: 1 },
  silver: { max_cashiers: 1, max_tables: 30, max_menu_items: 150, is_white_label: false, max_kitchens: 1 },
  gold: { max_cashiers: 3, max_tables: 100, max_menu_items: 9999, is_white_label: false, max_kitchens: 1 },
  diamond: { max_cashiers: 9999, max_tables: 9999, max_menu_items: 9999, is_white_label: true, max_kitchens: 99 },
};

const CAFE_FORCE_UPDATE_COLUMNS =
  "id, slug, subscription_status, subscription_ends_at, plan_type, billing_cycle, max_cashiers, max_tables, max_menu_items, is_white_label, max_kitchens, latitude, longitude";

const CAFE_FORCE_UPDATE_PAYLOAD_COLUMNS = new Set([
  "subscription_status",
  "subscription_ends_at",
  "plan_type",
  "billing_cycle",
  "max_cashiers",
  "max_tables",
  "max_menu_items",
  "is_white_label",
  "max_kitchens",
  "latitude",
  "longitude",
]);

const CAFE_NUMERIC_COLUMNS = new Set([
  "max_cashiers",
  "max_tables",
  "max_menu_items",
  "max_kitchens",
  "latitude",
  "longitude",
]);

// The super-admin cookie is signed server-side and is separate from every
// Supabase/browser session, so another role cannot overwrite this access.
async function verifySuperAdmin() {
  await assertSuperAdminAccess();
}

const normalizeCafePlan = (plan: string): CafePlan => {
  const normalized = plan?.toLowerCase().trim() as CafePlan;
  return Object.prototype.hasOwnProperty.call(PLAN_LIMITS, normalized) ? normalized : "silver";
};

const getCafePlanLimits = (plan: string): CafePlanLimits => PLAN_LIMITS[normalizeCafePlan(plan)];

const logSupabaseError = (context: string, error: SupabaseLoggableError | null | undefined) => {
  console.error(context, {
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    status: error?.status,
  });
};

const parseOptionalCoordinate = (label: string, value?: string | null) => {
  if (!value || value.trim() === "") return undefined;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid ${label}: ${value}`);

  return parsed;
};

const normalizeComparableCafeValue = (key: string, value: unknown) => {
  if (value === undefined || value === null) return value;

  if (key === "subscription_ends_at") {
    const timestamp = new Date(String(value)).getTime();
    return Number.isNaN(timestamp) ? value : timestamp;
  }

  if (CAFE_NUMERIC_COLUMNS.has(key)) return Number(value);

  return value;
};

const findCafeUpdateMismatches = (updates: CafeUpdatePayload, row: Record<string, unknown>) =>
  Object.entries(updates).flatMap(([key, expected]) => {
    const actual = row?.[key];
    const normalizedExpected = normalizeComparableCafeValue(key, expected);
    const normalizedActual = normalizeComparableCafeValue(key, actual);

    return normalizedExpected === normalizedActual
      ? []
      : [{ column: key, expected, actual }];
  });

// 1. فحص حالة الاشتراك (متاحة للعموم لأنها للقراءة والتحديث التلقائي)
export async function checkCafeSubscription(cafeSlug: string) {
  const { data: cafe, error } = await supabaseAdmin
    .from('cafes')
    .select('id, name, subscription_status, subscription_ends_at')
    .eq('slug', cafeSlug)
    .single();

  if (error || !cafe) {
    return { isValid: false, status: 'not_found' };
  }

  const now = new Date();
  const endsAt = new Date(cafe.subscription_ends_at);

  if (cafe.subscription_status === 'paused') {
    return { isValid: false, status: 'paused', cafeName: cafe.name };
  }

  if (now > endsAt) {
    await supabaseAdmin
      .from('cafes')
      .update({ subscription_status: 'paused' })
      .eq('id', cafe.id);

    return { isValid: false, status: 'expired', cafeName: cafe.name };
  }

  return { isValid: true, status: cafe.subscription_status, cafeName: cafe.name, cafeId: cafe.id };
}

// 2. استقبال الوصل البنكي (يجب أن يقوم بها المالك فقط)
export async function submitBankTransferReceipt(cafeId: string, receiptUrl: string, amount: number) {
  try {
    await assertAdminCafeAccess(cafeId); // 🔒 حماية: فقط مالك المقهى يمكنه رفع إيصال لمقهاه

    const { data: cafeData, error: fetchError } = await supabaseAdmin
      .from('cafes')
      .select('can_use_grace')
      .eq('id', cafeId)
      .single();

    if (fetchError || !cafeData) throw new Error("المقهى غير موجود");

    const { error: receiptError } = await supabaseAdmin
      .from('payment_receipts')
      .insert([{ 
        cafe_id: cafeId, 
        receipt_url: receiptUrl, 
        amount: Number(amount), 
        status: 'pending' 
      }]);

    if (receiptError) throw receiptError;

    if (cafeData.can_use_grace === true) {
      const { error: cafeError } = await supabaseAdmin
        .from('cafes')
        .update({ 
          subscription_status: 'paused',
          can_use_grace: false 
        })
        .eq('id', cafeId);

      if (cafeError) throw cafeError;
      return { success: true, status: 'activated_temporary' };
    } 
    
    return { success: true, status: 'saved_without_activation' };

  } catch (error: any) {
    console.error("Payment Submission Error:", error);
    return { success: false, error: error.message };
  }
}

// 3. جلب معلومات البنك
export async function getPlatformBankDetails() {
  const { data, error } = await supabaseAdmin
    .from('platform_settings')
    .select('bank_name, rib, holder_name, support_whatsapp')
    .eq('id', 1)
    .single();

  if (error || !data) {
    return { bank_name: "CIH BANK", rib: "230041540854821102280094", holder_name: "KAMAL EL OTMANI" };
  }

  return data;
}

// 4. جلب خريطة المنصة الشاملة للمدير الأكبر
export async function getUltimateDashboardData() {
  await verifySuperAdmin(); // 🔒 حماية

  const { data: cafes, error: cafesErr } = await supabaseAdmin
    .from('cafes')
    .select('*, products(count), orders(count)')
    .order('created_at', { ascending: false });

  const { data: receipts, error: receiptsErr } = await supabaseAdmin
    .from('payment_receipts')
    .select('*')
    .order('uploaded_at', { ascending: false });

  if (cafesErr || receiptsErr) {
    return { cafes: [], receipts: [], stats: { total: 0, active: 0, paused: 0, mrr: 0 } };
  }

  const cafeList = cafes || [];
  const activeCafes = cafeList.filter(c => c.subscription_status === 'active').length;
  const pausedCafes = cafeList.filter(c => c.subscription_status === 'paused').length;
  
  const totalMRR = cafeList.reduce((acc, c) => {
    if (c.subscription_status !== 'active') return acc;
    let monthlyVal = 0;
    if (c.plan_type === 'silver') monthlyVal = c.billing_cycle === 'yearly' ? (2490 / 12) : 249;
    if (c.plan_type === 'gold') monthlyVal = c.billing_cycle === 'yearly' ? (3990 / 12) : 399;
    if (c.plan_type === 'diamond') monthlyVal = c.billing_cycle === 'yearly' ? (7990 / 12) : 799;
    return acc + monthlyVal; 
  }, 0);

  return {
    cafes: cafeList,
    receipts: receipts || [],
    stats: { total: cafeList.length, active: activeCafes, paused: pausedCafes, mrr: Math.round(totalMRR) } 
  };
}

// 5. تعديل تاريخ الاشتراك يدوياً
export async function forceUpdateCafeSub(
  cafeId: string,
  newStatus: string,
  isoDate: string,
  newPlan: string,
  newCycle: string,
  latitude?: string | null,
  longitude?: string | null,
) {
  try {
    await verifySuperAdmin(); // 🔒 حماية

    const normalizedPlan = normalizeCafePlan(newPlan);
    const planLimits = getCafePlanLimits(normalizedPlan);
    const updates: CafeUpdatePayload = {
      subscription_status: newStatus,
      subscription_ends_at: isoDate,
      plan_type: normalizedPlan,
      billing_cycle: newCycle,
      ...planLimits,
    };

    const parsedLatitude = parseOptionalCoordinate("latitude", latitude);
    const parsedLongitude = parseOptionalCoordinate("longitude", longitude);
    if (parsedLatitude !== undefined) updates.latitude = parsedLatitude;
    if (parsedLongitude !== undefined) updates.longitude = parsedLongitude;

    const unknownPayloadColumns = Object.keys(updates).filter(
      (column) => !CAFE_FORCE_UPDATE_PAYLOAD_COLUMNS.has(column)
    );
    const missingLimitColumns = ["max_cashiers", "max_tables", "max_menu_items"].filter(
      (column) => !(column in updates)
    );

    if (unknownPayloadColumns.length > 0 || missingLimitColumns.length > 0) {
      console.error("[forceUpdateCafeSub] Payload/schema mismatch before Supabase update", {
        cafeId,
        unknownPayloadColumns,
        missingLimitColumns,
        payloadKeys: Object.keys(updates),
      });
    }

    const { data: existingCafe, error: preflightError } = await supabaseAdmin
      .from("cafes")
      .select(CAFE_FORCE_UPDATE_COLUMNS)
      .eq("id", cafeId)
      .maybeSingle();

    if (preflightError) {
      logSupabaseError("[forceUpdateCafeSub] Preflight cafe lookup failed", preflightError);
      return { success: false, error: preflightError.message, code: preflightError.code };
    }

    if (!existingCafe) {
      return { success: false, error: "Cafe not found or inaccessible" };
    }

    const { data: updatedCafe, error, count, status, statusText } = await supabaseAdmin
      .from("cafes")
      .update(updates, { count: "exact" })
      .eq("id", cafeId)
      .select(CAFE_FORCE_UPDATE_COLUMNS)
      .maybeSingle();

    if (error) {
      logSupabaseError("[forceUpdateCafeSub] Supabase cafes.update failed", error);
      return { success: false, error: error.message, code: error.code };
    }

    if (count === 0 || !updatedCafe) {
      return { success: false, error: "Cafe update affected zero rows" };
    }

    const mismatches = findCafeUpdateMismatches(updates, updatedCafe);
    if (mismatches.length > 0) {
      return { success: false, error: "Cafe update verification mismatch" };
    }

    revalidatePath('/ego-owner-9539');
    if (updatedCafe.slug) revalidatePath(`/${updatedCafe.slug}/admin`);

    return { success: true, cafe: updatedCafe };
  } catch (error: unknown) {
    const exception = error as SupabaseLoggableError;
    return { success: false, error: exception?.message || "Force update failed", code: exception?.code };
  }
}

// 6. معمل تفريخ المقاهي
export async function provisionNewCafe(payload: {
  name: string;
  slug: string;
  ownerEmail: string;
  ownerPassword?: string;
  planType: string;
  billingCycle: string;
  trialDays: number;
  adminPin: string;
  cashierPin: string;
}) {
  try {
    await verifySuperAdmin(); // 🔒 حماية

    const cleanSlug = payload.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    const pass = payload.ownerPassword || "CafeSaaS2026!";

    const { data: existing } = await supabaseAdmin.from('cafes').select('id').eq('slug', cleanSlug).single();
    if (existing) return { success: false, error: `الرابط المختصر "${cleanSlug}" محجوز مسبقاً!` };

    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: payload.ownerEmail,
      password: pass,
      email_confirm: true 
    });

    if (authErr || !authUser.user) return { success: false, error: "فشل إنشاء حساب المالك: " + authErr?.message };

    const endsAt = new Date(Date.now() + payload.trialDays * 24 * 60 * 60 * 1000).toISOString();
    
    const planType = normalizeCafePlan(payload.planType);
    const planLimits = getCafePlanLimits(planType);

    const { data: newCafe, error: dbErr } = await supabaseAdmin.from('cafes').insert([{
      name: payload.name,
      slug: cleanSlug,
      owner_email: payload.ownerEmail,
      owner_auth_id: authUser.user.id,
      admin_pin: payload.adminPin || "1234",
      cashier_pin: payload.cashierPin || "0000",
      plan_type: planType,
      billing_cycle: payload.billingCycle,
      subscription_status: 'active',
      subscription_ends_at: endsAt,
      can_use_grace: true,
      max_cashiers: planLimits.max_cashiers,
      max_tables: planLimits.max_tables,
      max_menu_items: planLimits.max_menu_items,
      is_white_label: planLimits.is_white_label,
      max_kitchens: planLimits.max_kitchens
    }]).select().single();

    if (dbErr || !newCafe) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id); 
      return { success: false, error: "خطأ في قاعدة البيانات: " + dbErr?.message };
    }

    revalidatePath('/ego-owner-9539');
    return { 
      success: true, 
      cafe: newCafe, 
      credentials: { email: payload.ownerEmail, password: pass, cashierPin: payload.cashierPin || "0000" } 
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 7. تحديث حساب المالك
export async function updateCafeOwnerCredentials(cafeId: string, oldAuthUserId: string, newEmail?: string, newPassword?: string) {
  try {
    await verifySuperAdmin(); // 🔒 حماية

    if (!newEmail || newEmail.trim() === '') throw new Error("البريد الإلكتروني مطلوب!");

    const cleanEmail = newEmail.trim();
    const cleanPassword = newPassword && newPassword.trim() !== '' ? newPassword.trim() : undefined;

    const { data: currentCafe } = await supabaseAdmin.from('cafes').select('owner_email').eq('id', cafeId).single();

    if (currentCafe?.owner_email === cleanEmail) {
      const updates: any = { email_confirm: true };
      if (cleanPassword) updates.password = cleanPassword;

      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(oldAuthUserId, updates);

      if (!updateErr) {
        revalidatePath('/ego-owner-9539');
        return { success: true };
      }

      if (!updateErr.message.includes("not found") && !updateErr.message.includes("not exist")) {
        throw updateErr;
      }
    }

    const passToUse = cleanPassword || "EgoCafe2026!";

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: passToUse,
      email_confirm: true
    });

    if (createError) throw new Error("فشل إنشاء الحساب الجديد: " + createError.message);

    const newAuthId = newUser.user.id;

    const { error: dbError } = await supabaseAdmin
      .from('cafes')
      .update({ 
        owner_email: cleanEmail,
        owner_auth_id: newAuthId 
      })
      .eq('id', cafeId);

    if (dbError) {
      await supabaseAdmin.auth.admin.deleteUser(newAuthId);
      throw new Error("فشل ربط الحساب بالمقهى: " + dbError.message);
    }

    if (oldAuthUserId && oldAuthUserId !== newAuthId) {
      await supabaseAdmin.auth.admin.deleteUser(oldAuthUserId).catch(() => {});
    }

    revalidatePath('/ego-owner-9539');
    return { success: true };

  } catch (error: any) {
    console.error("Auth Swap Error:", error);
    return { success: false, error: error.message };
  }
}

// 8. الإعدام النهائي
export async function deleteCafeCompletely(cafeId: string, authUserId: string) {
  try {
    await verifySuperAdmin(); // 🔒 حماية

    await supabaseAdmin.from('payment_receipts').delete().eq('cafe_id', cafeId);
    await supabaseAdmin.from('orders').delete().eq('cafe_id', cafeId);
    await supabaseAdmin.from('tables').delete().eq('cafe_id', cafeId);
    await supabaseAdmin.from('products').delete().eq('cafe_id', cafeId);
    
    const { error: cafeErr } = await supabaseAdmin.from('cafes').delete().eq('id', cafeId);
    if (cafeErr) throw cafeErr;

    if (authUserId) {
      const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
      if (authErr) console.error("Auth Delete Error:", authErr); 
    }

    revalidatePath('/ego-owner-9539');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/** Platform-owned modifier templates. These deliberately use cafe_id NULL and
 * are only reachable after checking the independent super-admin session. */
export async function getGlobalModifierGroups() {
  try {
    await verifySuperAdmin();
    const { data, error } = await supabaseAdmin
      .from("modifier_groups")
      .select("*, modifier_options(*)")
      .eq("is_global", true)
      .is("cafe_id", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { success: true, groups: data || [] };
  } catch (error: unknown) {
    return { success: false, groups: [], error: error instanceof Error ? error.message : "Unable to load global modifiers" };
  }
}

export async function saveGlobalModifierGroup(input: GlobalModifierGroupInput) {
  try {
    await verifySuperAdmin();
    const { options, ...groupData } = sanitizeGlobalModifier(input);
    const groupId = typeof input.id === "string" ? input.id : undefined;
    let savedGroupId = groupId;

    if (savedGroupId) {
      const { data: existing, error: existingError } = await supabaseAdmin
        .from("modifier_groups")
        .select("id")
        .eq("id", savedGroupId)
        .eq("is_global", true)
        .is("cafe_id", null)
        .maybeSingle();
      if (existingError || !existing) throw new Error("Global modifier group not found");

      const { error } = await supabaseAdmin
        .from("modifier_groups")
        .update({ ...groupData, is_global: true, cafe_id: null })
        .eq("id", savedGroupId)
        .eq("is_global", true)
        .is("cafe_id", null);
      if (error) throw error;
    } else {
      const { data, error } = await supabaseAdmin
        .from("modifier_groups")
        .insert({ ...groupData, is_global: true, cafe_id: null })
        .select("id")
        .single();
      if (error || !data) throw error || new Error("Unable to create global modifier group");
      savedGroupId = data.id;
    }

    const { error: deleteOptionsError } = await supabaseAdmin
      .from("modifier_options")
      .delete()
      .eq("modifier_group_id", savedGroupId);
    if (deleteOptionsError) throw deleteOptionsError;

    const { error: insertOptionsError } = await supabaseAdmin
      .from("modifier_options")
      .insert(options.map((option) => ({ ...option, modifier_group_id: savedGroupId, is_global: true })));
    if (insertOptionsError) throw insertOptionsError;

    revalidatePath("/ego-owner-9539");
    return { success: true, groupId: savedGroupId };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Unable to save global modifier" };
  }
}

export async function deleteGlobalModifierGroup(groupId: string) {
  try {
    await verifySuperAdmin();
    if (typeof groupId !== "string" || groupId.length === 0) throw new Error("Invalid modifier group id");
    const { data, error } = await supabaseAdmin
      .from("modifier_groups")
      .delete()
      .eq("id", groupId)
      .eq("is_global", true)
      .is("cafe_id", null)
      .select("id")
      .maybeSingle();
    if (error || !data) throw error || new Error("Global modifier group not found");
    revalidatePath("/ego-owner-9539");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Unable to delete global modifier" };
  }
}
