import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, AppData, Player } from '../lib/api';
import { motion } from 'motion/react';
import { Dices, Users } from 'lucide-react';

export function TeamDraw() {
  const { role } = useAuth();
  const [data, setData] = useState<AppData | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [numTeams, setNumTeams] = useState(2);
  const [teams, setTeams] = useState<Player[][]>([]);

  useEffect(() => {
    api.getData().then(setData).catch(console.error);
  }, []);

  const togglePlayer = (id: string) => {
    setSelectedPlayers(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const drawTeams = () => {
    if (!data) return;
    
    const playersToDraw = data.players.filter(p => selectedPlayers.includes(p.id));
    
    // Shuffle array
    for (let i = playersToDraw.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playersToDraw[i], playersToDraw[j]] = [playersToDraw[j], playersToDraw[i]];
    }

    const newTeams: Player[][] = Array.from({ length: numTeams }, () => []);
    
    playersToDraw.forEach((player, index) => {
      newTeams[index % numTeams].push(player);
    });

    setTeams(newTeams);
  };

  if (!data) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Dices className="text-indigo-500" size={32} />
          Sorteio de Times
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-fit">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users size={20} />
            Jogadores Presentes ({selectedPlayers.length})
          </h2>
          
          <div className="space-y-4 mb-6">
            <label className="block text-sm font-medium text-zinc-400">Número de Times</label>
            <input 
              type="number" 
              min={2} 
              max={10} 
              value={numTeams}
              onChange={e => setNumTeams(parseInt(e.target.value) || 2)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button 
            onClick={drawTeams}
            disabled={selectedPlayers.length < numTeams}
            className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg transition-colors font-medium mb-6"
          >
            <Dices size={20} />
            Sortear Times
          </button>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {data.players.map(player => (
              <label key={player.id} className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded-lg cursor-pointer hover:border-indigo-500/50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={selectedPlayers.includes(player.id)}
                  onChange={() => togglePlayer(player.id)}
                  className="w-4 h-4 text-indigo-600 bg-zinc-900 border-zinc-700 rounded focus:ring-indigo-600 focus:ring-2"
                />
                <span className="font-medium text-sm">{player.name}</span>
                <span className="text-xs text-zinc-500 ml-auto">{player.position}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {teams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teams.map((team, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="bg-indigo-900/20 border-b border-indigo-900/50 p-4">
                    <h3 className="text-xl font-bold text-indigo-400 text-center">Time {i + 1}</h3>
                  </div>
                  <ul className="divide-y divide-zinc-800">
                    {team.map(player => (
                      <li key={player.id} className="p-4 flex justify-between items-center hover:bg-zinc-800/50 transition-colors">
                        <span className="font-medium">{player.name}</span>
                        <span className="text-xs px-2 py-1 bg-zinc-800 rounded-full text-zinc-400">{player.position}</span>
                      </li>
                    ))}
                    {team.length === 0 && (
                      <li className="p-4 text-center text-zinc-500">Nenhum jogador</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl p-8 text-center">
              <Dices size={48} className="mb-4 text-zinc-700" />
              <p className="text-lg font-medium text-zinc-400 mb-2">Nenhum time sorteado</p>
              <p className="text-sm">Selecione os jogadores presentes e clique em "Sortear Times".</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
