import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Background3D } from "../components/landing/Background3D";
import { Navbar } from "../components/landing/Navbar";
import { Hero } from "../components/landing/Hero";
import { LivePreview } from "@/components/landing/LivePreview";
import { Features } from "../components/landing/Features";
import { ProjectGuide } from "../components/landing/ProjectGuide";
import { Footer } from "../components/landing/Footer";
import { publicPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");

  return publicPageMetadata({
    title: t("homeTitle"),
    description: t("description"),
    path: "/",
    locale: t("locale"),
    imageAlt: t("imageAlt"),
  });
}

export default function Home() {
  return (
    <div
      id="top"
      className="relative min-h-screen w-full overflow-x-hidden bg-zinc-950 text-zinc-50"
    >
      <Background3D />
      <Navbar />

      <main className="relative mx-auto flex max-w-7xl flex-col gap-32 px-4 pb-24 sm:px-6 lg:px-8">
        <section className="flex min-h-screen flex-col justify-center pt-28">
          <Hero />
        </section>

        <section id="demo" className="scroll-mt-28">
          <LivePreview />
        </section>

        <section id="features" className="scroll-mt-28">
          <Features />
        </section>

        <section id="tutorial" className="scroll-mt-28">
          <ProjectGuide />
        </section>

        <section id="pricing" className="scroll-mt-28">
          <Footer />
        </section>
      </main>
    </div>
  );
}
