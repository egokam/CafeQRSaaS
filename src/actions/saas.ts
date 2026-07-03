"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// 1. فحص حالة الاشتراك
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

  if (cafe.subscription_status === 'suspended') {
    return { isValid: false, status: 'suspended', cafeName: cafe.name };
  }

  if (now > endsAt && cafe.subscription_status !== 'pending_verification') {
    await supabaseAdmin
      .from('cafes')
      .update({ subscription_status: 'suspended' })
      .eq('id', cafe.id);

    return { isValid: false, status: 'expired', cafeName: cafe.name };
  }

  return { isValid: true, status: cafe.subscription_status, cafeName: cafe.name, cafeId: cafe.id };
}

// 2. استقبال الوصل البنكي
export async function submitBankTransferReceipt(cafeId: string, receiptUrl: string, amount: number) {
  try {
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
          subscription_status: 'pending_verification',
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
    return { bank_name: "CIH BANK", rib: "230041540854821102280094", holder_name: "KAMAL El Otmani" };
  }

  return data;
}

// 4. جلب خريطة المنصة الشاملة للمدير الأكبر
export async function getUltimateDashboardData(accessToken?: string) {
  if (!accessToken) {
    throw new Error("SECURITY ALERT: ACCESS TOKEN MISSING!");
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
  const adminEmail = process.env.SUPER_ADMIN_EMAIL;

  if (error || !user || user.email !== adminEmail) {
    throw new Error("SECURITY ALERT: UNAUTHORIZED ACCESS BLOCKED!");
  }

  const { data: cafes, error: cafesErr } = await supabaseAdmin
    .from('cafes')
    .select('*, products(count), orders(count)')
    .order('created_at', { ascending: false });

  const { data: receipts, error: receiptsErr } = await supabaseAdmin
    .from('payment_receipts')
    .select('*')
    .order('uploaded_at', { ascending: false });

  if (cafesErr || receiptsErr) {
    console.error("Dashboard Fetch Error:", cafesErr || receiptsErr);
    return { cafes: [], receipts: [], stats: { total: 0, active: 0, suspended: 0, mrr: 0 } };
  }

  const cafeList = cafes || [];
  const activeCafes = cafeList.filter(c => c.subscription_status === 'active').length;
  const suspendedCafes = cafeList.filter(c => c.subscription_status === 'suspended').length;
  
  const totalMRR = cafeList.reduce((acc, c) => {
    if (c.subscription_status !== 'active') return acc;
    if (c.plan_type === 'starter') return acc + 150;
    if (c.plan_type === 'enterprise') return acc + 499;
    return acc + 299; 
  }, 0);

  return {
    cafes: cafeList,
    receipts: receipts || [],
    stats: { total: cafeList.length, active: activeCafes, suspended: suspendedCafes, mrr: totalMRR }
  };
}

// 5. تعديل تاريخ الاشتراك يدوياً
export async function forceUpdateCafeSub(cafeId: string, newStatus: string, newEndsAt: string) {
  const { error } = await supabaseAdmin
    .from('cafes')
    .update({ 
      subscription_status: newStatus, 
      subscription_ends_at: newEndsAt,
      can_use_grace: true 
    })
    .eq('id', cafeId);

  revalidatePath('/ego-owner-9539');
  return !error;
}

// 6. معمل تفريخ المقاهي
export async function provisionNewCafe(payload: {
  name: string;
  slug: string;
  ownerEmail: string;
  ownerPassword?: string;
  planType: string;
  trialDays: number;
  adminPin: string;
  cashierPin: string;
}) {
  try {
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
    const maxC = payload.planType === 'enterprise' ? 10 : payload.planType === 'starter' ? 1 : 3;
    const maxK = payload.planType === 'enterprise' ? 5 : payload.planType === 'starter' ? 1 : 2;

    const { data: newCafe, error: dbErr } = await supabaseAdmin.from('cafes').insert([{
      name: payload.name,
      slug: cleanSlug,
      owner_email: payload.ownerEmail,
      owner_auth_id: authUser.user.id,
      admin_pin: payload.adminPin || "1234",
      cashier_pin: payload.cashierPin || "0000",
      plan_type: payload.planType,
      subscription_status: 'active',
      subscription_ends_at: endsAt,
      can_use_grace: true,
      max_cashiers: maxC,
      max_kitchens: maxK
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

// 7. تحديث حساب المالك (استراتيجية SWAP AND BURN 💣)
export async function updateCafeOwnerCredentials(cafeId: string, oldAuthUserId: string, newEmail?: string, newPassword?: string) {
  try {
    if (!newEmail || newEmail.trim() === '') throw new Error("البريد الإلكتروني مطلوب!");

    const cleanEmail = newEmail.trim();
    const cleanPassword = newPassword && newPassword.trim() !== '' ? newPassword.trim() : undefined;

    // 1. جلب الإيميل الحالي للمقهى لمعرفة هل تم تغييره أم لا
    const { data: currentCafe } = await supabaseAdmin.from('cafes').select('owner_email').eq('id', cafeId).single();

    // 2. إذا كان الإيميل هو نفسه، نحاول تحديث كلمة المرور فقط
    if (currentCafe?.owner_email === cleanEmail) {
      const updates: any = { email_confirm: true };
      if (cleanPassword) updates.password = cleanPassword;

      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(oldAuthUserId, updates);

      // إذا نجح التحديث، نخرج بسلام
      if (!updateErr) {
        revalidatePath('/ego-owner-9539');
        return { success: true };
      }

      // إذا كان الخطأ شيئاً آخر غير "User not found"، نرجع الخطأ (إذا كان User not found سننتقل للخطوة 3)
      if (!updateErr.message.includes("not found") && !updateErr.message.includes("not exist")) {
        throw updateErr;
      }
    }

    // 3. استراتيجية (SWAP AND BURN): الإيميل تغير أو الحساب مفقود (Ghost ID)
    const passToUse = cleanPassword || "EgoCafe2026!";

    // أ- (CREATE) إنشاء حساب جديد كلياً
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: passToUse,
      email_confirm: true
    });

    if (createError) throw new Error("فشل إنشاء الحساب الجديد: " + createError.message);

    const newAuthId = newUser.user.id;

    // ب- (LINK) ربط الحساب الجديد في جدول المقاهي
    const { error: dbError } = await supabaseAdmin
      .from('cafes')
      .update({ 
        owner_email: cleanEmail,
        owner_auth_id: newAuthId 
      })
      .eq('id', cafeId);

    if (dbError) {
      // Rollback: تدمير الحساب إذا فشل الربط
      await supabaseAdmin.auth.admin.deleteUser(newAuthId);
      throw new Error("فشل ربط الحساب بالمقهى: " + dbError.message);
    }

    // ج- (BURN) تدمير الحساب القديم بصمت لتنظيف النظام
    if (oldAuthUserId && oldAuthUserId !== newAuthId) {
      await supabaseAdmin.auth.admin.deleteUser(oldAuthUserId).catch(() => {
        // نتجاهل الخطأ لأن الحساب قد يكون محذوفاً مسبقاً
      });
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