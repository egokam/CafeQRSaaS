import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function middleware(request: NextRequest) {
  // إنشاء استجابة مبدئية
  const response = NextResponse.next();

  // 1. نظام تتبع العميل الذكي (Client Fingerprinting)
  let sessionId = request.cookies.get('cafe_lux_session')?.value;

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    response.cookies.set('cafe_lux_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 12,
    });
  }

  // 2. إضافة ترويسات الأمان الصارمة (Security Headers)
  // حيدنا X-Frame-Options من هنا باش ما يتعارضش مع إعدادات next.config.ts

  // منع المتصفح من تخمين نوع الملفات (حماية من MIME Sniffing)
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // تقليل تسريب الرابط عند الانتقال لمواقع خارجية
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

// تحديد المسارات التي سيعمل عليها هذا الوسيط
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};