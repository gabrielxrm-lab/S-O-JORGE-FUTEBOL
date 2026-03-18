import React, { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Users, DollarSign, FileText, Dices, Trophy, LogOut, Key, X, User, Download, Upload } from 'lucide-react';
import clsx from 'clsx';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { role, userName, userPhoto, logout, canAccess } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDiretoria = role === 'Diretoria';
  const isMembro = role === 'Membro';
  const hasAccess = isDiretoria || isMembro;

  const handleBackup = async () => {
    try {
      const data = await api.getData();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href",     dataStr);
      downloadAnchorNode.setAttribute("download", "sao_jorge_backup.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      toast.success('Backup realizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao realizar backup');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const jsonData = JSON.parse(content);
        
        if (!jsonData.players) {
          throw new Error('Arquivo JSON inválido. Certifique-se de que é um backup do São Jorge FC.');
        }

        if (window.confirm('ATENÇÃO: Isso irá substituir TODOS os dados atuais pelos dados do arquivo. Deseja continuar?')) {
          const loadingToast = toast.loading('Restaurando dados...');
          await api.restoreData(jsonData);
          toast.dismiss(loadingToast);
          toast.success('Dados restaurados com sucesso!');
          window.location.reload();
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro ao processar arquivo');
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  const navItems = [
    { path: '/', label: 'Página Principal', icon: Home, show: true },
    { path: '/players', label: canAccess('players') ? 'Gerenciar Jogadores' : 'Jogadores', icon: Users, show: true },
    { path: '/payments', label: 'Financeiro', icon: DollarSign, show: canAccess('payments') },
    { path: '/summary', label: 'Nova Súmula', icon: FileText, show: canAccess('matches') },
    { path: '/draw', label: 'Sorteio de Times', icon: Dices, show: canAccess('draw') },
    { path: '/ranking', label: 'Ranking', icon: Trophy, show: true },
    { path: '/history', label: 'Histórico de Partidas', icon: FileText, show: canAccess('matches') },
    { path: '/users', label: 'Gerenciar Acessos', icon: User, show: canAccess('users') },
  ].filter(item => item.show);

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={clsx(
        "w-72 bg-[#0a0a0a]/95 backdrop-blur-xl text-zinc-100 flex flex-col h-screen fixed left-0 top-0 border-r border-white/5 shadow-2xl z-50 transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex flex-col items-center border-b border-white/5 relative overflow-hidden">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 lg:hidden text-zinc-400 hover:text-white"
          >
            <X size={24} />
          </button>
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent"></div>
          <img 
            src="https://raw.githubusercontent.com/gabrielxrm-lab/S-O-JORGE-FUTEBOL/main/logo_sao_jorge.png" 
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
          
          {hasAccess ? (
            <div className={`bg-${isDiretoria ? 'emerald' : 'indigo'}-500/10 border border-${isDiretoria ? 'emerald' : 'indigo'}-500/20 rounded-xl p-4 relative overflow-hidden`}>
              <div className={`absolute top-0 left-0 w-1 h-full bg-${isDiretoria ? 'emerald' : 'indigo'}-500`}></div>
              <div className="flex items-center gap-3 mb-3">
                {userPhoto && userPhoto !== 'Nenhuma' ? (
                  <img src={userPhoto} alt={userName || 'User'} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                ) : (
                  <div className={`w-10 h-10 rounded-full bg-${isDiretoria ? 'emerald' : 'indigo'}-500/20 flex items-center justify-center`}>
                    <User size={20} className={`text-${isDiretoria ? 'emerald' : 'indigo'}-400`} />
                  </div>
                )}
                <div>
                  <p className={`text-${isDiretoria ? 'emerald' : 'indigo'}-400 text-sm font-bold`}>{userName}</p>
                  <p className="text-zinc-400 text-xs">Acesso: {role}</p>
                </div>
              </div>
              <button 
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-zinc-200 py-2 rounded-lg transition-colors text-sm font-medium border border-white/5"
              >
                <LogOut size={16} />
                Sair da Conta
              </button>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/5 rounded-xl p-4">
              <p className="text-zinc-400 text-sm mb-3 font-medium">Modo Jogador (Visualização)</p>
              <button 
                onClick={() => {
                  navigate('/login');
                  if (window.innerWidth < 1024) onClose();
                }}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition-colors text-sm font-bold shadow-lg shadow-indigo-500/20"
              >
                <Key size={16} />
                Fazer Login
              </button>
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
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
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

        {isDiretoria && (
          <div className="px-4 pb-4 space-y-2">
            <button
              onClick={handleBackup}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 py-2 rounded-xl transition-colors text-sm font-bold"
            >
              <Download size={16} />
              Fazer Backup dos Dados
            </button>
            
            <button
              onClick={handleUploadClick}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 py-2 rounded-xl transition-colors text-sm font-bold"
            >
              <Upload size={16} />
              Fazer Upload dos Dados
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".json" 
              className="hidden" 
            />
          </div>
        )}

        <div className="p-4 border-t border-white/5 text-xs text-zinc-500 text-center bg-black/20">
          <p>Desenvolvido por:</p>
          <p className="font-bold text-zinc-300 mt-1">Gabriel Conrado</p>
          <p className="font-medium">📱 (21) 97275-7256</p>
        </div>
      </aside>
    </>
  );
}