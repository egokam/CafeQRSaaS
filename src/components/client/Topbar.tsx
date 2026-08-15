"use client";

interface TopbarProps {
  cafeName: string;
  subtitle: string;
  activeLang?: "en" | "fr" | "ar";
}

export default function Topbar({ cafeName, subtitle, activeLang = "en" }: TopbarProps) {
  const dir = activeLang === "ar" ? "rtl" : "ltr";

  return (
    <div className="px-5 pb-[30px] pt-[30px] flex flex-col" dir={dir}>
      <h1 className="font-serif text-[3.25rem] font-black italic leading-none tracking-tighter text-black">
        {cafeName}
      </h1>
      <p className="mt-1 text-[14px] font-bold text-gray-400">
        {subtitle}
      </p>
    </div>
  );
}