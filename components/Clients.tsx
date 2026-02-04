
import React, { useMemo, useState, useEffect } from 'react';
import { Client, Movement } from '../types';
import { DataService } from '../services/dataService';
import { Search, User, Phone, FileDown, MessageSquare, AlertCircle, TrendingDown, UserPlus, X, DollarSign, FileText, Printer, ChevronLeft, ChevronRight, History, Download } from 'lucide-react';

declare var Swal: any;

export const Toast = Swal.mixin({
  toast: true,
  position: 'top',
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: false,
  background: 'rgba(255, 255, 255, 0.95)',
  didOpen: (toast: any) => {
    toast.style.backdropFilter = 'blur(12px)';
    toast.style.borderRadius = '24px';
    toast.style.boxShadow = '0 12px 34px rgba(0,0,0,0.12)';
  }
});

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(amount).replace('ARS', '$').trim();
};

const cleanText = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

interface ClientsProps {
  clients: Client[];
  movements: Movement[];
  onRefresh: () => Promise<void> | void;
}

const Clients: React.FC<ClientsProps> = ({ clients, movements, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [movementsSearch, setMovementsSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentMovPage, setCurrentMovPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (window as any).printMovementReceipt = (id: string) => {
      const mov = movements.find(m => m.id === id);
      if (mov) generateAbonoReceipt(mov);
    };
    (window as any).downloadFullStatement = (clientId: string) => {
      const client = clients.find(c => c.id === clientId);
      if (client) generateFullStatementPDF(client, movements.filter(m => m.clientId === clientId));
    };
  }, [movements, clients]);

  const filteredClients = useMemo(() => {
    const term = cleanText(searchTerm);
    return clients.filter(c => 
      cleanText(`${c.nombre} ${c.apellido}`).includes(term) ||
      c.telefono.includes(term)
    ).sort((a, b) => b.saldo - a.saldo);
  }, [clients, searchTerm]);

  const filteredMovements = useMemo(() => {
    const term = cleanText(movementsSearch);
    return movements.filter(m => 
      cleanText(m.clientName).includes(term) ||
      m.id.toLowerCase().includes(term) ||
      m.concepto.toLowerCase().includes(term)
    ).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [movements, movementsSearch]);

  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * 10;
    return filteredClients.slice(start, start + 10);
  }, [filteredClients, currentPage]);

  const paginatedMovements = useMemo(() => {
    const start = (currentMovPage - 1) * 10;
    return filteredMovements.slice(start, start + 10);
  }, [filteredMovements, currentMovPage]);

  const totalDebtAmount = useMemo(() => clients.reduce((acc, c) => acc + (Number(c.saldo) || 0), 0), [clients]);

  const generateFullStatementPDF = (client: Client, clientMovs: Movement[]) => {
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
    doc.text('ESTADO DE CUENTA CORRIENTE', 105, 30, { align: 'center' });
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text('RESUMEN DE CLIENTE', 20, 60);
    doc.setDrawColor(230, 230, 230);
    doc.line(20, 62, 190, 62);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text('TITULAR:', 20, 72);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(`${client.nombre} ${client.apellido}`.toUpperCase(), 50, 72);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text('TELÉFONO:', 20, 79);
    doc.setTextColor(0, 0, 0);
    doc.text(client.telefono, 50, 79);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text('SALDO:', 20, 86);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(client.saldo > 0 ? 200 : 0, client.saldo > 0 ? 0 : 150, 0);
    doc.text(formatCurrency(client.saldo), 50, 86);
    (doc as any).autoTable({
      startY: 100,
      head: [['FECHA', 'ID', 'CONCEPTO', 'IMPORTE', 'SALDO RESULT.']],
      body: clientMovs.sort((a,b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()).map(m => [
        new Date(m.fecha).toLocaleDateString(),
        m.id,
        m.concepto.toUpperCase(),
        (m.concepto === 'ABONO' ? '-' : '+') + formatCurrency(m.monto),
        formatCurrency(m.saldoRestante)
      ]),
      headStyles: { fillColor: [224, 122, 95], textColor: [255, 255, 255], fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2.5, font: "helvetica" },
      columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } },
      theme: 'striped'
    });
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text(`Generado el ${new Date().toLocaleString()} - Natura Gestión Cloud`, 105, 285, { align: 'center' });
    doc.save(`Cuenta_Corriente_${client.nombre}_${client.apellido}.pdf`);
  };

  const generateAbonoReceipt = (movement: Movement) => {
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
    const subtitulo = movement.concepto === 'ABONO' ? 'COMPROBANTE DE ABONO OFICIAL' : 'COMPROBANTE DE MOVIMIENTO';
    doc.text(subtitulo, 105, 30, { align: 'center' });
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.4);
    doc.line(85, 34, 125, 34);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text('DETALLES DEL MOVIMIENTO', 20, 60);
    doc.setDrawColor(230, 230, 230);
    doc.line(20, 62, 190, 62);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`CLIENTE:`, 20, 72);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(movement.clientName.toUpperCase(), 50, 72);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`FECHA:`, 20, 79);
    doc.setTextColor(0, 0, 0);
    doc.text(new Date(movement.fecha).toLocaleString('es-AR'), 50, 79);
    doc.setTextColor(100, 100, 100);
    doc.text(`CONCEPTO:`, 20, 86);
    doc.setTextColor(0, 0, 0);
    doc.text(movement.concepto.toUpperCase(), 50, 86);
    doc.setTextColor(100, 100, 100);
    doc.text(`OPERACIÓN:`, 20, 93);
    doc.setTextColor(120, 120, 120);
    doc.text(`#${movement.id}`, 50, 93);
    (doc as any).autoTable({
      startY: 105,
      head: [['DESCRIPCIÓN', 'VALOR ANTERIOR', 'MOVIMIENTO', 'NUEVO SALDO']],
      body: [[
        movement.concepto.toUpperCase(),
        formatCurrency(movement.saldoAnterior),
        (movement.concepto === 'ABONO' ? '-' : '+') + formatCurrency(movement.monto),
        formatCurrency(movement.saldoRestante)
      ]],
      headStyles: { fillColor: [224, 122, 95], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 3, font: "helvetica", textColor: [0, 0, 0] },
      columnStyles: { 0: { halign: 'left' }, 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
      foot: [
        ['', '', 'TOTAL ABONADO', formatCurrency(movement.monto)],
        ['', '', 'SALDO PENDIENTE', formatCurrency(movement.saldoRestante)]
      ],
      footStyles: { fillColor: [248, 248, 248], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5, lineColor: [230, 230, 230], lineWidth: 0.1 },
      margin: { left: 20, right: 20 },
      theme: 'striped'
    });
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text('Este documento es un comprobante de pago oficial. Natura Gestión Cloud', 105, 285, { align: 'center' });
    doc.save(`Recibo_Abono_${movement.clientName}_${movement.id}.pdf`);
  };

  const handleCollectPayment = async (client: Client) => {
    const { value: monto } = await Swal.fire({
      title: 'Cobrar Saldo',
      html: `<div class="p-4 text-center">
          <p class="text-[10px] font-black text-gray-400 uppercase mb-1">Deuda de ${client.nombre}</p>
          <p class="text-xl font-bold text-red-500 mb-6">${formatCurrency(client.saldo)}</p>
          <input id="swal-input-monto" type="number" step="0.01" class="w-full px-6 py-4 bg-gray-50 border-none rounded-[1.2rem] outline-none font-bold text-lg text-center text-gray-800" placeholder="Monto">
        </div>`,
      showCancelButton: true,
      confirmButtonText: 'CONFIRMAR PAGO',
      confirmButtonColor: '#4C7031',
      customClass: { popup: 'rounded-[2rem]' },
      preConfirm: () => {
        const input = document.getElementById('swal-input-monto') as HTMLInputElement;
        if (!input.value || parseFloat(input.value) <= 0) { Swal.showValidationMessage('Monto no válido'); return false; }
        return parseFloat(input.value);
      }
    });

    if (monto) {
      try {
        Toast.fire({ icon: 'info', title: 'Registrando...' });
        await DataService.registerClientPayment(client.id, monto);
        await onRefresh();
        Swal.fire({ title: '¡Abono Registrado!', icon: 'success', confirmButtonColor: '#4C7031', customClass: { popup: 'rounded-[2rem]' } });
      } catch (err: any) { Swal.fire('Error', err.message, 'error'); }
    }
  };

  const showCurrentAccount = (client: Client) => {
    const clientMovs = movements.filter(m => m.clientId === client.id).sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 5);
    Swal.fire({
      title: 'Cuenta Corriente',
      html: `<div class="text-left p-2">
          <div class="bg-gray-50 p-5 rounded-[1.5rem] border border-gray-100 mb-6 flex justify-between items-center">
             <div>
                <p class="text-[9px] font-black text-gray-400 uppercase mb-1">Saldo Actual</p>
                <p class="text-xl font-black ${client.saldo > 0 ? 'text-red-500' : 'text-green-600'}">${formatCurrency(client.saldo)}</p>
             </div>
             <button onclick="window.downloadFullStatement('${client.id}')" class="flex items-center gap-2 bg-[#E07A5F] text-white px-3 py-2 rounded-xl text-[8px] font-black uppercase shadow-md hover:scale-95 transition-all">
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
               REPORTE
             </button>
          </div>
          <p class="text-[9px] font-black text-gray-300 uppercase mb-3 ml-2">Últimos Movimientos</p>
          <div class="space-y-2">
            ${clientMovs.map(m => `
              <div class="flex justify-between items-center p-3 bg-white border border-gray-50 rounded-xl shadow-sm">
                <div class="flex-1">
                  <p class="text-[10px] font-bold text-gray-700 uppercase">${m.concepto}</p>
                  <p class="text-[8px] text-gray-400 font-bold">${new Date(m.fecha).toLocaleDateString()}</p>
                </div>
                <div class="flex items-center gap-4">
                  <p class="text-[10px] font-bold ${m.concepto === 'ABONO' ? 'text-green-600' : 'text-red-500'}">
                    ${m.concepto === 'ABONO' ? '-' : '+'}${formatCurrency(m.monto)}
                  </p>
                  <button onclick="window.printMovementReceipt('${m.id}')" class="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-orange-50 hover:text-orange-500 transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                  </button>
                </div>
              </div>`).join('') || '<p class="text-center text-[10px] text-gray-300 py-4 font-bold uppercase">Sin movimientos</p>'}
          </div>
        </div>`,
      confirmButtonText: 'CERRAR', confirmButtonColor: '#E07A5F', customClass: { popup: 'rounded-[2.5rem]' }
    });
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Clientes</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Cartera y saldos</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={() => setIsModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#4C7031] text-white px-5 py-3 rounded-2xl shadow-xl font-black text-[10px] uppercase tracking-widest hover:scale-95 transition-all">
              <UserPlus size={16} /> NUEVO
            </button>
            <button onClick={() => {
              const { jsPDF } = (window as any).jspdf;
              const doc = new jsPDF();
              doc.text('REPORTE DE DEUDORES', 105, 20, { align: 'center' });
              (doc as any).autoTable({ startY: 30, head: [['CLIENTE', 'DEUDA']], body: clients.filter(c => c.saldo > 0).map(c => [`${c.nombre} ${c.apellido}`, formatCurrency(c.saldo)]) });
              doc.save('Deudores_Natura.pdf');
            }} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#E07A5F] text-white px-5 py-3 rounded-2xl shadow-xl font-black text-[10px] uppercase tracking-widest hover:scale-95 transition-all">
              <FileDown size={16} /> REPORTES
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiSummary title="Total en Calle" value={formatCurrency(totalDebtAmount)} icon={<TrendingDown size={16}/>} color="bg-red-50 text-red-500" />
          <KpiSummary title="Clientes Deudores" value={clients.filter(c => c.saldo > 0).length.toString()} icon={<AlertCircle size={16}/>} color="bg-orange-50 text-orange-500" />
          <KpiSummary title="Total Clientes" value={clients.length.toString()} icon={<User size={16}/>} color="bg-blue-50 text-blue-500" />
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden">
          <div className="p-4 border-b border-gray-50 bg-gray-50/10 flex items-center gap-3">
            <Search className="text-gray-300" size={18} />
            <input type="text" placeholder="Buscar cliente..." className="flex-1 outline-none text-xs font-bold bg-transparent placeholder-gray-300" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] border-b">
                <tr><th className="px-8 py-4">Titular</th><th className="px-8 py-4">WhatsApp</th><th className="px-8 py-4">Saldo</th><th className="px-8 py-4 text-right">Acción</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedClients.map(client => (
                  <tr key={client.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-8 py-5"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-[#E07A5F] font-black text-[10px] shadow-sm">{client.nombre[0]}{client.apellido[0]}</div><p className="text-[11px] font-black text-gray-700 uppercase">{client.nombre} {client.apellido}</p></div></td>
                    <td className="px-8 py-5"><span className="text-[10px] font-bold text-gray-400">{client.telefono}</span></td>
                    <td className="px-8 py-5"><span className={`text-[11px] font-black ${client.saldo > 0 ? 'text-red-500' : 'text-green-600'}`}>{formatCurrency(client.saldo)}</span></td>
                    <td className="px-8 py-5 text-right"><div className="flex justify-end gap-2"><button onClick={() => showCurrentAccount(client)} className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-800 hover:text-white transition-all"><Printer size={16} /></button><button onClick={() => handleCollectPayment(client)} className={`p-2.5 rounded-xl transition-all shadow-sm ${client.saldo > 0 ? 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`}><DollarSign size={16} /></button><button onClick={() => window.open(`https://wa.me/${client.telefono}`, '_blank')} className="p-2.5 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><MessageSquare size={16} /></button></div></td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-6 pt-4 border-t border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight flex items-center gap-3"><History className="text-[#E07A5F]" size={22} />Historial de Movimientos</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Rastreo detallado de cobros y deudas</p>
        </div>
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden">
          <div className="p-4 border-b border-gray-50 bg-gray-50/10 flex items-center gap-3">
            <Search className="text-gray-300" size={18} />
            <input type="text" placeholder="Buscar movimiento..." className="flex-1 outline-none text-xs font-bold bg-transparent" value={movementsSearch} onChange={(e) => { setMovementsSearch(e.target.value); setCurrentMovPage(1); }} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] border-b">
                <tr><th className="px-8 py-4">#</th><th className="px-8 py-4">Fecha</th><th className="px-8 py-4">Cliente</th><th className="px-8 py-4">Concepto</th><th className="px-8 py-4">Monto</th><th className="px-8 py-4">Saldo Final</th><th className="px-8 py-4 text-right">Recibo</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedMovements.map((mov, idx) => (
                  <tr key={mov.id} className="hover:bg-gray-50/20 transition-colors">
                    <td className="px-8 py-5 text-[10px] font-bold text-gray-300">{(currentMovPage-1)*10 + idx + 1}</td>
                    <td className="px-8 py-5 text-[10px] font-bold text-gray-400">{new Date(mov.fecha).toLocaleDateString()}</td>
                    <td className="px-8 py-5 text-[11px] font-black text-gray-700 uppercase">{mov.clientName}</td>
                    <td className="px-8 py-5"><span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${mov.concepto === 'ABONO' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>{mov.concepto}</span></td>
                    <td className="px-8 py-5 text-[11px] font-black text-gray-800">{formatCurrency(mov.monto)}</td>
                    <td className="px-8 py-5 text-[11px] font-black text-gray-400">{formatCurrency(mov.saldoRestante)}</td>
                    <td className="px-8 py-5 text-right"><button onClick={() => generateAbonoReceipt(mov)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-[#E07A5F] hover:text-white transition-all"><FileText size={16} /></button></td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 z-[200] animate-in fade-in">
          <div className="bg-white rounded-[3rem] w-full max-sm p-10 shadow-2xl">
            <div className="flex justify-between items-center mb-8"><h3 className="text-xl font-black text-gray-800">Nuevo Cliente</h3><button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-300 hover:text-gray-500"><X size={24}/></button></div>
            <form onSubmit={async (e) => {
               e.preventDefault(); setIsSubmitting(true);
               const fd = new FormData(e.currentTarget);
               await DataService.addClient({ nombre: fd.get('nombre') as string, apellido: fd.get('apellido') as string, telefono: fd.get('telefono') as string });
               setIsModalOpen(false); await onRefresh(); setIsSubmitting(false);
            }} className="space-y-6">
              <InputField label="Nombre" name="nombre" placeholder="Nombre" />
              <InputField label="Apellido" name="apellido" placeholder="Apellido" />
              <InputField label="WhatsApp" name="telefono" placeholder="Ej: 54938150..." />
              <button type="submit" disabled={isSubmitting} className="w-full bg-[#E07A5F] text-white py-5 rounded-2xl font-black text-[10px] uppercase shadow-xl mt-4">{isSubmitting ? 'REGISTRANDO...' : 'GUARDAR CLIENTE'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const KpiSummary = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-50 flex items-center gap-4">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${color}`}>{icon}</div>
    <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{title}</p><p className="text-sm font-bold text-gray-800">{value}</p></div>
  </div>
);

const InputField = ({ label, ...props }: any) => (
  <div><label className="block text-[9px] font-black text-gray-400 uppercase mb-2 ml-1">{label}</label><input {...props} required className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl outline-none font-bold text-xs shadow-inner" /></div>
);

export default Clients;
