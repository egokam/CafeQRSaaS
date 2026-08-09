import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. معالجة الأزرار التفاعلية (قبول أو رفض أولي)
    if (body.callback_query) {
      const callback = body.callback_query;
      const [action, receiptId] = callback.data.split("_");
      const chatId = callback.message.chat.id;

      const { data: receipt } = await supabase
        .from("payment_receipts")
        .select("cafe_id, requested_plan, requested_cycle")
        .eq("id", receiptId)
        .single();

      if (!receipt) return NextResponse.json({ error: "Receipt not found" });

      const cafeId = receipt.cafe_id;

      if (action === "app") {
        // 🌟 منطق القبول (تراكمي إذا كان الحساب نشطاً)
        const { data: cafe } = await supabase
          .from("cafes")
          .select("subscription_status, subscription_ends_at")
          .eq("id", cafeId)
          .single();

        let baseDate = new Date();
        // إذا كان الحساب نشطاً وما زال به أيام، نبدأ الإضافة من نهاية المدة السابقة
        if (cafe?.subscription_status === 'active' && cafe?.subscription_ends_at) {
          const currentEndsAt = new Date(cafe.subscription_ends_at);
          if (currentEndsAt > baseDate) baseDate = currentEndsAt;
        }

        if (receipt.requested_cycle === 'yearly') {
          baseDate.setFullYear(baseDate.getFullYear() + 1);
        } else {
          baseDate.setMonth(baseDate.getMonth() + 1);
        }

        await supabase.from("payment_receipts").update({ status: "paid" }).eq("id", receiptId);
        
        await supabase.from("cafes").update({
          plan_type: receipt.requested_plan,
          billing_cycle: receipt.requested_cycle,
          subscription_status: "active",
          subscription_ends_at: baseDate.toISOString()
        }).eq("id", cafeId);

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: `✅ تم قبول الإيصال وتفعيل الحساب بنجاح وإضافة المدة.` })
        });
      } 
      else if (action === "den") {
        // 🌟 عند الرفض: نطلب السبب
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `الرجاء كتابة سبب الرفض بالرد المباشر (Reply) على هذه الرسالة لإيقاف الحساب.\n\nID: ${receiptId}`,
            reply_markup: { force_reply: true }
          })
        });
      }
      
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callback.id })
      });

      return NextResponse.json({ ok: true });
    }

    // 2. معالجة الرد المباشر لسبب الرفض
    if (body.message?.reply_to_message?.text) {
      const replyText = body.message.reply_to_message.text;
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
          // 🌟 منطق الرفض: تحديث الإيصال وإيقاف الحساب فوراً كما هو مطلوب
          await supabase.from("payment_receipts").update({
            status: "rejected",
            rejection_reason: reason
          }).eq("id", receiptId);

          await supabase.from("cafes").update({
            subscription_status: "paused" // إيقاف فوري
          }).eq("id", receipt.cafe_id);

          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: body.message.chat.id,
              text: `❌ تم إيقاف الحساب وتسجيل الرفض.\nالسبب: ${reason}`
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