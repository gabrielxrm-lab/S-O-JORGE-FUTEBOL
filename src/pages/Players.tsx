import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, Player, AppData } from '../lib/api';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'motion/react';
import { Search, Plus, Edit2, Trash2, Save, X, Trophy, Star, Shield, Goal, Activity, Users, Upload } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function Players() {
  const { role } = useAuth();
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPos, setFilterPos] = useState('TODOS');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [viewingPlayer, setViewingPlayer] = useState<Player | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const isDiretoria = role === 'Diretoria';
  const hasAccess = role === 'Diretoria' || role === 'Membro';

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setEditingPlayer(prev => prev ? {...prev, photo_file: dataUrl} : null);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
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

      {(isAdding || editingPlayer) && hasAccess && (
        <div className="bg-[#111] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
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

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Foto do Jogador</label>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {editingPlayer?.photo_file && editingPlayer.photo_file !== 'Nenhuma' ? (
                      <img 
                        src={editingPlayer.photo_file.startsWith('data:') || editingPlayer.photo_file.startsWith('http') ? editingPlayer.photo_file : `https://raw.githubusercontent.com/gabrielxrm-lab/S-O-JORGE-FUTEBOL/main/PLAYER_PHOTOS/${editingPlayer.photo_file}`} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-zinc-500 text-xs">Sem foto</span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <label className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl cursor-pointer transition-colors font-bold text-sm w-fit">
                      <Upload size={18} />
                      Fazer Upload de Foto
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    <p className="text-xs text-zinc-500 mt-2">A imagem será redimensionada automaticamente.</p>
                  </div>
                </div>

                {existingPhotos.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Ou escolha uma foto existente:</p>
                    <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                      <button
                        type="button"
                        onClick={() => setEditingPlayer(prev => prev ? {...prev, photo_file: 'Nenhuma'} : null)}
                        className={`w-16 h-16 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-all ${editingPlayer?.photo_file === 'Nenhuma' ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400' : 'border-white/10 bg-white/5 text-zinc-500 hover:border-white/30'}`}
                      >
                        <X size={24} />
                      </button>
                      {existingPhotos.map((photo, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditingPlayer(prev => prev ? {...prev, photo_file: photo} : null)}
                          className={`w-16 h-16 rounded-full overflow-hidden border-2 flex-shrink-0 transition-all ${editingPlayer?.photo_file === photo ? 'border-indigo-500 scale-110 shadow-lg shadow-indigo-500/20' : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'}`}
                        >
                          <img 
                            src={photo.startsWith('data:') || photo.startsWith('http') ? photo : `https://raw.githubusercontent.com/gabrielxrm-lab/S-O-JORGE-FUTEBOL/main/PLAYER_PHOTOS/${photo}`} 
                            alt={`Opção ${idx}`} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {role === 'Diretoria' && (
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Nível do Jogador (1 a 3)</label>
                <select 
                  value={editingPlayer?.level || 1}
                  onChange={e => setEditingPlayer(prev => prev ? {...prev, level: Number(e.target.value)} : null)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value={1}>1 - Iniciante/Regular</option>
                  <option value={2}>2 - Bom/Intermediário</option>
                  <option value={3}>3 - Craque/Avançado</option>
                </select>
              </div>
            )}

            <div className="md:col-span-2 flex flex-col sm:flex-row justify-end gap-4 mt-6">
              <button 
                type="button"
                onClick={() => { setEditingPlayer(null); setIsAdding(false); }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 font-bold transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all"
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
                    ? (viewingPlayer.photo_file.startsWith('data:') || viewingPlayer.photo_file.startsWith('http') ? viewingPlayer.photo_file : `https://raw.githubusercontent.com/gabrielxrm-lab/S-O-JORGE-FUTEBOL/main/PLAYER_PHOTOS/${viewingPlayer.photo_file}`)
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
                      <img 
                        src="https://raw.githubusercontent.com/gabrielxrm-lab/S-O-JORGE-FUTEBOL/main/logo_sao_jorge.png" 
                        alt="Logo SJFC" 
                        className="w-10 h-10 object-contain opacity-80"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=SJFC';
                        }}
                      />
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
            {['TODOS', 'GOLEIRO', 'ZAGUEIRO', 'LATERAL', 'MEIO-CAMPO', 'ATACANTE'].map(pos => (
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

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0a0a0a] text-zinc-400 uppercase tracking-wider text-xs border-b border-white/5">
              <tr>
                <th className="px-6 py-5 font-bold">Nome</th>
                <th className="px-6 py-5 font-bold">Posição</th>
                {role === 'Diretoria' && <th className="px-6 py-5 font-bold">Nível</th>}
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
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100x100.png?text=SJFC'; }}
                        />
                      </div>
                      {player.name}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 font-bold">{player.position}</td>
                    {role === 'Diretoria' && (
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
