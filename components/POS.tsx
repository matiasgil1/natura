
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Product, Client, SaleItem, Sale } from '../types';
import { Search, ShoppingCart, Plus, Minus, X, User, DollarSign, Loader2, CreditCard, Wallet, Printer, CheckCircle, Trash2, ArrowRight, Coins, Percent } from 'lucide-react';
import { formatCurrency, Toast } from './Clients';

declare var Swal: any;

interface POSProps {
  products: Product[];
  clients: Client[];
  onRefresh: () => void;
}

const POS: React.FC<POSProps> = ({ products, clients, onRefresh }) => {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientSearchText, setClientSearchText] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [montoPagado, setMontoPagado] = useState(0);
  
  const [descuento, setDescuento] = useState(0);
  const [descuentoInput, setDescuentoInput] = useState('0');

  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsClientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) && p.stockActual > 0
    );
  }, [products, searchTerm]);

  const filteredClients = useMemo(() => {
    if (!clientSearchText) return clients;
    const term = clientSearchText.toLowerCase();
    return clients.filter(c => 
      c.nombre.toLowerCase().includes(term) || c.apellido.toLowerCase().includes(term)
    );
  }, [clients, clientSearchText]);

  const selectedClient = useMemo(() => clients.find(c => c.id === selectedClientId), [clients, selectedClientId]);
  const subtotal = cart.reduce((acc, curr) => acc + curr.subtotal, 0);
  const total = Math.max(0, subtotal - descuento);
  const cartItemsCount = cart.reduce((acc, curr) => acc + curr.cantidad, 0);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.cantidad >= product.stockActual) {
          Toast.fire({ icon: 'warning', title: 'Sin stock disponible' });
          return prev;
        }
        return prev.map(item => item.productId === product.id 
          ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * item.precioVenta }
          : item
        );
      }
      Toast.fire({ icon: 'success', title: 'Añadido al carrito', timer: 800 });
      return [...prev, {
        productId: product.id, nombre: product.nombre, cantidad: 1, precioVenta: product.precioVenta, subtotal: product.precioVenta
      }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const product = products.find(p => p.id === productId);
        const newQty = item.cantidad + delta;
        if (newQty <= 0) return null;
        if (product && newQty > product.stockActual) {
          Toast.fire({ icon: 'warning', title: 'Límite de stock' });
          return item;
        }
        return { ...item, cantidad: newQty, subtotal: newQty * item.precioVenta };
      }
      return item;
    }).filter(Boolean) as SaleItem[]);
  };

  const handlePrintReceipt = (sale: any) => {
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF();
    doc.setFillColor(224, 122, 95); 
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text('NATURA', 105, 22, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text('COMPROBANTE DE VENTA OFICIAL', 105, 30, { align: 'center' });
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.4);
    doc.line(85, 34, 125, 34);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text('DETALLES DE LA OPERACIÓN', 20, 60);
    doc.setDrawColor(230, 230, 230);
    doc.line(20, 62, 190, 62);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`CLIENTE:`, 20, 72);
    doc.setTextColor(0, 0, 0); 
    doc.setFont("helvetica", "bold");
    doc.text(sale.clientName.toUpperCase(), 50, 72);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`FECHA:`, 20, 79);
    doc.setTextColor(0, 0, 0);
    doc.text(new Date(sale.fecha).toLocaleString('es-AR'), 50, 79);
    doc.setTextColor(100, 100, 100);
    doc.text(`MÉTODO:`, 20, 86);
    doc.setTextColor(0, 0, 0);
    doc.text(sale.metodoPago.toUpperCase(), 50, 86);
    doc.setTextColor(100, 100, 100);
    doc.text(`OPERACIÓN:`, 20, 93);
    doc.setTextColor(120, 120, 120);
    doc.text(`#${sale.id}`, 50, 93);
    (doc as any).autoTable({
      startY: 105,
      head: [['PRODUCTO', 'CANT.', 'PRECIO', 'SUBTOTAL']],
      body: sale.items.map((i: any) => [
        i.nombre.toUpperCase(), 
        i.cantidad, 
        formatCurrency(i.precioVenta), 
        formatCurrency(i.subtotal)
      ]),
      headStyles: { fillColor: [224, 122, 95], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2.5, font: "helvetica", textColor: [0, 0, 0] },
      columnStyles: { 0: { cellWidth: 'auto' }, 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
      foot: [
        ['', '', 'SUBTOTAL', formatCurrency(subtotal)],
        ['', '', 'DESCUENTO', '-' + formatCurrency(sale.descuento || 0)],
        ['', '', 'TOTAL FINAL', formatCurrency(sale.montoTotal)], 
        ['', '', 'ABONADO', formatCurrency(sale.montoPagado)], 
        ['', '', 'PENDIENTE', formatCurrency(sale.saldoRestante)]
      ],
      footStyles: { fillColor: [248, 248, 248], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5, lineColor: [230, 230, 230], lineWidth: 0.1 },
      margin: { left: 20, right: 20 },
      theme: 'striped'
    });
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text('¡Gracias por tu compra! Natura Gestión Cloud', 105, 285, { align: 'center' });
    doc.save(`Ticket_Natura_${sale.id}.pdf`);
  };

  const handleCheckout = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    Swal.fire({
      title: 'Procesando venta...',
      html: 'Generando comprobante y actualizando stock',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      customClass: { popup: 'rounded-[2rem]' }
    });

    try {
      const gananciaNetaBase = cart.reduce((acc, item) => {
        const prod = products.find(p => p.id === item.productId);
        const profit = (item.precioVenta - (prod?.precioCostoPromedio || 0)) * item.cantidad;
        return acc + profit;
      }, 0);

      const gananciaNetaFinal = gananciaNetaBase - descuento;
      
      const saleData = await DataService.registerSale(
        selectedClientId, 
        `${selectedClient?.nombre} ${selectedClient?.apellido}`, 
        cart, 
        total, 
        montoPagado, 
        metodoPago, 
        gananciaNetaFinal
      );

      const finalSaleData = { ...saleData, descuento };
      
      onRefresh();
      setCart([]);
      setDescuento(0);
      setDescuentoInput('0');
      setSelectedClientId('');
      setClientSearchText('');
      setIsPaymentModalOpen(false);
      setIsCartDrawerOpen(false);

      Swal.fire({
        title: '¡Venta Exitosa!',
        html: `<div class="p-6 bg-orange-50 rounded-[2rem] border border-orange-100 mb-2">
                 <p class="text-[9px] font-black text-gray-400 uppercase mb-1 tracking-widest">Monto Final</p>
                 <p class="text-2xl font-black text-[#E07A5F] tracking-tighter">${formatCurrency(total)}</p>
               </div>
               <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">¿Deseas descargar el ticket?</p>`,
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'DESCARGAR TICKET',
        cancelButtonText: 'CERRAR',
        confirmButtonColor: '#E07A5F',
        customClass: { popup: 'rounded-[2.5rem]', confirmButton: 'rounded-2xl font-black text-[10px] px-6 py-4' }
      }).then((result: any) => {
        if (result.isConfirmed) handlePrintReceipt(finalSaleData);
      });
    } catch (err: any) { 
      Swal.fire('Error', err.message, 'error'); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  // Se refactoriza CartContent como una función que devuelve JSX
  // para evitar el remounting del componente y la pérdida de foco.
  const renderCartContent = (isMobile = false) => (
    <div className={`flex flex-col h-full bg-white overflow-visible`}>
      <div className="p-6 border-b border-gray-50 bg-gray-50/10 relative z-30">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-[10px] font-black text-gray-400 flex items-center gap-2 uppercase tracking-widest">
            <ShoppingCart size={14} className="text-[#E07A5F]"/> Mi Carrito {cartItemsCount > 0 && `(${cartItemsCount})`}
          </h3>
          {isMobile && <button onClick={() => setIsCartDrawerOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-400"><X size={14}/></button>}
        </div>
        
        <div className="relative" ref={dropdownRef}>
          {selectedClientId ? (
            <div className="flex items-center justify-between bg-orange-50 border border-orange-100 p-3 rounded-xl shadow-sm animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E07A5F] flex items-center justify-center text-white font-black text-[10px]">
                  {selectedClient?.nombre[0]}{selectedClient?.apellido[0]}
                </div>
                <p className="text-[11px] font-black text-gray-800 uppercase">{selectedClient?.nombre} {selectedClient?.apellido}</p>
              </div>
              <button onClick={() => { setSelectedClientId(''); setClientSearchText(''); }} className="p-1.5 hover:bg-white rounded-lg text-orange-300 hover:text-red-500 transition-all">
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#E07A5F] transition-colors" size={14} />
                <input 
                  type="text" 
                  placeholder="Seleccionar cliente..." 
                  value={clientSearchText}
                  onFocus={() => setIsClientDropdownOpen(true)}
                  onChange={(e) => { setClientSearchText(e.target.value); setIsClientDropdownOpen(true); }}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#E07A5F] transition-all shadow-inner"
                />
              </div>
              {isClientDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[100] max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                  {filteredClients.map(c => (
                    <button 
                      key={c.id} 
                      type="button"
                      onMouseDown={(e) => {
                         e.preventDefault();
                         setSelectedClientId(c.id); 
                         setClientSearchText(`${c.nombre} ${c.apellido}`); 
                         setIsClientDropdownOpen(false); 
                      }} 
                      className="w-full text-left px-5 py-3 hover:bg-orange-50 text-[10px] font-bold text-gray-700 border-b border-gray-50 last:border-0 block"
                    >
                      {c.nombre} {c.apellido}
                    </button>
                  ))}
                  {filteredClients.length === 0 && (
                    <div className="p-4 text-center text-[9px] font-bold text-gray-300 uppercase tracking-widest">No hay clientes</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative z-10">
        {cart.map(item => (
          <div key={item.productId} className="flex gap-4 items-center p-3 rounded-2xl border border-gray-50 bg-white shadow-sm hover:border-orange-100 transition-all">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-gray-800 uppercase truncate leading-tight tracking-tight">{item.nombre}</p>
              <p className="text-[10px] font-black text-[#E07A5F]">{formatCurrency(item.precioVenta)}</p>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl p-1 border border-gray-100">
              <button onClick={() => updateQuantity(item.productId, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg text-gray-400 transition-colors shadow-sm"><Minus size={10}/></button>
              <span className="text-[11px] font-black w-5 text-center text-gray-700">{item.cantidad}</span>
              <button onClick={() => updateQuantity(item.productId, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg text-gray-400 transition-colors shadow-sm"><Plus size={10}/></button>
            </div>
          </div>
        ))}
        {cart.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20">
            <ShoppingCart size={42} className="mb-4 text-gray-300" />
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Carrito Vacío</p>
          </div>
        )}
      </div>
      
      <div className="p-6 bg-white border-t border-gray-50 space-y-4 relative z-20">
        <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
               <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Subtotal</span>
               <span className="text-xs font-bold text-gray-600">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center px-1">
               <span className="text-[9px] font-black text-[#E07A5F] uppercase tracking-[0.2em]">Descuento</span>
               <div className="flex items-center gap-2 bg-orange-50/30 rounded-xl px-4 border border-orange-100 shadow-inner w-44">
                  <span className="text-[12px] font-black text-[#E07A5F]">$</span>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    value={descuentoInput}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value.replace(',', '.');
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setDescuentoInput(val);
                        const numericVal = parseFloat(val);
                        setDescuento(isNaN(numericVal) ? 0 : numericVal);
                      }
                    }}
                    onBlur={() => {
                      if (descuentoInput === '' || isNaN(parseFloat(descuentoInput))) {
                        setDescuentoInput('0');
                        setDescuento(0);
                      }
                    }}
                    placeholder="0.00"
                    className="w-full bg-transparent outline-none text-[12px] font-black text-[#E07A5F] text-right py-2 placeholder-orange-200"
                  />
               </div>
            </div>
            <div className="flex justify-between items-center px-1 pt-2 border-t border-gray-50">
               <span className="text-[9px] font-black text-gray-800 uppercase tracking-[0.2em]">Total</span>
               <span className="text-sm font-black text-gray-800 tracking-tighter">{formatCurrency(total)}</span>
            </div>
        </div>
        <button 
          disabled={cart.length === 0 || !selectedClientId} 
          onClick={() => { setMontoPagado(total); setIsPaymentModalOpen(true); }} 
          className="w-full bg-[#E07A5F] text-white py-4.5 rounded-[1.5rem] font-black text-[10px] shadow-xl shadow-orange-100 disabled:opacity-40 disabled:grayscale transition-all active:scale-95 uppercase tracking-widest flex items-center justify-center gap-2 group"
        >
          CONTINUAR AL PAGO
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full relative pb-20 lg:pb-0">
      <div className="flex-1 bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-50 flex flex-col overflow-hidden">
        <div className="p-8 border-b border-gray-50 bg-gray-50/5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h2 className="text-xl font-black text-gray-800 tracking-tight">Venta (POS)</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Catálogo disponible</p>
            </div>
            <div className="relative w-full sm:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar productos..." 
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-orange-50 transition-all shadow-inner" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6 content-start">
          {filteredProducts.map(product => (
            <div key={product.id} className="relative flex flex-col bg-white border border-gray-100 rounded-[2rem] overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all group active:scale-[0.98]">
              <div className="aspect-square bg-gray-50 overflow-hidden cursor-pointer relative" onClick={() => addToCart(product)}>
                <img src={product.fotoUrl || 'https://via.placeholder.com/300'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <button 
                  onClick={(e) => { e.stopPropagation(); addToCart(product); }} 
                  className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md shadow-xl text-[#E07A5F] rounded-2xl flex items-center justify-center hover:bg-[#E07A5F] hover:text-white transition-all active:scale-90 z-20"
                >
                  <Plus size={18} strokeWidth={3} />
                </button>
                <div className="absolute top-4 left-4 px-2.5 py-1 bg-gray-900/40 backdrop-blur-md text-white text-[9px] font-black rounded-lg uppercase tracking-wider">Stock: {product.stockActual}</div>
              </div>
              <div className="p-5">
                <p className="text-[10px] font-bold text-gray-500 line-clamp-1 uppercase leading-tight mb-2 tracking-tight">{product.nombre}</p>
                <p className="text-sm font-black text-gray-900 tracking-tighter">{formatCurrency(product.precioVenta)}</p>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 text-center">
               <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 opacity-40">
                 <Search size={32} className="text-gray-400" />
               </div>
               <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Sin resultados en catálogo</p>
            </div>
          )}
        </div>
      </div>

      <div className="hidden lg:block w-80 flex-shrink-0 bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-50 sticky top-0 h-fit max-h-[calc(100vh-200px)]">
        {renderCartContent()}
      </div>

      {cartItemsCount > 0 && (
        <button 
          onClick={() => setIsCartDrawerOpen(true)} 
          className="lg:hidden fixed bottom-6 right-6 w-16 h-16 bg-[#E07A5F] text-white rounded-full shadow-[0_12px_44px_rgba(224,122,95,0.4)] flex items-center justify-center z-[110] animate-bounce-subtle active:scale-90 transition-transform"
        >
          <ShoppingCart size={28} />
          <span className="absolute -top-1 -right-1 bg-[#4C7031] text-[10px] font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
            {cartItemsCount}
          </span>
        </button>
      )}

      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartDrawerOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[90%] max-w-sm bg-white shadow-2xl animate-in slide-in-from-right duration-300">
             {renderCartContent(true)}
          </div>
        </div>
      )}

      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-[250] animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-green-50/20 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex justify-between items-center mb-8 relative z-10">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Cierre de Transacción</h3>
                <button onClick={() => setIsPaymentModalOpen(false)} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-600 transition-colors"><X size={18}/></button>
              </div>

              <div className="space-y-8 relative z-10">
                <div className="bg-gray-50/50 p-6 rounded-[2.5rem] border border-gray-100 shadow-inner">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em]">Subtotal</p>
                    <p className="text-xs font-bold text-gray-400 line-through">{formatCurrency(subtotal)}</p>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[8px] font-black text-[#E07A5F] uppercase tracking-[0.2em]">Descuento Aplicado</p>
                    <p className="text-xs font-black text-[#E07A5F]">-{formatCurrency(descuento)}</p>
                  </div>
                  <div className="text-center pt-2 border-t border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Total a cobrar</p>
                    <p className="text-3xl font-black text-gray-800 tracking-tighter">{formatCurrency(total)}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase ml-2 mb-3 block tracking-widest">Método de Pago</label>
                    <div className="grid grid-cols-3 gap-3">
                       {['Efectivo', 'Transf.', 'Tarjeta'].map(m => (
                         <button 
                           key={m} 
                           onClick={() => setMetodoPago(m)} 
                           className={`py-4 rounded-2xl text-[10px] font-black uppercase transition-all border-2 ${
                             metodoPago === m 
                             ? 'bg-[#E07A5F] text-white border-[#E07A5F] shadow-xl shadow-orange-100 scale-[1.02]' 
                             : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                           }`}
                         >
                           {m}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-3 ml-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Monto Recibido</label>
                        <div className="flex gap-2">
                           <button 
                             onClick={() => setMontoPagado(total)} 
                             className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${montoPagado === total ? 'bg-[#4C7031] text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                           >
                             TODO
                           </button>
                           <button 
                             onClick={() => setMontoPagado(0)} 
                             className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${montoPagado === 0 ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                           >
                             A CUENTA
                           </button>
                        </div>
                    </div>
                    <div className="relative group">
                      <Wallet className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#E07A5F] transition-colors" size={24} />
                      <input 
                        type="number" 
                        value={montoPagado} 
                        onChange={(e) => setMontoPagado(Number(e.target.value))} 
                        className="w-full pl-14 pr-8 py-6 bg-gray-50 border-none rounded-[2rem] outline-none font-black text-3xl text-gray-800 focus:ring-4 focus:ring-orange-50 transition-all shadow-inner" 
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-end">
                         <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Saldo Restante</p>
                         <p className={`text-[11px] font-black ${total - montoPagado > 0 ? 'text-red-500' : 'text-green-600'}`}>
                           {formatCurrency(Math.max(0, total - montoPagado))}
                         </p>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleCheckout} 
                  disabled={isProcessing} 
                  className="w-full py-6 bg-[#4C7031] text-white rounded-[2rem] font-black text-[11px] shadow-2xl shadow-green-100 uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      <CheckCircle size={20} />
                      CONFIRMAR VENTA
                    </>
                  )}
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default POS;
