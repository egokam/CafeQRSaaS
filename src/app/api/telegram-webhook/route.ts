import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. معالجة الضغط على الأزرار (Callback Query)
    if (body.callback_query) {
      const callback = body.callback_query;
      const [action, receiptId] = callback.data.split("_");
      const chatId = callback.message.chat.id;

      const { data: receipt } = await supabase
        .from("payment_receipts")
        .select("cafe_id")
        .eq("id", receiptId)
        .single();

      if (!receipt) {
        return NextResponse.json({ error: "Receipt not found" });
      }

      const cafeId = receipt.cafe_id;

      if (action === "app") {
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
            text: `✅ تم تأكيد استلام المبلغ. الحساب نشط الآن بشكل دائم.`
          })
        });
      } 
      else if (action === "den") {
        // إرسال رسالة تطلب الرد المباشر (Force Reply) وتحتوي على الـ ID
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `الرجاء كتابة سبب الرفض بالرد المباشر (Reply) على هذه الرسالة.\n\nID: ${receiptId}`,
            reply_markup: { force_reply: true }
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

    // 2. معالجة الرد المباشر (الاستخراج التلقائي)
    if (body.message?.reply_to_message?.text) {
      const replyText = body.message.reply_to_message.text;
      
      // البحث عن UUID (معرف الإيصال) داخل الرسالة التي تم الرد عليها
      const uuidRegex = /([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/;
      const match = replyText.match(uuidRegex);

      if (match && match[1]) {
        const receiptId = match[1];
        const reason = body.message.text;

        const { data: receipt } = await supabase
          .from("payment_receipts")
          .select("cafe_id")
          .eq("id", receiptId)
          .single();

        if (receipt) {
          // تحديث حالة الإيصال
          await supabase.from("payment_receipts").update({
            status: "rejected",
            rejection_reason: reason
          }).eq("id", receiptId);

          // إيقاف الحساب
          await supabase.from("cafes").update({
            subscription_status: "paused"
          }).eq("id", receipt.cafe_id);

          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: body.message.chat.id,
              text: `❌ تم الرفض بنجاح وتوقف الحساب.\nالسبب المسجل: ${reason}`
            })
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}