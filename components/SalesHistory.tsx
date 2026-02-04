
import React, { useMemo, useState } from 'react';
import { Sale } from '../types';
import { Search, Printer, Eye, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { formatCurrency, Toast } from './Clients';

declare var Swal: any;

interface SalesHistoryProps {
  sales: Sale[];
  onRefresh: () => Promise<void> | void;
}

const SalesHistory: React.FC<SalesHistoryProps> = ({ sales, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredSales = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return sales.filter(s => 
      s.id.toLowerCase().includes(term) ||
      s.clientName.toLowerCase().includes(term) ||
      s.metodoPago.toLowerCase().includes(term)
    ).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [sales, searchTerm]);

  const totalPages = Math.ceil(filteredSales.length / 10);
  const paginatedSales = useMemo(() => filteredSales.slice((currentPage - 1) * 10, currentPage * 10), [filteredSales, currentPage]);

  const handlePrintReceipt = (sale: Sale) => {
    Toast.fire({ icon: 'info', title: 'Generando Ticket...' });
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF();
    
    // Header Natura Premium
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
    doc.text('DETALLES DE LA VENTA REIMPRESA', 20, 60);
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
        ['', '', 'TOTAL', formatCurrency(sale.montoTotal)],
        ['', '', 'ABONADO EN VENTA', formatCurrency(sale.montoPagado)],
        ['', '', 'SALDO ORIG.', formatCurrency(sale.saldoRestante)]
      ],
      footStyles: { 
        fillColor: [248, 248, 248], 
        textColor: [0, 0, 0], 
        fontStyle: 'bold', 
        fontSize: 8.5,
        lineColor: [230, 230, 230],
        lineWidth: 0.1
      },
      margin: { left: 20, right: 20 },
      theme: 'striped'
    });

    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text('Este documento es una copia del original. Natura Gestión Cloud', 105, 285, { align: 'center' });

    doc.save(`Ticket_Natura_${sale.id}.pdf`);
    Toast.fire({ icon: 'success', title: 'Ticket descargado' });
  };

  const viewItems = (sale: Sale) => {
    Swal.fire({
      title: 'Detalle de Operación',
      html: `
        <div class="text-left text-[11px] space-y-4">
          <div class="p-5 bg-gray-50 rounded-[1.5rem] border border-gray-100">
            ${sale.items.map(i => `
              <div class="flex justify-between py-2 border-b border-gray-100 last:border-0">
                <span class="text-gray-500 font-medium">${i.cantidad}x ${i.nombre}</span>
                <span class="font-bold text-gray-800">${formatCurrency(i.subtotal)}</span>
              </div>
            `).join('')}
          </div>
          <div class="px-2 space-y-2">
             <div class="flex justify-between text-gray-400 font-black uppercase tracking-widest text-[8px]"><span>Monto Total</span><span class="text-gray-800 text-sm font-black">${formatCurrency(sale.montoTotal)}</span></div>
             <div class="flex justify-between text-green-600 font-black uppercase tracking-widest text-[8px]"><span>Pagado en Venta</span><span class="text-sm font-black">${formatCurrency(sale.montoPagado)}</span></div>
             ${sale.saldoRestante > 0 ? `
               <div class="flex justify-between text-red-500 font-black uppercase tracking-widest text-[8px]"><span>Deuda en esta Venta</span><span class="text-sm font-black">${formatCurrency(sale.saldoRestante)}</span></div>
               <div class="mt-4 p-3 bg-blue-50 text-blue-600 rounded-xl flex items-start gap-2 border border-blue-100">
                 <div class="mt-0.5"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></div>
                 <p class="text-[9px] font-bold leading-tight uppercase">Los pagos realizados posteriormente se reflejan en el Saldo Actual dentro de la sección "Clientes".</p>
               </div>
             ` : ''}
          </div>
        </div>
      `,
      confirmButtonText: 'CERRAR',
      confirmButtonColor: '#E07A5F',
      customClass: { popup: 'rounded-[2rem]' }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight">Historial de Ventas</h2>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Control de transacciones realizadas</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden">
        <div className="p-4 border-b border-gray-50 bg-gray-50/10 flex items-center gap-3">
          <Search className="text-gray-300" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por cliente, ID o método..." 
            className="flex-1 outline-none text-xs font-bold bg-transparent placeholder-gray-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] border-b">
              <tr>
                <th className="px-8 py-4">Fecha / ID</th>
                <th className="px-8 py-4">Titular</th>
                <th className="px-8 py-4">Monto</th>
                <th className="px-8 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedSales.map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-gray-700">{new Date(sale.fecha).toLocaleDateString()}</span>
                      <span className="text-[9px] text-gray-300 font-black uppercase tracking-tighter">#{sale.id}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[11px] font-bold text-gray-600 uppercase tracking-tight">{sale.clientName}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-gray-800">{formatCurrency(sale.montoTotal)}</span>
                      <span className={`text-[8px] font-black uppercase tracking-widest ${sale.saldoRestante > 0 ? 'text-red-400' : 'text-green-500'}`}>
                        {sale.saldoRestante > 0 ? 'Histórico: Pendiente' : 'Saldado'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 transition-all">
                      <button onClick={() => handlePrintReceipt(sale)} className="p-2.5 text-gray-400 hover:text-blue-500 bg-gray-50 hover:bg-blue-50 rounded-xl transition-all" title="Generar Ticket">
                        <Printer size={16} />
                      </button>
                      <button onClick={() => viewItems(sale)} className="p-2.5 text-gray-400 hover:text-[#E07A5F] bg-gray-50 hover:bg-orange-50 rounded-xl transition-all" title="Ver Detalle">
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedSales.length === 0 && (
                <tr><td colSpan={4} className="py-24 text-center text-gray-300 italic font-bold text-[10px] uppercase tracking-widest">Sin registros de ventas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center gap-3 px-4">
           <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} className="p-3 bg-white border border-gray-50 rounded-2xl shadow-sm text-gray-400 disabled:opacity-30 transition-all hover:bg-gray-50"><ChevronLeft size={18}/></button>
           <div className="flex items-center px-4 bg-white border border-gray-50 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest">Pág {currentPage} de {totalPages}</div>
           <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} className="p-3 bg-white border border-gray-50 rounded-2xl shadow-sm text-gray-400 disabled:opacity-30 transition-all hover:bg-gray-50"><ChevronRight size={18}/></button>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;
