"use server";

export async function sendTelegramReceipt(data: {
  receiptId: string;
  cafeId: string;
  cafeName: string;
  amount: number;
  receiptUrl: string;
  planId: string;
  billingCycle: string;
}) {
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