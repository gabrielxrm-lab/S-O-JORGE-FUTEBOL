import React from 'react';
import { X, Upload, Save } from 'lucide-react';
import { Player } from '../../lib/api';

interface PlayerFormProps {
  player: Player;
  setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
  isAdding: boolean;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
  existingPhotos: string[];
  isDiretoria: boolean;
}

export function PlayerForm({ player, setPlayer, isAdding, onSave, onCancel, existingPhotos, isDiretoria }: PlayerFormProps) {
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
        setPlayer(prev => prev ? {...prev, photo_file: dataUrl} : null);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-[#111] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
      <div className="flex justify-between items-center mb-8 relative z-10">
        <h2 className="text-2xl font-black tracking-tight">{isAdding ? 'Cadastrar Novo Jogador' : 'Editar Jogador'}</h2>
        <button onClick={onCancel} className="text-zinc-500 hover:text-white bg-white/5 p-2 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={onSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Nome do Jogador</label>
          <input 
            required
            type="text" 
            value={player.name}
            onChange={e => setPlayer(prev => prev ? {...prev, name: e.target.value.toUpperCase()} : null)}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 uppercase transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Posição</label>
          <select 
            value={player.position}
            onChange={e => setPlayer(prev => prev ? {...prev, position: e.target.value} : null)}
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
            value={player.shirt_number}
            onChange={e => setPlayer(prev => prev ? {...prev, shirt_number: e.target.value} : null)}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Data Nasc. (DD/MM/AAAA)</label>
          <input 
            type="text" 
            placeholder="DD/MM/AAAA"
            value={player.date_of_birth}
            onChange={e => setPlayer(prev => prev ? {...prev, date_of_birth: e.target.value} : null)}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Telefone</label>
          <input 
            type="text" 
            value={player.phone}
            onChange={e => setPlayer(prev => prev ? {...prev, phone: e.target.value} : null)}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Foto do Jogador</label>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {player.photo_file && player.photo_file !== 'Nenhuma' ? (
                  <img 
                    src={player.photo_file.startsWith('data:') || player.photo_file.startsWith('http') ? player.photo_file : `https://raw.githubusercontent.com/gabrielxrm-lab/S-O-JORGE-FUTEBOL/main/PLAYER_PHOTOS/${player.photo_file}`} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
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
              </div>
            </div>

            {existingPhotos.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Ou escolha uma foto existente:</p>
                <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                  <button
                    type="button"
                    onClick={() => setPlayer(prev => prev ? {...prev, photo_file: 'Nenhuma'} : null)}
                    className={`w-16 h-16 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-all ${player.photo_file === 'Nenhuma' ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400' : 'border-white/10 bg-white/5 text-zinc-500 hover:border-white/30'}`}
                  >
                    <X size={24} />
                  </button>
                  {existingPhotos.map((photo, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPlayer(prev => prev ? {...prev, photo_file: photo} : null)}
                      className={`w-16 h-16 rounded-full overflow-hidden border-2 flex-shrink-0 transition-all ${player.photo_file === photo ? 'border-indigo-500 scale-110 shadow-lg shadow-indigo-500/20' : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'}`}
                    >
                      <img 
                        src={photo.startsWith('data:') || photo.startsWith('http') ? photo : `https://raw.githubusercontent.com/gabrielxrm-lab/S-O-JORGE-FUTEBOL/main/PLAYER_PHOTOS/${photo}`} 
                        alt={`Opção ${idx}`} 
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {isDiretoria && (
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Nível do Jogador (1 a 3)</label>
            <select 
              value={player.level || 1}
              onChange={e => setPlayer(prev => prev ? {...prev, level: Number(e.target.value)} : null)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value={1}>1 - Iniciante/Regular</option>
              <option value={2}>2 - Bom/Intermediário</option>
              <option value={3}>3 - Craque/Avançado</option>
            </select>
          </div>
        )}

        <div className="md:col-span-2 flex flex-col sm:flex-row justify-end gap-4 mt-6">
          <button type="button" onClick={onCancel} className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 font-bold transition-colors">Cancelar</button>
          <button type="submit" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all">
            <Save size={20} /> Salvar Jogador
          </button>
        </div>
      </form>
    </div>
  );
}