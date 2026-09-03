import type { Metadata, Viewport } from "next";
import { Cairo, Geist } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import "./globals.css";
import { cn } from "../lib/utils";
import { getLocaleDirection, type Locale } from "@/i18n/config";

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
    title: "Qerve",
    description: t("description"),
    metadataBase: new URL("https://qerve.egokam.site"),
    manifest: "/manifest.json",
    verification: {
      google: "uRSDVPHWPOMxeQSpB3WNbMGY4U88_poBxQsJWUq5Oig",
    },
    openGraph: {
      title: "Qerve",
      description: t("ogDescription"),
      url: "https://qerve.egokam.site",
      siteName: "Qerve",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Qerve",
              "url": "https://qerve.egokam.site/"
            }),
          }}
        />

        <div id="root-content" className="flex flex-col flex-1 w-full">
          <NextIntlClientProvider messages={messages} locale={locale}>
            {children}
          </NextIntlClientProvider>
        </div>
      </body>
    </html>
  );
}