import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, GameStat, Match } from '../lib/api';
import { motion } from 'motion/react';
import { Save, Trash2 } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { v4 as uuidv4 } from 'uuid';

// Componentes Modulares
import { MatchInfoFields } from '../components/summary/MatchInfoFields';
import { ListEditor } from '../components/summary/ListEditor';
import { TeamSection } from '../components/summary/TeamSection';
import { SummaryPreview } from '../components/summary/SummaryPreview';

export function MatchSummary() {
  const { role, canAccess } = useAuth();
  const hasAccess = canAccess('matches');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [round, setRound] = useState('');
  const [homeName, setHomeName] = useState('MILAN');
  const [awayName, setAwayName] = useState('INTER');
  const [saving, setSaving] = useState(false);

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
    if (!hasAccess) return;
    
    const statsMap = new Map<string, GameStat>();
    
    const getStat = (name: string) => {
      if (!statsMap.has(name)) {
        statsMap.set(name, {
          date: new Date(date).toLocaleDateString('pt-BR'),
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

    const homeScore = homeGoals.reduce((sum, g) => sum + g.qty, 0);
    const awayScore = awayGoals.reduce((sum, g) => sum + g.qty, 0);

    const match: Match = {
      id: uuidv4(),
      date: new Date(date).toLocaleDateString('pt-BR'),
      homeTeam: homeName,
      awayTeam: awayName,
      homeScore,
      awayScore
    };

    setSaving(true);
    try {
      await api.saveStats(Array.from(statsMap.values()));
      await api.saveMatch(match);
      alert('Estatísticas e placar salvos com sucesso!');
      clearAll();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar estatísticas');
    } finally {
      setSaving(false);
    }
  };

  if (saving) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl">
            <Save className="text-indigo-400" size={36} />
          </div>
          Gerador de Súmula
        </h1>
        {hasAccess && (
          <button onClick={clearAll} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-5 py-3 rounded-xl transition-colors font-bold border border-red-500/20">
            <Trash2 size={20} />
            Limpar Campos
          </button>
        )}
      </div>

      {!hasAccess && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-5 rounded-2xl flex items-center gap-3 font-bold">
          <span className="text-xl">🔒</span> Apenas a Diretoria e Membros podem criar ou editar súmulas.
        </div>
      )}

      <MatchInfoFields 
        date={date} setDate={setDate} 
        round={round} setRound={setRound} 
        hasAccess={hasAccess} 
      />

      <h2 className="text-3xl font-black mt-12 tracking-tight">🏆 Destaques Individuais</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ListEditor title="⭐ Craque(s) do Jogo" items={craques} setter={setCraques} placeholder="Nome do craque" hasAccess={hasAccess} />
        <ListEditor title="🧤 Goleiro(s) do Jogo" items={goleiros} setter={setGoleiros} placeholder="Nome do goleiro" hasAccess={hasAccess} />
        <ListEditor title="⚽ Gol(s) do Jogo" items={golsJogo} setter={setGolsJogo} placeholder="Nome do autor" hasAccess={hasAccess} />
      </div>

      <h2 className="text-3xl font-black mt-12 tracking-tight">📝 Detalhes dos Times</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <TeamSection 
          teamName={homeName} setTeamName={setHomeName}
          logoUrl="https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg"
          colorClass="text-red-500" accentColor="red"
          goals={homeGoals} setGoals={setHomeGoals}
          yellowCards={homeYellow} setYellowCards={setHomeYellow}
          redCards={homeRed} setRedCards={setHomeRed}
          hasAccess={hasAccess}
        />
        <TeamSection 
          teamName={awayName} setTeamName={setAwayName}
          logoUrl="https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg"
          colorClass="text-blue-500" accentColor="blue"
          goals={awayGoals} setGoals={setAwayGoals}
          yellowCards={awayYellow} setYellowCards={setAwayYellow}
          redCards={awayRed} setRedCards={setAwayRed}
          hasAccess={hasAccess}
        />
      </div>

      <h2 className="text-3xl font-black mt-12 tracking-tight">📌 Ocorrências Gerais</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ListEditor title="🚫 Suspensos" items={suspensos} setter={setSuspensos} placeholder="Nome do jogador" hasAccess={hasAccess} />
        <ListEditor title="📌 Faltas não justificadas" items={faltasNao} setter={setFaltasNao} placeholder="Nome do jogador" hasAccess={hasAccess} />
        <ListEditor title="📆 Cumpriu Suspensão" items={cumpriu} setter={setCumpriu} placeholder="Nome do jogador" hasAccess={hasAccess} />
        <ListEditor title="✅ Faltas justificadas" items={faltasSim} setter={setFaltasSim} placeholder="Nome (motivo)" hasAccess={hasAccess} />
        <ListEditor title="🚑 Departamento Médico" items={medico} setter={setMedico} placeholder="Nome (lesão)" hasAccess={hasAccess} />
        <ListEditor title="🟨 Cartões (Mês)" items={cartoesMes} setter={setCartoesMes} placeholder="Nome (2 amarelos)" hasAccess={hasAccess} />
      </div>

      <SummaryPreview 
        text={generateText()} 
        onDownload={downloadTxt} 
        onSave={saveStats} 
        hasAccess={hasAccess} 
      />
    </motion.div>
  );
}