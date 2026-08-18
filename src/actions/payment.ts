"use server";

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { randomUUID } from "crypto";
import { assertAdminCafeAccess } from "./auth"; // 🔒 استيراد قفل الأمان

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const RECEIPT_PLANS = new Set(["silver", "gold", "diamond"]);
const RECEIPT_CYCLES = new Set(["monthly", "yearly"]);
const RECEIPT_FILE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_RECEIPT_FILE_SIZE = 5 * 1024 * 1024;

type TelegramReceiptData = {
  receiptId: string;
  cafeId: string;
  cafeName: string;
  amount: number;
  receiptUrl: string;
  planId: string;
  billingCycle: string;
};

async function sendTelegramReceiptNotification(data: TelegramReceiptData) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    throw new Error("بيانات اعتماد Telegram مفقودة");
  }

  const currentDate = new Date().toLocaleString("en-GB", { 
    timeZone: "Africa/Casablanca",
    dateStyle: "medium",
    timeStyle: "short"
  });

  const cycleText = data.billingCycle === "yearly" ? "سنوي" : "شهري";

  const caption = `🚨 <b>طلب تفعيل جديد</b>\n\n` +
    `🏢 <b>المقهى:</b> ${data.cafeName}\n` +
    `📦 <b>الباقة:</b> ${data.planId.toUpperCase()} (${cycleText})\n` +
    `💰 <b>المبلغ:</b> ${data.amount} MAD\n` +
    `📅 <b>التاريخ:</b> ${currentDate}\n` +
    `🆔 <b>الإيصال:</b> <code>${data.receiptId}</code>\n\n` +
    `يرجى مراجعة الإيصال المرفق لاتخاذ القرار:`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "✅ قبول التفعيل", callback_data: `app_${data.receiptId}` },
        { text: "❌ رفض الطلب", callback_data: `den_${data.receiptId}` }
      ]
    ]
  };

  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      photo: data.receiptUrl,
      caption: caption,
      parse_mode: "HTML",
      reply_markup: keyboard
    })
  });

  if (!res.ok) {
    const errData = await res.text();
    throw new Error("فشل إرسال الإشعار إلى Telegram: " + errData);
  }
}

// Kept as a separately callable action for existing callers, but all new
// receipt submissions use submitPaymentReceipt below so the record and the
// notification are created from one authenticated server-side workflow.
export async function sendTelegramReceipt(data: TelegramReceiptData) {
  await assertAdminCafeAccess(data.cafeId);
  await sendTelegramReceiptNotification(data);
}

