
import React, { useMemo, useState, useEffect } from 'react';
import { Product, Sale, Client, Movement, Expense } from '../types';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, DollarSign, AlertTriangle, Calendar, RefreshCw, ShoppingBag, CreditCard, Package, Users, ReceiptText } from 'lucide-react';
import { DataService } from '../services/dataService';
import { formatCurrency } from './Clients';

declare var Swal: any;

interface DashboardProps {
  sales: Sale[];
  products: Product[];
  movements: Movement[];
  expenses: Expense[];
  onRefresh: () => Promise<void> | void;
}

const Dashboard: React.FC<DashboardProps> = ({ sales, products, movements, expenses, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 15); return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    DataService.getClients().then(setClients);
  }, [sales]);

  const filteredSales = useMemo(() => sales.filter(s => s.fecha && s.fecha.split('T')[0] >= startDate && s.fecha.split('T')[0] <= endDate), [sales, startDate, endDate]);
  const filteredExpenses = useMemo(() => expenses.filter(e => e.fecha && e.fecha.split('T')[0] >= startDate && e.fecha.split('T')[0] <= endDate), [expenses, startDate, endDate]);
  
  const chartData = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredSales.forEach(s => {
      const day = s.fecha.split('T')[0];
      groups[day] = (groups[day] || 0) + s.montoTotal;
    });

    const data = [];
    const curr = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');

    while (curr <= end) {
      const dateStr = curr.toISOString().split('T')[0];
      data.push({
        name: dateStr.split('-').reverse().slice(0, 2).join('/'),
        fullDate: dateStr,
        v: groups[dateStr] || 0
      });
      curr.setDate(curr.getDate() + 1);
    }
    return data;
  }, [filteredSales, startDate, endDate]);

  const metrics = useMemo(() => {
    const totalSales = filteredSales.reduce((acc, curr) => acc + curr.montoTotal, 0);
    const grossProfit = filteredSales.reduce((acc, curr) => acc + curr.gananciaNeta, 0);
    const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + curr.monto, 0);
    const netProfit = grossProfit - totalExpenses;
    
    const salesCount = filteredSales.length;
    const avgTicket = salesCount > 0 ? totalSales / salesCount : 0;
    
    return { totalSales, grossProfit, totalExpenses, netProfit, salesCount, avgTicket };
  }, [filteredSales, filteredExpenses]);

  const totalClientDebt = useMemo(() => clients.reduce((acc, c) => acc + (Number(c.saldo) || 0), 0), [clients]);
  const lowStockProducts = useMemo(() => products.filter(p => Number(p.stockActual) <= 3).slice(0, 5), [products]);
  const inventoryValue = useMemo(() => products.reduce((acc, p) => acc + (p.stockActual * (p.precioCostoPromedio || 0)), 0), [products]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">Dashboard de Ventas</h2>
            <button onClick={async () => { setIsRefreshing(true); await onRefresh(); setIsRefreshing(false); }} className={`p-2 text-gray-400 hover:text-[#E07A5F] transition-all ${isRefreshing ? 'animate-spin' : ''}`}>
              <RefreshCw size={18} />
            </button>
          </div>
          <p className="text-xs text-gray-400 font-medium">Visualización de ingresos y salud de cuenta.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-white p-2.5 px-4 rounded-xl shadow-sm border border-gray-100">
            <Calendar size={14} className="text-gray-400" />
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-[10px] font-bold outline-none bg-transparent text-gray-600" />
            <span className="text-gray-200">|</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-[10px] font-bold outline-none bg-transparent text-gray-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard title="Ventas Totales" value={formatCurrency(metrics.totalSales)} icon={<DollarSign size={18} className="text-orange-500" />} color="bg-orange-50" />
          <KpiCard title="Ganancia Real" value={formatCurrency(metrics.netProfit)} icon={<TrendingUp size={18} className="text-green-600" />} color="bg-green-50" />
          <KpiCard title="Gastos Operat." value={formatCurrency(metrics.totalExpenses)} icon={<ReceiptText size={18} className="text-red-400" />} color="bg-red-50" />
          <KpiCard title="Ticket Promedio" value={formatCurrency(metrics.avgTicket)} icon={<CreditCard size={18} className="text-blue-500" />} color="bg-blue-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 h-[380px] transition-colors flex flex-col relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-orange-50/20 rounded-full blur-3xl pointer-events-none" />
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Evolución Diaria de Ventas</h3>
              </div>
            </div>
            <div className="flex-1 min-h-0 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E07A5F" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#E07A5F" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} stroke="#94a3b8" dy={10} minTickGap={30} />
                  <YAxis fontSize={9} axisLine={false} tickLine={false} stroke="#94a3b8" tickFormatter={(val) => `$${val > 999 ? (val/1000).toFixed(0) + 'k' : val}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="v" stroke="#E07A5F" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" activeDot={{ r: 6, strokeWidth: 0, fill: '#E07A5F' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <KpiCard title="Deuda Clientes" value={formatCurrency(totalClientDebt)} icon={<Users size={18} className="text-red-500" />} color="bg-red-50" />
            <KpiCard title="Valor Inventario" value={formatCurrency(inventoryValue)} icon={<Package size={18} className="text-[#4C7031]" />} color="bg-green-50" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle size={14} className="text-orange-400" /> Stock Crítico
            </h3>
          </div>
          <div className="flex-1 space-y-3">
            {lowStockProducts.length > 0 ? lowStockProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden">
                    <img src={p.fotoUrl || 'https://via.placeholder.com/50'} className="w-full h-full object-cover" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-gray-700 truncate uppercase">{p.nombre}</p>
                    <p className="text-[8px] text-gray-400 font-bold">STOCK: {p.stockActual}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] font-black text-red-500">{p.stockActual}u</p>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-20">
                <ShoppingBag size={32} />
                <p className="text-[9px] font-bold uppercase tracking-widest">Todo en orden</p>
              </div>
            )}
          </div>
          <div className="mt-8 pt-6 border-t border-gray-50">
             <h3 className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-4">Movimientos del Día</h3>
             <div className="space-y-3">
                {movements.slice(0, 3).map(m => (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${m.concepto === 'ABONO' ? 'bg-green-500' : 'bg-red-400'}`} />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[9px] font-bold text-gray-700 uppercase truncate">{m.clientName}</p>
                      <p className="text-[8px] text-gray-400 font-medium">{m.concepto}</p>
                    </div>
                    <span className="text-[10px] font-bold text-gray-800">{formatCurrency(m.monto)}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-50">
        <p className="text-[8px] font-black text-[#E07A5F] uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
        <p className="text-xs font-black text-gray-800">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-all">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color} flex-shrink-0 shadow-sm`}>{icon}</div>
    <div className="overflow-hidden">
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">{title}</p>
      <p className="text-sm font-bold text-gray-800 truncate">{value}</p>
    </div>
  </div>
);

export default Dashboard;
