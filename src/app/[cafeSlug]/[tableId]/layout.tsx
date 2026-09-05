import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo";

// QR menu URLs are table-specific entry points, not public marketing pages.
export const metadata: Metadata = {
  ...privatePageMetadata,
  title: "Guest menu",
};

export default function GuestMenuLayout({ children }: { children: React.ReactNode }) {
  return children;
}
