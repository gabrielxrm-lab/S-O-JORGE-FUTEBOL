import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, AppData } from '../lib/api';
import { motion } from 'motion/react';
import { History as HistoryIcon, Calendar, Goal, Star, Shield, Activity, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export function History() {
  const { canAccess } = useAuth();
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    api.getData()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteMatch = async (matchId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta partida e todas as suas estatísticas?')) return;
    
    try {
      await api.deleteMatch(matchId);
      toast.success('Partida excluída com sucesso!');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir partida');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // Group stats by date
  const matchesByDate = new Map<string, any[]>();
  
  if (data?.game_stats) {
    data.game_stats.forEach(stat => {
      if (!stat.date) return;
      const current = matchesByDate.get(stat.date) || [];
      matchesByDate.set(stat.date, [...current, stat]);
    });
  }

  const sortedDates = Array.from(matchesByDate.keys()).sort((a, b) => {
    const [dayA, monthA, yearA] = a.split('/');
    const [dayB, monthB, yearB] = b.split('/');
    return new Date(`${yearB}-${monthB}-${dayB}`).getTime() - new Date(`${yearA}-${monthA}-${dayA}`).getTime();
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl">
            <HistoryIcon className="text-indigo-400" size={36} />
          </div>
          Histórico de Partidas
        </h1>
      </div>

      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
        {sortedDates.length === 0 ? (
          <div className="bg-[#111] border border-white/5 rounded-3xl p-10 text-center text-zinc-500 font-medium text-lg">
            Nenhuma partida registrada no histórico.
          </div>
        ) : (
          sortedDates.map((date, index) => {
            const stats = matchesByDate.get(date) || [];
            const matchInfo = data?.matches?.find(m => m.date === date);
            const isExpanded = expandedMatch === date;
            
            // Calculate match highlights
            const scorers = stats.filter(s => s.goals > 0).sort((a, b) => b.goals - a.goals);
            const yellowCards = stats.filter(s => s.yellow_cards > 0);
            const redCards = stats.filter(s => s.red_cards > 0);
            const craques = stats.filter(s => s.craque_do_jogo).map(s => s.player_name);
            const goleiros = stats.filter(s => s.goleiro_do_jogo).map(s => s.player_name);
            const totalGoals = stats.reduce((sum, s) => sum + (s.goals || 0), 0);

            return (
              <div key={date} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-[#111] text-zinc-500 group-hover:text-indigo-400 group-hover:border-indigo-500/50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors z-10">
                  <Calendar size={18} />
                </div>
                
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#111] border border-white/5 p-6 rounded-3xl shadow-xl hover:border-indigo-500/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <h3 className="font-black text-xl text-white">{date}</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full w-fit">
                        <Goal size={14} /> {totalGoals} Gols
                      </div>
                      {canAccess('matches') && matchInfo && (
                        <button 
                          onClick={() => handleDeleteMatch(matchInfo.id)}
                          className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Excluir Partida"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {matchInfo && (
                    <div className="mb-6 p-4 bg-black/30 rounded-2xl border border-white/5 flex items-center justify-center gap-6">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{matchInfo.homeTeam}</p>
                        <p className="text-3xl font-black text-white">{matchInfo.homeScore}</p>
                      </div>
                      <div className="text-zinc-700 font-black text-xl">X</div>
                      <div className="text-center">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{matchInfo.awayTeam}</p>
                        <p className="text-3xl font-black text-white">{matchInfo.awayScore}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {craques.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Star size={14} className="text-amber-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Craque</p>
                            <p className="text-xs font-bold text-zinc-300 truncate">{craques[0]}</p>
                          </div>
                        </div>
                      )}
                      {goleiros.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Shield size={14} className="text-blue-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Goleiro</p>
                            <p className="text-xs font-bold text-zinc-300 truncate">{goleiros[0]}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => setExpandedMatch(isExpanded ? null : date)}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 transition-colors"
                    >
                      {isExpanded ? (
                        <>Ocultar Detalhes <ChevronUp size={14} /></>
                      ) : (
                        <>Ver Detalhes da Partida <ChevronDown size={14} /></>
                      )}
                    </button>

                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="space-y-4 pt-2 border-t border-white/5"
                      >
                        {scorers.length > 0 && (
                          <div>
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Artilheiros</p>
                            <div className="space-y-1">
                              {scorers.map(s => (
                                <div key={s.player_name} className="flex justify-between text-xs font-bold">
                                  <span className="text-zinc-300">{s.player_name}</span>
                                  <span className="text-white">{s.goals} {s.goals > 1 ? 'gols' : 'gol'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {(yellowCards.length > 0 || redCards.length > 0) && (
                          <div>
                            <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-2">Cartões</p>
                            <div className="space-y-1">
                              {yellowCards.map(s => (
                                <div key={s.player_name} className="flex items-center gap-2 text-xs font-bold">
                                  <div className="w-2 h-3 bg-yellow-400 rounded-sm"></div>
                                  <span className="text-zinc-300">{s.player_name}</span>
                                </div>
                              ))}
                              {redCards.map(s => (
                                <div key={s.player_name} className="flex items-center gap-2 text-xs font-bold">
                                  <div className="w-2 h-3 bg-red-500 rounded-sm"></div>
                                  <span className="text-zinc-300">{s.player_name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                          <Activity size={12} /> {stats.length} jogadores participaram
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}