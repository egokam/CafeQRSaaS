"use server";

import { createClient } from "@supabase/supabase-js";
import { assertAdminCafeAccess } from "./auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const escapeTelegramHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]!);

export async function sendSupportTicket(data: { cafeId: string; cafeName: string; message: string; planType: string }) {
  await assertAdminCafeAccess(data.cafeId);

  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  const message = data.message.trim();

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) throw new Error("Missing Telegram Credentials");
  if (!message || message.length > 2_000) throw new Error("Invalid support message");

  const { data: cafe, error: cafeError } = await supabase
    .from("cafes")
    .select("name, plan_type")
    .eq("id", data.cafeId)
    .single();

  if (cafeError || !cafe) throw new Error("Cafe not found");

  // 1. حفظ الرسالة في قاعدة البيانات ليراها العميل في لوحته
  const { error: insertError } = await supabase.from("admin_messages").insert({
    cafe_id: data.cafeId,
    sender: 'cafe_admin',
    message_text: message
  });
  if (insertError) throw insertError;

  // 2. إرسال إشعار لك في تليغرام
  const caption = `📩 <b>رسالة دعم فني</b>\n\n` +
    `🏢 <b>المقهى:</b> ${escapeTelegramHtml(cafe.name)}\n` +
    `📦 <b>الباقة:</b> ${escapeTelegramHtml((cafe.plan_type || "unknown").toUpperCase())}\n` +
    `🔑 <b>الآيدي:</b> <code>${data.cafeId}</code>\n\n` +
    `💬 <b>الرسالة:</b>\n${escapeTelegramHtml(message)}\n\n` +
    `<i>للرد، قم بعمل Reply على هذه الرسالة واكتب جوابك.</i>`;

  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: caption, parse_mode: "HTML" })
  });
}

export async function getAdminMessages(cafeId: string) {
  await assertAdminCafeAccess(cafeId);

  const { data, error } = await supabase
    .from("admin_messages")
    .select("*")
    .eq("cafe_id", cafeId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function markAdminMessagesRead(cafeId: string) {
  await assertAdminCafeAccess(cafeId);

  const { error } = await supabase
    .from("admin_messages")
    .update({ is_read: true })
    .eq("cafe_id", cafeId)
    .eq("sender", "super_admin")
    .eq("is_read", false);

  if (error) throw error;
}
