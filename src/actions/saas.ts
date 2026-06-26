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
export async function submitBankTransferReceipt(cafeId: string, receiptUrl: string, amount: number) {
  try {
    const { error: receiptError } = await supabaseAdmin
      .from('payment_receipts')
      .insert([{ 
        cafe_id: cafeId, 
        receipt_url: receiptUrl, 
        amount: Number(amount), 
        status: 'pending' 
      }]);

    if (receiptError) throw receiptError;

    const { error: cafeError } = await supabaseAdmin
      .from('cafes')
      .update({ subscription_status: 'pending_verification' })
      .eq('id', cafeId);

    if (cafeError) throw cafeError;

    return { success: true };
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