import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TablesPage } from './TablesPage';

const { getAll, getZones } = vi.hoisted(() => ({
  getAll: vi.fn(),
  getZones: vi.fn(),
}));

vi.mock('../../api/tables', () => ({
  tablesApi: {
    getAll,
    getZones,
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    release: vi.fn(),
    releaseAll: vi.fn(),
    createZone: vi.fn(),
    updateZone: vi.fn(),
    deleteZone: vi.fn(),
  },
}));

vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

vi.mock('../../hooks/useConfirm', () => ({
  useConfirm: () => vi.fn(),
}));

vi.mock('../../utils/formatDate', async () => {
  const actual = await vi.importActual<typeof import('../../utils/formatDate')>('../../utils/formatDate');
  return { ...actual, todayLocal: () => '2026-09-29' };
});

describe('TablesPage', () => {
  beforeEach(() => {
    getAll.mockResolvedValue({ data: [] });
    getZones.mockResolvedValue({ data: [] });
  });

  it('loads table availability for the selected date', async () => {
    render(<TablesPage />);

    expect(await screen.findByRole('heading', { name: 'Mesas' })).toBeInTheDocument();
    await waitFor(() => expect(getAll).toHaveBeenCalledWith({
      date: '2026-09-29',
      timeSlot: '13:00',
    }));
    expect(screen.getByLabelText('Fecha de disponibilidad')).toHaveValue('2026-09-29');
    expect(screen.getByLabelText('Hora de disponibilidad')).toHaveValue('13:00');
  });
});
