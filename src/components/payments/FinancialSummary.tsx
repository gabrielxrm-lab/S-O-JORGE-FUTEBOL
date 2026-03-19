import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface FinancialSummaryProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export function FinancialSummary({ totalIncome, totalExpense, balance }: FinancialSummaryProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
        <div className="flex items-center gap-3 text-emerald-500 mb-2">
          <TrendingUp size={24} />
          <h3 className="font-medium text-zinc-400">Entradas</h3>
        </div>
        <p className="text-3xl font-bold text-white">R$ {formatCurrency(totalIncome)}</p>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
        <div className="flex items-center gap-3 text-red-500 mb-2">
          <TrendingDown size={24} />
          <h3 className="font-medium text-zinc-400">Saídas</h3>
        </div>
        <p className="text-3xl font-bold text-white">R$ {formatCurrency(totalExpense)}</p>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
        <div className="flex items-center gap-3 text-indigo-500 mb-2">
          <Wallet size={24} />
          <h3 className="font-medium text-zinc-400">Saldo Atual</h3>
        </div>
        <p className={`text-3xl font-bold ${balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
          R$ {formatCurrency(balance)}
        </p>
      </div>
    </div>
  );
}