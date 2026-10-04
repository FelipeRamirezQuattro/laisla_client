import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../../types';
import { RecipesPage } from './RecipesPage';

const {
  getAll,
  getCategories,
  deleteRecipe,
  confirmDelete,
  toastSuccess,
} = vi.hoisted(() => ({
  getAll: vi.fn(),
  getCategories: vi.fn(),
  deleteRecipe: vi.fn(),
  confirmDelete: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('../../../api/costs', () => ({
  recipesApi: {
    getAll,
    getCategories,
    delete: deleteRecipe,
    update: vi.fn(),
    createCategory: vi.fn(),
  },
}));

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { role: 'admin' } }),
}));

vi.mock('../../../hooks/useConfirm', () => ({
  useConfirm: () => confirmDelete,
}));

vi.mock('../../../hooks/useToast', () => ({
  useToast: () => ({ success: toastSuccess, error: vi.fn() }),
}));

const recipe = {
  _id: 'recipe-pepino',
  name: 'PEPINO QA',
  description: '',
  category: 'OTROS',
  active: true,
  isSubRecipe: false,
  isProduct: false,
  variants: [],
} as unknown as Recipe;

describe('RecipesPage', () => {
  beforeEach(() => {
    getAll.mockResolvedValue({ data: [recipe] });
    getCategories.mockResolvedValue({ data: [] });
    deleteRecipe.mockResolvedValue({ data: { message: 'Receta desactivada' } });
    confirmDelete.mockResolvedValue(true);
  });

  it('removes a successfully deleted recipe from the visible list', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RecipesPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('PEPINO QA')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(deleteRecipe).toHaveBeenCalledWith('recipe-pepino'));
    await waitFor(() => expect(screen.queryByText('PEPINO QA')).not.toBeInTheDocument());
    expect(toastSuccess).toHaveBeenCalledWith('Receta eliminada');
  });
});
