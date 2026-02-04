
import React, { useState, useEffect } from 'react';
import { View, User, Product, Client, Sale, Movement, Expense } from './types';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Purchases from './components/Purchases';
import POS from './components/POS';
import Clients from './components/Clients';
import SalesHistory from './components/SalesHistory';
import Expenses from './components/Expenses';
import { DataService } from './services/dataService';
import { Leaf } from 'lucide-react';

declare var Swal: any;

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true
});

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [isLoading, setIsLoading] = useState(true);
  
  const [data, setData] = useState<{ 
    products: Product[], 
    clients: Client[], 
    sales: Sale[],
    movements: Movement[],
    expenses: Expense[]
  }>({
    products: [],
    clients: [],
    sales: [],
    movements: [],
    expenses: []
  });

  const refreshData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [products, clients, sales, movements, expenses] = await Promise.all([
        DataService.getProducts(),
        DataService.getClients(),
        DataService.getSales(),
        DataService.getMovements(),
        DataService.getExpenses()
      ]);
      setData({ products, clients, sales, movements, expenses });
      if (silent) Toast.fire({ icon: 'success', title: 'Sincronizado' });
    } catch (e: any) {
      console.error("Error cargando datos:", e);
      Swal.fire({
        title: 'Error de Sincronización',
        text: 'No se pudo conectar con la base de datos.',
        icon: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('NATURA_SESSION');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      refreshData();
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = (usuario: string) => {
    const user: User = { usuario, rol: 'admin' };
    setCurrentUser(user);
    localStorage.setItem('NATURA_SESSION', JSON.stringify(user));
    refreshData();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('NATURA_SESSION');
  };

  if (isLoading && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF9]">
        <div className="flex flex-col items-center gap-6 text-center animate-in fade-in duration-1000">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-orange-100 border-t-[#E07A5F] rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-[#E07A5F]">
              <Leaf size={18} className="animate-pulse" />
            </div>
          </div>
          <div>
            <p className="text-[#E07A5F] text-[9px] font-black uppercase tracking-[0.4em] mb-1">Entrando</p>
            <div className="w-24 h-0.5 bg-gray-100 mx-auto rounded-full overflow-hidden">
               <div className="h-full bg-[#E07A5F] animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) return <Auth onLogin={handleLogin} />;

  return (
    <div className="animate-in fade-in duration-1000">
      <Layout 
        currentView={currentView} 
        setView={setCurrentView} 
        onLogout={handleLogout} 
      >
        {currentView === View.DASHBOARD && <Dashboard sales={data.sales} products={data.products} movements={data.movements} expenses={data.expenses} onRefresh={() => refreshData(true)} />}
        {currentView === View.INVENTORY && <Inventory products={data.products} onRefresh={() => refreshData(true)} />}
        {currentView === View.PURCHASES && <Purchases products={data.products} onRefresh={() => refreshData(true)} />}
        {currentView === View.POS && <POS products={data.products} clients={data.clients} onRefresh={() => refreshData(true)} />}
        {currentView === View.CLIENTS && <Clients clients={data.clients} movements={data.movements} onRefresh={() => refreshData(true)} />}
        {currentView === View.SALES && <SalesHistory sales={data.sales} onRefresh={() => refreshData(true)} />}
        {currentView === View.EXPENSES && <Expenses expenses={data.expenses} onRefresh={() => refreshData(true)} />}
      </Layout>
    </div>
  );
};

export default App;
