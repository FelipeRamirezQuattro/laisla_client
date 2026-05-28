import { Plus } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { providersApi } from '../../api/providers';
import { Provider } from '../../types';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { PageLoader } from '../../components/ui/Spinner';

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  contactName: z.string().default(''),
  phone: z.string().default(''),
  email: z.string().email('Email inválido').or(z.literal('')).default(''),
  category: z.string().min(1, 'Categoría requerida'),
  notes: z.string().default(''),
});

type FormData = z.infer<typeof schema>;

export function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Provider | null>(null);
  const toast = useToast();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await providersApi.getAll({ page, limit: 20, search });
      setProviders(res.data.providers);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  const openCreate = () => { setEditing(null); reset({}); setModalOpen(true); };
  const openEdit = (p: Provider) => {
    setEditing(p);
    reset({ name: p.name, contactName: p.contactName || '', phone: p.phone || '', email: p.email || '', category: p.category, notes: p.notes || '' });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) {
        await providersApi.update(editing._id, data);
        toast.success('Proveedor actualizado');
      } else {
        await providersApi.create(data);
        toast.success('Proveedor creado');
      }
      setModalOpen(false);
      fetchProviders();
    } catch {
      toast.error('Error al guardar proveedor');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este proveedor?')) return;
    try {
      await providersApi.delete(id);
      toast.success('Proveedor eliminado');
      fetchProviders();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-espresso">Proveedores</h1>
          <p className="text-stone font-body text-sm">{total} proveedores registrados</p>
        </div>
        <Button onClick={openCreate} icon={<Plus size={15} />}>Nuevo proveedor</Button>
      </div>

      <div className="card">
        <Input
          placeholder="Buscar por nombre..."
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
                <th className="text-left px-4 py-3 text-stone font-medium">Contacto</th>
                <th className="text-left px-4 py-3 text-stone font-medium">Categoría</th>
                <th className="text-left px-4 py-3 text-stone font-medium">Teléfono</th>
                <th className="text-right px-4 py-3 text-stone font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {providers.map((p) => (
                <tr key={p._id} className="hover:bg-surface-tint transition-colors">
                  <td className="px-4 py-3 font-medium text-espresso">{p.name}</td>
                  <td className="px-4 py-3 text-stone">{p.contactName || '—'}</td>
                  <td className="px-4 py-3 text-stone">{p.category}</td>
                  <td className="px-4 py-3 text-stone">{p.phone || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>Editar</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(p._id)}>Eliminar</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {providers.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-stone">No se encontraron proveedores.</td></tr>
              )}
            </tbody>
          </table>
          <div className="p-4">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar proveedor' : 'Nuevo proveedor'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nombre de la empresa" error={errors.name?.message} {...register('name')} />
          <Input label="Nombre del contacto" {...register('contactName')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Teléfono" {...register('phone')} />
            <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          </div>
          <Input label="Categoría de productos" error={errors.category?.message} {...register('category')} />
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
