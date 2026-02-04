
import React from 'react';
import { LayoutDashboard, Package, ShoppingCart, ShoppingBag, Users, History, Receipt } from 'lucide-react';

export const THEME = {
  primary: '#E07A5F', // Natura Orange
  secondary: '#4C7031', // Natura Green
  background: '#F4F1DE', // Sand
  text: '#3D405B', // Dark Brown
};

export const NAV_ITEMS = [
  { id: 'DASHBOARD', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'POS', label: 'Venta (POS)', icon: <ShoppingCart size={20} /> },
  { id: 'SALES', label: 'Historial Ventas', icon: <History size={20} /> },
  { id: 'INVENTORY', label: 'Inventario', icon: <Package size={20} /> },
  { id: 'PURCHASES', label: 'Compras / PPP', icon: <ShoppingBag size={20} /> },
  { id: 'EXPENSES', label: 'Gastos Varios', icon: <Receipt size={20} /> },
  { id: 'CLIENTS', label: 'Clientes', icon: <Users size={20} /> },
];
