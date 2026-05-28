import api from './axios';

export interface SalesReport {
  totalRevenue: number;
  totalOrders: number;
  revenueByMethod: { cash: number; card: number; transfer: number };
  dailyRevenue: Array<{ date: string; revenue: number }>;
}

export interface ProductsReport {
  topProducts: Array<{
    _id: string;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  categoryRevenue: Array<{ _id: string; revenue: number }>;
}

export const reportsApi = {
  getSales: (params?: { dateFrom?: string; dateTo?: string }) =>
    api.get<SalesReport>('/admin/reports/sales', { params }),
  getProducts: (params?: { dateFrom?: string; dateTo?: string }) =>
    api.get<ProductsReport>('/admin/reports/products', { params }),
};
