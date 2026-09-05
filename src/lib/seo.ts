import type { Metadata } from "next";

export const SITE_URL = "https://qerve.egokam.site";
export const SITE_NAME = "Qerve";

type PublicPageMetadata = {
  title: string;
  description: string;
  path: "/" | `/${string}`;
  locale: string;
  imageAlt: string;
};

/**
 * Keeps the canonical URL, social previews, and search metadata in sync for
 * each indexable marketing page.
 */
export function publicPageMetadata({
  title,
  description,
  path,
  locale,
  imageAlt,
}: PublicPageMetadata): Metadata {
  const socialTitle = `${title} | ${SITE_NAME}`;

  return {
    // The root page is not wrapped by a parent title template in Next.js.
    title: path === "/" ? socialTitle : title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: socialTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      locale,
      type: "website",
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: ["/og-image.jpg"],
    },
  };
}

/** Metadata shared by authenticated, tenant, and preview-only interfaces. */
export const privatePageMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};
