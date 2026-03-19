import React from 'react';

interface MatchInfoFieldsProps {
  date: string;
  setDate: (val: string) => void;
  round: string;
  setRound: (val: string) => void;
  hasAccess: boolean;
}

export function MatchInfoFields({ date, setDate, round, setRound, hasAccess }: MatchInfoFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-xl">
        <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Data</label>
        <input 
          type="date" 
          value={date} 
          onChange={e => setDate(e.target.value)} 
          disabled={!hasAccess} 
          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors" 
        />
      </div>
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-xl">
        <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Rodada</label>
        <input 
          type="text" 
          value={round} 
          onChange={e => setRound(e.target.value)} 
          disabled={!hasAccess} 
          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors" 
        />
      </div>
    </div>
  );
}