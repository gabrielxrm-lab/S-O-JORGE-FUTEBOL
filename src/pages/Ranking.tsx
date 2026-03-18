import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, AppData, Player } from '../lib/api';
import { motion } from 'motion/react';
import { Trophy, AlertTriangle, Edit2, X, Save, Goal, Star, Shield } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function Ranking() {
  const { role, canAccess } = useAuth();
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingPlayer, setEditingPlayer] = useState<any>(null);

  const isDiretoria = role === 'Diretoria';
  const hasAccess = canAccess('ranking');

  const loadData = () => {
    api.getData()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const getPlayerPhoto = (name: string) => {
    const player = data?.players.find(p => p.name === name);
    if (player?.photo_file && player.photo_file !== 'Nenhuma') {
      return player.photo_file.startsWith('data:') || player.photo_file.startsWith('http') 
        ? player.photo_file 
        : `https://raw.githubusercontent.com/gabrielxrm-lab/S-O-JORGE-FUTEBOL/main/PLAYER_PHOTOS/${player.photo_file}`;
    }
    return 'https://via.placeholder.com/150x150.png?text=SJFC';
  };

  const handleClear = async () => {
    const confirmText = window.prompt('Esta ação apagará permanentemente TODAS as estatísticas de TODAS as partidas salvas. Esta ação é irreversível.\n\nDigite CONFIRMAR para apagar o histórico:');
    
    if (confirmText !== 'CONFIRMAR') {
      if (confirmText !== null) {
        alert('Texto incorreto. Ação cancelada.');
      }
      return;
    }

    try {
      await api.clearStats();
      alert('O histórico do ranking foi limpo com sucesso!');
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

  const Table = ({ title, icon: Icon, data, columns, colorClass }: any) => (
    <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-white/5 bg-[#0a0a0a] flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
          <Icon className={colorClass.replace('bg-', 'text-')} size={20} />
        </div>
        <h3 className="font-black text-lg tracking-tight">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#0a0a0a] text-zinc-500 uppercase tracking-wider text-[10px] font-black border-b border-white/5">
            <tr>
              <th className="px-6 py-4 w-12 text-center">Pos</th>
              <th className="px-6 py-4">Jogador</th>
              {columns.map((col: any, i: number) => (
                <th key={i} className="px-6 py-4 text-center">{col.label}</th>
              ))}
              {hasAccess && <th className="px-6 py-4 text-center w-16">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (hasAccess ? 3 : 2)} className="px-6 py-12 text-center text-zinc-500 font-bold">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              data.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-black text-xs ${
                      i === 0 ? 'bg-amber-500/20 text-amber-500' : 
                      i === 1 ? 'bg-zinc-400/20 text-zinc-400' : 
                      i === 2 ? 'bg-orange-700/20 text-orange-700' : 'text-zinc-600'
                    }`}>
                      {i + 1}º
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={getPlayerPhoto(row.name)} 
                        alt={row.name} 
                        className="w-10 h-10 rounded-full object-cover border-2 border-white/5 group-hover:border-indigo-500/50 transition-colors"
                      />
                      <span className="font-black text-white group-hover:text-indigo-400 transition-colors">{row.name}</span>
                    </div>
                  </td>
                  {columns.map((col: any, j: number) => (
                    <td key={j} className="px-6 py-4 text-center text-zinc-300 font-black text-base">{row[col.key]}</td>
                  ))}
                  {hasAccess && (
                    <td className="px-6 py-4 text-center">
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

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-2xl">
            <Trophy className="text-amber-500" size={36} />
          </div>
          Ranking Geral
        </h1>
      </div>

      <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 p-5 rounded-2xl font-bold flex items-center gap-3">
        <Star size={20} className="text-indigo-400" />
        As estatísticas são atualizadas automaticamente a cada nova súmula salva.
      </div>

      {editingPlayer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black tracking-tight">Editar: <span className="text-indigo-400">{editingPlayer.name}</span></h2>
              <button onClick={() => setEditingPlayer(null)} className="text-zinc-500 hover:text-white bg-white/5 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSave} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Gols</label>
                  <input type="number" value={editingPlayer.goals} onChange={e => setEditingPlayer({...editingPlayer, goals: parseInt(e.target.value) || 0})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">C. Amarelos</label>
                  <input type="number" value={editingPlayer.yellow_cards} onChange={e => setEditingPlayer({...editingPlayer, yellow_cards: parseInt(e.target.value) || 0})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">C. Vermelhos</label>
                  <input type="number" value={editingPlayer.red_cards} onChange={e => setEditingPlayer({...editingPlayer, red_cards: parseInt(e.target.value) || 0})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Craque</label>
                  <input type="number" value={editingPlayer.craque} onChange={e => setEditingPlayer({...editingPlayer, craque: parseInt(e.target.value) || 0})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Goleiro do Jogo</label>
                  <input type="number" value={editingPlayer.goleiro} onChange={e => setEditingPlayer({...editingPlayer, goleiro: parseInt(e.target.value) || 0})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Gol do Jogo</label>
                  <input type="number" value={editingPlayer.gol} onChange={e => setEditingPlayer({...editingPlayer, gol: parseInt(e.target.value) || 0})} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>
              <div className="pt-6 flex flex-col sm:flex-row justify-end gap-3">
                <button type="button" onClick={() => setEditingPlayer(null)} className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 font-bold transition-colors">Cancelar</button>
                <button type="submit" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all">
                  <Save size={20} /> Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Table 
          title="Artilharia da Temporada" 
          icon={Goal}
          data={artilharia} 
          columns={[{ label: 'Gols', key: 'goals' }]} 
          colorClass="bg-emerald-500"
        />
        <Table 
          title="Prêmios Individuais" 
          icon={Star}
          data={premios} 
          columns={[
            { label: 'Craque', key: 'craque' },
            { label: 'Goleiro', key: 'goleiro' },
            { label: 'Gol do Jogo', key: 'gol' }
          ]} 
          colorClass="bg-amber-500"
        />
        <Table 
          title="Cartões Amarelos" 
          icon={Shield}
          data={amarelos} 
          columns={[{ label: 'Amarelos', key: 'yellow_cards' }]} 
          colorClass="bg-yellow-500"
        />
        <Table 
          title="Cartões Vermelhos" 
          icon={Shield}
          data={vermelhos} 
          columns={[{ label: 'Vermelhos', key: 'red_cards' }]} 
          colorClass="bg-red-500"
        />
      </div>

      {isDiretoria && (
        <div className="mt-12 bg-red-500/10 border border-red-500/20 rounded-3xl p-8">
          <h2 className="text-2xl font-black text-red-500 flex items-center gap-3 mb-4 tracking-tight">
            <AlertTriangle size={28} />
            Área Restrita - Limpar Histórico
          </h2>
          <p className="text-zinc-400 mb-6 font-bold">
            Esta ação apagará permanentemente TODAS as estatísticas de TODAS as partidas salvas. Esta ação é irreversível.
          </p>
          <div className="flex gap-4 max-w-md">
            <button 
              onClick={handleClear}
              className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-2xl transition-all font-black shadow-lg shadow-red-500/20 uppercase tracking-widest text-xs"
            >
              Limpar Ranking
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}