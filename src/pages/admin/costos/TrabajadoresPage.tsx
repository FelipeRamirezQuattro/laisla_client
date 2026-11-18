import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { workersApi } from '../../../api/workers';
import type { Worker } from '../../../types';
import { calcMODFromWorkersResult, DAYS_PER_MONTH } from '../../../utils/costFormulas';
import { formatCOP } from '../../../utils/formatCurrency';
import { useToast } from '../../../hooks/useToast';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { PageLoader } from '../../../components/ui/Spinner';

interface FormState {
  name: string;
  role: string;
  hourlyRate: string;
  hoursPerDay: string;
  daysPerMonth: string;
}

const emptyForm = (): FormState => ({ name: '', role: '', hourlyRate: '', hoursPerDay: '8', daysPerMonth: String(DAYS_PER_MONTH) });

const monthlyCost = (w: Pick<Worker, 'hourlyRate' | 'hoursPerDay' | 'daysPerMonth'>) => w.hourlyRate * w.hoursPerDay * w.daysPerMonth;

export function TrabajadoresPage() {
  const toast = useToast();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Worker | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setWorkers((await workersApi.getAll()).data);
    } catch {
      toast.error('Error al cargar los trabajadores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = useMemo(() => workers.filter((w) => w.active), [workers]);
  const totals = useMemo(() => calcMODFromWorkersResult({ workers: active, monthlyCustomers: 1, productsPerCustomer: 1 }), [active]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setError('');
    setModalOpen(true);
  };

  const openEdit = (worker: Worker) => {
    setEditing(worker);
    setForm({
      name: worker.name,
      role: worker.role ?? '',
      hourlyRate: String(worker.hourlyRate),
      hoursPerDay: String(worker.hoursPerDay),
      daysPerMonth: String(worker.daysPerMonth),
    });
    setError('');
    setModalOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const hourlyRate = Number(form.hourlyRate);
    const hoursPerDay = Number(form.hoursPerDay);
    const daysPerMonth = Number(form.daysPerMonth);
    if (!form.name.trim()) return setError('El nombre es obligatorio');
    if (!Number.isFinite(hourlyRate) || hourlyRate < 0 || form.hourlyRate === '') return setError('La tarifa por hora no es válida');
    if (!Number.isFinite(hoursPerDay) || hoursPerDay < 0.1 || hoursPerDay > 24) return setError('Las horas por día deben estar entre 0,1 y 24');
    if (!Number.isFinite(daysPerMonth) || daysPerMonth < 0.1 || daysPerMonth > 31) return setError('Los días al mes deben estar entre 0,1 y 31');

    setSaving(true);
    setError('');
    try {
      const payload = { name: form.name.trim(), role: form.role.trim(), hourlyRate, hoursPerDay, daysPerMonth };
      if (editing) await workersApi.update(editing._id, payload);
      else await workersApi.create(payload);
      toast.success(editing ? 'Trabajador actualizado' : 'Trabajador creado');
      setModalOpen(false);
      await load();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al guardar el trabajador');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (worker: Worker) => {
    try {
      if (worker.active) await workersApi.deactivate(worker._id);
      else await workersApi.update(worker._id, { active: true });
      await load();
    } catch {
      toast.error('Error al cambiar el estado del trabajador');
    }
  };

  if (loading) return <PageLoader />;

  const label = 'text-sm font-medium text-island-dark font-body block mb-1';

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-island-dark">Trabajadores</h1>
          <p className="text-island-dark/70 font-body text-sm">
            Cada trabajador con su tarifa y sus horas: de aquí sale la mano de obra directa (MOD) de los costos.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Nuevo trabajador
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs font-body text-island-dark/70 uppercase tracking-wide">Trabajadores activos</p>
          <p className="font-body text-2xl font-bold text-island-dark mt-1">{active.length}</p>
        </div>
        <div className="card">
          <p className="text-xs font-body text-island-dark/70 uppercase tracking-wide">MOD mensual</p>
          <p className="font-body text-2xl font-bold text-island-dark mt-1">{formatCOP(totals.monthlyLabor)}</p>
        </div>
        <div className="card">
          <p className="text-xs font-body text-island-dark/70 uppercase tracking-wide">MOD diario</p>
          <p className="font-body text-2xl font-bold text-island-dark mt-1">{formatCOP(totals.dailyLabor)}</p>
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm font-body">
          <thead className="bg-gray-100 border-b border-island-blue/20">
            <tr className="text-island-dark/70">
              <th className="text-left px-4 py-3 font-medium">Trabajador</th>
              <th className="text-right px-3 py-3 font-medium">Tarifa/hora</th>
              <th className="text-right px-3 py-3 font-medium">Horas/día</th>
              <th className="text-right px-3 py-3 font-medium">Días/mes</th>
              <th className="text-right px-3 py-3 font-medium">Costo mensual</th>
              <th className="text-right px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {workers.map((worker) => (
              <tr key={worker._id} className={worker.active ? '' : 'opacity-50'}>
                <td className="px-4 py-3">
                  <p className="font-medium text-island-dark">{worker.name}</p>
                  {worker.role && <p className="text-xs text-island-dark/60">{worker.role}</p>}
                  {!worker.active && <p className="text-xs text-island-dark/60">Inactivo (no cuenta en el MOD)</p>}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{formatCOP(worker.hourlyRate)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{worker.hoursPerDay}</td>
                <td className="px-3 py-3 text-right tabular-nums">{worker.daysPerMonth}</td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums">{formatCOP(monthlyCost(worker))}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(worker)} className="btn-ghost py-1 text-xs flex items-center gap-1">
                      <Pencil size={13} /> Editar
                    </button>
                    <button
                      onClick={() => toggleActive(worker)}
                      className={`text-xs px-2 py-1 rounded-lg font-medium ${worker.active ? 'bg-error-tint text-error-ink' : 'bg-success-tint text-success-ink'}`}
                    >
                      {worker.active ? 'Desactivar' : 'Reactivar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {workers.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-island-dark/70">
                  Aún no hay trabajadores. Mientras no registres ninguno, la MOD usa los campos manuales de Parámetros MOD/GIF.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs font-body text-island-dark/60">
        Los cambios aquí no modifican los costos de las recetas por sí solos: se aplican cuando guardas en Parámetros MOD/GIF con "Guardar y recalcular".
      </p>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar trabajador' : 'Nuevo trabajador'}>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className={label}>Nombre</label>
            <input autoFocus className="input-base" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className={label}>Cargo (opcional)</label>
            <input className="input-base" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Barista, cocina, caja…" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={label}>Tarifa/hora (COP)</label>
              <input type="number" min="0" className="input-base" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} />
            </div>
            <div>
              <label className={label}>Horas/día</label>
              <input type="number" min="0.1" max="24" step="any" className="input-base" value={form.hoursPerDay} onChange={(e) => setForm({ ...form, hoursPerDay: e.target.value })} />
            </div>
            <div>
              <label className={label}>Días/mes</label>
              <input type="number" min="0.1" max="31" step="any" className="input-base" value={form.daysPerMonth} onChange={(e) => setForm({ ...form, daysPerMonth: e.target.value })} />
            </div>
          </div>
          <p className="text-xs text-island-dark/60 font-body">
            Costo mensual: {formatCOP((Number(form.hourlyRate) || 0) * (Number(form.hoursPerDay) || 0) * (Number(form.daysPerMonth) || 0))} ({DAYS_PER_MONTH} días = todos los días del mes).
          </p>
          {error && <p role="alert" className="text-sm text-error-ink bg-error-tint rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear trabajador'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
