"use client";

interface TopbarProps {
  cafeName: string;
  subtitle: string;
}

export default function Topbar({ cafeName, subtitle }: TopbarProps) {
  return (
    <div className="px-3 pb-[40px] pt-[30px] flex flex-col">
      <h1 className="font-serif text-[3.25rem] font-black italic leading-none tracking-tighter text-black">
        {cafeName}
      </h1>
      <p className="mt-0 text-[14px] font-bold text-gray-400">
        {subtitle}
      </p>
    </div>
  );
}