"use client";

import { ArrowRight } from "lucide-react";

interface ClientHomeProps {
  cafeName: string;
  activeLang: string;
  onGoToMenu: () => void;
}

export default function ClientHome({ cafeName, activeLang, onGoToMenu }: ClientHomeProps) {
  const dir = activeLang === 'ar' ? 'rtl' : 'ltr';

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 space-y-8 animate-in fade-in duration-300" dir={dir}>
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black text-zinc-900">{cafeName}</h1>
        <p className="text-zinc-500 font-medium max-w-sm mx-auto">
          {activeLang === 'ar' 
            ? 'مرحباً بك في مقهانا. اكتشف قائمتنا واطلب مباشرة من طاولتك.' 
            : activeLang === 'fr' 
            ? 'Bienvenue dans notre café. Découvrez notre menu et commandez.'
            : 'Welcome to our cafe. Discover our menu and order directly.'}
        </p>
      </div>

      <button
        onClick={onGoToMenu}
        className="bg-zinc-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 active:scale-95 transition-transform shadow-lg shadow-zinc-900/20"
      >
        {activeLang === 'ar' ? 'تصفح المنيو' : activeLang === 'fr' ? 'Voir le Menu' : 'Browse Menu'}
        <ArrowRight size={20} className={activeLang === 'ar' ? 'rotate-180' : ''} />
      </button>
    </div>
  );
}