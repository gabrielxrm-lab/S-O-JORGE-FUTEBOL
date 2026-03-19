import React from 'react';
import { motion } from 'motion/react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: () => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
}

export function ReportModal({ isOpen, onClose, onGenerate, startDate, setStartDate, endDate, setEndDate }: ReportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6">Gerar Relatório PDF</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Data Inicial</label>
            <input 
              type="date" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Data Final</label>
            <input 
              type="date" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
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
            onClick={onGenerate}
            className="flex-1 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 transition-colors text-white"
          >
            Gerar PDF
          </button>
        </div>
      </motion.div>
    </div>
  );
}