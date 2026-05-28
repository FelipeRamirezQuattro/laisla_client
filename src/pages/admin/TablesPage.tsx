import { Plus } from 'lucide-react';
import { FormEvent, useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { tablesApi } from '../../api/tables';
import { CafeTable, TableZoneRecord } from '../../types';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { TableStatusBadge } from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Spinner';

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  capacity: z.coerce.number().min(1, 'Mínimo 1 persona'),
  zone: z.string().min(1, 'Zona requerida'),
});

type FormData = z.infer<typeof schema>;

const statusBorder: Record<string, string> = {
  available: 'border-l-4 border-l-success',
  occupied:  'border-l-4 border-l-error',
  reserved:  'border-l-4 border-l-warning',
};

export function TablesPage() {
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [zones, setZones] = useState<TableZoneRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [editing, setEditing] = useState<CafeTable | null>(null);
  const [editingZone, setEditingZone] = useState<TableZoneRecord | null>(null);
  const [zoneName, setZoneName] = useState('');
  const [zoneSaving, setZoneSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CafeTable | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [releasingId, setReleasingId] = useState('');
  const [releasingAll, setReleasingAll] = useState(false);
  const [releaseAllModalOpen, setReleaseAllModalOpen] = useState(false);
  const [zoneFilter, setZoneFilter] = useState('');
  const toast = useToast();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const fetchZones = useCallback(async () => {
    try {
      const res = await tablesApi.getZones();
      setZones(res.data);
    } catch {
      toast.error('Error al cargar zonas');
    }
  }, []);

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const params = zoneFilter ? { zone: zoneFilter } : undefined;
      const res = await tablesApi.getAll(params);
      setTables(res.data);
    } catch {
      toast.error('Error al cargar mesas');
    } finally {
      setLoading(false);
    }
  }, [zoneFilter]);

  useEffect(() => { fetchZones(); }, [fetchZones]);
  useEffect(() => { fetchTables(); }, [fetchTables]);

  const zoneOptions = zones.map((zone) => ({ value: zone.value, label: zone.label }));
  const uncategorizedTableZones = Array.from(
    new Map(
      tables
        .filter((table) => !zones.some((zone) => zone.value === table.zone))
        .map((table) => [
          table.zone,
          {
            _id: table.zone,
            value: table.zone,
            label: table.zone,
            orden: 999,
            createdAt: table.createdAt,
          },
        ])
    ).values()
  );
  const displayZones = [
    ...zones,
    ...uncategorizedTableZones,
  ];

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', capacity: 2, zone: zones[0]?.value || '' });
    setModalOpen(true);
  };

  const openEdit = (t: CafeTable) => {
    setEditing(t);
    reset({ name: t.name, capacity: t.capacity, zone: t.zone });
    setModalOpen(true);
  };

  const openZoneManager = () => {
    setEditingZone(null);
    setZoneName('');
    setZoneModalOpen(true);
  };

  const editZone = (zone: TableZoneRecord) => {
    setEditingZone(zone);
    setZoneName(zone.label);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) {
        await tablesApi.update(editing._id, data);
        toast.success('Mesa actualizada');
      } else {
        await tablesApi.create(data);
        toast.success('Mesa creada');
      }
      setModalOpen(false);
      fetchTables();
    } catch {
      toast.error('Error al guardar mesa');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await tablesApi.delete(deleteTarget._id);
      toast.success('Mesa eliminada');
      setDeleteTarget(null);
      fetchTables();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeleting(false);
    }
  };

  const releaseTable = async (table: CafeTable) => {
    setReleasingId(table._id);
    try {
      await tablesApi.release(table._id);
      toast.success(`Mesa ${table.name} liberada`);
      fetchTables();
    } catch {
      toast.error('Error al liberar mesa');
    } finally {
      setReleasingId('');
    }
  };

  const releaseAllTables = async () => {
    setReleasingAll(true);
    try {
      await tablesApi.releaseAll();
      toast.success('Mesas liberadas');
      setReleaseAllModalOpen(false);
      fetchTables();
    } catch {
      toast.error('Error al liberar mesas');
    } finally {
      setReleasingAll(false);
    }
  };

  const saveZone = async (event: FormEvent) => {
    event.preventDefault();
    const label = zoneName.trim();
    if (!label) return;
    setZoneSaving(true);
    try {
      const res = editingZone
        ? await tablesApi.updateZone(editingZone._id, { label })
        : await tablesApi.createZone({ label });

      setZoneName('');
      setEditingZone(null);
      setZoneFilter((current) => current === editingZone?.value ? res.data.value : current);
      await Promise.all([fetchZones(), fetchTables()]);
      toast.success(editingZone ? 'Zona actualizada' : 'Zona creada');
    } catch {
      toast.error(editingZone ? 'Error al actualizar zona' : 'Error al crear zona');
    } finally {
      setZoneSaving(false);
    }
  };

  const grouped = displayZones.reduce<Record<string, CafeTable[]>>((acc, z) => {
    acc[z.value] = tables.filter((t) => t.zone === z.value);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-espresso">Mesas</h1>
          <p className="text-stone font-body text-sm">{tables.length} mesas en total</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={openZoneManager}>
            Zonas
          </Button>
          <Button variant="secondary" onClick={() => setReleaseAllModalOpen(true)} loading={releasingAll}>
            Liberar todas
          </Button>
          <Select
            options={[{ value: '', label: 'Todas las zonas' }, ...zoneOptions]}
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="w-44"
          />
          <Button onClick={openCreate} icon={<Plus size={15} />}>Nueva mesa</Button>
        </div>
      </div>

      {loading ? <PageLoader /> : (
        <div className="space-y-6">
          {displayZones.map((zone) => {
            const zoneTables = grouped[zone.value] || [];
            if (zoneFilter && zoneFilter !== zone.value) return null;
            return (
              <div key={zone.value}>
                <h2 className="font-body text-lg font-semibold text-espresso mb-3">{zone.label}</h2>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {zoneTables.map((table) => (
                    <div
                      key={table._id}
                      className={`bg-white border border-rule rounded-xl p-4 ${statusBorder[table.status]} transition-all hover:shadow-sm`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="min-w-0 truncate pr-2 font-body font-semibold text-espresso text-sm">{table.name}</span>
                        <span className="shrink-0 text-xs text-stone">{table.capacity}p</span>
                      </div>
                      <div>
                        <TableStatusBadge status={table.status} />
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full px-2"
                          onClick={() => openEdit(table)}
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="w-full px-2"
                          loading={releasingId === table._id}
                          onClick={() => releaseTable(table)}
                        >
                          Liberar
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          className="w-full px-2"
                          onClick={() => setDeleteTarget(table)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ))}
                  {zoneTables.length === 0 && (
                    <div className="border border-dashed border-rule rounded-xl p-4 bg-white flex items-center justify-center">
                      <span className="text-xs text-stone font-body">Sin mesas</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar mesa' : 'Nueva mesa'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nombre / Número" error={errors.name?.message} {...register('name')} />
          <Input label="Capacidad (personas)" type="number" error={errors.capacity?.message} {...register('capacity')} />
          <Select
            label="Zona"
            options={zoneOptions}
            error={errors.zone?.message}
            {...register('zone')}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>{editing ? 'Actualizar' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={zoneModalOpen}
        onClose={() => {
          if (!zoneSaving) setZoneModalOpen(false);
        }}
        title="Zonas de mesas"
      >
        <div className="space-y-5">
          <div className="space-y-2">
            {zones.map((zone) => (
              <div key={zone._id} className="flex items-center justify-between rounded-lg border border-rule px-3 py-2">
                <div>
                  <p className="font-body text-sm font-semibold text-espresso">{zone.label}</p>
                  <p className="font-body text-xs text-stone">{grouped[zone.value]?.length || 0} mesas</p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => editZone(zone)}>
                  Editar
                </Button>
              </div>
            ))}
          </div>

          <form onSubmit={saveZone} className="space-y-4 border-t border-rule pt-4">
            <Input
              label={editingZone ? 'Editar zona' : 'Nueva zona'}
              value={zoneName}
              onChange={(event) => setZoneName(event.target.value)}
              placeholder="Ej: Terraza interna"
              autoFocus
            />
            <p className="text-xs font-body text-stone">
              Si editas una zona, las mesas asociadas se moverán automáticamente al nuevo nombre.
            </p>
            <div className="flex justify-end gap-3">
              {editingZone && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditingZone(null);
                    setZoneName('');
                  }}
                  disabled={zoneSaving}
                >
                  Nueva zona
                </Button>
              )}
              <Button type="submit" loading={zoneSaving} disabled={!zoneName.trim()}>
                {editingZone ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        title="Eliminar mesa"
        size="sm"
      >
        <div className="space-y-5">
          <p className="font-body text-sm leading-6 text-stone">
            ¿Quieres eliminar la mesa{' '}
            <span className="font-semibold text-espresso">{deleteTarget?.name}</span>?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={deleting}
              onClick={handleDelete}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={releaseAllModalOpen}
        onClose={() => {
          if (!releasingAll) setReleaseAllModalOpen(false);
        }}
        title="Liberar todas las mesas"
        size="sm"
      >
        <div className="space-y-5">
          <div className="rounded-lg border border-warning bg-warning-tint p-4 font-body">
            <p className="font-semibold text-warning-ink">Esta acción liberará todas las mesas.</p>
            <p className="mt-2 text-sm leading-6 text-stone">
              Los pedidos activos asociados no se eliminarán. Pasarán a quedar como
              <span className="font-semibold text-espresso"> Sin mesa / Mostrador</span>.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setReleaseAllModalOpen(false)}
              disabled={releasingAll}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              loading={releasingAll}
              onClick={releaseAllTables}
            >
              Liberar todas
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
