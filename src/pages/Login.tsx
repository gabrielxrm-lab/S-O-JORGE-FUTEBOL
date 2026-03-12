import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Key, User, LogIn, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Login() {
  const { role, userName, login, logout } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const success = await login(username, password);
    
    if (success) {
      navigate('/');
    } else {
      setError('Usuário ou senha incorretos.');
    }
    setLoading(false);
  };

  if (role !== 'Jogador') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <User size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black mb-2">Olá, {userName || 'Usuário'}</h2>
          <p className="text-zinc-400 mb-8 font-medium">Você está logado com nível de acesso: <span className="text-indigo-400 font-bold">{role}</span></p>
          
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-xl font-bold transition-colors"
          >
            <LogOut size={20} />
            Sair da Conta
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        
        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Key size={32} className="text-indigo-500" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Acesso Restrito</h1>
          <p className="text-zinc-400 mt-2 font-medium">Faça login para gerenciar o time</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Usuário</label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Digite seu usuário"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Senha</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm font-bold text-center">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all"
          >
            {loading ? 'Entrando...' : (
              <>
                <LogIn size={20} />
                Entrar
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
