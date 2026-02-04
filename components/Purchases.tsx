
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Product, Purchase } from '../types';
import { Plus, ShoppingBag, Info, Search, ChevronLeft, ChevronRight, Calendar, X, ChevronDown, Loader2, Check } from 'lucide-react';
import { formatCurrency } from './Clients';

declare var Swal: any;

interface PurchasesProps {
  products: Product[];
  onRefresh: () => void;
}

const ITEMS_PER_PAGE = 10;

const Purchases: React.FC<PurchasesProps> = ({ products, onRefresh }) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Custom Select State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [selectSearch, setSelectSearch] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    DataService.getPurchases().then(setPurchases);
  }, [products]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPurchases = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return purchases.filter(p => {
      const product = products.find(prod => prod.id === p.productId);
      return (
        p.id.toLowerCase().includes(term) ||
        p.proveedor.toLowerCase().includes(term) ||
        (product && product.nombre.toLowerCase().includes(term))
      );
    }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [purchases, searchTerm, products]);

  const filteredSelectProducts = useMemo(() => {
    if (!selectSearch) return products;
    return products.filter(p => p.nombre.toLowerCase().includes(selectSearch.toLowerCase()));
  }, [products, selectSearch]);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const totalPages = Math.ceil(filteredPurchases.length / ITEMS_PER_PAGE);
  const paginatedPurchases = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPurchases.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPurchases, currentPage]);

  const handlePurchase = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProductId) {
      Swal.fire('Atención', 'Selecciona un producto.', 'warning');
      return;
    }
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      productId: selectedProductId,
      cantidad: parseInt(formData.get('cantidad') as string),
      precioCosto: parseFloat(formData.get('precioCosto') as string),
      proveedor: formData.get('proveedor') as string,
    };

    try {
      await DataService.registerPurchase(data);
      onRefresh(); 
      setIsModalOpen(false);
      setSelectedProductId('');
      Swal.fire({
        title: '¡Ingreso Exitoso!',
        text: 'PPP y Stock actualizados correctamente.',
        icon: 'success',
        confirmButtonColor: '#E07A5F',
        customClass: { popup: 'rounded-[2rem]' }
      });
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight">Reposición de Stock</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Control de costos promedio (PPP)</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#4C7031] text-white px-6 py-3.5 rounded-2xl shadow-xl shadow-green-50 font-black text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
        >
          <Plus size={18} className="inline mr-2" /> Nueva Compra
        </button>
      </div>

      <div className="bg-orange-50/50 border border-orange-100/50 p-6 rounded-[2rem] flex items-center gap-6 text-orange-800 shadow-inner">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#E07A5F] shadow-sm">
           <Info size={24} />
        </div>
        <div className="text-xs">
          <p className="font-black mb-1 uppercase tracking-wider">¿Cómo funciona el PPP?</p>
          <p className="font-medium opacity-70">El sistema recalcula el costo unitario de tu inventario cada vez que registras una compra, asegurando que tus ganancias sean reales y precisas.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/10 flex items-center gap-3">
          <Search className="text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por producto o proveedor..." 
            className="flex-1 outline-none text-xs font-bold bg-transparent placeholder-gray-300"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] border-b">
              <tr>
                <th className="px-8 py-4">Fecha</th>
                <th className="px-8 py-4">Producto / Ref.</th>
                <th className="px-8 py-4 text-center">Cant.</th>
                <th className="px-8 py-4">Costo Unit.</th>
                <th className="px-8 py-4">Inversión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedPurchases.map(purchase => {
                const product = products.find(p => p.id === purchase.productId);
                return (
                  <tr key={purchase.id} className="hover:bg-gray-50/20 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold">
                        <Calendar size={12} />
                        {new Date(purchase.fecha).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[11px] font-black text-gray-700 uppercase leading-tight truncate max-w-[180px]">{product?.nombre || '???'}</p>
                      <p className="text-[9px] text-gray-300 font-bold uppercase tracking-tighter">{purchase.proveedor || 'S/Ref'}</p>
                    </td>
                    <td className="px-8 py-5 text-center text-[11px] font-black text-gray-800">
                      {purchase.cantidad}
                    </td>
                    <td className="px-8 py-5 text-[11px] font-bold text-gray-500">
                      {formatCurrency(purchase.precioCosto)}
                    </td>
                    <td className="px-8 py-5 text-[11px] font-black text-[#4C7031]">
                      {formatCurrency(purchase.cantidad * purchase.precioCosto)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 z-[200] animate-in fade-in">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 relative overflow-visible">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-gray-800 tracking-tight">Nueva Compra</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-300 hover:text-gray-500 transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={handlePurchase} className="space-y-6">
              {/* CUSTOM SELECT PRODUCT */}
              <div className="relative" ref={selectRef}>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Producto a reponer</label>
                <div 
                  onClick={() => setIsSelectOpen(!isSelectOpen)}
                  className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer hover:bg-white hover:border-orange-100 transition-all shadow-inner"
                >
                  <span className={`text-xs font-bold ${selectedProduct ? 'text-gray-800' : 'text-gray-300'}`}>
                    {selectedProduct ? `${selectedProduct.nombre} (Stock: ${selectedProduct.stockActual})` : 'Seleccionar...'}
                  </span>
                  <ChevronDown className={`text-gray-400 transition-transform ${isSelectOpen ? 'rotate-180' : ''}`} size={18} />
                </div>

                {isSelectOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-3xl shadow-2xl z-[210] overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-3 border-b border-gray-50 bg-gray-50/30">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                        <input 
                          autoFocus
                          type="text" 
                          placeholder="Buscar producto..." 
                          className="w-full pl-9 pr-4 py-2 bg-white border-none rounded-xl text-[11px] font-bold outline-none shadow-sm"
                          value={selectSearch}
                          onChange={(e) => setSelectSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      {filteredSelectProducts.map(p => (
                        <div 
                          key={p.id}
                          onClick={() => { setSelectedProductId(p.id); setIsSelectOpen(false); setSelectSearch(''); }}
                          className={`px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-orange-50 transition-colors ${selectedProductId === p.id ? 'bg-orange-50/50' : ''}`}
                        >
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-gray-700 uppercase">{p.nombre}</span>
                            <span className="text-[9px] text-gray-400 font-bold">Stock Actual: {p.stockActual}</span>
                          </div>
                          {selectedProductId === p.id && <Check size={14} className="text-[#E07A5F]" />}
                        </div>
                      ))}
                      {filteredSelectProducts.length === 0 && (
                        <div className="p-8 text-center text-gray-300 text-[10px] font-bold uppercase">Sin resultados</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Cantidad</label>
                  <input name="cantidad" type="number" min="1" required className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none font-black text-sm text-gray-800 focus:ring-4 focus:ring-orange-50 transition-all shadow-inner" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Costo Unit.</label>
                  <input name="precioCosto" type="number" step="0.01" min="0" required className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none font-black text-sm text-gray-800 focus:ring-4 focus:ring-orange-50 transition-all shadow-inner" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Referencia / Proveedor</label>
                <input name="proveedor" placeholder="Ej: Natura Ciclo 5" className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none font-bold text-xs text-gray-700 focus:ring-4 focus:ring-orange-50 transition-all shadow-inner" />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-5 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] px-6 py-5 bg-[#4C7031] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-green-100 hover:brightness-110 active:scale-95 transition-all">
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'REGISTRAR INGRESO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
