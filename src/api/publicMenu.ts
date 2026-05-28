import api from './axios';
import type { Recipe, RecipeCategoryOption } from '../types';

export const publicMenuApi = {
  get: () => api.get<{ recipes: Recipe[]; categories: RecipeCategoryOption[] }>('/public/menu'),
};
