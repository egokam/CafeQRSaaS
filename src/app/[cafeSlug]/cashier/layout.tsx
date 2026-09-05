import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...privatePageMetadata,
  title: "Cashier workspace",
};

export default function CashierLayout({ children }: { children: React.ReactNode }) {
  return children;
}
