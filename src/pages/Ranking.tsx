import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, AppData } from '../lib/api';
import { motion } from 'motion/react';
import { Trophy, AlertTriangle, Edit2, X, Save } from 'lucide-react';

export function Ranking() {
  const { role } = useAuth();
  const [data, setData] = useState<AppData | null>(null);
  const [password, setPassword] = useState('');
  const [editingPlayer, setEditingPlayer] = useState<any>(null);

  const isDiretoria = role === 'Diretoria';

  const loadData = () => {
    api.getData().then(setData).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClear = async () => {
    const correctPassword = import.meta.env.VITE_DIRETORIA_PASSWORD || 'admin123';
    if (password !== correctPassword) {
      alert('Senha incorreta.');
      return;
    }

    if (!window.confirm('Esta ação apagará permanentemente TODAS as estatísticas de TODAS as partidas salvas. Esta ação é irreversível.')) return;

    try {
      await api.clearStats();
      alert('O histórico do ranking foi limpo com sucesso!');
      setPassword('');
      loadData();
    } catch (error) {
      console.error(error);
      alert('Erro ao limpar o ranking');
    }
  };

  if (!data) return null;

  const stats = data.game_stats || [];

  const rankingMap = new Map<string, any>();
  stats.forEach(stat => {
    if (!rankingMap.has(stat.player_name)) {
      rankingMap.set(stat.player_name, {
        name: stat.player_name,
        goals: 0,
        yellow_cards: 0,
        red_cards: 0,
        craque: 0,
        goleiro: 0,
        gol: 0
      });
    }
    const p = rankingMap.get(stat.player_name);
    p.goals += stat.goals;
    p.yellow_cards += stat.yellow_cards;
    p.red_cards += stat.red_cards;
    p.craque += (typeof stat.craque_do_jogo === 'boolean' ? (stat.craque_do_jogo ? 1 : 0) : stat.craque_do_jogo);
    p.goleiro += (typeof stat.goleiro_do_jogo === 'boolean' ? (stat.goleiro_do_jogo ? 1 : 0) : stat.goleiro_do_jogo);
    p.gol += (typeof stat.gol_do_jogo === 'boolean' ? (stat.gol_do_jogo ? 1 : 0) : stat.gol_do_jogo);
  });

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updatePlayerStats({
        player_name: editingPlayer.name,
        goals: editingPlayer.goals,
        yellow_cards: editingPlayer.yellow_cards,
        red_cards: editingPlayer.red_cards,
        craque: editingPlayer.craque,
        goleiro: editingPlayer.goleiro,
        gol: editingPlayer.gol
      });
      setEditingPlayer(null);
      loadData();
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar estatísticas');
    }
  };

  const ranking = Array.from(rankingMap.values());

  const artilharia = [...ranking].filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals);
  const amarelos = [...ranking].filter(p => p.yellow_cards > 0).sort((a, b) => b.yellow_cards - a.yellow_cards);
  const vermelhos = [...ranking].filter(p => p.red_cards > 0).sort((a, b) => b.red_cards - a.red_cards);
  const premios = [...ranking].filter(p => p.craque > 0 || p.goleiro > 0 || p.gol > 0).sort((a, b) => b.craque - a.craque);

  const Table = ({ title, data, columns }: any) => (
    <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-5 border-b border-white/5 bg-[#0a0a0a]">
        <h3 className="font-bold text-lg flex items-center gap-2 tracking-tight">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#0a0a0a] text-zinc-400 uppercase tracking-wider text-xs border-b border-white/5">
            <tr>
              <th className="px-5 py-4 font-bold w-12 text-center">#</th>
              <th className="px-5 py-4 font-bold">Jogador</th>
              {columns.map((col: any, i: number) => (
                <th key={i} className="px-5 py-4 font-bold text-center">{col.label}</th>
              ))}
              {isDiretoria && <th className="px-5 py-4 font-bold text-center w-16">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (isDiretoria ? 3 : 2)} className="px-5 py-8 text-center text-zinc-500 font-medium">
                  Nenhum registro.
                </td>
              </tr>
            ) : (
              data.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-white/5 transition-colors group">
                  <td className="px-5 py-4 text-center text-zinc-500 font-bold">{i + 1}</td>
                  <td className="px-5 py-4 font-bold text-white group-hover:text-indigo-400 transition-colors">{row.name}</td>
                  {columns.map((col: any, j: number) => (
                    <td key={j} className="px-5 py-4 text-center text-zinc-300 font-black text-base">{row[col.key]}</td>
                  ))}
                  {isDiretoria && (
                    <td className="px-5 py-4 text-center">
                      <button 
                        onClick={() => setEditingPlayer({...row})}
                        className="text-zinc-500 hover:text-indigo-400 p-2 rounded-lg hover:bg-indigo-500/10 transition-colors"
                        title="Editar Estatísticas"
                      >
                        <Edit2 size={18} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
          <div className="p-3 bg-yellow-500/10 rounded-2xl">
            <Trophy className="text-yellow-500" size={36} />
          </div>
          Ranking Geral
        </h1>
      </div>

      <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 p-4 rounded-2xl font-medium">
        As estatísticas são atualizadas sempre que uma nova súmula é salva.
      </div>

      {editingPlayer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black tracking-tight">Editar: <span className="text-indigo-400">{editingPlayer.name}</span></h2>
              <button onClick={() => setEditingPlayer(null)} className="text-zinc-500 hover:text-white bg-white/5 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSave} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Gols</label>
                  <input type="number" value={editingPlayer.goals} onChange={e => setEditingPlayer({...editingPlayer, goals: parseInt(e.target.value) || 0})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">C. Amarelos</label>
                  <input type="number" value={editingPlayer.yellow_cards} onChange={e => setEditingPlayer({...editingPlayer, yellow_cards: parseInt(e.target.value) || 0})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">C. Vermelhos</label>
                  <input type="number" value={editingPlayer.red_cards} onChange={e => setEditingPlayer({...editingPlayer, red_cards: parseInt(e.target.value) || 0})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Craque</label>
                  <input type="number" value={editingPlayer.craque} onChange={e => setEditingPlayer({...editingPlayer, craque: parseInt(e.target.value) || 0})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Goleiro do Jogo</label>
                  <input type="number" value={editingPlayer.goleiro} onChange={e => setEditingPlayer({...editingPlayer, goleiro: parseInt(e.target.value) || 0})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Gol do Jogo</label>
                  <input type="number" value={editingPlayer.gol} onChange={e => setEditingPlayer({...editingPlayer, gol: parseInt(e.target.value) || 0})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>
              <div className="pt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingPlayer(null)} className="px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 font-bold transition-colors">Cancelar</button>
                <button type="submit" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all">
                  <Save size={20} /> Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Table 
          title="⚽ Artilharia" 
          data={artilharia} 
          columns={[{ label: 'Gols', key: 'goals' }]} 
        />
        <Table 
          title="🟨 Cartões Amarelos" 
          data={amarelos} 
          columns={[{ label: 'Amarelos', key: 'yellow_cards' }]} 
        />
        <Table 
          title="🟥 Cartões Vermelhos" 
          data={vermelhos} 
          columns={[{ label: 'Vermelhos', key: 'red_cards' }]} 
        />
        <Table 
          title="⭐ Prêmios Individuais" 
          data={premios} 
          columns={[
            { label: 'Craque', key: 'craque' },
            { label: 'Goleiro', key: 'goleiro' },
            { label: 'Gol do Jogo', key: 'gol' }
          ]} 
        />
      </div>

      {isDiretoria && (
        <div className="mt-12 bg-red-500/10 border border-red-500/20 rounded-3xl p-8">
          <h2 className="text-2xl font-black text-red-500 flex items-center gap-3 mb-4 tracking-tight">
            <AlertTriangle size={28} />
            Área Restrita - Limpar Histórico
          </h2>
          <p className="text-zinc-400 mb-6 font-medium">
            Esta ação apagará permanentemente TODAS as estatísticas de TODAS as partidas salvas. Esta ação é irreversível.
          </p>
          <div className="flex gap-4 max-w-md">
            <input 
              type="password" 
              placeholder="Senha da Diretoria" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 transition-colors"
            />
            <button 
              onClick={handleClear}
              disabled={!password}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl transition-all font-bold shadow-lg shadow-red-500/20"
            >
              Limpar Ranking
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
