import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-indigo-500/30">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 flex items-center px-6 sticky top-0 z-30">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="ml-4 flex items-center gap-3">
            <img 
              src="https://raw.githubusercontent.com/gabrielxrm-lab/S-O-JORGE-FUTEBOL/main/logo_sao_jorge.png" 
              alt="Logo SJFC" 
              className="w-8 h-8 object-contain"
            />
            <span className="font-black tracking-tight text-sm">SÃO JORGE FC</span>
          </div>
        </header>

        <main className="flex-1 lg:ml-72 p-4 md:p-8 overflow-y-auto relative">
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none"></div>
          <div className="max-w-6xl mx-auto relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
