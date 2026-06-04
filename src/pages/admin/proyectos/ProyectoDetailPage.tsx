import { ArrowLeft, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { projectsApi } from '../../../api/projects';
import { tasksApi } from '../../../api/tasks';
import { usersApi } from '../../../api/users';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Select } from '../../../components/ui/Select';
import { PageLoader } from '../../../components/ui/Spinner';
import { useToast } from '../../../hooks/useToast';
import { formatShortDate } from '../../../utils/formatDate';
import type { Project, ProjectTask, ProjectTaskStatus, TaskPriority, User } from '../../../types';

const statusOptions = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'in-progress', label: 'En progreso' },
  { value: 'review', label: 'En revisión' },
  { value: 'done', label: 'Completada' },
  { value: 'cancelled', label: 'Cancelada' },
];

const priorityOptions = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

const statusLabels = Object.fromEntries(statusOptions.map((item) => [item.value, item.label])) as Record<ProjectTaskStatus, string>;
const priorityLabels = Object.fromEntries(priorityOptions.map((item) => [item.value, item.label])) as Record<TaskPriority, string>;

const priorityClass: Record<TaskPriority, string> = {
  urgent: 'border-l-terracotta',
  high: 'border-l-maize',
  medium: 'border-l-lagoon',
  low: 'border-l-stone',
};

const statusClass: Record<ProjectTaskStatus, string> = {
  pending: 'bg-surface-tint text-stone',
  'in-progress': 'bg-info-tint text-info-ink',
  review: 'bg-warning-tint text-warning-ink',
  done: 'bg-success-tint text-success-ink',
  cancelled: 'bg-error-tint text-error-ink',
};

function userId(user: User) {
  return user._id || user.id;
}

function projectId(project: string | Project) {
  return typeof project === 'string' ? project : project._id;
}

function isOverdue(task: ProjectTask) {
  return task.dueDate && !['done', 'cancelled'].includes(task.status) && new Date(task.dueDate) < new Date();
}

function dueSoon(task: ProjectTask) {
  if (!task.dueDate || ['done', 'cancelled'].includes(task.status)) return false;
  const diff = new Date(task.dueDate).getTime() - Date.now();
  return diff >= 0 && diff <= 3 * 24 * 60 * 60 * 1000;
}

interface TaskDraft {
  title: string;
  description: string;
  status: ProjectTaskStatus;
  priority: TaskPriority;
  assignedTo: string[];
  dueDate: string;
  notes: string;
  tagsText: string;
  order: number;
}

