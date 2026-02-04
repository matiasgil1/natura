
import React, { useState } from 'react';
import { Leaf, Lock, User, Loader2, ChevronRight } from 'lucide-react';
import { DataService } from '../services/dataService';

interface AuthProps {
  onLogin: (usuario: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    try {
      const user = await DataService.login(usuario, password);
      setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          onLogin(user.usuario);
        }, 600);
      }, 800);
    } catch (err: any) {
      setTimeout(() => {
        setIsLoggingIn(false);
        setError('Acceso denegado. Verifica tus datos.');
      }, 600);
    }
  };

  return (
    <div className={`min-h-screen bg-[#FDFCF9] flex items-center justify-center p-6 font-sans transition-all duration-700 ${isExiting ? 'opacity-0 scale-110 blur-xl' : 'opacity-100 scale-100'}`}>
      <div className="max-w-sm w-full">
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.5rem] bg-[#E07A5F] text-white shadow-xl shadow-orange-100 mb-6">
            <Leaf size={32} />
          </div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Bienvenida</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-1">Gestión Natura Cloud</p>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Usuario</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#E07A5F] transition-colors" size={16} />
                <input 
                  type="text"
                  value={usuario} 
                  onChange={(e) => setUsuario(e.target.value)} 
                  placeholder="Usuario"
                  className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-50 transition-all shadow-inner" 
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#E07A5F] transition-colors" size={16} />
                <input 
                  type="password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••"
                  className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-50 transition-all shadow-inner" 
                  required
                />
              </div>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 text-red-500 rounded-xl flex items-center gap-2 animate-shake">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <p className="text-[9px] font-black uppercase tracking-wider">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoggingIn} 
              className="w-full bg-[#E07A5F] text-white py-4.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-100 transition-all hover:brightness-105 active:scale-95 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={14} />
                  <span>ENTRANDO...</span>
                </div>
              ) : (
                <>
                  INGRESAR
                  <ChevronRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-10 text-[9px] font-bold text-gray-300 uppercase tracking-widest animate-pulse">
          Acceso Seguro Autorizado
        </p>
      </div>
    </div>
  );
};

export default Auth;
