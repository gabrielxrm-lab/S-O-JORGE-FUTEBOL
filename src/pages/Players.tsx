import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, Player, AppData } from '../lib/api';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'motion/react';
import { Plus, Edit2, Trash2, Star, Users } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

// Componentes Modulares
import { PlayerFilters } from '../components/players/PlayerFilters';
import { PlayerProfileModal } from '../components/players/PlayerProfileModal';
import { PlayerForm } from '../components/players/PlayerForm';

export function Players() {
  const { role, canAccess } = useAuth();
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPos, setFilterPos] = useState('TODOS');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [viewingPlayer, setViewingPlayer] = useState<Player | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const isDiretoria = role === 'Diretoria';
  const hasAccess = canAccess('players');

  const loadData = () => {
    api.getData()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
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
      alert(`Erro ao salvar jogador: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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

  const filteredPlayers = data?.players.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesPos = filterPos === 'TODOS' || p.position === filterPos;
    return matchesSearch && matchesPos;
  }) || [];

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

  const existingPhotos = Array.from(new Set(data?.players?.map(p => p.photo_file).filter(p => p && p !== 'Nenhuma') || [])) as string[];

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl">
            <Users className="text-indigo-400" size={36} />
          </div>
          Gerenciamento de Jogadores
        </h1>
        {hasAccess && !isAdding && !editingPlayer && (
          <button 
            onClick={startAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl transition-all font-bold shadow-lg shadow-indigo-500/20"
          >
            <Plus size={20} />
            Novo Jogador
          </button>
        )}
      </div>

      {!hasAccess && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-5 rounded-2xl flex items-center gap-3 font-bold">
          <span className="text-xl">🔒</span> Modo de visualização. Para editar, acesse como Diretoria na página principal.
        </div>
      )}

      {(isAdding || editingPlayer) && editingPlayer && hasAccess && (
        <PlayerForm 
          player={editingPlayer}
          setPlayer={setEditingPlayer}
          isAdding={isAdding}
          onSave={handleSave}
          onCancel={() => { setEditingPlayer(null); setIsAdding(false); }}
          existingPhotos={existingPhotos}
          isDiretoria={isDiretoria}
        />
      )}

      {viewingPlayer && (
        <PlayerProfileModal 
          player={viewingPlayer}
          stats={getPlayerStats(viewingPlayer.name)}
          onClose={() => setViewingPlayer(null)}
        />
      )}

      <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <PlayerFilters 
          search={search}
          setSearch={setSearch}
          filterPos={filterPos}
          setFilterPos={setFilterPos}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0a0a0a] text-zinc-400 uppercase tracking-wider text-xs border-b border-white/5">
              <tr>
                <th className="px-6 py-5 font-bold">Nome</th>
                <th className="px-6 py-5 font-bold">Posição</th>
                {isDiretoria && <th className="px-6 py-5 font-bold">Nível</th>}
                <th className="px-6 py-5 font-bold">Camisa</th>
                <th className="px-6 py-5 font-bold">Idade/Nasc.</th>
                {hasAccess && <th className="px-6 py-5 font-bold text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-zinc-500 font-medium text-lg">
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
                            ? (player.photo_file.startsWith('data:') || player.photo_file.startsWith('http') ? player.photo_file : `https://raw.githubusercontent.com/gabrielxrm-lab/S-O-JORGE-FUTEBOL/main/PLAYER_PHOTOS/${player.photo_file}`)
                            : 'https://via.placeholder.com/100x100.png?text=SJFC'}
                          alt={player.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {player.name}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 font-bold">{player.position}</td>
                    {isDiretoria && (
                      <td className="px-6 py-4 text-zinc-400 font-bold">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: player.level || 1 }).map((_, i) => (
                            <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                          ))}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 text-zinc-400 font-bold">{player.shirt_number || '-'}</td>
                    <td className="px-6 py-4 text-zinc-400 font-bold">{player.date_of_birth || '-'}</td>
                    {hasAccess && (
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