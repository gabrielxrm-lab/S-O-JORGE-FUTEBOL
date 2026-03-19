import React from 'react';
import { motion } from 'motion/react';
import { X, Goal, Star, Shield } from 'lucide-react';
import { Player } from '../../lib/api';

interface PlayerProfileModalProps {
  player: Player;
  stats: any;
  onClose: () => void;
}

export function PlayerProfileModal({ player, stats, onClose }: PlayerProfileModalProps) {
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

  const photoUrl = player.photo_file && player.photo_file !== 'Nenhuma' 
    ? (player.photo_file.startsWith('data:') || player.photo_file.startsWith('http') ? player.photo_file : `https://raw.githubusercontent.com/gabrielxrm-lab/S-O-JORGE-FUTEBOL/main/PLAYER_PHOTOS/${player.photo_file}`)
    : 'https://via.placeholder.com/150x150.png?text=SJFC';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-[#0a0a0a]"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
        >
          <X size={18} />
        </button>

        <div className={`h-32 bg-gradient-to-br ${getPositionColor(player.position)} relative`}>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full border-4 border-[#0a0a0a] overflow-hidden bg-zinc-800 shadow-xl">
            <img src={photoUrl} alt={player.name} className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="pt-20 pb-8 px-6 text-center">
          <h2 className="text-2xl font-black text-white tracking-tight">{player.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-1 mb-6">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r ${getPositionColor(player.position)} text-white shadow-lg`}>
              {player.position}
            </span>
            {player.shirt_number && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/5">
                Nº {player.shirt_number}
              </span>
            )}
          </div>

          {stats && (
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
          )}
        </div>
      </motion.div>
    </div>
  );
}