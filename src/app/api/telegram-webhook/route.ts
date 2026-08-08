import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. معالجة الضغط على الأزرار التفاعلية
    if (body.callback_query) {
      const callback = body.callback_query;
      const [action, receiptId, cafeId] = callback.data.split("_");
      const chatId = callback.message.chat.id;

      if (action === "approve") {
        // حساب تاريخ انتهاء جديد (سنة واحدة افتراضياً)
        const newEndDate = new Date();
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);

        await supabase.from("payment_receipts").update({ status: "paid" }).eq("id", receiptId);
        await supabase.from("cafes").update({
          subscription_status: "active",
          subscription_ends_at: newEndDate.toISOString()
        }).eq("id", cafeId);

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `✅ تم تأكيد استلام المبلغ. الحساب الخاص بالمقهى (${cafeId}) نشط الآن بشكل دائم.`
          })
        });
      } 
      else if (action === "deny") {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `لتحديد سبب الرفض وإيقاف المقهى، انسخ النص التالي واكتب السبب في نهايته:\n\nreason_${receiptId}_${cafeId}_اكتب_السبب_هنا`
          })
        });
      }
      
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callback.id })
      });

      return NextResponse.json({ ok: true });
    }

    // 2. معالجة نص سبب الرفض
    if (body.message?.text?.startsWith("reason_")) {
      const parts = body.message.text.split("_");
      const receiptId = parts[1];
      const cafeId = parts[2];
      const reason = parts.slice(3).join("_");

      await supabase.from("payment_receipts").update({
        status: "rejected",
        rejection_reason: reason
      }).eq("id", receiptId);

      await supabase.from("cafes").update({
        subscription_status: "paused"
      }).eq("id", cafeId);

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: body.message.chat.id,
          text: `❌ تم الرفض بنجاح وتوقف حساب المقهى.\nالسبب المسجل: ${reason}`
        })
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}