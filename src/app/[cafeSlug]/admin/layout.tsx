import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  ...privatePageMetadata,
  title: "Cafe administration",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
