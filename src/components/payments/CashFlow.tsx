import React from 'react';
import { Trash2 } from 'lucide-react';
import { Transaction } from '../../lib/api';

interface CashFlowProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export function CashFlow({ transactions, onDelete }: CashFlowProps) {
  const formatCurrency = (value: any) => {
    const num = Number(value) || 0;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider text-xs">
          <tr>
            <th className="px-6 py-4 font-medium">Data</th>
            <th className="px-6 py-4 font-medium">Descrição</th>
            <th className="px-6 py-4 font-medium">Categoria</th>
            <th className="px-6 py-4 font-medium text-right">Valor</th>
            <th className="px-6 py-4 font-medium text-center">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                Nenhuma transação registrada.
              </td>
            </tr>
          ) : (
            transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => (
              <tr key={tx.id} className="hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4 text-zinc-300">
                  {new Date(tx.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                </td>
                <td className="px-6 py-4 text-white font-medium">{tx.description}</td>
                <td className="px-6 py-4 text-zinc-400">{tx.category}</td>
                <td className={`px-6 py-4 text-right font-bold ${tx.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {tx.type === 'income' ? '+' : '-'} R$ {formatCurrency(tx.amount)}
                </td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => onDelete(tx.id)}
                    className="text-zinc-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
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
  );
}