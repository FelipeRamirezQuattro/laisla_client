import { useEffect, useMemo, useState } from 'react';
import { tasksApi } from '../../../api/tasks';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { PageLoader } from '../../../components/ui/Spinner';
import { useToast } from '../../../hooks/useToast';
import { formatShortDate } from '../../../utils/formatDate';
import type { Project, ProjectTask, ProjectTaskStatus } from '../../../types';

const statusOptions = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'in-progress', label: 'En progreso' },
  { value: 'review', label: 'En revisión' },
  { value: 'done', label: 'Completada' },
  { value: 'cancelled', label: 'Cancelada' },
];

const statusLabels = Object.fromEntries(statusOptions.map((item) => [item.value, item.label])) as Record<ProjectTaskStatus, string>;

function projectName(task: ProjectTask) {
  return typeof task.projectId === 'string' ? 'Sin proyecto' : task.projectId.name;
}

function projectColor(task: ProjectTask) {
  return typeof task.projectId === 'string' ? '#43593B' : task.projectId.color;
}

export function MisTareasPage() {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const toast = useToast();

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await tasksApi.getMyTasks();
      setTasks(res.data);
    } catch {
      toast.error('Error al cargar tus tareas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredTasks = useMemo(() => tasks.filter((task) => {
    if (!normalizedSearch) return true;
    return [
      task.title,
      task.description,
      projectName(task),
      statusLabels[task.status],
      task.status,
      task.priority,
      task.dueDate,
    ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
  }), [tasks, normalizedSearch]);

  const grouped = useMemo(() => filteredTasks.reduce<Record<string, ProjectTask[]>>((acc, task) => {
    const name = projectName(task);
    acc[name] = acc[name] || [];
    acc[name].push(task);
    return acc;
  }, {}), [filteredTasks]);

  const updateStatus = async (task: ProjectTask, status: ProjectTaskStatus) => {
    try {
      await tasksApi.update(task._id, { status });
      toast.success('Estado actualizado');
      fetchTasks();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar tarea');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-body text-2xl font-bold text-espresso">Mis tareas</h1>
        <p className="text-stone font-body text-sm">{filteredTasks.length} tareas asignadas</p>
      </div>

      <div className="card grid gap-3 md:grid-cols-[minmax(0,1fr)_16rem]">
        <Input
          placeholder="Buscar por tarea, proyecto, estado o prioridad..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="rounded-lg border border-rule bg-surface-tint px-4 py-2 font-body text-sm text-stone">
          {filteredTasks.length} de {tasks.length} tareas
        </div>
      </div>

      {Object.entries(grouped).map(([name, items]) => (
        <section key={name} className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: projectColor(items[0]) }} />
            <h2 className="font-body text-lg font-semibold text-espresso">{name}</h2>
          </div>
          <div className="space-y-3">
            {items.map((task) => (
              <div key={task._id} className="card py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="font-semibold text-espresso">{task.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="badge bg-surface-tint text-stone">{statusLabels[task.status]}</span>
                      <span className="badge bg-surface-tint text-stone">{task.priority}</span>
                      {task.dueDate && <span className="badge bg-warning-tint text-warning-ink">{formatShortDate(task.dueDate)}</span>}
                    </div>
                    {task.description && <p className="mt-2 text-sm text-stone">{task.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      options={statusOptions}
                      value={task.status}
                      onChange={(e) => updateStatus(task, e.target.value as ProjectTaskStatus)}
                    />
                    <Button variant="secondary" size="sm" onClick={() => updateStatus(task, 'done')}>Completar</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {filteredTasks.length === 0 && (
        <div className="card text-center text-stone">No tienes tareas asignadas por ahora.</div>
      )}
    </div>
  );
}
