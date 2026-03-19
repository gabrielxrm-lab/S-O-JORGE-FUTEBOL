import React from 'react';
import { Trash2 } from 'lucide-react';

interface Goal {
  name: string;
  shirt: number;
  qty: number;
}

interface TeamSectionProps {
  teamName: string;
  setTeamName: (val: string) => void;
  logoUrl: string;
  colorClass: string;
  accentColor: string;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  yellowCards: string[];
  setYellowCards: React.Dispatch<React.SetStateAction<string[]>>;
  redCards: string[];
  setRedCards: React.Dispatch<React.SetStateAction<string[]>>;
  hasAccess: boolean;
}

export function TeamSection({ 
  teamName, setTeamName, logoUrl, colorClass, accentColor,
  goals, setGoals, yellowCards, setYellowCards, redCards, setRedCards, hasAccess 
}: TeamSectionProps) {
  
  const totalGoals = goals.reduce((sum, g) => sum + g.qty, 0);

  const handleAddGoal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get('name') as string;
    const shirt = parseInt(fd.get('shirt') as string);
    const qty = parseInt(fd.get('qty') as string);
    
    if (name && shirt) {
      setGoals(prev => {
        const existing = prev.find(g => g.name === name.toUpperCase() && g.shirt === shirt);
        if (existing) return prev.map(g => g === existing ? {...g, qty: g.qty + qty} : g);
        return [...prev, { name: name.toUpperCase(), shirt, qty }];
      });
      (e.target as HTMLFormElement).reset();
    }
  };

  const handleAddCard = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = (fd.get('name') as string).toUpperCase();
    const type = fd.get('type') as string;
    
    if (name) {
      if (type === 'Y') setYellowCards(prev => [...prev, name]);
      else setRedCards(prev => [...prev, name]);
      (e.target as HTMLFormElement).reset();
    }
  };

  return (
    <div className="bg-[#111] border border-white/5 rounded-3xl p-6 md:p-8 space-y-8 shadow-2xl relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-64 h-64 ${accentColor}/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none`}></div>
      
      <div className="flex justify-between items-center relative z-10">
        <div className="flex items-center gap-4 w-2/3">
          <img src={logoUrl} alt={teamName} className="w-12 h-12 object-contain drop-shadow-lg" />
          <input 
            type="text" 
            value={teamName} 
            onChange={e => setTeamName(e.target.value.toUpperCase())} 
            disabled={!hasAccess} 
            className={`bg-transparent text-3xl font-black ${colorClass} focus:outline-none w-full tracking-tight`} 
          />
        </div>
        <div className={`text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-${accentColor}-400 to-${accentColor}-600`}>
          {totalGoals}
        </div>
      </div>
      
      <div className="space-y-5 relative z-10">
        <h4 className="font-black text-lg border-b border-white/5 pb-3 tracking-tight">Gols</h4>
        {hasAccess && (
          <form onSubmit={handleAddGoal} className="flex gap-3">
            <input name="name" placeholder="Nome" required className={`flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-${accentColor}-500 transition-colors`} />
            <input name="shirt" type="number" placeholder="Nº" required className={`w-20 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-${accentColor}-500 transition-colors`} />
            <input name="qty" type="number" defaultValue={1} min={1} required className={`w-20 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-${accentColor}-500 transition-colors`} />
            <button type="submit" className={`bg-${accentColor}-600 hover:bg-${accentColor}-500 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-${accentColor}-500/20 transition-all`}>Add</button>
          </form>
        )}
        <ul className="space-y-3">
          {goals.map((g, i) => (
            <li key={i} className="flex justify-between items-center text-sm font-bold bg-black/30 p-3 rounded-xl border border-white/5">
              <span>⚽ {g.name} ({g.shirt}) - <span className={`${colorClass}`}>{g.qty} gol(s)</span></span>
              {hasAccess && <button onClick={() => setGoals(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={18} /></button>}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-5 relative z-10">
        <h4 className="font-black text-lg border-b border-white/5 pb-3 tracking-tight">Cartões</h4>
        {hasAccess && (
          <form onSubmit={handleAddCard} className="flex gap-3">
            <input name="name" placeholder="Nome" required className={`flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-${accentColor}-500 transition-colors`} />
            <select name="type" className={`bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-${accentColor}-500 transition-colors`}>
              <option value="Y">🟨 Amarelo</option>
              <option value="R">🟥 Vermelho</option>
            </select>
            <button type="submit" className={`bg-${accentColor}-600 hover:bg-${accentColor}-500 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-${accentColor}-500/20 transition-all`}>Add</button>
          </form>
        )}
        <ul className="space-y-3">
          {yellowCards.map((n, i) => (
            <li key={`y-${i}`} className="flex justify-between items-center text-sm font-bold bg-black/30 p-3 rounded-xl border border-white/5">
              <span>🟨 {n}</span>
              {hasAccess && <button onClick={() => setYellowCards(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={18} /></button>}
            </li>
          ))}
          {redCards.map((n, i) => (
            <li key={`r-${i}`} className="flex justify-between items-center text-sm font-bold bg-black/30 p-3 rounded-xl border border-white/5">
              <span>🟥 {n}</span>
              {hasAccess && <button onClick={() => setRedCards(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={18} /></button>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}