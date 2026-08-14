"use client";

import { Search } from "lucide-react";

interface SearchbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function Searchbar({ searchQuery, setSearchQuery }: SearchbarProps) {
  return (
    <div className="relative flex-1">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        <Search size={22} className="text-black" strokeWidth={2.5} />
      </div >
      <input
        type="text"
        placeholder="Search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full rounded-full border border-black/20 shadow-[0_4px_15px_rgba(0,0,0,0.05)] py-3.5 pl-12 pr-4 text-[15px] font-bold text-black focus:border-black focus:outline-none placeholder:font-normal placeholder:text-gray-400"
      />
    </div>
  );
}