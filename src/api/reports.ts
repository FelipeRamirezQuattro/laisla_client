import api from './axios';

export interface SalesReport {
  totalRevenue: number;
  totalOrders: number;
  revenueByMethod: { cash: number; card: number; transfer: number; nequi: number };
  complimentary?: { units: number; value: number };
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

export interface RecipeWeeklyEntry {
  recipeId: string | null;
  name: string;
  category: string | null;
  weekly: Array<{ key: string; sold: number; complimentary: number }>;
  windowSold: number;
  windowComplimentary: number;
  avgWeekly: number;
  trendPct: number | null;
  totalSold: number;
  totalComplimentary: number;
}

export interface RecipesWeeklyReport {
  weeks: Array<{ key: string; year: number; week: number; start: string; partial: boolean }>;
  recipes: RecipeWeeklyEntry[];
  generatedAt: string;
}

export const reportsApi = {
  getSales: (params?: { dateFrom?: string; dateTo?: string }) =>
    api.get<SalesReport>('/admin/reports/sales', { params }),
  getProducts: (params?: { dateFrom?: string; dateTo?: string }) =>
    api.get<ProductsReport>('/admin/reports/products', { params }),
  getRecipesWeekly: (weeks: number) =>
    api.get<RecipesWeeklyReport>('/admin/reports/recipes-weekly', { params: { weeks } }),
};
