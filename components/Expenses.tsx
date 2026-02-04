
import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { DataService } from '../services/dataService';
import { Plus, Search, Receipt, X, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { formatCurrency, Toast } from './Clients';

declare var Swal: any;

interface ExpensesProps {
  expenses: Expense[];
  onRefresh: () => void;
}

const Expenses: React.FC<ExpensesProps> = ({ expenses, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExpenses = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return expenses.filter(e => 
      e.concepto.toLowerCase().includes(term) || e.categoria.toLowerCase().includes(term)
    ).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [expenses, searchTerm]);

  const handleSaveExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      await DataService.addExpense({
        concepto: formData.get('concepto') as string,
        monto: parseFloat(formData.get('monto') as string),
        categoria: formData.get('categoria') as string,
      });
      setIsModalOpen(false);
      onRefresh();
      Swal.fire('Éxito', 'Gasto registrado correctamente.', 'success');
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight">Gastos Varios</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Control de egresos operativos</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#E07A5F] text-white px-5 py-3 rounded-2xl shadow-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all">
          <Plus size={18} className="inline mr-2" /> Registrar Gasto
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden">
        <div className="p-4 border-b border-gray-50 bg-gray-50/10 flex items-center gap-3">
          <Search className="text-gray-300" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por concepto o categoría..." 
            className="flex-1 outline-none text-xs font-bold bg-transparent placeholder-gray-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] border-b">
              <tr>
                <th className="px-8 py-4">Fecha</th>
                <th className="px-8 py-4">Concepto</th>
                <th className="px-8 py-4">Categoría</th>
                <th className="px-8 py-4 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredExpenses.map(expense => (
                <tr key={expense.id} className="hover:bg-gray-50/20 transition-colors">
                  <td className="px-8 py-5 text-[10px] font-bold text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar size={12} />
                      {new Date(expense.fecha).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[11px] font-black text-gray-700 uppercase">{expense.concepto}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-gray-100 text-gray-400 rounded-full text-[8px] font-black uppercase">{expense.categoria}</span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className="text-[11px] font-black text-red-500">{formatCurrency(expense.monto)}</span>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr><td colSpan={4} className="py-20 text-center text-gray-300 font-bold uppercase text-[10px]">Sin gastos registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 z-[200] animate-in fade-in">
          <div className="bg-white rounded-[3rem] w-full max-w-sm p-10 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-gray-800 tracking-tight">Nuevo Gasto</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-300 hover:text-gray-500 transition-colors"><X size={24}/></button>
            </div>
            <form onSubmit={handleSaveExpense} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Concepto</label>
                <input name="concepto" placeholder="Ej: Bolsas de Regalo" required className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none font-bold text-xs focus:ring-4 focus:ring-orange-50 transition-all shadow-inner" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Monto</label>
                  <input name="monto" type="number" step="0.01" required className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none font-black text-sm text-gray-800 focus:ring-4 focus:ring-orange-50 transition-all shadow-inner" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Categoría</label>
                  <select name="categoria" className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none font-bold text-xs focus:ring-4 focus:ring-orange-50 transition-all shadow-inner appearance-none">
                    <option value="Operativo">Operativo</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Envio">Envío</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-[#E07A5F] text-white py-5 rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-orange-100 hover:brightness-110 active:scale-95 transition-all">
                {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'REGISTRAR GASTO'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
