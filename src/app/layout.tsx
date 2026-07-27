import type { Metadata, Viewport } from "next";
import { Cairo, Geist } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import "./globals.css";
import { cn } from "../lib/utils";
import { getLocaleDirection, type Locale } from "@/i18n/config";
import SecurityShield from "@/components/SecurityShield";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-arabic",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("title"),
    description: t("description"),
    metadataBase: new URL("https://cafeqr.egokam.site"),
    manifest: "/manifest.json",
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      url: "https://cafeqr.egokam.site",
      siteName: t("siteName"),
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: t("imageAlt"),
        },
      ],
      locale: t("locale"),
      type: "website",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "hsl(0, 0%, 100%)",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();
  const direction = getLocaleDirection(locale);

  return (
    <html
      lang={locale}
      dir={direction}
      suppressHydrationWarning
      className={cn(geist.variable, cairo.variable)}
    >
      <body
        suppressHydrationWarning
        className={cn(
          locale === "ar" ? cairo.className : geist.className,
          "antialiased bg-background text-foreground min-h-screen flex flex-col relative selection:bg-primary/20"
        )}
      >
        <SecurityShield />
        <noscript>
          <style>{`
            .noscript-blocker {
              position: fixed;
              top: 0;
              left: 0;
              width: 100vw;
              height: 100vh;
              background-color: #f8fafc;
              z-index: 999999999;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              font-family: system-ui, -apple-system, sans-serif;
              padding: 2rem;
            }
            /* إخفاء المحتوى الأساسي تماماً لتجنب أي تسريب في الكود */
            #root-content {
              display: none !important;
            }
          `}</style>
          <div className="noscript-blocker">
            <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a', marginBottom: '1rem' }}>
              JavaScript is Required ⚠️
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#64748b', maxWidth: '400px' }}>
              We have detected that JavaScript is disabled in your browser.
              Please enable it to access this platform securely.
            </p>
          </div>
        </noscript>
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
