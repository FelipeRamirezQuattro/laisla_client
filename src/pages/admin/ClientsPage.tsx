import { Plus } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { clientsApi } from '../../api/clients';
import { Client } from '../../types';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { PageLoader } from '../../components/ui/Spinner';

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  email: z.string().email('Email inválido').or(z.literal('')).default(''),
  phone: z.string().default(''),
  notes: z.string().default(''),
});

type FormData = z.infer<typeof schema>;

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const toast = useToast();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await clientsApi.getAll({ page, limit: 20, search });
      setClients(res.data.clients);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const openCreate = () => { setEditing(null); reset({}); setModalOpen(true); };
  const openEdit = (c: Client) => {
    setEditing(c);
    reset({ name: c.name, email: c.email || '', phone: c.phone || '', notes: c.notes || '' });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) {
        await clientsApi.update(editing._id, data);
        toast.success('Cliente actualizado');
      } else {
        await clientsApi.create(data);
        toast.success('Cliente creado');
      }
      setModalOpen(false);
      fetchClients();
    } catch {
      toast.error('Error al guardar cliente');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    try {
      await clientsApi.delete(id);
      toast.success('Cliente eliminado');
      fetchClients();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-espresso">Clientes</h1>
          <p className="text-stone font-body text-sm">{total} clientes registrados</p>
        </div>
        <Button onClick={openCreate} icon={<Plus size={15} />}>Nuevo cliente</Button>
      </div>

      <div className="card">
        <Input
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {loading ? <PageLoader /> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm font-body">
            <thead className="bg-surface-tint border-b border-rule">
              <tr>
                <th className="text-left px-4 py-3 text-stone font-medium">Nombre</th>
                <th className="text-left px-4 py-3 text-stone font-medium">Email</th>
                <th className="text-left px-4 py-3 text-stone font-medium">Teléfono</th>
                <th className="text-center px-4 py-3 text-stone font-medium">Visitas</th>
                <th className="text-right px-4 py-3 text-stone font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {clients.map((c) => (
                <tr key={c._id} className="hover:bg-surface-tint transition-colors">
                  <td className="px-4 py-3 font-medium text-espresso">{c.name}</td>
                  <td className="px-4 py-3 text-stone">{c.email || '—'}</td>
                  <td className="px-4 py-3 text-stone">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-center text-stone">{c.visitCount}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>Editar</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(c._id)}>Eliminar</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-stone">No se encontraron clientes.</td></tr>
              )}
            </tbody>
          </table>
          <div className="p-4">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar cliente' : 'Nuevo cliente'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nombre" error={errors.name?.message} {...register('name')} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Teléfono" {...register('phone')} />
          <div>
            <label className="text-sm font-medium text-ink font-body block mb-1">Notas</label>
            <textarea className="input-base h-20 resize-none" {...register('notes')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>{editing ? 'Actualizar' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