export function ProyectoDetailPage() {
  const { id = '' } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [assignedFilter, setAssignedFilter] = useState<string>('');
  const [grouped, setGrouped] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectTask | null>(null);
  const [draft, setDraft] = useState<TaskDraft>(emptyDraft());
  const [attachment, setAttachment] = useState({ filename: '', url: '' });
  const toast = useToast();

  const fetchProject = async () => {
    setLoading(true);
    try {
      const [projectRes, usersRes] = await Promise.all([
        projectsApi.getOne(id),
        usersApi.getAssignable(),
      ]);
      setProject(projectRes.data.project);
      setTasks(projectRes.data.tasks);
      setUsers(usersRes.data);
    } catch {
      toast.error('Error al cargar proyecto');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProject(); }, [id]);

  const filtered = useMemo(() => tasks.filter((task) => {
    if (statusFilter && task.status !== statusFilter) return false;
    if (priorityFilter && task.priority !== priorityFilter) return false;
    if (assignedFilter && !task.assignedTo.some((user) => userId(user) === assignedFilter)) return false;
    return true;
  }), [tasks, statusFilter, priorityFilter, assignedFilter]);

  const stats = useMemo(() => ({
    total: tasks.length,
    done: tasks.filter((task) => task.status === 'done').length,
    pending: tasks.filter((task) => task.status === 'pending').length,
    overdue: tasks.filter(isOverdue).length,
  }), [tasks]);

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft());
    setAttachment({ filename: '', url: '' });
    setModalOpen(true);
  };

  const openEdit = (task: ProjectTask) => {
    setEditing(task);
    setDraft({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo.map(userId),
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      notes: task.notes || '',
      tagsText: task.tags?.join(', ') || '',
      order: task.order || 0,
    });
    setAttachment({ filename: '', url: '' });
    setModalOpen(true);
  };

  const saveTask = async () => {
    if (!draft.title.trim()) {
      toast.error('El título es requerido');
      return;
    }
    try {
      const payload = {
        projectId: id,
        title: draft.title,
        description: draft.description,
        status: draft.status,
        priority: draft.priority,
        assignedTo: draft.assignedTo,
        dueDate: draft.dueDate || undefined,
        notes: draft.notes,
        tags: draft.tagsText.split(',').map((tag) => tag.trim()).filter(Boolean),
        order: Number(draft.order) || 0,
      };
      if (editing) {
        await tasksApi.update(editing._id, payload);
        toast.success('Tarea actualizada');
      } else {
        await tasksApi.create(payload);
        toast.success('Tarea creada');
      }
      setModalOpen(false);
      fetchProject();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar tarea');
    }
  };

  const deleteTask = async (task: ProjectTask) => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    try {
      await tasksApi.delete(task._id);
      toast.success('Tarea eliminada');
      fetchProject();
    } catch {
      toast.error('Error al eliminar tarea');
    }
  };

  const addAttachment = async () => {
    if (!editing || !attachment.filename || !attachment.url) return;
    try {
      await tasksApi.addAttachment(editing._id, attachment);
      toast.success('Adjunto agregado');
      setAttachment({ filename: '', url: '' });
      fetchProject();
      const res = await tasksApi.getOne(editing._id);
      setEditing(res.data);
    } catch {
      toast.error('Error al agregar adjunto');
    }
  };

  const removeAttachment = async (attachmentId: string) => {
    if (!editing) return;
    try {
      await tasksApi.deleteAttachment(editing._id, attachmentId);
      toast.success('Adjunto eliminado');
      const res = await tasksApi.getOne(editing._id);
      setEditing(res.data);
      fetchProject();
    } catch {
      toast.error('Error al eliminar adjunto');
    }
  };

  const renderTask = (task: ProjectTask) => (
    <div key={task._id} className={`bg-white border border-rule border-l-4 ${priorityClass[task.priority]} rounded-lg p-4 hover:border-rule-strong transition-colors`}>
      <div className="flex items-start justify-between gap-4">
        <button type="button" onClick={() => openEdit(task)} className="text-left min-w-0">
          <h3 className="font-semibold text-espresso truncate">{task.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className={`badge ${statusClass[task.status]}`}>{statusLabels[task.status]}</span>
            <span className="badge bg-surface-tint text-stone">{priorityLabels[task.priority]}</span>
            {task.dueDate && (
              <span className={`badge ${isOverdue(task) ? 'bg-error-tint text-error-ink' : dueSoon(task) ? 'bg-warning-tint text-warning-ink' : 'bg-surface-tint text-stone'}`}>
                {formatShortDate(task.dueDate)}
              </span>
            )}
          </div>
        </button>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex -space-x-2">
            {task.assignedTo.slice(0, 3).map((user) => (
              <span key={userId(user)} className="h-8 w-8 rounded-full bg-espresso text-cream text-xs font-semibold flex items-center justify-center border-2 border-white">
                {user.avatarInitials || user.name.slice(0, 1)}
              </span>
            ))}
            {task.assignedTo.length > 3 && (
              <span className="h-8 w-8 rounded-full bg-surface-tint text-stone text-xs font-semibold flex items-center justify-center border-2 border-white">
                +{task.assignedTo.length - 3}
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => openEdit(task)}>Editar</Button>
          <Button variant="danger" size="sm" onClick={() => deleteTask(task)} aria-label="Eliminar tarea"><Trash2 size={15} /></Button>
        </div>
      </div>
    </div>
  );

  if (loading) return <PageLoader />;
  if (!project) return <div className="card text-stone">Proyecto no encontrado.</div>;

  const groupedTasks = statusOptions.map((status) => ({
    status: status.value as ProjectTaskStatus,
    label: status.label,
    tasks: filtered.filter((task) => task.status === status.value),
  }));

  return (
    <div className="space-y-6">
      <Link to="/admin/proyectos" className="inline-flex items-center gap-2 text-sm text-stone hover:text-espresso">
        <ArrowLeft size={16} /> Volver a proyectos
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-4 w-4 rounded-full" style={{ backgroundColor: project.color }} />
            <h1 className="font-body text-2xl font-bold text-espresso">{project.name}</h1>
          </div>
          <p className="text-stone font-body text-sm mt-1">{project.description || 'Sin descripción'}</p>
        </div>
        <Button onClick={openCreate} icon={<Plus size={15} />}>Nueva tarea</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Total" value={stats.total} />
        <Stat label="Completadas" value={stats.done} />
        <Stat label="Pendientes" value={stats.pending} />
        <Stat label="Vencidas" value={stats.overdue} tone="error" />
      </div>

      <div className="card">
        <div className="grid gap-3 md:grid-cols-4">
          <Select options={[{ value: '', label: 'Todos los estados' }, ...statusOptions]} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
          <Select options={[{ value: '', label: 'Todas las prioridades' }, ...priorityOptions]} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} />
          <Select
            options={[{ value: '', label: 'Todos los asignados' }, ...users.map((user) => ({ value: userId(user), label: user.name }))]}
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
          />
          <Button variant="secondary" type="button" onClick={() => setGrouped((value) => !value)}>
            {grouped ? 'Vista plana' : 'Agrupar por estado'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {grouped ? groupedTasks.map((group) => (
          <section key={group.status} className="space-y-3">
            <h2 className="font-body text-lg font-semibold text-espresso">{group.label} ({group.tasks.length})</h2>
            {group.tasks.map(renderTask)}
          </section>
        )) : filtered.map(renderTask)}
        {filtered.length === 0 && <div className="card text-center text-stone">No hay tareas con esos filtros.</div>}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar tarea' : 'Nueva tarea'} size="xl">
        <div className="space-y-4">
          <Input label="Título" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <div>
            <label className="text-sm font-medium text-ink font-body block mb-1">Descripción</label>
            <textarea className="input-base h-24 resize-none" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Estado" options={statusOptions} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as ProjectTaskStatus })} />
            <Select label="Prioridad" options={priorityOptions} value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as TaskPriority })} />
            <Input label="Fecha límite" type="date" value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} />
            <Input label="Orden" type="number" value={draft.order} onChange={(e) => setDraft({ ...draft, order: Number(e.target.value) })} />
          </div>
          <div>
            <label className="text-sm font-medium text-ink font-body block mb-2">Asignados</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {users.map((user) => {
                const selected = draft.assignedTo.includes(userId(user));
                return (
                  <label key={userId(user)} className={`flex items-center gap-3 border rounded-lg px-3 py-2 ${selected ? 'border-terracotta bg-surface-tint' : 'border-rule bg-white'}`}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-terracotta"
                      checked={selected}
                      onChange={(e) => setDraft({
                        ...draft,
                        assignedTo: e.target.checked
                          ? [...draft.assignedTo, userId(user)]
                          : draft.assignedTo.filter((id) => id !== userId(user)),
                      })}
                    />
                    <span className="text-sm text-ink">{user.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <Input label="Tags" hint="Separados por coma" value={draft.tagsText} onChange={(e) => setDraft({ ...draft, tagsText: e.target.value })} />
          <div>
            <label className="text-sm font-medium text-ink font-body block mb-1">Notas</label>
            <textarea className="input-base h-20 resize-none" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          </div>

          {editing && (
            <div className="border-t border-rule pt-4 space-y-3">
              <h3 className="font-semibold text-espresso">Adjuntos</h3>
              <div className="space-y-2">
                {(editing.attachments || []).map((item) => (
                  <div key={item._id} className="flex items-center justify-between gap-3 rounded-lg border border-rule px-3 py-2">
                    <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-espresso hover:text-terracotta">
                      <ExternalLink size={14} /> {item.filename}
                    </a>
                    <Button variant="danger" size="sm" onClick={() => removeAttachment(item._id)}>Quitar</Button>
                  </div>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <Input placeholder="Nombre del link" value={attachment.filename} onChange={(e) => setAttachment({ ...attachment, filename: e.target.value })} />
                <Input placeholder="URL o ruta" value={attachment.url} onChange={(e) => setAttachment({ ...attachment, url: e.target.value })} />
                <Button type="button" variant="secondary" onClick={addAttachment}>Agregar</Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="button" onClick={saveTask}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function emptyDraft(): TaskDraft {
  return {
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    assignedTo: [],
    dueDate: '',
    notes: '',
    tagsText: '',
    order: 0,
  };
}

function Stat({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'error' }) {
  return (
    <div className="card py-4">
      <p className="text-xs text-stone font-body">{label}</p>
      <p className={`text-2xl font-bold ${tone === 'error' ? 'text-error-ink' : 'text-espresso'}`}>{value}</p>
    </div>
  );
}
