import React from 'react';
import { motion } from 'motion/react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  newTx: any;
  setNewTx: (tx: any) => void;
}

export function TransactionModal({ isOpen, onClose, onSave, newTx, setNewTx }: TransactionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6">Nova Transação</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Tipo</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="type" 
                  value="income" 
                  checked={newTx.type === 'income'}
                  onChange={e => setNewTx({...newTx, type: e.target.value as 'income'})}
                  className="text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-emerald-500 font-medium">Entrada</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="type" 
                  value="expense" 
                  checked={newTx.type === 'expense'}
                  onChange={e => setNewTx({...newTx, type: e.target.value as 'expense'})}
                  className="text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-red-500 font-medium">Saída</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Data</label>
            <input 
              type="date" 
              value={newTx.date}
              onChange={e => setNewTx({...newTx, date: e.target.value})}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Descrição</label>
            <input 
              type="text" 
              value={newTx.description || ''}
              onChange={e => setNewTx({...newTx, description: e.target.value})}
              placeholder="Ex: Compra de bolas"
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Categoria</label>
            <select 
              value={newTx.category || ''}
              onChange={e => setNewTx({...newTx, category: e.target.value})}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Selecione...</option>
              {newTx.type === 'income' ? (
                <>
                  <option value="Mensalidade">Mensalidade</option>
                  <option value="Patrocínio">Patrocínio</option>
                  <option value="Rifa">Rifa</option>
                  <option value="Outros">Outros</option>
                </>
              ) : (
                <>
                  <option value="Juiz">Pagamento de Juiz</option>
                  <option value="Campo">Aluguel do Campo</option>
                  <option value="Lavagem">Lavagem de Uniforme</option>
                  <option value="Bolas">Compra de Bolas</option>
                  <option value="Outros">Outros</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Valor (R$)</label>
            <input 
              type="text" 
              value={newTx.amount || ''}
              onChange={e => setNewTx({...newTx, amount: e.target.value})}
              placeholder="0,00"
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={onSave}
            className="flex-1 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 transition-colors text-white"
          >
            Salvar
          </button>
        </div>
      </motion.div>
    </div>
  );
}