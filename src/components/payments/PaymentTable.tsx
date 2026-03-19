import React from 'react';
import { CheckCircle2, XCircle, MessageCircle } from 'lucide-react';
import { Player } from '../../lib/api';

interface PaymentTableProps {
  players: Player[];
  months: string[];
  payments: Record<string, Record<string, string>>;
  onToggle: (player: Player, monthKey: string, monthName: string) => void;
  onCobrar: (player: Player, monthName: string) => void;
}

export function PaymentTable({ players, months, payments, onToggle, onCobrar }: PaymentTableProps) {
  return (
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
            {players.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-6 py-8 text-center text-zinc-500">
                  Nenhum jogador cadastrado.
                </td>
              </tr>
            ) : (
              players.map(player => (
                <tr key={player.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white sticky left-0 bg-zinc-900 z-10 border-r border-zinc-800">
                    {player.name}
                  </td>
                  {months.map((m, i) => {
                    const monthKey = (i + 1).toString();
                    const status = payments[player.id]?.[monthKey] || 'Atrasada';
                    const isPaid = status === 'Paga';
                    
                    return (
                      <td key={m} className="px-2 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onToggle(player, monthKey, m)}
                            className={`p-1.5 rounded-full transition-colors ${
                              isPaid ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-zinc-600 hover:bg-zinc-800'
                            }`}
                          >
                            {isPaid ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                          </button>
                          {!isPaid && (
                            <button
                              onClick={() => onCobrar(player, m)}
                              className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-full transition-colors"
                              title="Cobrar via WhatsApp"
                            >
                              <MessageCircle size={16} />
                            </button>
                          )}
                        </div>
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
  );
}