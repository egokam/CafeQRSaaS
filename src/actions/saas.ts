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
export async function getUltimateDashboardData(accessToken?: string) {
  if (!accessToken) throw new Error("SECURITY ALERT: ACCESS TOKEN MISSING!");

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
  const adminEmail = "elotmanikamal607@gmail.com"; 

  if (error || !user || user.email?.toLowerCase() !== adminEmail.toLowerCase()) {
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
    return { cafes: [], receipts: [], stats: { total: 0, active: 0, paused: 0, mrr: 0 } };
  }

  const cafeList = cafes || [];
  const activeCafes = cafeList.filter(c => c.subscription_status === 'active').length;
  const pausedCafes = cafeList.filter(c => c.subscription_status === 'paused').length;
  
  // 🌟 حساب الـ MRR بناءً على الأسعار الجديدة ودورة الدفع
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
export async function forceUpdateCafeSub(cafeId: string, status: string, endsAt: string, planType: string, billingCycle: string = 'monthly') {
  try {
    const isoDate = new Date(endsAt).toISOString();

    // 🌟 حساب القيود الديناميكية
    let maxC = 1, maxT = 30, maxM = 150, isWL = false;
    if (planType === 'gold') { maxC = 3; maxT = 100; maxM = 9999; }
    if (planType === 'diamond') { maxC = 9999; maxT = 9999; maxM = 9999; isWL = true; }

    const { error } = await supabaseAdmin
      .from('cafes')
      .update({
        subscription_status: status,
        subscription_ends_at: isoDate,
        plan_type: planType,
        billing_cycle: billingCycle,
        max_cashiers: maxC,
        max_tables: maxT,
        max_menu_items: maxM,
        is_white_label: isWL
      })
      .eq('id', cafeId);

    if (error) {
      console.error("Supabase Update Error:", error);
      return false;
    }

    revalidatePath('/ego-owner-9539');
    return true;
  } catch (err) {
    console.error("Force update catch error:", err);
    return false;
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
    
    // 🌟 حساب القيود الديناميكية
    let maxC = 1, maxT = 30, maxM = 150, isWL = false;
    if (payload.planType === 'gold') { maxC = 3; maxT = 100; maxM = 9999; }
    if (payload.planType === 'diamond') { maxC = 9999; maxT = 9999; maxM = 9999; isWL = true; }

    const { data: newCafe, error: dbErr } = await supabaseAdmin.from('cafes').insert([{
      name: payload.name,
      slug: cleanSlug,
      owner_email: payload.ownerEmail,
      owner_auth_id: authUser.user.id,
      admin_pin: payload.adminPin || "1234",
      cashier_pin: payload.cashierPin || "0000",
      plan_type: payload.planType,
      billing_cycle: payload.billingCycle,
      subscription_status: 'active',
      subscription_ends_at: endsAt,
      can_use_grace: true,
      max_cashiers: maxC,
      max_tables: maxT,
      max_menu_items: maxM,
      is_white_label: isWL,
      max_kitchens: payload.planType === 'diamond' ? 99 : 1
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