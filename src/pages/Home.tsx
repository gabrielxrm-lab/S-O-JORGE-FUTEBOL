import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, AppData } from '../lib/api';
import { nextSunday, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import { motion } from 'motion/react';
import { Calendar, Trophy, Users, MessageCircle, Goal, Star, Shield, Wallet, Plus, FileText, ArrowRight } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useNavigate, Link } from 'react-router-dom';

export function Home() {
  const { role, canAccess } = useAuth();
  const hasAccess = role === 'Diretoria' || role === 'Membro';
  const navigate = useNavigate();

  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    api.getData()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      let nextGame = nextSunday(now);
      nextGame = setHours(nextGame, 7);
      nextGame = setMinutes(nextGame, 0);
      nextGame = setSeconds(nextGame, 0);
      nextGame = setMilliseconds(nextGame, 0);

      if (nextGame < now) {
        nextGame.setDate(nextGame.getDate() + 7);
      }

      const diff = nextGame.getTime() - now.getTime();
      if (diff < 0) {
        setTimeLeft('É DIA DE JOGO!');
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${d}d ${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
    };

    const timer = setInterval(updateCountdown, 1000);
    updateCountdown();
    return () => clearInterval(timer);
  }, []);

  const currentMonth = new Date().getMonth() + 1;
  const birthdays = data?.players.filter(p => {
    if (!p.date_of_birth) return false;
    const parts = p.date_of_birth.split('/');
    if (parts.length !== 3) return false;
    return parseInt(parts[1], 10) === currentMonth;
  }).sort((a, b) => {
    const dayA = parseInt(a.date_of_birth.split('/')[0], 10);
    const dayB = parseInt(b.date_of_birth.split('/')[0], 10);
    return dayA - dayB;
  }) || [];

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const handleShareBirthdays = () => {
    if (birthdays.length === 0) return;
    const monthName = monthNames[currentMonth - 1];
    let message = `🎂 *Aniversariantes de ${monthName}* 🎂\n\n`;
    birthdays.forEach(p => {
      const day = p.date_of_birth.split('/')[0];
      message += `Dia ${day} - ${p.name}\n`;
    });
    message += `\nParabéns aos nossos craques! 🎉⚽`;
    
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Calculate top stats
  const playerStats = new Map<string, { goals: number, craque: number, goleiro: number }>();
  
  if (data?.game_stats) {
    data.game_stats.forEach(stat => {
      const current = playerStats.get(stat.player_name) || { goals: 0, craque: 0, goleiro: 0 };
      playerStats.set(stat.player_name, {
        goals: current.goals + (stat.goals || 0),
        craque: current.craque + (Number(stat.craque_do_jogo) || 0),
        goleiro: current.goleiro + (Number(stat.goleiro_do_jogo) || 0)
      });
    });
  }

  const topScorers = Array.from(playerStats.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 3);

  const getPlayerPhoto = (name: string) => {
    const player = data?.players.find(p => p.name === name);
    if (player?.photo_file && player.photo_file !== 'Nenhuma') {
      return player.photo_file.startsWith('data:') || player.photo_file.startsWith('http') 
        ? player.photo_file 
        : `https://raw.githubusercontent.com/gabrielxrm-lab/S-O-JORGE-FUTEBOL/main/PLAYER_PHOTOS/${player.photo_file}`;
    }
    return 'https://via.placeholder.com/150x150.png?text=SJFC';
  };

  // Financial Summary
  const totalIncome = data?.transactions?.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0) || 0;
  const totalExpense = data?.transactions?.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0) || 0;
  const balance = totalIncome - totalExpense;

  // Last Match
  const lastMatch = data?.matches && data.matches.length > 0 
    ? [...data.matches].sort((a, b) => {
        const [da, ma, ya] = a.date.split('/');
        const [db, mb, yb] = b.date.split('/');
        return new Date(`${yb}-${mb}-${db}`).getTime() - new Date(`${ya}-${ma}-${da}`).getTime();
      }).pop()
    : null;

  const lastMatchStats = lastMatch ? data?.game_stats.filter(s => s.date === lastMatch.date) : [];
  const totalGoals = lastMatch ? (lastMatch.homeScore + lastMatch.awayScore) : 0;

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-10"
    >
      <header className="flex flex-col items-center justify-center text-center gap-6">
        <div className="flex flex-col items-center gap-4">
          <img 
            src="https://raw.githubusercontent.com/gabrielxrm-lab/S-O-JORGE-FUTEBOL/main/logo_sao_jorge.png" 
            alt="Logo SJFC" 
            className="w-32 h-32 object-contain drop-shadow-2xl"
          />
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">São Jorge FC</h1>
            <p className="text-zinc-400 font-bold tracking-widest uppercase text-sm">Painel de Controle</p>
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-black tracking-widest uppercase text-zinc-400">
            {role}
          </div>
          <p className="text-zinc-500 text-xs font-medium">Versão 2.0.4 • Est. 1980</p>
        </div>
      </header>

      {/* Top Section: Countdown & Financial */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-[#111] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[200px]">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none"></div>
          <h2 className="text-zinc-500 uppercase tracking-widest text-xs font-black mb-4 flex items-center gap-2 relative z-10">
            <Calendar size={18} className="text-indigo-400" />
            Próximo Jogo: Domingo, 07:00
          </h2>
          <div className="font-mono text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400 tracking-wider relative z-10 drop-shadow-lg">
            {timeLeft || 'Calculando...'}
          </div>
        </section>

        {canAccess('payments') && (
          <section className="bg-[#111] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none"></div>
            <h2 className="text-zinc-500 uppercase tracking-widest text-xs font-black mb-4 flex items-center gap-2 relative z-10">
              <Wallet size={18} className="text-emerald-400" />
              Saldo em Caixa
            </h2>
            <div className={`text-4xl font-black tracking-tight relative z-10 ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <Link to="/payments" className="mt-4 text-xs font-bold text-zinc-500 hover:text-white flex items-center gap-1 transition-colors relative z-10">
              Ver detalhes do financeiro <ArrowRight size={12} />
            </Link>
          </section>
        )}
      </div>

      {/* Quick Actions for Admins */}
      {hasAccess && (
        <section className="space-y-4">
          <h2 className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Ações Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/summary')}
              className="flex flex-col items-center justify-center gap-3 p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all group"
            >
              <div className="p-3 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
                <FileText className="text-indigo-400" size={24} />
              </div>
              <span className="text-sm font-bold text-zinc-300">Nova Súmula</span>
            </button>
            
            <button 
              onClick={() => navigate('/players')}
              className="flex flex-col items-center justify-center gap-3 p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all group"
            >
              <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                <Plus className="text-emerald-400" size={24} />
              </div>
              <span className="text-sm font-bold text-zinc-300">Novo Jogador</span>
            </button>

            <button 
              onClick={() => navigate('/draw')}
              className="flex flex-col items-center justify-center gap-3 p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-amber-500/10 hover:border-amber-500/30 transition-all group"
            >
              <div className="p-3 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-colors">
                <Trophy className="text-amber-400" size={24} />
              </div>
              <span className="text-sm font-bold text-zinc-300">Sortear Times</span>
            </button>

            <button 
              onClick={() => navigate('/payments')}
              className="flex flex-col items-center justify-center gap-3 p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-violet-500/10 hover:border-violet-500/30 transition-all group"
            >
              <div className="p-3 bg-violet-500/10 rounded-xl group-hover:bg-violet-500/20 transition-colors">
                <Wallet className="text-violet-400" size={24} />
              </div>
              <span className="text-sm font-bold text-zinc-300">Financeiro</span>
            </button>
          </div>
        </section>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Last Match & Birthdays */}
        <div className="lg:col-span-2 space-y-8">
          {/* Last Match Highlight */}
          <section className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-white/5 bg-black/20 flex justify-between items-center">
              <h3 className="font-black uppercase tracking-widest text-xs text-zinc-500 flex items-center gap-2">
                <Trophy size={16} className="text-amber-400" /> Última Partida
              </h3>
              <span className="text-xs font-bold text-zinc-400">{lastMatch?.date || 'Nenhuma partida'}</span>
            </div>
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-6">
              {lastMatch ? (
                <>
                  <div className="flex items-center gap-8 sm:gap-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg" alt="Milan" className="w-10 h-10 object-contain" />
                      </div>
                      <span className="font-black text-sm tracking-tighter">{lastMatch.homeTeam}</span>
                    </div>
                    <div className="text-5xl font-black text-white flex items-center gap-4">
                      <span>{lastMatch.homeScore}</span>
                      <span className="text-zinc-700 text-2xl">X</span>
                      <span>{lastMatch.awayScore}</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg" alt="Inter" className="w-10 h-10 object-contain" />
                      </div>
                      <span className="font-black text-sm tracking-tighter">{lastMatch.awayTeam}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-bold text-emerald-400 flex items-center gap-2">
                      <Goal size={14} /> {totalGoals} Gols Marcados
                    </div>
                    <Link to="/history" className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-zinc-400 hover:text-white transition-colors">
                      Ver Súmula Completa
                    </Link>
                  </div>
                </>
              ) : (
                <p className="text-zinc-500 font-medium">Aguardando a primeira partida da temporada.</p>
              )}
            </div>
          </section>

          {/* Birthdays */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black flex items-center gap-3 tracking-tight">
                <span className="text-2xl">🎂</span> Aniversariantes de {monthNames[currentMonth - 1]}
              </h3>
              {hasAccess && birthdays.length > 0 && (
                <button 
                  onClick={handleShareBirthdays}
                  className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
                >
                  <MessageCircle size={16} />
                  Compartilhar
                </button>
              )}
            </div>
            
            {birthdays.length === 0 ? (
              <div className="bg-[#111] border border-white/5 rounded-3xl p-10 text-center text-zinc-500 font-medium">
                Nenhum aniversariante este mês.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {birthdays.map(player => {
                  const day = player.date_of_birth.split('/')[0];
                  return (
                    <div key={player.id} className="bg-[#111] border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-indigo-500/30 transition-colors group">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/5 group-hover:border-indigo-500/50 transition-colors">
                        <img src={getPlayerPhoto(player.name)} alt={player.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-white group-hover:text-indigo-400 transition-colors">{player.name}</h4>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Dia {day}</p>
                      </div>
                      <div className="text-2xl">🎉</div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Top Scorers Podium */}
        <div className="space-y-6">
          <section className="bg-[#111] border border-white/5 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2 mb-6">
              <Goal size={18} /> Artilharia da Temporada
            </h3>
            <div className="space-y-4">
              {topScorers.length > 0 ? (
                topScorers.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-colors group">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
                      i === 0 ? 'bg-amber-500/20 text-amber-500' : 
                      i === 1 ? 'bg-zinc-400/20 text-zinc-400' : 
                      'bg-orange-700/20 text-orange-700'
                    }`}>
                      {i + 1}º
                    </div>
                    <img src={getPlayerPhoto(p.name)} alt={p.name} className="w-12 h-12 rounded-full object-cover border-2 border-white/5 group-hover:border-emerald-500/50 transition-colors" />
                    <div className="flex-1">
                      <p className="font-bold text-white text-sm truncate">{p.name}</p>
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{p.goals} Gols</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-zinc-500 text-center py-10 text-sm font-bold">Nenhum gol registrado ainda.</p>
              )}
            </div>
            <Link to="/ranking" className="block w-full text-center mt-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-zinc-400 transition-colors">
              Ver Ranking Completo
            </Link>
          </section>
        </div>
      </div>
    </motion.div>
  );
}