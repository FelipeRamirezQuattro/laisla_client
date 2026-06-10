import { Edit2, KeyRound, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usersApi } from '../../api/users';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { PageLoader } from '../../components/ui/Spinner';
import { useToast } from '../../hooks/useToast';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/formatDate';
import type { User, UserRole } from '../../types';

const userSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  role: z.enum(['superadmin', 'admin', 'user']),
  isActive: z.boolean().default(true),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => !data.password || data.password.length >= 8, {
  message: 'La contraseña debe tener mínimo 8 caracteres',
  path: ['password'],
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

const passwordSchema = z.object({
  password: z.string().min(8, 'La contraseña debe tener mínimo 8 caracteres'),
  confirmPassword: z.string().min(8, 'Confirma la contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type UserForm = z.infer<typeof userSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const roleOptions = [
  { value: 'superadmin', label: 'Superadmin' },
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'Usuario' },
];

const roleLabels: Record<UserRole, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  user: 'Usuario',
};

function roleBadge(role: UserRole) {
  const classes = {
    superadmin: 'bg-espresso text-cream',
    admin: 'bg-lagoon text-ink',
    user: 'bg-olive text-ink',
  }[role];
  return <span className={`badge ${classes}`}>{roleLabels[role]}</span>;
}

function initials(user: User) {
  return user.avatarInitials || user.name.slice(0, 1).toUpperCase();
}

function userId(user: User) {
  return user._id || user.id;
}

export function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const toast = useToast();
  const { user: currentUser } = useAuthStore();

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
  });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });
  const isActive = watch('isActive');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await usersApi.getAll();
      setUsers(res.data);
    } catch {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', email: '', role: 'user', isActive: true, password: '', confirmPassword: '' });
    setModalOpen(true);
  };

  const openEdit = (selected: User) => {
    setEditing(selected);
    reset({
      name: selected.name,
      email: selected.email,
      role: selected.role,
      isActive: selected.isActive ?? true,
      password: '',
      confirmPassword: '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: UserForm) => {
    try {
      if (editing) {
        await usersApi.update(userId(editing), {
          name: data.name,
          role: data.role,
          isActive: data.isActive,
        });
        toast.success('Usuario actualizado');
      } else {
        if (!data.email || !data.password) {
          toast.error('Email y contraseña son requeridos');
          return;
        }
        await usersApi.create({
          name: data.name,
          email: data.email,
          role: data.role,
          isActive: data.isActive,
          password: data.password,
        });
        toast.success('Usuario creado');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar usuario');
    }
  };

  const toggleActive = async (selected: User) => {
    try {
      await usersApi.update(userId(selected), { isActive: !(selected.isActive ?? true) });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar estado');
    }
  };

  const handleDelete = async (selected: User) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      await usersApi.delete(userId(selected));
      toast.success('Usuario eliminado');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al eliminar usuario');
    }
  };

  const openPassword = (selected: User) => {
    setPasswordUser(selected);
    passwordForm.reset({ password: '', confirmPassword: '' });
    setPasswordOpen(true);
  };

  const submitPassword = async (data: PasswordForm) => {
    if (!passwordUser) return;
    try {
      await usersApi.updatePassword(userId(passwordUser), data.password);
      toast.success('Contraseña actualizada');
      setPasswordOpen(false);
    } catch {
      toast.error('Error al actualizar contraseña');
    }
  };

  const currentId = currentUser ? (currentUser._id || currentUser.id) : '';
  const normalizedSearch = search.trim().toLowerCase();
  const filteredUsers = users.filter((item) => {
    if (!normalizedSearch) return true;
    const activeLabel = (item.isActive ?? true) ? 'activo' : 'inactivo';
    return [
      item.name,
      item.email,
      roleLabels[item.role],
      item.role,
      activeLabel,
      item.lastLoginAt ? formatDateTime(item.lastLoginAt) : '',
    ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-body text-2xl font-bold text-espresso">Usuarios</h1>
          <p className="text-stone font-body text-sm">{filteredUsers.length} usuarios registrados</p>
        </div>
        <Button onClick={openCreate} icon={<Plus size={15} />}>Nuevo usuario</Button>
      </div>

      <div className="card grid gap-3 md:grid-cols-[minmax(0,1fr)_16rem]">
        <Input
          placeholder="Buscar por usuario, email, rol o estado..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="rounded-lg border border-rule bg-surface-tint px-4 py-2 font-body text-sm text-stone">
          {filteredUsers.length} de {users.length} usuarios
        </div>
      </div>

      {loading ? <PageLoader /> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm font-body">
            <thead className="bg-surface-tint border-b border-rule">
              <tr>
                <th className="text-left px-4 py-3 text-stone font-medium">Usuario</th>
                <th className="text-left px-4 py-3 text-stone font-medium">Email</th>
                <th className="text-left px-4 py-3 text-stone font-medium">Rol</th>
                <th className="text-left px-4 py-3 text-stone font-medium">Estado</th>
                <th className="text-left px-4 py-3 text-stone font-medium">Último acceso</th>
                <th className="text-right px-4 py-3 text-stone font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {filteredUsers.map((item) => {
                const ownUser = userId(item) === currentId;
                return (
                  <tr key={userId(item)} className="hover:bg-surface-tint transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-espresso text-cream flex items-center justify-center text-sm font-semibold">
                          {initials(item)}
                        </div>
                        <span className="font-medium text-espresso">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone">{item.email}</td>
                    <td className="px-4 py-3">{roleBadge(item.role)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleActive(item)}
                        className={`badge ${(item.isActive ?? true) ? 'bg-success-tint text-success-ink' : 'bg-error-tint text-error-ink'}`}
                      >
                        {(item.isActive ?? true) ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-stone">{item.lastLoginAt ? formatDateTime(item.lastLoginAt) : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(item)} icon={<Edit2 size={14} />}>Editar</Button>
                        <Button variant="ghost" size="sm" onClick={() => openPassword(item)} icon={<KeyRound size={14} />}>Clave</Button>
                        {!ownUser && (
                          <Button variant="danger" size="sm" onClick={() => handleDelete(item)} aria-label="Eliminar usuario">
                            <Trash2 size={15} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-stone">No se encontraron usuarios.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar usuario' : 'Nuevo usuario'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nombre completo" error={errors.name?.message} {...register('name')} />
          <Input label="Email" type="email" disabled={!!editing} error={errors.email?.message} {...register('email')} />
          <Select label="Rol" options={roleOptions} error={errors.role?.message} {...register('role')} />
          {!editing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Contraseña" type="password" error={errors.password?.message} {...register('password')} />
              <Input label="Confirmar contraseña" type="password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
            </div>
          )}
          <label className="flex items-center gap-3 text-sm text-ink font-body">
            <input type="checkbox" className="h-4 w-4 accent-terracotta" {...register('isActive')} />
            {isActive ? 'Usuario activo' : 'Usuario inactivo'}
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>{editing ? 'Actualizar' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={passwordOpen} onClose={() => setPasswordOpen(false)} title="Cambiar contraseña">
        <form onSubmit={passwordForm.handleSubmit(submitPassword)} className="space-y-4">
          <Input label="Nueva contraseña" type="password" error={passwordForm.formState.errors.password?.message} {...passwordForm.register('password')} />
          <Input label="Confirmar contraseña" type="password" error={passwordForm.formState.errors.confirmPassword?.message} {...passwordForm.register('confirmPassword')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setPasswordOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={passwordForm.formState.isSubmitting}>Actualizar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
