import React from 'react';
import { Search } from 'lucide-react';

interface PlayerFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  filterPos: string;
  setFilterPos: (val: string) => void;
}

export function PlayerFilters({ search, setSearch, filterPos, setFilterPos }: PlayerFiltersProps) {
  const positions = ['TODOS', 'GOLEIRO', 'ZAGUEIRO', 'LATERAL', 'MEIO-CAMPO', 'ATACANTE'];

  return (
    <div className="p-4 md:p-6 border-b border-white/5 flex flex-col sm:flex-row items-center gap-4 bg-[#0a0a0a]">
      <div className="relative w-full sm:flex-1 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
        <input 
          type="text" 
          placeholder="Buscar jogador..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>
      <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
        {positions.map(pos => (
          <button
            key={pos}
            onClick={() => setFilterPos(pos)}
            className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase whitespace-nowrap transition-all ${
              filterPos === pos 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {pos}
          </button>
        ))}
      </div>
    </div>
  );
}