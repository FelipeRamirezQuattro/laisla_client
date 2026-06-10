import { FolderOpen, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { projectsApi } from '../../../api/projects';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { PageLoader } from '../../../components/ui/Spinner';
import { useToast } from '../../../hooks/useToast';
import type { Project, ProjectTaskStatus } from '../../../types';

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().default(''),
  color: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

const palette = ['#43593B', '#7CC1E7', '#F2D17E', '#ACAD79', '#E87A5D', '#6B7768'];

const statusLabels: Record<ProjectTaskStatus, string> = {
  pending: 'Pendientes',
  'in-progress': 'En progreso',
  review: 'En revisión',
  done: 'Completadas',
  cancelled: 'Canceladas',
};

export function ProyectosPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const toast = useToast();
  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { color: palette[0] },
  });

  const selectedColor = watch('color');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await projectsApi.getAll();
      setProjects(res.data);
    } catch {
      toast.error('Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const openCreate = () => {
    reset({ name: '', description: '', color: palette[0] });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      await projectsApi.create(data);
      toast.success('Proyecto creado');
      setModalOpen(false);
      fetchProjects();
    } catch {
      toast.error('Error al crear proyecto');
    }
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredProjects = projects.filter((project) => {
    if (!normalizedSearch) return true;
    return [
      project.name,
      project.description,
      project.createdAt,
      ...Object.entries(project.taskCounts ?? {}).map(([status, count]) => `${status} ${statusLabels[status as ProjectTaskStatus]} ${count}`),
    ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-body text-2xl font-bold text-espresso">Proyectos</h1>
          <p className="text-stone font-body text-sm">{filteredProjects.length} proyectos activos</p>
        </div>
        <Button onClick={openCreate} icon={<Plus size={15} />}>Nuevo proyecto</Button>
      </div>

      <div className="card grid gap-3 md:grid-cols-[minmax(0,1fr)_16rem]">
        <Input
          placeholder="Buscar por proyecto, descripción o estado de tareas..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="rounded-lg border border-rule bg-surface-tint px-4 py-2 font-body text-sm text-stone">
          {filteredProjects.length} de {projects.length} proyectos
        </div>
      </div>

      {loading ? <PageLoader /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <Link
              key={project._id}
              to={`/admin/proyectos/${project._id}`}
              className="card block hover:border-rule-strong hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-lg flex items-center justify-center text-cream" style={{ backgroundColor: project.color }}>
                    <FolderOpen size={20} />
                  </div>
                  <div>
                    <h2 className="font-body text-lg font-semibold text-espresso">{project.name}</h2>
                    <p className="text-xs text-stone">{new Date(project.createdAt).toLocaleDateString('es-CO')}</p>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-stone min-h-[2.5rem]">{project.description || 'Sin descripción'}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(Object.keys(statusLabels) as ProjectTaskStatus[]).map((status) => (
                  <span key={status} className="badge bg-surface-tint text-stone">
                    {statusLabels[status]}: {project.taskCounts?.[status] ?? 0}
                  </span>
                ))}
              </div>
            </Link>
          ))}
          {filteredProjects.length === 0 && (
            <div className="card md:col-span-2 xl:col-span-3 text-center text-stone">
              No hay proyectos activos.
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo proyecto" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nombre" error={errors.name?.message} {...register('name')} />
          <div>
            <label className="text-sm font-medium text-ink font-body block mb-1">Descripción</label>
            <textarea className="input-base h-24 resize-none" {...register('description')} />
          </div>
          <div>
            <label className="text-sm font-medium text-ink font-body block mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {palette.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  className={`h-9 w-9 rounded-lg border-2 ${selectedColor === color ? 'border-espresso' : 'border-rule'}`}
                  style={{ backgroundColor: color }}
                  aria-label={`Usar color ${color}`}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>Crear</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
