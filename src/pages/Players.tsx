import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, Player, AppData } from '../lib/api';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'motion/react';
import { Search, Plus, Edit2, Trash2, Save, X, Trophy, Star, Shield, Goal, Activity, Users } from 'lucide-react';

export function Players() {
  const { role } = useAuth();
  const [data, setData] = useState<AppData | null>(null);
  const [search, setSearch] = useState('');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [viewingPlayer, setViewingPlayer] = useState<Player | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const isDiretoria = role === 'Diretoria';

  const loadData = () => {
    api.getData().then(setData).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;

    try {
      await api.savePlayer(editingPlayer);
      setEditingPlayer(null);
      setIsAdding(false);
      loadData();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar jogador');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este jogador?')) return;
    try {
      await api.deletePlayer(id);
      loadData();
    } catch (error) {
      console.error(error);
      alert('Erro ao excluir jogador');
    }
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingPlayer({
      id: uuidv4(),
      name: '',
      position: 'MEIO-CAMPO',
      shirt_number: '',
      date_of_birth: '',
      phone: '',
      photo_file: 'Nenhuma',
      team_start_date: new Date().toLocaleDateString('pt-BR')
    });
  };

  const filteredPlayers = data?.players.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const getPlayerStats = (playerName: string) => {
    if (!data) return null;
    const stats = data.game_stats.filter(s => s.player_name === playerName);
    return {
      goals: stats.reduce((sum, s) => sum + s.goals, 0),
      yellow_cards: stats.reduce((sum, s) => sum + s.yellow_cards, 0),
      red_cards: stats.reduce((sum, s) => sum + s.red_cards, 0),
      craque: stats.reduce((sum, s) => sum + (typeof s.craque_do_jogo === 'boolean' ? (s.craque_do_jogo ? 1 : 0) : s.craque_do_jogo), 0),
      goleiro: stats.reduce((sum, s) => sum + (typeof s.goleiro_do_jogo === 'boolean' ? (s.goleiro_do_jogo ? 1 : 0) : s.goleiro_do_jogo), 0),
      gol: stats.reduce((sum, s) => sum + (typeof s.gol_do_jogo === 'boolean' ? (s.gol_do_jogo ? 1 : 0) : s.gol_do_jogo), 0),
      matches: stats.length
    };
  };

  const getPositionColor = (position: string) => {
    switch(position) {
      case 'GOLEIRO': return 'from-amber-500 to-orange-600';
      case 'ZAGUEIRO': return 'from-blue-500 to-indigo-600';
      case 'LATERAL': return 'from-cyan-500 to-blue-600';
      case 'MEIO-CAMPO': return 'from-emerald-500 to-teal-600';
      case 'ATACANTE': return 'from-rose-500 to-red-600';
      default: return 'from-zinc-500 to-zinc-700';
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl">
            <Users className="text-indigo-400" size={36} />
          </div>
          Gerenciamento de Jogadores
        </h1>
        {isDiretoria && !isAdding && !editingPlayer && (
          <button 
            onClick={startAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl transition-all font-bold shadow-lg shadow-indigo-500/20"
          >
            <Plus size={20} />
            Novo Jogador
          </button>
        )}
      </div>

      {!isDiretoria && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-5 rounded-2xl flex items-center gap-3 font-bold">
          <span className="text-xl">🔒</span> Modo de visualização. Para editar, acesse como Diretoria na página principal.
        </div>
      )}

      {(isAdding || editingPlayer) && isDiretoria && (
        <div className="bg-[#111] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          <div className="flex justify-between items-center mb-8 relative z-10">
            <h2 className="text-2xl font-black tracking-tight">{isAdding ? 'Cadastrar Novo Jogador' : 'Editar Jogador'}</h2>
            <button 
              onClick={() => { setEditingPlayer(null); setIsAdding(false); }}
              className="text-zinc-500 hover:text-white bg-white/5 p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Nome do Jogador</label>
              <input 
                required
                type="text" 
                value={editingPlayer?.name || ''}
                onChange={e => setEditingPlayer(prev => prev ? {...prev, name: e.target.value.toUpperCase()} : null)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 uppercase transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Posição</label>
              <select 
                value={editingPlayer?.position || 'MEIO-CAMPO'}
                onChange={e => setEditingPlayer(prev => prev ? {...prev, position: e.target.value} : null)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="GOLEIRO">GOLEIRO</option>
                <option value="ZAGUEIRO">ZAGUEIRO</option>
                <option value="LATERAL">LATERAL</option>
                <option value="MEIO-CAMPO">MEIO-CAMPO</option>
                <option value="ATACANTE">ATACANTE</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Nº da Camisa</label>
              <input 
                type="text" 
                value={editingPlayer?.shirt_number || ''}
                onChange={e => setEditingPlayer(prev => prev ? {...prev, shirt_number: e.target.value} : null)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Data Nasc. (DD/MM/AAAA)</label>
              <input 
                type="text" 
                placeholder="DD/MM/AAAA"
                value={editingPlayer?.date_of_birth || ''}
                onChange={e => setEditingPlayer(prev => prev ? {...prev, date_of_birth: e.target.value} : null)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Telefone</label>
              <input 
                type="text" 
                value={editingPlayer?.phone || ''}
                onChange={e => setEditingPlayer(prev => prev ? {...prev, phone: e.target.value} : null)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Foto (Nome do arquivo no GitHub)</label>
              <input 
                type="text" 
                placeholder="Ex: joao.jpg ou Nenhuma"
                value={editingPlayer?.photo_file || 'Nenhuma'}
                onChange={e => setEditingPlayer(prev => prev ? {...prev, photo_file: e.target.value} : null)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-4 mt-6">
              <button 
                type="button"
                onClick={() => { setEditingPlayer(null); setIsAdding(false); }}
                className="px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 font-bold transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all"
              >
                <Save size={20} />
                Salvar Jogador
              </button>
            </div>
          </form>
        </div>
      )}

      {viewingPlayer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingPlayer(null)}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-[#0a0a0a]"
          >
            <button 
              onClick={() => setViewingPlayer(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
            >
              <X size={18} />
            </button>

            <div className={`h-32 bg-gradient-to-br ${getPositionColor(viewingPlayer.position)} relative`}>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full border-4 border-[#0a0a0a] overflow-hidden bg-zinc-800 shadow-xl">
                <img 
                  src={viewingPlayer.photo_file && viewingPlayer.photo_file !== 'Nenhuma' 
                    ? `https://raw.githubusercontent.com/gabrielxrm-lab/sjfc-streamlit-app/main/player_photos/${viewingPlayer.photo_file}`
                    : 'https://via.placeholder.com/150x150.png?text=SJFC'}
                  alt={viewingPlayer.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150x150.png?text=SJFC'; }}
                />
              </div>
            </div>

            <div className="pt-20 pb-8 px-6 text-center">
              <h2 className="text-2xl font-black text-white tracking-tight">{viewingPlayer.name}</h2>
              <div className="flex items-center justify-center gap-2 mt-1 mb-6">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r ${getPositionColor(viewingPlayer.position)} text-white shadow-lg`}>
                  {viewingPlayer.position}
                </span>
                {viewingPlayer.shirt_number && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/5">
                    Nº {viewingPlayer.shirt_number}
                  </span>
                )}
              </div>

              {(() => {
                const stats = getPlayerStats(viewingPlayer.name);
                if (!stats) return null;
                
                return (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center">
                      <Goal size={20} className="text-emerald-400 mb-1" />
                      <span className="text-2xl font-black text-white">{stats.goals}</span>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Gols</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center">
                      <Star size={20} className="text-amber-400 mb-1" />
                      <span className="text-2xl font-black text-white">{stats.craque}</span>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Craque</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center">
                      <Activity size={20} className="text-indigo-400 mb-1" />
                      <span className="text-2xl font-black text-white">{stats.matches}</span>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Jogos</span>
                    </div>
                    
                    <div className="col-span-3 grid grid-cols-2 gap-3 mt-1">
                      <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-4 bg-yellow-400 rounded-sm"></div>
                          <span className="text-xs font-medium text-zinc-300">Amarelos</span>
                        </div>
                        <span className="font-bold text-white">{stats.yellow_cards}</span>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-4 bg-red-500 rounded-sm"></div>
                          <span className="text-xs font-medium text-zinc-300">Vermelhos</span>
                        </div>
                        <span className="font-bold text-white">{stats.red_cards}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        </div>
      )}

      <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-[#0a0a0a]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            <input 
              type="text" 
              placeholder="Buscar jogador..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0a0a0a] text-zinc-400 uppercase tracking-wider text-xs border-b border-white/5">
              <tr>
                <th className="px-6 py-5 font-bold">Nome</th>
                <th className="px-6 py-5 font-bold">Posição</th>
                <th className="px-6 py-5 font-bold">Camisa</th>
                <th className="px-6 py-5 font-bold">Idade/Nasc.</th>
                {isDiretoria && <th className="px-6 py-5 font-bold text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-zinc-500 font-medium text-lg">
                    Nenhum jogador encontrado.
                  </td>
                </tr>
              ) : (
                filteredPlayers.map(player => (
                  <tr 
                    key={player.id} 
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                    onClick={() => setViewingPlayer(player)}
                  >
                    <td className="px-6 py-4 font-black text-white flex items-center gap-4 group-hover:text-indigo-400 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-zinc-900 overflow-hidden flex-shrink-0 border-2 border-transparent group-hover:border-indigo-500 transition-colors shadow-md">
                        <img 
                          src={player.photo_file && player.photo_file !== 'Nenhuma' 
                            ? `https://raw.githubusercontent.com/gabrielxrm-lab/sjfc-streamlit-app/main/player_photos/${player.photo_file}`
                            : 'https://via.placeholder.com/100x100.png?text=SJFC'}
                          alt={player.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100x100.png?text=SJFC'; }}
                        />
                      </div>
                      {player.name}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 font-bold">{player.position}</td>
                    <td className="px-6 py-4 text-zinc-400 font-bold">{player.shirt_number || '-'}</td>
                    <td className="px-6 py-4 text-zinc-400 font-bold">{player.date_of_birth || '-'}</td>
                    {isDiretoria && (
                      <td className="px-6 py-4 text-right space-x-2" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => { setEditingPlayer(player); setIsAdding(false); }}
                          className="p-2 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(player.id)}
                          className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
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
    </motion.div>
  );
}
