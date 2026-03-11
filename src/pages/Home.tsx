import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, AppData } from '../lib/api';
import { differenceInDays, nextSunday, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import { motion } from 'motion/react';
import { Calendar, Trophy, Users } from 'lucide-react';

export function Home() {
  const { role } = useAuth();
  const [data, setData] = useState<AppData | null>(null);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    api.getData().then(setData).catch(console.error);
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      <header className="text-center space-y-4">
        <img 
          src="https://raw.githubusercontent.com/gabrielxrm-lab/sjfc-streamlit-app/main/logo_sao_jorge.png" 
          alt="Logo SJFC" 
          className="w-32 h-32 mx-auto object-contain drop-shadow-2xl"
        />
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">Central de Dados do São Jorge FC</h1>
        <p className="text-xl text-zinc-400 font-medium tracking-widest uppercase">Desde 1980</p>
        
        <div className="inline-block px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm font-bold mt-4 tracking-wide shadow-lg backdrop-blur-md">
          {role === 'Diretoria' ? '🔑 Você está no modo Diretoria' : '👁️ Você está no modo Jogador'}
        </div>
      </header>

      <section className="bg-[#111] border border-white/5 rounded-3xl p-10 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none"></div>
        <h2 className="text-zinc-500 uppercase tracking-widest text-sm font-black mb-6 flex items-center justify-center gap-2 relative z-10">
          <Calendar size={20} className="text-indigo-400" />
          Próximo Jogo: Domingo, 07:00
        </h2>
        <div className="font-mono text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400 tracking-wider relative z-10 drop-shadow-lg">
          {timeLeft || 'Calculando...'}
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-black mb-8 flex items-center gap-3 tracking-tight">
          <span className="text-3xl">🎂</span> Aniversariantes de {monthNames[currentMonth - 1]}
        </h2>
        
        {birthdays.length === 0 ? (
          <div className="bg-[#111] border border-white/5 rounded-2xl p-10 text-center text-zinc-500 font-medium text-lg">
            Nenhum aniversariante este mês.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {birthdays.map(player => {
              const day = player.date_of_birth.split('/')[0];
              const photoUrl = player.photo_file && player.photo_file !== 'Nenhuma' 
                ? `https://raw.githubusercontent.com/gabrielxrm-lab/sjfc-streamlit-app/main/player_photos/${player.photo_file}`
                : 'https://via.placeholder.com/200x200.png?text=Sem+Foto';

              return (
                <div key={player.id} className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden group hover:border-indigo-500/50 transition-all duration-300 shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1">
                  <div className="aspect-square bg-zinc-900 relative">
                    <img src={photoUrl} alt={player.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/40 to-transparent opacity-90" />
                    <div className="absolute bottom-5 left-5 right-5">
                      <h3 className="font-black text-xl truncate text-white drop-shadow-md">{player.name}</h3>
                      {player.shirt_number && <p className="text-indigo-300 text-sm font-bold mt-1">Camisa: {player.shirt_number}</p>}
                    </div>
                  </div>
                  <div className="p-5 flex items-center justify-between bg-[#111] border-t border-white/5">
                    <span className="text-zinc-500 text-xs uppercase tracking-widest font-black">Dia</span>
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-violet-400">{day}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-3xl font-black mb-8 flex items-center gap-3 tracking-tight">
          <span className="text-3xl">🖼️</span> Galeria do Time
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {[
            "20250817_075933.jpg",
            "20250817_080001.jpg",
            "20250817_085832.jpg",
            "20250817_085914.jpg",
            "20250817_085945.jpg"
          ].map((img, i) => (
            <div key={i} className="aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 shadow-lg group">
              <img 
                src={`https://raw.githubusercontent.com/gabrielxrm-lab/sjfc-streamlit-app/main/player_photos/slideshow/${img}`} 
                alt="Galeria" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              />
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
