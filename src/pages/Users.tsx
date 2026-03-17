import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, User } from '../lib/api';
import { motion } from 'motion/react';
import { Users as UsersIcon, Plus, Trash2, Shield, User as UserIcon, Lock, Edit2, CheckSquare, Square } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const AVAILABLE_PERMISSIONS = [
  { id: 'players', label: 'Gerenciar Jogadores' },
  { id: 'payments', label: 'Financeiro' },
  { id: 'matches', label: 'Súmulas e Histórico' },
  { id: 'draw', label: 'Sorteio de Times' },
  { id: 'ranking', label: 'Ranking' },
  { id: 'users', label: 'Gerenciar Acessos' }
];

export function Users() {
  const { role } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    password: '',
    role: 'Membro',
    permissions: []
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getData();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUserId(user.id);
      setFormData({
        name: user.name,
        password: '', // Don't show existing password
        role: user.role,
        permissions: user.permissions || []
      });
    } else {
      setEditingUserId(null);
      setFormData({ name: '', password: '', role: 'Membro', permissions: [] });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.role) return;
    if (!editingUserId && !formData.password) return; // Password required for new users

    try {
      const userToSave: User = {
        id: editingUserId || uuidv4(),
        name: formData.name,
        role: formData.role as 'Diretoria' | 'Membro',
        permissions: formData.permissions
      };

      if (formData.password) {
        userToSave.password = formData.password;
      }

      await api.saveUser(userToSave);
      await loadUsers();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save user:', error);
      alert('Erro ao salvar usuário');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await api.deleteUser(id);
        await loadUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert('Erro ao excluir usuário');
      }
    }
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => {
      const current = prev.permissions || [];
      if (current.includes('all')) return prev; // If they have 'all', don't toggle
      
      const updated = current.includes(permId)
        ? current.filter(p => p !== permId)
        : [...current, permId];
        
      return { ...prev, permissions: updated };
    });
  };

  if (role !== 'Diretoria') {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-zinc-400">Acesso restrito à Diretoria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Gerenciar Acessos</h1>
          <p className="text-zinc-400 mt-1">Controle quem pode acessar o sistema</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Novo Acesso</span>
        </button>
      </div>

      <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 text-zinc-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">Usuário</th>
                <th className="p-4 font-bold">Nível de Acesso</th>
                <th className="p-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-zinc-500">
                    Carregando...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-zinc-500">
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                          <UserIcon size={20} className="text-indigo-400" />
                        </div>
                        <span className="font-bold text-zinc-100">{user.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        user.role === 'Diretoria' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}>
                        <Shield size={14} />
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenModal(user)}
                        className="p-2 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors mr-2"
                        title="Editar usuário"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Excluir usuário"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl my-8"
          >
            <div className="p-6 border-b border-white/5">
              <h2 className="text-xl font-black">{editingUserId ? 'Editar Acesso' : 'Novo Acesso'}</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Nome de Usuário</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon size={18} className="text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Ex: joao.silva"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  {editingUserId ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-zinc-500" />
                  </div>
                  <input
                    type="password"
                    required={!editingUserId}
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Nível de Acesso</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as 'Diretoria' | 'Membro'})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                >
                  <option value="Membro">Membro (Acesso Parcial)</option>
                  <option value="Diretoria">Diretoria (Acesso Total)</option>
                </select>
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Permissões de Edição</label>
                <div className="grid grid-cols-1 gap-2 bg-black/30 p-4 rounded-xl border border-white/5">
                  {AVAILABLE_PERMISSIONS.map(perm => {
                    const hasPerm = formData.permissions?.includes('all') || formData.permissions?.includes(perm.id);
                    return (
                      <button
                        key={perm.id}
                        type="button"
                        onClick={() => togglePermission(perm.id)}
                        className="flex items-center gap-3 text-left hover:bg-white/5 p-2 rounded-lg transition-colors"
                      >
                        {hasPerm ? (
                          <CheckSquare size={20} className="text-indigo-500 flex-shrink-0" />
                        ) : (
                          <Square size={20} className="text-zinc-500 flex-shrink-0" />
                        )}
                        <span className={`text-sm font-medium ${hasPerm ? 'text-zinc-200' : 'text-zinc-500'}`}>
                          {perm.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all"
                >
                  Salvar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

