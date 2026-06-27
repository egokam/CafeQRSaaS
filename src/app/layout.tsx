import type { Metadata, Viewport } from "next";
import { Tajawal, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "../lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

// استدعاء الخط العربي
const tajawal = Tajawal({ 
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-tajawal",
});

export const metadata: Metadata = {
  title: "CafeQR",
  description: "نظام الطلبات الذكي عبر QR",
  manifest: "/manifest.json",
  openGraph: {
    title: "CafeQR - Smart Cafe System",
    description: "النظام الأسرع والأكثر أماناً لإدارة المقاهي في المغرب.",
    url: "https://cafeqr.egokam.site", // بدلها بالدومين ديالك من بعد
    siteName: "EgoCafe",
    images: [
      {
        url: "/og-image.jpg", // حط شي تصويرة واعرة للسيستم ديالك في فولدر public سميتها og-image.jpg
        width: 1200,
        height: 630,
        alt: "EgoCafe Platform Preview",
      },
    ],
    locale: "ar_MA",
    type: "website",
  },
};

// 🌟 تلوين شريط المهام في الهواتف الذكية ليتناسب مع الخلفية البيضاء
export const viewport: Viewport = {
  themeColor: "hsl(0, 0%, 100%)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 🛡️ suppressHydrationWarning: ضروري جداً لمنع إضافات المتصفح من كسر التطبيق (الشاشة البيضاء)
    <html lang="ar" dir="rtl" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body 
        suppressHydrationWarning 
        className={`${tajawal.variable} font-sans antialiased bg-background text-foreground min-h-screen flex flex-col relative selection:bg-primary/20`}
      >
        {children}
      </body>
    </html>
  );
}