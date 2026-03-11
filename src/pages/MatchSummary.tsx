import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, GameStat } from '../lib/api';
import { motion } from 'motion/react';
import { Save, Trash2, Download } from 'lucide-react';

export function MatchSummary() {
  const { role } = useAuth();
  const isDiretoria = role === 'Diretoria';

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [round, setRound] = useState('');
  const [homeName, setHomeName] = useState('MILAN');
  const [awayName, setAwayName] = useState('INTER');

  const [craques, setCraques] = useState<string[]>([]);
  const [goleiros, setGoleiros] = useState<string[]>([]);
  const [golsJogo, setGolsJogo] = useState<string[]>([]);

  const [homeGoals, setHomeGoals] = useState<{name: string, shirt: number, qty: number}[]>([]);
  const [awayGoals, setAwayGoals] = useState<{name: string, shirt: number, qty: number}[]>([]);

  const [homeYellow, setHomeYellow] = useState<string[]>([]);
  const [homeRed, setHomeRed] = useState<string[]>([]);
  const [awayYellow, setAwayYellow] = useState<string[]>([]);
  const [awayRed, setAwayRed] = useState<string[]>([]);

  const [suspensos, setSuspensos] = useState<string[]>([]);
  const [faltasNao, setFaltasNao] = useState<string[]>([]);
  const [cumpriu, setCumpriu] = useState<string[]>([]);
  const [faltasSim, setFaltasSim] = useState<string[]>([]);
  const [medico, setMedico] = useState<string[]>([]);
  const [cartoesMes, setCartoesMes] = useState<string[]>([]);

  const handleAddList = (setter: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    if (val) setter(prev => [...prev, val]);
  };

  const handleRemoveList = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    if (!window.confirm('Tem certeza que deseja limpar todos os campos?')) return;
    setCraques([]); setGoleiros([]); setGolsJogo([]);
    setHomeGoals([]); setAwayGoals([]);
    setHomeYellow([]); setHomeRed([]); setAwayYellow([]); setAwayRed([]);
    setSuspensos([]); setFaltasNao([]); setCumpriu([]); setFaltasSim([]); setMedico([]); setCartoesMes([]);
    setRound('');
  };

  const generateText = () => {
    const homeScore = homeGoals.reduce((sum, g) => sum + g.qty, 0);
    const awayScore = awayGoals.reduce((sum, g) => sum + g.qty, 0);
    
    const formatGoals = (goals: {name: string, shirt: number, qty: number}[]) => {
      if (goals.length === 0) return "(Sem gols)";
      return goals.map(g => `${g.name} (${g.shirt}) → ${'⚽'.repeat(g.qty)} (${g.qty})`).join('\n');
    };

    const dateObj = new Date(date);
    const dayOfWeek = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
    const dateStr = dateObj.toLocaleDateString('pt-BR');

    return `📋 SÚMULA: ${round}
📅 ${dayOfWeek}, ${dateStr}

🏟 ${homeName} ${homeScore} x ${awayScore} ${awayName}

⚽ GOL(S) DO JOGO → ${golsJogo.join(', ') || '(Não preenchido)'}
🧤 GOLEIRO(S) DO JOGO → ${goleiros.join(', ') || '(Não preenchido)'}
⭐ CRAQUE(S) DO JOGO → ${craques.join(', ') || '(Não preenchido)'}

________________________________________

🔴⚫ Gols do ${homeName}:

${formatGoals(homeGoals)}


🟦⬛ Gols do ${awayName}:

${formatGoals(awayGoals)}
________________________________________


🟨 Cartões Amarelos – ${dateStr}
${[...homeYellow.map(n => `${n} (${homeName})`), ...awayYellow.map(n => `${n} (${awayName})`)].join('\n') || '(Sem cartões amarelos)'}

🟥 Cartões Vermelhos – ${dateStr}
${[...homeRed.map(n => `${n} (${homeName})`), ...awayRed.map(n => `${n} (${awayName})`)].join('\n') || '(Sem cartões vermelhos)'}
________________________________________

📌 Faltas não justificadas:
${faltasNao.join('\n') || '(Nenhum)'}

🚫 Suspensos:
${suspensos.join('\n') || '(Nenhum)'}
________________________________________

✅ Faltas justificadas:
${faltasSim.map(n => `(${n})`).join('\n') || '(Nenhum)'}
________________________________________

🚑 Depto. Médico:
${medico.map(n => `(${n})`).join('\n') || '(Nenhum)'}
________________________________________

📆 Cumpriu suspensão:
${cumpriu.map(n => `${n} (APTO)`).join('\n') || '(Nenhum)'}
________________________________________

🟨 Cartões (Mês):
${cartoesMes.join('\n') || '(Nenhum)'}

🖋 Gerado em: ${new Date().toLocaleString('pt-BR')}`;
  };

  const downloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([generateText()], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `sumula_${date}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  const saveStats = async () => {
    if (!isDiretoria) return;
    
    const statsMap = new Map<string, GameStat>();
    
    const getStat = (name: string) => {
      if (!statsMap.has(name)) {
        statsMap.set(name, {
          game_date: date,
          player_name: name,
          goals: 0,
          yellow_cards: 0,
          red_cards: 0,
          craque_do_jogo: 0,
          goleiro_do_jogo: 0,
          gol_do_jogo: 0
        });
      }
      return statsMap.get(name)!;
    };

    homeGoals.forEach(g => getStat(g.name).goals += g.qty);
    awayGoals.forEach(g => getStat(g.name).goals += g.qty);
    
    homeYellow.forEach(n => getStat(n).yellow_cards += 1);
    awayYellow.forEach(n => getStat(n).yellow_cards += 1);
    
    homeRed.forEach(n => getStat(n).red_cards += 1);
    awayRed.forEach(n => getStat(n).red_cards += 1);
    
    craques.forEach(n => (getStat(n).craque_do_jogo as number) += 1);
    goleiros.forEach(n => (getStat(n).goleiro_do_jogo as number) += 1);
    golsJogo.forEach(n => (getStat(n).gol_do_jogo as number) += 1);

    try {
      await api.saveStats(Array.from(statsMap.values()));
      alert('Estatísticas salvas no Ranking com sucesso!');
      clearAll();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar estatísticas');
    }
  };

  const ListEditor = ({ title, items, setter, placeholder }: any) => {
    const [val, setVal] = useState('');
    return (
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-xl">
        <h3 className="font-black mb-5 tracking-tight text-lg">{title}</h3>
        <div className="flex gap-3 mb-5">
          <input 
            type="text" 
            placeholder={placeholder}
            value={val}
            onChange={e => setVal(e.target.value.toUpperCase())}
            disabled={!isDiretoria}
            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button 
            onClick={() => { handleAddList(setter, val); setVal(''); }}
            disabled={!isDiretoria || !val}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all"
          >
            Add
          </button>
        </div>
        <ul className="space-y-3">
          {items.map((item: string, i: number) => (
            <li key={i} className="flex justify-between items-center text-sm font-bold bg-black/30 p-3 rounded-xl border border-white/5">
              <span>{item}</span>
              {isDiretoria && (
                <button onClick={() => handleRemoveList(setter, i)} className="text-red-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 size={18} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl">
            <Save className="text-indigo-400" size={36} />
          </div>
          Gerador de Súmula
        </h1>
        {isDiretoria && (
          <button onClick={clearAll} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-5 py-3 rounded-xl transition-colors font-bold border border-red-500/20">
            <Trash2 size={20} />
            Limpar Campos
          </button>
        )}
      </div>

      {!isDiretoria && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-5 rounded-2xl flex items-center gap-3 font-bold">
          <span className="text-xl">🔒</span> Apenas a Diretoria pode criar ou editar súmulas.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-xl">
          <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Data</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} disabled={!isDiretoria} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors" />
        </div>
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-xl">
          <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Rodada</label>
          <input type="text" value={round} onChange={e => setRound(e.target.value)} disabled={!isDiretoria} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors" />
        </div>
      </div>

      <h2 className="text-3xl font-black mt-12 tracking-tight">🏆 Destaques Individuais</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ListEditor title="⭐ Craque(s) do Jogo" items={craques} setter={setCraques} placeholder="Nome do craque" />
        <ListEditor title="🧤 Goleiro(s) do Jogo" items={goleiros} setter={setGoleiros} placeholder="Nome do goleiro" />
        <ListEditor title="⚽ Gol(s) do Jogo" items={golsJogo} setter={setGolsJogo} placeholder="Nome do autor" />
      </div>

      <h2 className="text-3xl font-black mt-12 tracking-tight">📝 Detalhes dos Times</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Time da Casa */}
        <div className="bg-[#111] border border-white/5 rounded-3xl p-8 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-4 w-2/3">
              <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg" alt="Milan" className="w-12 h-12 object-contain drop-shadow-lg" />
              <input type="text" value={homeName} onChange={e => setHomeName(e.target.value.toUpperCase())} disabled={!isDiretoria} className="bg-transparent text-3xl font-black text-red-500 focus:outline-none w-full tracking-tight" />
            </div>
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-400 to-red-600">{homeGoals.reduce((s, g) => s + g.qty, 0)}</div>
          </div>
          
          <div className="space-y-5 relative z-10">
            <h4 className="font-black text-lg border-b border-white/5 pb-3 tracking-tight">Gols</h4>
            {isDiretoria && (
              <form onSubmit={e => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const name = fd.get('name') as string;
                const shirt = parseInt(fd.get('shirt') as string);
                const qty = parseInt(fd.get('qty') as string);
                if (name && shirt) {
                  setHomeGoals(prev => {
                    const existing = prev.find(g => g.name === name && g.shirt === shirt);
                    if (existing) return prev.map(g => g === existing ? {...g, qty: g.qty + qty} : g);
                    return [...prev, {name: name.toUpperCase(), shirt, qty}];
                  });
                  (e.target as HTMLFormElement).reset();
                }
              }} className="flex gap-3">
                <input name="name" placeholder="Nome" required className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-500 transition-colors" />
                <input name="shirt" type="number" placeholder="Nº" required className="w-20 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-500 transition-colors" />
                <input name="qty" type="number" defaultValue={1} min={1} required className="w-20 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-500 transition-colors" />
                <button type="submit" className="bg-red-600 hover:bg-red-500 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-all">Add</button>
              </form>
            )}
            <ul className="space-y-3">
              {homeGoals.map((g, i) => (
                <li key={i} className="flex justify-between items-center text-sm font-bold bg-black/30 p-3 rounded-xl border border-white/5">
                  <span>⚽ {g.name} ({g.shirt}) - <span className="text-red-400">{g.qty} gol(s)</span></span>
                  {isDiretoria && <button onClick={() => setHomeGoals(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={18} /></button>}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-5 relative z-10">
            <h4 className="font-black text-lg border-b border-white/5 pb-3 tracking-tight">Cartões</h4>
            {isDiretoria && (
              <form onSubmit={e => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const name = (fd.get('name') as string).toUpperCase();
                const type = fd.get('type') as string;
                if (name) {
                  if (type === 'Y') setHomeYellow(prev => [...prev, name]);
                  else setHomeRed(prev => [...prev, name]);
                  (e.target as HTMLFormElement).reset();
                }
              }} className="flex gap-3">
                <input name="name" placeholder="Nome" required className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-500 transition-colors" />
                <select name="type" className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-red-500 transition-colors">
                  <option value="Y">🟨 Amarelo</option>
                  <option value="R">🟥 Vermelho</option>
                </select>
                <button type="submit" className="bg-red-600 hover:bg-red-500 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-all">Add</button>
              </form>
            )}
            <ul className="space-y-3">
              {homeYellow.map((n, i) => (
                <li key={`y-${i}`} className="flex justify-between items-center text-sm font-bold bg-black/30 p-3 rounded-xl border border-white/5">
                  <span>🟨 {n}</span>
                  {isDiretoria && <button onClick={() => setHomeYellow(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={18} /></button>}
                </li>
              ))}
              {homeRed.map((n, i) => (
                <li key={`r-${i}`} className="flex justify-between items-center text-sm font-bold bg-black/30 p-3 rounded-xl border border-white/5">
                  <span>🟥 {n}</span>
                  {isDiretoria && <button onClick={() => setHomeRed(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={18} /></button>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Time Visitante */}
        <div className="bg-[#111] border border-white/5 rounded-3xl p-8 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-4 w-2/3">
              <img src="https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg" alt="Inter" className="w-12 h-12 object-contain drop-shadow-lg" />
              <input type="text" value={awayName} onChange={e => setAwayName(e.target.value.toUpperCase())} disabled={!isDiretoria} className="bg-transparent text-3xl font-black text-blue-500 focus:outline-none w-full tracking-tight" />
            </div>
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-blue-600">{awayGoals.reduce((s, g) => s + g.qty, 0)}</div>
          </div>
          
          <div className="space-y-5 relative z-10">
            <h4 className="font-black text-lg border-b border-white/5 pb-3 tracking-tight">Gols</h4>
            {isDiretoria && (
              <form onSubmit={e => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const name = fd.get('name') as string;
                const shirt = parseInt(fd.get('shirt') as string);
                const qty = parseInt(fd.get('qty') as string);
                if (name && shirt) {
                  setAwayGoals(prev => {
                    const existing = prev.find(g => g.name === name && g.shirt === shirt);
                    if (existing) return prev.map(g => g === existing ? {...g, qty: g.qty + qty} : g);
                    return [...prev, {name: name.toUpperCase(), shirt, qty}];
                  });
                  (e.target as HTMLFormElement).reset();
                }
              }} className="flex gap-3">
                <input name="name" placeholder="Nome" required className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 transition-colors" />
                <input name="shirt" type="number" placeholder="Nº" required className="w-20 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 transition-colors" />
                <input name="qty" type="number" defaultValue={1} min={1} required className="w-20 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 transition-colors" />
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all">Add</button>
              </form>
            )}
            <ul className="space-y-3">
              {awayGoals.map((g, i) => (
                <li key={i} className="flex justify-between items-center text-sm font-bold bg-black/30 p-3 rounded-xl border border-white/5">
                  <span>⚽ {g.name} ({g.shirt}) - <span className="text-blue-400">{g.qty} gol(s)</span></span>
                  {isDiretoria && <button onClick={() => setAwayGoals(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={18} /></button>}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-5 relative z-10">
            <h4 className="font-black text-lg border-b border-white/5 pb-3 tracking-tight">Cartões</h4>
            {isDiretoria && (
              <form onSubmit={e => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const name = (fd.get('name') as string).toUpperCase();
                const type = fd.get('type') as string;
                if (name) {
                  if (type === 'Y') setAwayYellow(prev => [...prev, name]);
                  else setAwayRed(prev => [...prev, name]);
                  (e.target as HTMLFormElement).reset();
                }
              }} className="flex gap-3">
                <input name="name" placeholder="Nome" required className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 transition-colors" />
                <select name="type" className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="Y">🟨 Amarelo</option>
                  <option value="R">🟥 Vermelho</option>
                </select>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all">Add</button>
              </form>
            )}
            <ul className="space-y-3">
              {awayYellow.map((n, i) => (
                <li key={`y-${i}`} className="flex justify-between items-center text-sm font-bold bg-black/30 p-3 rounded-xl border border-white/5">
                  <span>🟨 {n}</span>
                  {isDiretoria && <button onClick={() => setAwayYellow(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={18} /></button>}
                </li>
              ))}
              {awayRed.map((n, i) => (
                <li key={`r-${i}`} className="flex justify-between items-center text-sm font-bold bg-black/30 p-3 rounded-xl border border-white/5">
                  <span>🟥 {n}</span>
                  {isDiretoria && <button onClick={() => setAwayRed(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={18} /></button>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <h2 className="text-3xl font-black mt-12 tracking-tight">📌 Ocorrências Gerais</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ListEditor title="🚫 Suspensos" items={suspensos} setter={setSuspensos} placeholder="Nome do jogador" />
        <ListEditor title="📌 Faltas não justificadas" items={faltasNao} setter={setFaltasNao} placeholder="Nome do jogador" />
        <ListEditor title="📆 Cumpriu Suspensão" items={cumpriu} setter={setCumpriu} placeholder="Nome do jogador" />
        <ListEditor title="✅ Faltas justificadas" items={faltasSim} setter={setFaltasSim} placeholder="Nome (motivo)" />
        <ListEditor title="🚑 Departamento Médico" items={medico} setter={setMedico} placeholder="Nome (lesão)" />
        <ListEditor title="🟨 Cartões (Mês)" items={cartoesMes} setter={setCartoesMes} placeholder="Nome (2 amarelos)" />
      </div>

      <div className="bg-[#111] border border-white/5 rounded-3xl p-8 space-y-8 shadow-2xl">
        <h2 className="text-3xl font-black tracking-tight">📄 Prévia e Finalização</h2>
        <pre className="bg-black/50 border border-white/10 p-6 rounded-2xl overflow-x-auto text-sm font-mono text-zinc-300 whitespace-pre-wrap shadow-inner">
          {generateText()}
        </pre>

        <div className="flex flex-col md:flex-row gap-5">
          <button onClick={downloadTxt} className="flex-1 flex justify-center items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-2xl transition-all font-bold shadow-lg">
            <Download size={22} />
            Baixar Súmula (TXT)
          </button>
          {isDiretoria && (
            <button onClick={saveStats} className="flex-1 flex justify-center items-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl transition-all font-bold shadow-lg shadow-emerald-500/20">
              <Save size={22} />
              Salvar no Ranking e Limpar
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
