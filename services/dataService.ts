
import { Product, Client, Sale, Purchase, SaleItem, Movement, Expense, User } from '../types';

// URL actualizada proporcionada por el usuario
const API_URL = 'https://script.google.com/macros/s/AKfycbxF9z3QbS71jYxbTifNwPc6sbxC4K7Vrz6fxdibPlZYldNTMYWhUkDXVRMWROx5WROjUQ/exec';

function getValue(obj: any, key: string): any {
  if (!obj) return undefined;
  const lowerKey = key.toLowerCase();
  const foundKey = Object.keys(obj).find(k => k.toLowerCase() === lowerKey);
  return foundKey ? obj[foundKey] : undefined;
}

async function apiCall(action: string, payload: any = {}, isRead: boolean = false) {
  try {
    const fetchOptions: RequestInit = {
      method: 'POST',
      body: JSON.stringify({ action, payload }),
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      }
    };
    
    const response = await fetch(API_URL, fetchOptions);
    const result = await response.json();
    
    if (isRead) {
      if (result.success) return result.data;
      throw new Error(result.error || "Error en la API");
    }
    
    if (!result.success) throw new Error(result.error || "Error en la operación");
    return result.data;
  } catch (error) {
    console.error(`Error en API (${action}):`, error);
    throw error; 
  }
}

export class DataService {
  static async login(usuario: string, password: string): Promise<User> {
    return await apiCall('login', { usuario, password }, true);
  }

  static async getInitialData() {
    const data = await apiCall('getInitialData', {}, true);
    
    const products = (data.products || []).map((p: any) => ({
      id: String(getValue(p, 'ID')), nombre: String(getValue(p, 'Nombre')),
      descripcion: String(getValue(p, 'Descripción') || getValue(p, 'Descripcion')),
      fotoUrl: String(getValue(p, 'FotoURL')), stockActual: Number(getValue(p, 'StockActual')),
      precioCostoPromedio: Number(getValue(p, 'PrecioCostoPromedio')), precioVenta: Number(getValue(p, 'PrecioVenta'))
    }));

    const clients = (data.clients || []).map((c: any) => ({
      id: String(getValue(c, 'ID')), nombre: String(getValue(c, 'Nombre')),
      apellido: String(getValue(c, 'Apellido')), telefono: String(getValue(c, 'Telefono')),
      saldo: Number(getValue(c, 'Saldo'))
    }));

    const sales = (data.sales || []).map((s: any) => ({
      id: String(getValue(s, 'ID')), fecha: String(getValue(s, 'Fecha')),
      clientId: String(getValue(s, 'IDCliente')), clientName: String(getValue(s, 'ClienteNombre')),
      montoTotal: Number(getValue(s, 'MontoTotal')), montoPagado: Number(getValue(s, 'MontoPagado')),
      saldoRestante: Number(getValue(s, 'SaldoRestante')), metodoPago: String(getValue(s, 'MetodoPago')),
      gananciaNeta: Number(getValue(s, 'GananciaNeta')), items: JSON.parse(getValue(s, 'ItemsJSON') || '[]')
    }));

    const movements = (data.movements || []).map((m: any) => ({
      id: String(getValue(m, 'ID')), fecha: String(getValue(m, 'Fecha')),
      clientId: String(getValue(m, 'IDCliente')), clientName: String(getValue(m, 'ClienteNombre')),
      concepto: String(getValue(m, 'Concepto')), monto: Number(getValue(m, 'Monto')),
      saldoAnterior: Number(getValue(m, 'SaldoAnterior')), saldoRestante: Number(getValue(m, 'SaldoRestante'))
    }));

    const expenses = (data.expenses || []).map((e: any) => ({
      id: String(getValue(e, 'ID')), fecha: String(getValue(e, 'Fecha')),
      concepto: String(getValue(e, 'Concepto')), monto: Number(getValue(e, 'Monto')),
      categoria: String(getValue(e, 'Categoria'))
    }));

    return { products, clients, sales, movements, expenses };
  }

  static async getProducts(): Promise<Product[]> {
    const data = await apiCall('getProducts', {}, true);
    return (data || []).map((p: any) => ({
      id: String(getValue(p, 'ID')), nombre: String(getValue(p, 'Nombre')),
      descripcion: String(getValue(p, 'Descripción') || getValue(p, 'Descripcion')),
      fotoUrl: String(getValue(p, 'FotoURL')), stockActual: Number(getValue(p, 'StockActual')),
      precioCostoPromedio: Number(getValue(p, 'PrecioCostoPromedio')), precioVenta: Number(getValue(p, 'PrecioVenta'))
    }));
  }

  static async getClients(): Promise<Client[]> {
    const data = await apiCall('getClients', {}, true);
    return (data || []).map((c: any) => ({
      id: String(getValue(c, 'ID')), nombre: String(getValue(c, 'Nombre')),
      apellido: String(getValue(c, 'Apellido')), telefono: String(getValue(c, 'Telefono')),
      saldo: Number(getValue(c, 'Saldo'))
    }));
  }

