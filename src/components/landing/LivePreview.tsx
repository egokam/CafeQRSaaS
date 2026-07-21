"use client";

import {
  Smartphone,
  CreditCard,
  Settings,
  ChefHat,
} from "lucide-react";
import { Sandbox, type SandboxView } from "./Sandbox";


const VIEWS: SandboxView[] = [
  {
    id: "client",
    label: "Client Menu",
    icon: Smartphone,
    content: (
      <iframe 
        src="/demo/client" 
        className="w-full h-[650px] border-none bg-background rounded-b-2xl"
        title="Live Client Menu"
      />
    ),
  },
  {
    id: "pos",
    label: "POS Cashier",
    icon: CreditCard,
    content: (
      <iframe 
        src="/demo/pos" 
        className="w-full h-[650px] border-none bg-zinc-950 rounded-b-2xl"
        title="Live POS Terminal"
      />
    ),
  },
  {
    id: "kitchen",
    label: "Kitchen Display",
    icon: ChefHat,
    content: (
      <iframe 
        src="/demo/kitchen" 
        className="w-full h-[650px] border-none bg-[#121212] rounded-b-2xl"
        title="Live Kitchen Display"
      />
    ),
  },
  {
    id: "admin",
    label: "Admin Panel",
    icon: Settings,
    content: (
      <iframe 
        src="/demo/admin" 
        className="w-full h-[650px] border-none bg-muted/20 rounded-b-2xl"
        title="Live Admin Panel"
      />
    ),
  },
];

export function LivePreview() {
  return (
    <section className="relative z-10 mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h2 className="text-sm font-bold uppercase tracking-widest text-amber-500 mb-2">
          Live Interactive Demo
        </h2>
        <h3 className="text-3xl font-black text-white sm:text-4xl md:text-5xl tracking-tight mb-4">
          See every angle of the experience
        </h3>
        <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
          Switch between the views your guests, kitchen, and cashiers see in real-time. 
          Go ahead, try adding a product or placing an order!
        </p>
      </div>
      
      {/* هنا نمرر الـ VIEWS لـ Sandbox ليعرضها بشكل نافذة macOS أنيقة 
        قمنا بتغيير الرابط الوهمي ليناسب فكرة التطبيق المتكامل
      */}
      <Sandbox views={VIEWS} url="app.cafeqr.io/live-demo" />
    </section>
  );
}