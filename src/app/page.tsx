//i spent two months building this saas, i really hope to get something from it.

import { Background3D } from "../components/landing/Background3D";
import { Navbar } from "../components/landing/Navbar";
import { Hero } from "../components/landing/Hero";
import { LivePreview } from "@/components/landing/LivePreview";
import { Features } from "../components/landing/Features";
import { ProjectGuide } from "../components/landing/ProjectGuide";
import { Footer } from "../components/landing/Footer";

export default function Home() {
  return (
    <div
      id="top"
      dir="ltr"
      className="relative min-h-screen w-full overflow-x-hidden bg-zinc-950 font-sans text-zinc-50"
    >
      <Background3D />
      <Navbar />

      <main className="relative mx-auto flex max-w-7xl flex-col gap-32 px-4 pb-24 sm:px-6 lg:px-8">
        <section className="flex min-h-screen flex-col justify-center pt-28">
          <Hero />
        </section>

        <section id="demo" className="scroll-mt-28">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-amber-300">
              Live Preview
            </p>
            <h2 className="text-balance text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
              See every angle of the experience
            </h2>
            <p className="mt-4 text-pretty text-lg leading-relaxed text-zinc-400">
              Switch between the views your guests and cashiers see in
              real time.
            </p>
          </div>
          <LivePreview />
        </section>

        <section id="features" className="scroll-mt-28">
          <Features />
        </section>

        <section id="guide" className="scroll-mt-28">
          <ProjectGuide />
        </section>

        <section id="pricing" className="scroll-mt-28">
          <Footer />
        </section>
      </main>
    </div>
  );
}