  static async getMovements(): Promise<Movement[]> {
    const data = await apiCall('getMovements', {}, true);
    return (data || []).map((m: any) => ({
      id: String(getValue(m, 'ID')), fecha: String(getValue(m, 'Fecha')),
      clientId: String(getValue(m, 'IDCliente')), clientName: String(getValue(m, 'ClienteNombre')),
      concepto: String(getValue(m, 'Concepto')), monto: Number(getValue(m, 'Monto')),
      saldoAnterior: Number(getValue(m, 'SaldoAnterior')), saldoRestante: Number(getValue(m, 'SaldoRestante'))
    }));
  }

  static async getExpenses(): Promise<Expense[]> {
    const data = await apiCall('getExpenses', {}, true);
    return (data || []).map((e: any) => ({
      id: String(getValue(e, 'ID')), fecha: String(getValue(e, 'Fecha')),
      concepto: String(getValue(e, 'Concepto')), monto: Number(getValue(e, 'Monto')),
      categoria: String(getValue(e, 'Categoria'))
    }));
  }

  static async getSales(): Promise<Sale[]> {
    const data = await apiCall('getSales', {}, true);
    return (data || []).map((s: any) => ({
      id: String(getValue(s, 'ID')), fecha: String(getValue(s, 'Fecha')),
      clientId: String(getValue(s, 'IDCliente')), clientName: String(getValue(s, 'ClienteNombre')),
      montoTotal: Number(getValue(s, 'MontoTotal')), montoPagado: Number(getValue(s, 'MontoPagado')),
      saldoRestante: Number(getValue(s, 'SaldoRestante')), metodoPago: String(getValue(s, 'MetodoPago')),
      gananciaNeta: Number(getValue(s, 'GananciaNeta')), items: JSON.parse(getValue(s, 'ItemsJSON') || '[]')
    }));
  }

  static async getPurchases(): Promise<Purchase[]> {
    const data = await apiCall('getPurchases', {}, true);
    return (data || []).map((p: any) => ({
      id: String(getValue(p, 'ID')), fecha: String(getValue(p, 'Fecha')),
      productId: String(getValue(p, 'IDProducto')), cantidad: Number(getValue(p, 'Cantidad')),
      precioCosto: Number(getValue(p, 'PrecioCosto')), proveedor: String(getValue(p, 'Proveedor'))
    }));
  }

  static async addProduct(product: Omit<Product, 'id'>) {
    const data = { 'ID': 'P' + Date.now().toString().slice(-6), 'Nombre': product.nombre, 'Descripción': product.descripcion, 'FotoURL': product.fotoUrl, 'StockActual': product.stockActual, 'PrecioCostoPromedio': product.precioCostoPromedio, 'PrecioVenta': product.precioVenta };
    return await apiCall('saveRecord', { sheet: 'Inventario', data });
  }

  static async updateProduct(id: string, product: Partial<Product>) {
    const data: any = {};
    if (product.nombre) data['Nombre'] = product.nombre;
    if (product.descripcion) data['Descripción'] = product.descripcion;
    if (product.fotoUrl) data['FotoURL'] = product.fotoUrl;
    if (product.precioVenta !== undefined) data['PrecioVenta'] = product.precioVenta;
    return await apiCall('updateRecord', { sheet: 'Inventario', id, data });
  }

  static async deleteProduct(id: string) {
    return await apiCall('deleteRecord', { sheet: 'Inventario', id });
  }

  static async addExpense(expense: Omit<Expense, 'id' | 'fecha'>) {
    const id = 'G' + Date.now().toString().slice(-6);
    const data = { 'ID': id, 'Fecha': new Date().toISOString(), 'Concepto': expense.concepto, 'Monto': expense.monto, 'Categoria': expense.categoria };
    return await apiCall('saveRecord', { sheet: 'Gastos', data });
  }

  static async addClient(client: Omit<Client, 'id' | 'saldo'>) {
    const id = 'C' + Date.now().toString().slice(-6);
    const data = { 'ID': id, 'Nombre': client.nombre, 'Apellido': client.apellido, 'Telefono': client.telefono, 'Saldo': 0 };
    return await apiCall('saveRecord', { sheet: 'Clientes', data });
  }

  static async registerPurchase(purchaseData: any) {
    const data = { 'ID': 'B' + Date.now().toString().slice(-6), 'Fecha': new Date().toISOString(), 'IDProducto': purchaseData.productId, 'Cantidad': purchaseData.cantidad, 'PrecioCosto': purchaseData.precioCosto, 'Proveedor': purchaseData.proveedor };
    return await apiCall('processPurchase', { purchaseData: data });
  }

  static async registerSale(clientId: string, clientName: string, items: SaleItem[], montoTotal: number, montoPagado: number, metodoPago: string, gananciaNeta: number) {
    const saleData = { id: 'S' + Date.now().toString().slice(-6), fecha: new Date().toISOString(), clientId, clientName, montoTotal, montoPagado, saldoRestante: montoTotal - montoPagado, metodoPago, gananciaNeta, items };
    await apiCall('processSale', { saleData });
    return saleData;
  }

  static async registerClientPayment(clientId: string, monto: number) {
    return await apiCall('registerPayment', { clientId, monto });
  }
}
