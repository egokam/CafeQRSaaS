"use server";

export async function sendTelegramReceipt(data: {
  receiptId: string;
  cafeId: string;
  cafeName: string;
  amount: number;
  receiptUrl: string;
}) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    throw new Error("بيانات اعتماد Telegram مفقودة");
  }

  const caption = `🧾 *طلب تفعيل جديد*\n\n` +
    `• *المقهى:* ${data.cafeName}\n` +
    `• *المبلغ:* ${data.amount} MAD\n` +
    `• *معرف الإيصال:* \`${data.receiptId}\``;

  // تصغير حجم callback_data ليتوافق مع قيود تليغرام (أقل من 64 حرف)
  const keyboard = {
    inline_keyboard: [
      [
        { text: "✅ قبول", callback_data: `app_${data.receiptId}` },
        { text: "❌ رفض", callback_data: `den_${data.receiptId}` }
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
      parse_mode: "Markdown",
      reply_markup: keyboard
    })
  });

  if (!res.ok) {
    const errData = await res.text();
    throw new Error("فشل إرسال الإشعار إلى Telegram: " + errData);
  }
}