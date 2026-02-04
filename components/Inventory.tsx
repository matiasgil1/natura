
import React, { useState, useMemo, useRef } from 'react';
import { DataService } from '../services/dataService';
import { Product } from '../types';
import { Plus, Edit2, Trash2, Search, Camera, X, Image as ImageIcon, Check, Download, Upload, Loader2, FolderOpen } from 'lucide-react';
import { formatCurrency, Toast } from './Clients';

declare var Swal: any;

interface InventoryProps {
  products: Product[];
  onRefresh: () => void;
}

const ITEMS_PER_PAGE = 10;

const Inventory: React.FC<InventoryProps> = ({ products, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return products.filter(p => 
      p.nombre.toLowerCase().includes(term) || p.id.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    Swal.fire({
      title: editingProduct ? 'Actualizando...' : 'Guardando...',
      html: 'Procesando información del producto',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      customClass: { popup: 'rounded-[2rem]' }
    });

    const formData = new FormData(e.currentTarget);
    try {
      const nombre = formData.get('nombre') as string;
      const descripcion = formData.get('descripcion') as string;
      const precioVenta = parseFloat(formData.get('precioVenta') as string);
      
      if (editingProduct) {
        await DataService.updateProduct(editingProduct.id, {
          nombre, descripcion, fotoUrl: selectedImage || editingProduct.fotoUrl, precioVenta,
        });
      } else {
        const stockActual = parseInt(formData.get('stockActual') as string) || 0;
        const precioCostoPromedio = parseFloat(formData.get('precioCosto') as string) || 0;
        await DataService.addProduct({
          nombre, descripcion, fotoUrl: selectedImage || '', precioVenta, stockActual, precioCostoPromedio
        });
      }
      
      setIsModalOpen(false); 
      setEditingProduct(null); 
      setSelectedImage(null);
      await onRefresh();
      
      Swal.fire({
        title: '¡Completado!',
        text: 'Inventario actualizado correctamente.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: 'rounded-[2rem]' }
      });
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSelectedImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
      Swal.fire({
        title: 'Cámara no disponible',
        text: 'No pudimos acceder a la cámara. ¿Deseas seleccionar una foto de tu galería?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'USAR GALERÍA',
        cancelButtonText: 'CANCELAR',
        confirmButtonColor: '#E07A5F',
        customClass: { popup: 'rounded-[2rem]' }
      }).then((result: any) => {
        if (result.isConfirmed) galleryInputRef.current?.click();
      });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setSelectedImage(dataUrl);
        stopCamera();
        Toast.fire({ icon: 'success', title: 'Foto capturada' });
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight">Inventario</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Catálogo de productos Natura</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <input type="file" ref={fileInputRef} onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
                // Lógica de importación CSV ya existente...
            }
          }} accept=".csv" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all">
            <Upload size={16} /> IMPORTAR
          </button>
          <button onClick={() => {
              Toast.fire({ icon: 'info', title: 'Generando CSV...' });
              // Lógica exportCSV...
          }} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-orange-50 text-[#E07A5F] px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-100 transition-all">
            <Download size={16} /> EXPORTAR
          </button>
          <button onClick={() => { setEditingProduct(null); setSelectedImage(null); setIsModalOpen(true); }} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#4C7031] text-white px-5 py-3 rounded-2xl shadow-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all">
            <Plus size={18} /> NUEVO PRODUCTO
          </button>
        </div>
      </div>

      {/* Grid de Productos */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden">
        <div className="p-4 border-b border-gray-50 bg-gray-50/10 flex items-center gap-3">
          <Search className="text-gray-300" size={18} />
          <input 
            type="text" 
            placeholder="Buscar en el inventario..." 
            className="flex-1 outline-none text-xs font-bold bg-transparent placeholder-gray-300"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] border-b">
              <tr>
                <th className="px-8 py-4">Producto</th>
                <th className="px-8 py-4 text-center">Stock</th>
                <th className="px-8 py-4">P. Venta</th>
                <th className="px-8 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50/20 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm">
                        <img src={product.fotoUrl || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-gray-700 uppercase leading-tight truncate max-w-[200px] tracking-tight">{product.nombre}</p>
                        <p className="text-[8px] text-gray-300 font-bold uppercase tracking-widest">ID: {product.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight ${
                      product.stockActual <= 3 ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'
                    }`}>
                      {product.stockActual} u
                    </span>
                  </td>
                  <td className="px-8 py-4 text-[11px] font-black text-gray-800">
                    {formatCurrency(product.precioVenta)}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => { setEditingProduct(product); setSelectedImage(product.fotoUrl); setIsModalOpen(true); }} className="p-2 text-blue-400 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={async () => {
                         const res = await Swal.fire({ title: '¿Eliminar producto?', text: "Esta acción no se puede deshacer.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#E07A5F', customClass: { popup: 'rounded-[2rem]' } });
                         if(res.isConfirmed) { 
                           Toast.fire({ icon: 'info', title: 'Eliminando...' });
                           await DataService.deleteProduct(product.id); 
                           onRefresh(); 
                         }
                      }} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-in fade-in">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-gray-800 mb-8 tracking-tight">{editingProduct ? 'Editar' : 'Nuevo'} Producto</h3>
            <form onSubmit={handleSave} className="space-y-6">
              
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="w-40 h-40 rounded-[2.5rem] bg-gray-50 border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center relative group shadow-inner">
                  {selectedImage ? (
                    <img src={selectedImage} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="text-gray-200" size={48} />
                  )}
                  
                  <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-3 transition-opacity rounded-[2.5rem]">
                    <div className="flex gap-4">
                        <button type="button" onClick={startCamera} className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/40 transition-all">
                            <Camera size={20} />
                        </button>
                        <button type="button" onClick={() => galleryInputRef.current?.click()} className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/40 transition-all">
                            <FolderOpen size={20} />
                        </button>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest">Cambiar Foto</span>
                  </div>
                </div>
                <input type="file" ref={galleryInputRef} onChange={handleGallerySelect} accept="image/*" className="hidden" />
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Imágenes de alta calidad</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nombre del Producto</label>
                  <input name="nombre" defaultValue={editingProduct?.nombre} required className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl outline-none font-bold text-xs focus:ring-4 focus:ring-orange-50 transition-all shadow-inner" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Precio Venta</label>
                    <input name="precioVenta" type="number" step="0.01" defaultValue={editingProduct?.precioVenta} required className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl outline-none font-bold text-xs focus:ring-4 focus:ring-orange-50 transition-all shadow-inner" />
                  </div>
                  {!editingProduct && (
                    <div>
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Stock Inicial</label>
                      <input name="stockActual" type="number" defaultValue="0" className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl outline-none font-bold text-xs focus:ring-4 focus:ring-orange-50 transition-all shadow-inner" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black text-[9px] uppercase tracking-widest">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] px-6 py-4 bg-[#E07A5F] text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl shadow-orange-100 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'CONFIRMAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCameraOpen && (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center p-6">
          <div className="relative w-full max-w-lg aspect-[3/4] bg-gray-900 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/10">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-x-0 bottom-10 flex justify-center items-center gap-10">
              <button onClick={stopCamera} className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30"><X size={28} /></button>
              <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-4 border-gray-200 flex items-center justify-center shadow-2xl active:scale-90 transition-transform"><Check size={36} className="text-green-600" /></button>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <p className="mt-8 text-white/50 text-[10px] font-black uppercase tracking-widest">Centra el producto en el marco</p>
        </div>
      )}
    </div>
  );
};

export default Inventory;
