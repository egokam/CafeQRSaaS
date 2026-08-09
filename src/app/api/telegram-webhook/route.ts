import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // -- 1. معالجة أزرار (قبول / رفض) الإيصالات --
    if (body.callback_query) {
      const callback = body.callback_query;
      const [action, receiptId] = callback.data.split("_");
      const chatId = callback.message.chat.id;

      const { data: receipt } = await supabase.from("payment_receipts").select("cafe_id, requested_plan, requested_cycle").eq("id", receiptId).single();
      if (!receipt) return NextResponse.json({ error: "Receipt not found" });

      const cafeId = receipt.cafe_id;

      if (action === "app") {
        const { data: cafe } = await supabase.from("cafes").select("subscription_status, subscription_ends_at").eq("id", cafeId).single();
        let baseDate = new Date();
        if (cafe?.subscription_status === 'active' && cafe?.subscription_ends_at) {
          const currentEndsAt = new Date(cafe.subscription_ends_at);
          if (currentEndsAt > baseDate) baseDate = currentEndsAt;
        }

        if (receipt.requested_cycle === 'yearly') baseDate.setFullYear(baseDate.getFullYear() + 1);
        else baseDate.setMonth(baseDate.getMonth() + 1);

        await supabase.from("payment_receipts").update({ status: "paid" }).eq("id", receiptId);
        await supabase.from("cafes").update({
          plan_type: receipt.requested_plan, billing_cycle: receipt.requested_cycle,
          subscription_status: "active", subscription_ends_at: baseDate.toISOString()
        }).eq("id", cafeId);

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: `✅ تم تفعيل الحساب وإضافة المدة.` })
        });
      } 
      else if (action === "den") {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `اكتب سبب الرفض بالرد (Reply) على هذه الرسالة.\n\nID: ${receiptId}`,
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

    // -- 2. معالجة الردود المباشرة (Reply) من تليغرام --
    if (body.message?.reply_to_message?.text) {
      const replyText = body.message.reply_to_message.text;
      const replyContent = body.message.text;
      const uuidRegex = /([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/;
      const match = replyText.match(uuidRegex);

      if (match && match[1]) {
        const extractedId = match[1];

        // الحالة الأولى: الرد على سبب رفض الإيصال
        if (replyText.includes("ID:")) {
          const receiptId = extractedId;
          const { data: receipt } = await supabase.from("payment_receipts").select("cafe_id").eq("id", receiptId).single();
          
          if (receipt) {
            const cafeId = receipt.cafe_id;
            const { data: cafe } = await supabase.from("cafes").select("subscription_status, subscription_ends_at").eq("id", cafeId).single();
            
            const now = new Date();
            const endsAt = cafe?.subscription_ends_at ? new Date(cafe.subscription_ends_at) : new Date(0);
            
            // التحقق: هل الحساب نشط ولديه رصيد أيام؟
            const isActive = cafe?.subscription_status === 'active' && endsAt > now;

            await supabase.from("payment_receipts").update({ status: "rejected", rejection_reason: replyContent }).eq("id", receiptId);

            // إذا كان الحساب منتهياً، يتم إيقافه، أما إذا كان نشطاً فيستمر في العمل
            if (!isActive) {
              await supabase.from("cafes").update({ subscription_status: "paused" }).eq("id", cafeId);
            }

            // إرسال الإشعار للعميل في واجهة المحادثة الجديدة
            await supabase.from("admin_messages").insert({
              cafe_id: cafeId, sender: 'super_admin',
              message_text: `❌ تم رفض إيصال الدفع الأخير. السبب: ${replyContent}`
            });

            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: body.message.chat.id, text: `تم الرفض بنجاح. ${isActive ? 'الحساب بقي نشطاً لوجود مدة متبقية' : 'تم إيقاف الحساب تماماً'}.` })
            });
          }
        } 
        // الحالة الثانية: الرد على تذكرة دعم فني
        else if (replyText.includes("الآيدي:")) {
          const cafeId = extractedId;
          await supabase.from("admin_messages").insert({
            cafe_id: cafeId, sender: "super_admin", message_text: replyContent
          });

          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: body.message.chat.id, text: `✅ تم إرسال ردك للعميل.` })
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}