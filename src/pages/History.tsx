import React, { useEffect, useState } from 'react';
import { api, AppData } from '../lib/api';
import { motion } from 'motion/react';
import { History as HistoryIcon, Calendar, Goal, Star, Shield, Activity } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function History() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getData()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
            
            // Calculate match highlights
            const totalGoals = stats.reduce((sum, s) => sum + (s.goals || 0), 0);
            const craques = stats.filter(s => s.craque_do_jogo).map(s => s.player_name);
            const goleiros = stats.filter(s => s.goleiro_do_jogo).map(s => s.player_name);

            return (
              <div key={date} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-[#111] text-zinc-500 group-hover:text-indigo-400 group-hover:border-indigo-500/50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors z-10">
                  <Calendar size={18} />
                </div>
                
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#111] border border-white/5 p-6 rounded-3xl shadow-xl hover:border-indigo-500/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <h3 className="font-black text-xl text-white">{date}</h3>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full w-fit">
                      <Goal size={14} /> {totalGoals} Gols
                    </div>
                  </div>

                  <div className="space-y-3">
                    {craques.length > 0 && (
                      <div className="flex items-start gap-3">
                        <Star size={16} className="text-amber-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Craque(s) do Jogo</p>
                          <p className="text-sm font-medium text-zinc-300">{craques.join(', ')}</p>
                        </div>
                      </div>
                    )}
                    
                    {goleiros.length > 0 && (
                      <div className="flex items-start gap-3">
                        <Shield size={16} className="text-blue-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Goleiro(s) do Jogo</p>
                          <p className="text-sm font-medium text-zinc-300">{goleiros.join(', ')}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <Activity size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Participantes</p>
                        <p className="text-sm font-medium text-zinc-300">{stats.length} jogadores</p>
                      </div>
                    </div>
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
