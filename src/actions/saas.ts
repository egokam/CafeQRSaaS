"use server";
import { createClient } from "@supabase/supabase-js";

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

// 2. استقبال الروسي البنكي
// 2. استقبال الروسي البنكي (مُحصّن ضد السبام والثغرات المجانية 🛡️)
export async function submitBankTransferReceipt(cafeId: string, receiptUrl: string, amount: number) {
  try {
    // جلب حالة المقهى أولاً للتحقق من حقه في الفرصة المؤقتة
    const { data: cafeData, error: fetchError } = await supabaseAdmin
      .from('cafes')
      .select('can_use_grace')
      .eq('id', cafeId)
      .single();

    if (fetchError || !cafeData) throw new Error("المقهى غير موجود");

    // 1. تسجيل الإيصال في قاعدة البيانات دائماً (لكي نمسك النصاب بالأدلة)
    const { error: receiptError } = await supabaseAdmin
      .from('payment_receipts')
      .insert([{ 
        cafe_id: cafeId, 
        receipt_url: receiptUrl, 
        amount: Number(amount), 
        status: 'pending' 
      }]);

    if (receiptError) throw receiptError;

    // 2. إذا كان لا يزال يملك حق الفرصة المؤقتة -> نفعل المنيو وننزع منه الفرصة!
    if (cafeData.can_use_grace === true) {
      const { error: cafeError } = await supabaseAdmin
        .from('cafes')
        .update({ 
          subscription_status: 'pending_verification',
          can_use_grace: false // 🔒 سحب الصلاحية فوراً!
        })
        .eq('id', cafeId);

      if (cafeError) throw cafeError;
      return { success: true, status: 'activated_temporary' };
    } 
    
    // 3. أما إذا كان النصّاب قد استنفد فرصته مسبقاً -> تم حفظ إيصاله لكن يبقى المنيو مجمداً!
    return { success: true, status: 'saved_without_activation' };

  } catch (error: any) {
    console.error("Payment Submission Error:", error);
    return { success: false, error: error.message };
  }
}

// 3. الدالة اللي كانت هاربة: جلب معلومات البنك من داتا بيز
export async function getPlatformBankDetails() {
  const { data, error } = await supabaseAdmin
    .from('platform_settings')
    .select('bank_name, rib, holder_name, support_whatsapp')
    .eq('id', 1)
    .single();

  if (error || !data) {
    return { bank_name: "CIH BANK", rib: "230330000000000000000000", holder_name: "KAMAL EGO-DEV" };
  }

  return data;
}

// جلب خريطة المنصة الشاملة للمدير الأكبر
export async function getUltimateDashboardData() {
  // 1. جلب المقاهي مع عدد منتجاتها وطلباتها الحالية
  const { data: cafes, error: cafesErr } = await supabaseAdmin
    .from('cafes')
    .select('*, products(count), orders(count)')
    .order('created_at', { ascending: false });

  // 2. جلب جميع الإيصالات التاريخية (معلقة، مقبولة، مرفوضة)
  const { data: receipts, error: receiptsErr } = await supabaseAdmin
    .from('payment_receipts')
    .select('*')
    .order('uploaded_at', { ascending: false });

  if (cafesErr || receiptsErr) {
    console.error("Dashboard Fetch Error:", cafesErr || receiptsErr);
    return { cafes: [], receipts: [], stats: { total: 0, active: 0, suspended: 0, mrr: 0 } };
  }

  // حساب الإحصائيات المالية والحيوية
  const activeCafes = cafes.filter(c => c.subscription_status === 'active').length;
  const suspendedCafes = cafes.filter(c => c.subscription_status === 'suspended').length;
  
  // حساب المداخيل الشهرية المتوقعة بناءً على باقة المقاهي النشطة
  const totalMRR = cafes.reduce((acc, c) => {
    if (c.subscription_status !== 'active') return acc;
    if (c.plan_type === 'starter') return acc + 150;
    if (c.plan_type === 'enterprise') return acc + 499;
    return acc + 299; // الباقة الافتراضية Pro
  }, 0);

  return {
    cafes,
    receipts,
    stats: { total: cafes.length, active: activeCafes, suspended: suspendedCafes, mrr: totalMRR }
  };
}

// دالة تعديل تاريخ الاشتراك أو الحالة يدوياً من الأرشيف
export async function forceUpdateCafeSub(cafeId: string, newStatus: string, newEndsAt: string) {
  const { error } = await supabaseAdmin
    .from('cafes')
    .update({ 
      subscription_status: newStatus, 
      subscription_ends_at: newEndsAt,
      can_use_grace: true // إعادة تفعيل الدرع احتياطاً
    })
    .eq('id', cafeId);

  return !error;
}