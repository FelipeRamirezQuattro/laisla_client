import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProyectoDetailPage } from './ProyectoDetailPage';

const {
  getProject,
  deleteProject,
  getAssignable,
  confirmArchive,
  toastSuccess,
} = vi.hoisted(() => ({
  getProject: vi.fn(),
  deleteProject: vi.fn(),
  getAssignable: vi.fn(),
  confirmArchive: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('../../../api/projects', () => ({
  projectsApi: {
    getOne: getProject,
    delete: deleteProject,
  },
}));

vi.mock('../../../api/tasks', () => ({
  tasksApi: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    addAttachment: vi.fn(),
    deleteAttachment: vi.fn(),
    getOne: vi.fn(),
  },
}));

vi.mock('../../../api/users', () => ({
  usersApi: { getAssignable },
}));

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { role: 'superadmin' } }),
}));

vi.mock('../../../hooks/useConfirm', () => ({
  useConfirm: () => confirmArchive,
}));

vi.mock('../../../hooks/useToast', () => ({
  useToast: () => ({ success: toastSuccess, error: vi.fn() }),
}));

function LocationProbe() {
  return <div data-testid="location">{useLocation().pathname}</div>;
}

describe('ProyectoDetailPage', () => {
  beforeEach(() => {
    getProject.mockResolvedValue({
      data: {
        project: {
          _id: 'project-1',
          name: 'Proyecto QA',
          description: 'Proyecto para pruebas',
          color: '#2043A9',
          isActive: true,
          createdAt: '2026-09-29T00:00:00.000Z',
        },
        tasks: [],
      },
    });
    getAssignable.mockResolvedValue({ data: [] });
    deleteProject.mockResolvedValue({ data: { message: 'Proyecto archivado' } });
    confirmArchive.mockResolvedValue(true);
  });

  it('lets a superadmin archive the whole project', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/admin/proyectos/project-1']}>
        <Routes>
          <Route
            path="/admin/proyectos/:id"
            element={<><ProyectoDetailPage /><LocationProbe /></>}
          />
          <Route path="/admin/proyectos" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Proyecto QA' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Archivar proyecto' }));

    await waitFor(() => expect(deleteProject).toHaveBeenCalledWith('project-1'));
    expect(toastSuccess).toHaveBeenCalledWith('Proyecto archivado');
    expect(screen.getByTestId('location')).toHaveTextContent('/admin/proyectos');
  });
});
