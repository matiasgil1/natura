
export interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  fotoUrl: string;
  stockActual: number;
  precioCostoPromedio: number;
  precioVenta: number;
}

export interface Client {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  saldo: number; 
}

export interface Movement {
  id: string;
  fecha: string;
  clientId: string;
  clientName: string;
  concepto: string; // 'ABONO', 'VENTA' o 'GASTO'
  monto: number;
  saldoAnterior: number;
  saldoRestante: number;
}

export interface SaleItem {
  productId: string;
  nombre: string;
  cantidad: number;
  precioVenta: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  fecha: string;
  clientId: string;
  clientName: string;
  montoTotal: number;
  montoPagado: number; 
  saldoRestante: number; 
  metodoPago: string; 
  gananciaNeta: number;
  items: SaleItem[];
}

export interface Purchase {
  id: string;
  fecha: string;
  productId: string;
  cantidad: number;
  precioCosto: number;
  proveedor: string;
}

export interface Expense {
  id: string;
  fecha: string;
  concepto: string;
  monto: number;
  categoria: string;
}

export interface User {
  usuario: string;
  rol: 'admin' | 'vendedor';
}

export enum View {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  PURCHASES = 'PURCHASES',
  POS = 'POS',
  CLIENTS = 'CLIENTS',
  SALES = 'SALES',
  EXPENSES = 'EXPENSES'
}
