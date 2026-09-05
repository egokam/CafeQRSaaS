import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...privatePageMetadata,
  title: "Secure administration",
};

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
