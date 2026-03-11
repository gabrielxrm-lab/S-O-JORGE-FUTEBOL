import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Users, DollarSign, FileText, Dices, Trophy, LogOut, Key } from 'lucide-react';
import clsx from 'clsx';

export function Sidebar() {
  const { role, loginAsDiretoria, logout } = useAuth();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const isDiretoria = role === 'Diretoria';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginAsDiretoria(password)) {
      setPassword('');
      setError('');
    } else {
      setError('Senha incorreta.');
    }
  };

  const navItems = [
    { path: '/', label: 'Página Principal', icon: Home },
    { path: '/players', label: 'Gerenciar Jogadores', icon: Users },
    ...(isDiretoria ? [{ path: '/payments', label: 'Mensalidades', icon: DollarSign }] : []),
    { path: '/summary', label: 'Nova Súmula', icon: FileText },
    { path: '/draw', label: 'Sorteio de Times', icon: Dices },
    { path: '/ranking', label: 'Ranking', icon: Trophy },
  ];

  return (
    <aside className="w-72 bg-[#0a0a0a]/95 backdrop-blur-xl text-zinc-100 flex flex-col h-screen fixed left-0 top-0 border-r border-white/5 shadow-2xl">
      <div className="p-6 flex flex-col items-center border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent"></div>
        <img 
          src="https://raw.githubusercontent.com/gabrielxrm-lab/sjfc-streamlit-app/main/logo_sao_jorge.png" 
          alt="Logo SJFC" 
          className="w-24 h-24 object-contain mb-4 relative z-10 drop-shadow-2xl"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=SJFC';
          }}
        />
        <h1 className="text-xl font-black text-center tracking-tight relative z-10">SÃO JORGE FC</h1>
      </div>

      <div className="p-4 border-b border-white/5">
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Perfil de Acesso</h2>
        
        {isDiretoria ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <p className="text-emerald-400 text-sm font-bold mb-3">Logado como Diretoria</p>
            <button 
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-zinc-200 py-2 rounded-lg transition-colors text-sm font-medium border border-white/5"
            >
              <LogOut size={16} />
              Sair do modo Edição
            </button>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/5 rounded-xl p-4">
            <p className="text-zinc-400 text-sm mb-3 font-medium">Modo Jogador (Visualização)</p>
            <form onSubmit={handleLogin} className="space-y-2">
              <input 
                type="password" 
                placeholder="Senha da Diretoria" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {error && <p className="text-red-400 text-xs font-medium">{error}</p>}
              <button 
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition-colors text-sm font-bold shadow-lg shadow-indigo-500/20"
              >
                <Key size={16} />
                Entrar como Diretoria
              </button>
            </form>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link 
                  to={item.path}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-bold",
                    isActive 
                      ? "bg-gradient-to-r from-indigo-600/20 to-violet-600/10 text-indigo-400 border-l-2 border-indigo-500" 
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100 border-l-2 border-transparent"
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-white/5 text-xs text-zinc-500 text-center bg-black/20">
        <p>Desenvolvido por:</p>
        <p className="font-bold text-zinc-300 mt-1">Gabriel Conrado</p>
        <p className="font-medium">📱 (21) 97275-7256</p>
      </div>
    </aside>
  );
}
