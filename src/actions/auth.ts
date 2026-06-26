"use server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// ====================================================================
// 1. محرك SUPABASE AUTH الرسمي (خاص بـ ملاك المقاهي / المدراء)
// ====================================================================

// تسجيل دخول المدير عبر الإيميل وكلمة المرور
export async function signInAdminWithEmail(email: string, password: string) {
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { success: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
  }

  // جلب بيانات المقهى المربوط بهذا الحساب
  const { data: cafeData, error: cafeErr } = await supabaseAdmin
    .from('cafes')
    .select('*')
    .eq('owner_email', email) // تأكد أن جدول cafes فيه عمود owner_email
    .single();

  if (cafeErr || !cafeData) {
    return { success: false, error: "لم يتم العثور على مقهى مرتبط بهذا الحساب" };
  }

  return { 
    success: true, 
    session: data.session, 
    user: data.user,
    cafe: cafeData 
  };
}

// إنشاء مقهى جديد أوتوماتيكياً (SaaS Self-Onboarding)
export async function signUpNewCafe(email: string, password: string, cafeName: string, cafeSlug: string) {
  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // تفعيل فوري لكي يدخل مباشرة
  });

  if (authErr || !authData.user) return { success: false, error: authErr?.message || "فشل إنشاء الحساب" };

  const { error: dbErr } = await supabaseAdmin.from('cafes').insert([{
    name: cafeName,
    slug: cafeSlug,
    owner_email: email,
    owner_auth_id: authData.user.id,
    plan_type: 'starter',
    subscription_status: 'pending_verification', // 24 ساعة تجربة مجانية
    max_cashiers: 1
  }]);

  if (dbErr) return { success: false, error: "فشل إعداد ملف المقهى في قاعدة البيانات" };

  return { success: true };
}

// دالة إرسال رابط استعادة كلمة المرور الرسمي
export async function sendRecoveryEmail(email: string) {
  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback?next=/admin/reset-password`,
  });
  return { success: !error, error: error?.message };
}

// ====================================================================
// 2. نظام التوافق الصارم (مخصص لـ الكاشير والمطبخ عبر PIN)
// ====================================================================

export async function verifyPin(cafeId: string, role: "admin" | "cashier", pin: string) {
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (role === "cashier") {
    const { data, error } = await supabaseAdmin
      .from('cafes')
      .select('cashier_pin, subscription_status')
      .eq('id', cafeId)
      .single();

    // 🔒 منع الكاشير من الدخول إذا كان المقهى مجمداً من طرفك
    if (error || !data || data.subscription_status === 'suspended') return false;
    return pin === data.cashier_pin;
  } 
  
  // fallback للتوافق المؤقت مع الواجهات القديمة للمدير
  const { data, error } = await supabaseAdmin
    .from('cafes')
    .select('admin_pin')
    .eq('id', cafeId)
    .single();

  if (error || !data) return false;
  return pin === data.admin_pin;
}

export async function verifyOtpAndUpdatePins(email: string, otp: string, cafeId: string, newAdminPin: string, newCashierPin: string) {
  const { error: otpError } = await supabaseAdmin.auth.verifyOtp({ email, token: otp, type: 'recovery' });
  if (otpError) return { success: false, error: "رمز التحقق غير صحيح أو منتهي الصلاحية" };

  const { error: updateError } = await supabaseAdmin.from('cafes').update({ admin_pin: newAdminPin, cashier_pin: newCashierPin }).eq('id', cafeId);
  if (updateError) return { success: false, error: "حدث خطأ أثناء تحديث الرموز" };
  
  return { success: true };
}

// دالة تحديث إعدادات المقهى الشاملة (الاسم، الرموز، والحد الأقصى للأجهزة)
export async function updateCafeSettings(cafeId: string, newName?: string, newAdminPin?: string, newCashierPin?: string, maxCashiers?: number, maxKitchens?: number) {
  const updates: any = {};
  if (newName) updates.name = newName;
  if (newAdminPin) updates.admin_pin = newAdminPin;
  if (newCashierPin) updates.cashier_pin = newCashierPin;
  if (maxCashiers !== undefined && !isNaN(maxCashiers)) updates.max_cashiers = Number(maxCashiers);
  if (maxKitchens !== undefined && !isNaN(maxKitchens)) updates.max_kitchens = Number(maxKitchens);

  if (Object.keys(updates).length === 0) return { success: true };

  const { error } = await supabaseAdmin.from('cafes').update(updates).eq('id', cafeId);
  return { success: !error };
}

// ====================================================================
// 3. عمليات المنيو والمنتجات 
// ====================================================================

export async function adminAddProduct(productData: any) {
  const { error } = await supabaseAdmin.from('products').insert([productData]);
  return { success: !error, error: error?.message };
}

export async function adminUpdateProduct(id: string, productData: any) {
  const { error } = await supabaseAdmin.from('products').update(productData).eq('id', id);
  return { success: !error, error: error?.message };
}

export async function adminDeleteProduct(id: string) {
  const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
  return { success: !error, error: error?.message };
}

// ====================================================================
// 4. عمليات الكاشير والمطبخ الحية
// ====================================================================

export async function cashierUpdateOrderStatus(orderId: string, status: string) {
  const { error } = await supabaseAdmin.from('orders').update({ status }).eq('id', orderId);
  return { success: !error, error: error?.message };
}

export async function cashierMarkOutOfStock(productId: string) {
  const { error } = await supabaseAdmin.from('products').update({ is_active: false }).eq('id', productId);
  return { success: !error, error: error?.message };
}

// ====================================================================
// عمليات الطاولات (الـ QR) عبر السيرفر الآمن
// ====================================================================
export async function adminCheckOrAddTable(cafeId: string, tableNumber: string) {
  try {
    // 1. فحص هل الطاولة موجودة أصلاً لتفادي التكرار
    const { data: existing } = await supabaseAdmin
      .from('tables')
      .select('id')
      .eq('cafe_id', cafeId)
      .eq('table_number', tableNumber)
      .single();

    if (existing) return { success: true };

    // 2. إذا لم تكن موجودة، نقوم بإضافتها بصلاحيات السيرفر (God Mode)
    const { error } = await supabaseAdmin
      .from('tables')
      .insert([{ cafe_id: cafeId, table_number: tableNumber }]);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error("Table Error:", err.message);
    return { success: false, error: err.message };
  }
}