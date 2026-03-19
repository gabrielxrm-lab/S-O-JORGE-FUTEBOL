import React from 'react';
import { Download, Save } from 'lucide-react';

interface SummaryPreviewProps {
  text: string;
  onDownload: () => void;
  onSave: () => void;
  hasAccess: boolean;
}

export function SummaryPreview({ text, onDownload, onSave, hasAccess }: SummaryPreviewProps) {
  return (
    <div className="bg-[#111] border border-white/5 rounded-3xl p-6 md:p-8 space-y-8 shadow-2xl">
      <h2 className="text-3xl font-black tracking-tight">📄 Prévia e Finalização</h2>
      <pre className="bg-black/50 border border-white/10 p-6 rounded-2xl overflow-x-auto text-sm font-mono text-zinc-300 whitespace-pre-wrap shadow-inner">
        {text}
      </pre>

      <div className="flex flex-col sm:flex-row gap-5">
        <button onClick={onDownload} className="w-full sm:flex-1 flex justify-center items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-2xl transition-all font-bold shadow-lg">
          <Download size={22} />
          Baixar Súmula (TXT)
        </button>
        {hasAccess && (
          <button onClick={onSave} className="w-full sm:flex-1 flex justify-center items-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl transition-all font-bold shadow-lg shadow-emerald-500/20">
            <Save size={22} />
            Salvar no Ranking e Limpar
          </button>
        )}
      </div>
    </div>
  );
}