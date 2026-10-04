import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectionsPage } from './ProjectionsPage';

const { getProjection } = vi.hoisted(() => ({
  getProjection: vi.fn(),
}));

vi.mock('../../../api/costs', () => ({
  projectionsApi: {
    get: getProjection,
    create: vi.fn(),
    updateMonth: vi.fn(),
  },
}));

vi.mock('../../../hooks/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

function LocationProbe() {
  return <div data-testid="location">{useLocation().pathname}</div>;
}

const projection = {
  _id: 'projection-2026',
  year: 2026,
  growthRate: 0.02,
  workingDaysPerMonth: 26,
  months: Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    isManualOverride: false,
    dailyTickets: 0,
    monthlyTickets: 0,
    averageTicket: 0,
    dailySales: 0,
    monthlySales: 0,
    costOfSalesPct: 0.25,
    costOfSales: 0,
    operatingExpenses: 0,
    totalExpenses: 0,
    profit: 0,
  })),
};

describe('ProjectionsPage', () => {
  beforeEach(() => {
    getProjection.mockResolvedValue({ data: projection });
  });

  it('lets the user open another projection year', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/admin/costos/proyecciones/2026']}>
        <Routes>
          <Route
            path="/admin/costos/proyecciones/:year"
            element={<><ProjectionsPage /><LocationProbe /></>}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Proyecciones 2026' })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Año de proyección'), '2025');

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/admin/costos/proyecciones/2025');
    });
  });
});
