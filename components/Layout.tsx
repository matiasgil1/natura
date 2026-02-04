
import React from 'react';
import { View } from '../types';
import { NAV_ITEMS, THEME } from '../constants';
import { LogOut, Leaf, Menu } from 'lucide-react';

interface LayoutProps {
  currentView: View;
  setView: (view: View) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, setView, onLogout, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleNav = (view: View) => {
    setView(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-[#FDFCF9] text-gray-900">
      <aside className="w-72 bg-white border-r border-gray-100 hidden lg:flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50">
        <div className="p-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-orange-100" style={{ backgroundColor: THEME.primary }}>
            <Leaf className="text-white" size={28} />
          </div>
          <div>
            <h1 className="font-black text-xl text-gray-800 tracking-tight">NATURA</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gestión Premium</p>
          </div>
        </div>
        
        <nav className="flex-1 px-6 py-4 space-y-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id as View)}
              className={`w-full flex items-center gap-4 px-5 py-4 text-sm font-bold rounded-[1.5rem] transition-all duration-300 ${
                currentView === item.id 
                ? 'bg-[#E07A5F] text-white shadow-xl shadow-orange-100 translate-x-1' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <span className={`${currentView === item.id ? 'scale-110' : ''} transition-transform`}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-6 py-8">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-[1.5rem] transition-all"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-auto relative">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 flex items-center justify-between sticky top-0 z-40 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E07A5F] flex items-center justify-center shadow-md">
                <Leaf className="text-white" size={20} />
              </div>
              <span className="font-black text-gray-800 tracking-tight">NATURA</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-3 bg-gray-50 rounded-2xl text-gray-600">
              <Menu size={24} />
            </button>
        </header>
        
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-2xl p-8 animate-in slide-in-from-left duration-300 rounded-r-[3rem]">
               <div className="flex justify-between items-center mb-10">
                  <h2 className="text-2xl font-black text-gray-800">Menú</h2>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400">✕</button>
               </div>
               <nav className="space-y-3">
                  {NAV_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id as View)}
                      className={`w-full flex items-center gap-4 px-6 py-5 text-lg font-bold rounded-[2rem] transition-all ${
                        currentView === item.id ? 'bg-[#E07A5F] text-white shadow-lg' : 'text-gray-500'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
               </nav>
            </aside>
          </div>
        )}

        <div className="p-6 lg:p-12 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
