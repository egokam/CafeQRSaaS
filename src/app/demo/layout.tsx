import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...privatePageMetadata,
  title: "Interactive demos",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