export async function getAdminBillingDetails(cafeId: string) {
  try {
    await assertAdminCafeAccess(cafeId);

    const [cafeResult, pendingResult, rejectedResult] = await Promise.all([
      supabaseAdmin
        .from("cafes")
        .select("plan_type, billing_cycle, subscription_status, subscription_ends_at")
        .eq("id", cafeId)
        .single(),
      supabaseAdmin
        .from("payment_receipts")
        .select("id, requested_plan, requested_cycle, status")
        .eq("cafe_id", cafeId)
        .in("status", ["pending", "under_review", "processing"])
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from("payment_receipts")
        .select("rejection_reason")
        .eq("cafe_id", cafeId)
        .eq("status", "rejected")
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (cafeResult.error || !cafeResult.data) throw cafeResult.error || new Error("CAFE_NOT_FOUND");
    if (pendingResult.error) throw pendingResult.error;
    if (rejectedResult.error) throw rejectedResult.error;

    return {
      success: true,
      cafe: cafeResult.data,
      pendingReceipt: pendingResult.data,
      rejectionReason: rejectedResult.data?.rejection_reason || null,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to load billing details";
    return { success: false, error: message };
  }
}

export async function submitPaymentReceipt(formData: FormData) {
  let uploadedObjectPath: string | null = null;

  try {
    const cafeId = String(formData.get("cafeId") || "");
    const requestedPlan = String(formData.get("requestedPlan") || "").toLowerCase();
    const requestedCycle = String(formData.get("requestedCycle") || "").toLowerCase();
    const fileEntry = formData.get("receipt");

    if (!cafeId || !RECEIPT_PLANS.has(requestedPlan) || !RECEIPT_CYCLES.has(requestedCycle)) {
      throw new Error("INVALID_RECEIPT_REQUEST");
    }
    if (!(fileEntry instanceof File) || fileEntry.size === 0) {
      throw new Error("RECEIPT_FILE_REQUIRED");
    }
    if (fileEntry.size > MAX_RECEIPT_FILE_SIZE || !RECEIPT_FILE_TYPES[fileEntry.type]) {
      throw new Error("INVALID_RECEIPT_FILE");
    }

    const cafe = await assertAdminCafeAccess(cafeId);
    const { data: existingReceipt, error: existingReceiptError } = await supabaseAdmin
      .from("payment_receipts")
      .select("id")
      .eq("cafe_id", cafeId)
      .in("status", ["pending", "under_review", "processing"])
      .limit(1)
      .maybeSingle();

    if (existingReceiptError) throw existingReceiptError;
    if (existingReceipt) throw new Error("PENDING_RECEIPT_EXISTS");

    const amountByPlan = {
      silver: { monthly: 249, yearly: 2490 },
      gold: { monthly: 399, yearly: 3990 },
      diamond: { monthly: 799, yearly: 7990 },
    } as const;
    const amount = amountByPlan[requestedPlan as keyof typeof amountByPlan][
      requestedCycle as "monthly" | "yearly"
    ];
    const extension = RECEIPT_FILE_TYPES[fileEntry.type];
    uploadedObjectPath = `${cafeId}/${randomUUID()}.${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("receipts")
      .upload(uploadedObjectPath, Buffer.from(await fileEntry.arrayBuffer()), {
        contentType: fileEntry.type,
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("receipts")
      .getPublicUrl(uploadedObjectPath);
    const receiptUrl = publicUrlData.publicUrl;

    const { data: receipt, error: receiptError } = await supabaseAdmin
      .from("payment_receipts")
      .insert({
        cafe_id: cafeId,
        amount,
        receipt_url: receiptUrl,
        bank_name: "CIH BANK",
        status: "pending",
        requested_plan: requestedPlan,
        requested_cycle: requestedCycle,
      })
      .select("id")
      .single();
    if (receiptError || !receipt) throw receiptError || new Error("RECEIPT_INSERT_FAILED");

    try {
      const { data: cafeDetails } = await supabaseAdmin
        .from("cafes")
        .select("name")
        .eq("id", cafe.id)
        .single();
      await sendTelegramReceiptNotification({
        receiptId: receipt.id,
        cafeId,
        cafeName: cafeDetails?.name || "Cafe",
        amount,
        receiptUrl,
        planId: requestedPlan,
        billingCycle: requestedCycle,
      });
    } catch (notificationError) {
      // The receipt exists safely even if Telegram is temporarily unavailable.
      console.error("Telegram receipt notification failed", notificationError);
    }

    return { success: true, receiptId: receipt.id };
  } catch (error: unknown) {
    if (uploadedObjectPath) {
      await supabaseAdmin.storage.from("receipts").remove([uploadedObjectPath]);
    }
    const message = error instanceof Error ? error.message : "Unable to submit receipt";
    return { success: false, error: message };
  }
}

export async function cancelPendingPaymentReceipt(cafeId: string, receiptId: string) {
  try {
    await assertAdminCafeAccess(cafeId);
    const { data, error } = await supabaseAdmin
      .from("payment_receipts")
      .update({ status: "canceled" })
      .eq("id", receiptId)
      .eq("cafe_id", cafeId)
      .in("status", ["pending", "under_review", "processing"])
      .select("id")
      .maybeSingle();

    if (error || !data) throw error || new Error("RECEIPT_CANNOT_BE_CANCELLED");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to cancel receipt";
    return { success: false, error: message };
  }
}

export async function getPaymentHistory(cafeId: string) {
  try {
    await assertAdminCafeAccess(cafeId); // 🔒 حماية: منع جلب سجلات مقهى آخر

    const { data, error } = await supabaseAdmin
      .from("payment_receipts")
      .select("*")
      .eq("cafe_id", cafeId)
      .order("uploaded_at", { ascending: false });

    if (error) throw error;
    
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error("Error fetching payment history:", error);
    return { success: false, data: [], error: error.message };
  }
}

export async function clearPaymentHistory(cafeId: string) {
  try {
    await assertAdminCafeAccess(cafeId); // 🔒 حماية: منع مسح سجلات مقهى آخر

    if (!process.env.RESEND_API) {
      throw new Error("مفتاح RESEND_API مفقود");
    }

    const resend = new Resend(process.env.RESEND_API);

    const { data: cafeData, error: cafeError } = await supabaseAdmin
      .from("cafes")
      .select("name, owner_email")
      .eq("id", cafeId)
      .single();

    if (cafeError || !cafeData) throw new Error("المقهى غير موجود");

    const { data: receipts, error: receiptsError } = await supabaseAdmin
      .from("payment_receipts")
      .select("*")
      .eq("cafe_id", cafeId)
      .order("uploaded_at", { ascending: true });

    if (receiptsError) throw new Error("فشل جلب الإيصالات");
    if (!receipts || receipts.length === 0) return { success: true, message: "لا توجد سجلات لمسحها" };

    let htmlContent = `
      <div dir="rtl" style="font-family: system-ui, -apple-system, sans-serif; color: #18181b; max-width: 800px; margin: 0 auto;">
        <h2 style="border-bottom: 2px solid #e4e4e7; padding-bottom: 10px; color: #09090b;">تقرير سجل المدفوعات السنوي للمقهى: <span style="color: #3b82f6;">${cafeData.name}</span></h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; text-align: right;">
          <thead>
            <tr style="background-color: #f4f4f5; color: #52525b;">
              <th style="padding: 12px; border: 1px solid #e4e4e7;">#</th>
              <th style="padding: 12px; border: 1px solid #e4e4e7;">التاريخ</th>
              <th style="padding: 12px; border: 1px solid #e4e4e7;">الباقة</th>
              <th style="padding: 12px; border: 1px solid #e4e4e7;">الدورة</th>
              <th style="padding: 12px; border: 1px solid #e4e4e7;">المبلغ</th>
              <th style="padding: 12px; border: 1px solid #e4e4e7;">الحالة</th>
              <th style="padding: 12px; border: 1px solid #e4e4e7;">الإيصال</th>
            </tr>
          </thead>
          <tbody>
    `;

    receipts.forEach((r, index) => {
      const dateStr = new Date(r.uploaded_at).toLocaleString('en-GB', { timeZone: "Africa/Casablanca" });
      const statusColor = r.status === 'paid' ? 'color: #16a34a;' : r.status === 'rejected' ? 'color: #e11d48;' : 'color: #d97706;';
      const cycleStr = r.requested_cycle === 'yearly' ? 'سنوي' : 'شهري';
      
      htmlContent += `
        <tr>
          <td style="padding: 12px; border: 1px solid #e4e4e7;">${index + 1}</td>
          <td style="padding: 12px; border: 1px solid #e4e4e7;" dir="ltr">${dateStr}</td>
          <td style="padding: 12px; border: 1px solid #e4e4e7; text-transform: uppercase;">${r.requested_plan}</td>
          <td style="padding: 12px; border: 1px solid #e4e4e7;">${cycleStr}</td>
          <td style="padding: 12px; border: 1px solid #e4e4e7; font-weight: bold;" dir="ltr">${r.amount} MAD</td>
          <td style="padding: 12px; border: 1px solid #e4e4e7; font-weight: bold; ${statusColor}">${r.status}</td>
          <td style="padding: 12px; border: 1px solid #e4e4e7; text-align: center;">
            ${r.receipt_url ? `<a href="${r.receipt_url}" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 12px;">عرض الرابط</a>` : '-'}
          </td>
        </tr>
      `;
    });

    htmlContent += `
          </tbody>
        </table>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e4e4e7; font-size: 12px; color: #71717a;">
          <p>تم مسح هذا السجل من قاعدة البيانات بشكل نهائي بتاريخ: <span dir="ltr">${new Date().toLocaleString('en-GB', { timeZone: "Africa/Casablanca" })}</span></p>
        </div>
      </div>
    `;

    const { error: emailError } = await resend.emails.send({
      from: "CafeQR System <admin@cafeqr.egokam.site>",
      to: ["contact@egokam.site", cafeData.owner_email],
      subject: `تقرير سجل المدفوعات السنوي - ${cafeData.name}`,
      html: htmlContent,
    });

    if (emailError) {
      throw new Error("فشل إرسال البريد الإلكتروني عبر Resend API: " + emailError.message);
    }

    const { error: deleteError } = await supabaseAdmin
      .from("payment_receipts")
      .delete()
      .eq("cafe_id", cafeId);

    if (deleteError) throw new Error("فشل مسح السجلات من قاعدة البيانات");

    return { success: true };
  } catch (error: any) {
    console.error("Clear history error:", error);
    return { success: false, error: error.message };
  }
}
