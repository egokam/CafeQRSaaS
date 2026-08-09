"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function sendSupportTicket(data: { cafeId: string; cafeName: string; message: string; planType: string }) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) throw new Error("Missing Telegram Credentials");

  // 1. حفظ الرسالة في قاعدة البيانات ليراها العميل في لوحته
  await supabase.from("admin_messages").insert({
    cafe_id: data.cafeId,
    sender: 'cafe_admin',
    message_text: data.message
  });

  // 2. إرسال إشعار لك في تليغرام
  const caption = `📩 <b>رسالة دعم فني</b>\n\n` +
    `🏢 <b>المقهى:</b> ${data.cafeName}\n` +
    `📦 <b>الباقة:</b> ${data.planType.toUpperCase()}\n` +
    `🔑 <b>الآيدي:</b> <code>${data.cafeId}</code>\n\n` +
    `💬 <b>الرسالة:</b>\n${data.message}\n\n` +
    `<i>للرد، قم بعمل Reply على هذه الرسالة واكتب جوابك.</i>`;

  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: caption, parse_mode: "HTML" })
  });
}