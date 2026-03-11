import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, AppData } from '../lib/api';
import { motion } from 'motion/react';
import { Save, CheckCircle2, XCircle } from 'lucide-react';

export function Payments() {
  const { role } = useAuth();
  const [data, setData] = useState<AppData | null>(null);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [payments, setPayments] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (role !== 'Diretoria') {
      window.location.href = '/';
      return;
    }
    loadData();
  }, [role]);

  const loadData = async () => {
    try {
      const res = await api.getData();
      setData(res);
      setPayments(res.monthly_payments[year] || {});
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (data) {
      setPayments(data.monthly_payments[year] || {});
    }
  }, [year, data]);

  const handleToggle = (playerId: string, month: string) => {
    setPayments(prev => {
      const playerPayments = prev[playerId] || {};
      const currentStatus = playerPayments[month] || 'Atrasada';
      const newStatus = currentStatus === 'Paga' ? 'Atrasada' : 'Paga';
      
      return {
        ...prev,
        [playerId]: {
          ...playerPayments,
          [month]: newStatus
        }
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.savePayments(year, payments);
      alert('Mensalidades salvas com sucesso!');
      loadData();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar mensalidades');
    } finally {
      setSaving(false);
    }
  };

  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const years = Array.from({ length: 7 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());

  if (!data) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Controle de Mensalidades</h1>
        
        <div className="flex items-center gap-4">
          <select 
            value={year}
            onChange={e => setYear(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors"
          >
            <Save size={20} />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 font-medium sticky left-0 bg-zinc-950 z-10">Jogador</th>
                {months.map(m => (
                  <th key={m} className="px-4 py-4 font-medium text-center">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {data.players.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-6 py-8 text-center text-zinc-500">
                    Nenhum jogador cadastrado.
                  </td>
                </tr>
              ) : (
                data.players.map(player => (
                  <tr key={player.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white sticky left-0 bg-zinc-900 z-10 border-r border-zinc-800">
                      {player.name}
                    </td>
                    {months.map((m, i) => {
                      const monthKey = (i + 1).toString();
                      const status = payments[player.id]?.[monthKey] || 'Atrasada';
                      const isPaid = status === 'Paga';
                      
                      return (
                        <td key={m} className="px-4 py-4 text-center">
                          <button
                            onClick={() => handleToggle(player.id, monthKey)}
                            className={`p-2 rounded-full transition-colors ${
                              isPaid ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-zinc-600 hover:bg-zinc-800'
                            }`}
                          >
                            {isPaid ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
