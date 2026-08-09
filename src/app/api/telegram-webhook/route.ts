import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Handle Callback Queries (Inline Keyboard Clicks)
    if (body.callback_query) {
      const callback = body.callback_query;
      const callbackData = callback.data;
      const chatId = callback.message.chat.id;

      // Handle cafe selection from /send_to_admin
      if (callbackData.startsWith("chatwith_")) {
        const cafeId = callbackData.replace("chatwith_", "");
        
        const { data: cafe } = await supabase.from("cafes").select("name").eq("id", cafeId).single();
        
        await supabase.from("telegram_bot_state").upsert({
          chat_id: chatId,
          active_cafe_id: cafeId,
          updated_at: new Date().toISOString()
        });

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            chat_id: chatId, 
            text: `🟢 You are now chatting with: ${cafe?.name || cafeId}\nAll your text messages will be sent directly to this cafe's support tab.\n\nType /exit to leave chat mode.` 
          })
        });

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callback_query_id: callback.id })
        });
        
        return NextResponse.json({ ok: true });
      }

      // Existing Receipt Approval/Denial Logic
      const [action, receiptId] = callbackData.split("_");
      
      if (action === "app" || action === "den") {
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
      }
      
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callback.id })
      });
      return NextResponse.json({ ok: true });
    }

    // 2. Handle Text Messages
    if (body.message?.text) {
      const chatId = body.message.chat.id;
      const text = body.message.text;

      // Command: /send_to_admin
      if (text.startsWith("/send_to_admin")) {
        const { data: cafes, error } = await supabase.from("cafes").select("id, name");
        
        if (error || !cafes || cafes.length === 0) {
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: "No cafes found in the database." })
          });
          return NextResponse.json({ ok: true });
        }

        const inlineKeyboard = cafes.map(cafe => ([{
          text: cafe.name,
          callback_data: `chatwith_${cafe.id}`
        }]));

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            chat_id: chatId, 
            text: "Select a cafe to start a direct chat:",
            reply_markup: { inline_keyboard: inlineKeyboard }
          })
        });
        return NextResponse.json({ ok: true });
      }

      // Command: /exit
      if (text.startsWith("/exit")) {
        await supabase.from("telegram_bot_state").upsert({ chat_id: chatId, active_cafe_id: null });
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: "🔴 Chat mode exited. Standard bot behavior restored." })
        });
        return NextResponse.json({ ok: true });
      }

      // Existing Direct Replies logic
      if (body.message.reply_to_message?.text) {
        const replyText = body.message.reply_to_message.text;
        const uuidRegex = /([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/;
        const match = replyText.match(uuidRegex);

        if (match && match[1]) {
          const extractedId = match[1];

          if (replyText.includes("ID:")) {
            const receiptId = extractedId;
            const { data: receipt } = await supabase.from("payment_receipts").select("cafe_id").eq("id", receiptId).single();
            
            if (receipt) {
              const cafeId = receipt.cafe_id;
              const { data: cafe } = await supabase.from("cafes").select("subscription_status, subscription_ends_at").eq("id", cafeId).single();
              
              const now = new Date();
              const endsAt = cafe?.subscription_ends_at ? new Date(cafe.subscription_ends_at) : new Date(0);
              const isActive = cafe?.subscription_status === 'active' && endsAt > now;

              await supabase.from("payment_receipts").update({ status: "rejected", rejection_reason: text }).eq("id", receiptId);

              if (!isActive) {
                await supabase.from("cafes").update({ subscription_status: "paused" }).eq("id", cafeId);
              }

              await supabase.from("admin_messages").insert({
                cafe_id: cafeId, sender: 'super_admin',
                message_text: `❌ تم رفض إيصال الدفع الأخير. السبب: ${text}`
              });

              await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text: `تم الرفض بنجاح. ${isActive ? 'الحساب بقي نشطاً لوجود مدة متبقية' : 'تم إيقاف الحساب تماماً'}.` })
              });
            }
          } 
          else if (replyText.includes("الآيدي:")) {
            const cafeId = extractedId;
            await supabase.from("admin_messages").insert({
              cafe_id: cafeId, sender: "super_admin", message_text: text
            });

            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: chatId, text: `✅ تم إرسال ردك للعميل.` })
            });
          }
          return NextResponse.json({ ok: true });
        }
      }

      // Session-based Message Routing (Not a reply, not a command)
      const { data: botState } = await supabase.from("telegram_bot_state").select("active_cafe_id").eq("chat_id", chatId).single();
      
      if (botState && botState.active_cafe_id) {
        const { error: insertError } = await supabase.from("admin_messages").insert({
          cafe_id: botState.active_cafe_id,
          sender: "super_admin",
          message_text: text
        });

        if (insertError) {
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: `❌ Failed to send message. Database error.` })
          });
        } else {
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: `✅ Message sent.` })
          });
        }
        return NextResponse.json({ ok: true });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}