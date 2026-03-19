import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

interface ListEditorProps {
  title: string;
  items: string[];
  setter: React.Dispatch<React.SetStateAction<string[]>>;
  placeholder: string;
  hasAccess: boolean;
}

export function ListEditor({ title, items, setter, placeholder, hasAccess }: ListEditorProps) {
  const [val, setVal] = useState('');

  const handleAdd = () => {
    if (val) {
      setter(prev => [...prev, val.toUpperCase()]);
      setVal('');
    }
  };

  const handleRemove = (index: number) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-xl">
      <h3 className="font-black mb-5 tracking-tight text-lg">{title}</h3>
      <div className="flex gap-3 mb-5">
        <input 
          type="text" 
          placeholder={placeholder}
          value={val}
          onChange={e => setVal(e.target.value)}
          disabled={!hasAccess}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button 
          onClick={handleAdd}
          disabled={!hasAccess || !val}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all"
        >
          Add
        </button>
      </div>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex justify-between items-center text-sm font-bold bg-black/30 p-3 rounded-xl border border-white/5">
            <span>{item}</span>
            {hasAccess && (
              <button onClick={() => handleRemove(i)} className="text-red-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded-lg transition-colors">
                <Trash2 size={18} />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}