import { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { printAgentsApi, printConfigApi, printersApi, printJobsApi } from '../../../api/printing';
import { PrintAgent, PrintAgentWithToken, PrintConfig, PrintJob, Printer } from '../../../types';
import { useToast } from '../../../hooks/useToast';
import { useConfirm } from '../../../hooks/useConfirm';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Select } from '../../../components/ui/Select';
import { Switch } from '../../../components/ui/Switch';
import { Pagination } from '../../../components/ui/Pagination';
import { PageLoader } from '../../../components/ui/Spinner';
import { Badge, PrintJobStatusBadge } from '../../../components/ui/Badge';

type Tab = 'printers' | 'agents' | 'config' | 'jobs';

const TABS: { id: Tab; label: string }[] = [
  { id: 'printers', label: 'Impresoras' },
  { id: 'agents', label: 'Agentes' },
  { id: 'config', label: 'Configuración' },
  { id: 'jobs', label: 'Historial' },
];

export function PrintingPage() {
  const [tab, setTab] = useState<Tab>('printers');
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [agents, setAgents] = useState<PrintAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [printersRes, agentsRes] = await Promise.all([printersApi.getAll(), printAgentsApi.getAll()]);
      setPrinters(printersRes.data);
      setAgents(agentsRes.data);
    } catch {
      toast.error('Error al cargar el módulo de impresión');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const hasActiveBarraPrinter = useMemo(
    () => printers.some((p) => p.role === 'BARRA' && p.isActive),
    [printers]
  );

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-body text-2xl font-bold text-island-dark">Impresoras</h1>
        <p className="text-island-dark/70 font-body text-sm">Ticket de caja y comandas de barra por impresión térmica.</p>
      </div>

      <div className="flex gap-1 border-b border-island-blue/20">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 font-body text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-island-blue text-island-blue'
                : 'border-transparent text-island-dark/70 hover:text-island-dark'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'printers' && <PrintersTab printers={printers} agents={agents} onChange={fetchAll} />}
      {tab === 'agents' && <AgentsTab agents={agents} onChange={fetchAll} />}
      {tab === 'config' && <ConfigTab hasActiveBarraPrinter={hasActiveBarraPrinter} />}
      {tab === 'jobs' && <JobsTab />}
    </div>
  );
}

// ─── Impresoras ──────────────────────────────────────────────────────────

const printerSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  role: z.enum(['CAJA', 'BARRA']),
  ip: z.string().min(1, 'IP requerida'),
  port: z.coerce.number().int().min(1),
  paperWidthMm: z.coerce.number().int().min(1),
  columns: z.coerce.number().int().min(1),
  hasCashDrawer: z.boolean(),
  isActive: z.boolean(),
  agentId: z.string(),
});
type PrinterFormData = z.infer<typeof printerSchema>;

const emptyPrinterForm: PrinterFormData = {
  name: '',
  role: 'CAJA',
  ip: '',
  port: 9100,
  paperWidthMm: 80,
  columns: 48,
  hasCashDrawer: false,
  isActive: true,
  agentId: '',
};

function roleLabel(role: string) {
  return role === 'CAJA' ? 'Caja' : 'Barra';
}

function PrintersTab({
  printers,
  agents,
  onChange,
}: {
  printers: Printer[];
  agents: PrintAgent[];
  onChange: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Printer | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PrinterFormData>({ resolver: zodResolver(printerSchema), defaultValues: emptyPrinterForm });

  const openCreate = () => {
    setEditing(null);
    reset(emptyPrinterForm);
    setModalOpen(true);
  };

  const openEdit = (printer: Printer) => {
    setEditing(printer);
    reset({
      name: printer.name,
      role: printer.role,
      ip: printer.ip,
      port: printer.port,
      paperWidthMm: printer.paperWidthMm,
      columns: printer.columns,
      hasCashDrawer: printer.hasCashDrawer,
      isActive: printer.isActive,
      agentId: printer.agentId || '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: PrinterFormData) => {
    try {
      const payload = { ...data, agentId: data.agentId || null };
      if (editing) {
        await printersApi.update(editing._id, payload);
        toast.success('Impresora actualizada');
      } else {
        await printersApi.create(payload);
        toast.success('Impresora creada');
      }
      setModalOpen(false);
      onChange();
    } catch {
      toast.error('Error al guardar la impresora');
    }
  };

  const handleDelete = async (printer: Printer) => {
    if (!(await confirm(`¿Eliminar la impresora "${printer.name}"?`))) return;
    try {
      await printersApi.delete(printer._id);
      toast.success('Impresora eliminada');
      onChange();
    } catch {
      toast.error('Error al eliminar la impresora');
    }
  };

  const handleTest = async (printer: Printer) => {
    try {
      await printersApi.test(printer._id);
      toast.success('Trabajo de impresión de prueba enviado');
    } catch {
      toast.error('Error al enviar la impresión de prueba');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} icon={<Plus size={15} />}>Nueva impresora</Button>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm font-body">
          <thead className="bg-gray-100 border-b border-island-blue/20">
            <tr>
              <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Nombre</th>
              <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Rol</th>
              <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Conexión</th>
              <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Agente</th>
              <th className="text-center px-4 py-3 text-island-dark/70 font-medium">Cajón</th>
              <th className="text-center px-4 py-3 text-island-dark/70 font-medium">Activa</th>
              <th className="text-right px-4 py-3 text-island-dark/70 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-island-blue/20">
            {printers.map((printer) => (
              <tr key={printer._id} className="hover:bg-gray-100 transition-colors">
                <td className="px-4 py-3 font-medium text-island-dark">{printer.name}</td>
                <td className="px-4 py-3 text-island-dark/70">{roleLabel(printer.role)}</td>
                <td className="px-4 py-3 text-island-dark/70">{printer.ip}:{printer.port}</td>
                <td className="px-4 py-3 text-island-dark/70">
                  {agents.find((a) => a._id === printer.agentId)?.name || '—'}
                </td>
                <td className="px-4 py-3 text-center">{printer.hasCashDrawer ? 'Sí' : 'No'}</td>
                <td className="px-4 py-3 text-center">{printer.isActive ? 'Sí' : 'No'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleTest(printer)}>Prueba</Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(printer)}>Editar</Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(printer)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {printers.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-island-dark/70">No hay impresoras registradas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar impresora' : 'Nueva impresora'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nombre" error={errors.name?.message} {...register('name')} />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Rol"
              options={[{ value: 'CAJA', label: 'Caja' }, { value: 'BARRA', label: 'Barra' }]}
              {...register('role')}
            />
            <Select
              label="Agente asignado"
              placeholder="Sin asignar"
              options={agents.map((a) => ({ value: a._id, label: a.name }))}
              {...register('agentId')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="IP" error={errors.ip?.message} {...register('ip')} />
            <Input label="Puerto" type="number" {...register('port')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Ancho de papel (mm)" type="number" {...register('paperWidthMm')} />
            <Input label="Columnas" type="number" {...register('columns')} />
          </div>
          <div className="flex flex-wrap gap-6 pt-1">
            <Controller
              name="hasCashDrawer"
              control={control}
              render={({ field }) => <Switch checked={field.value} onChange={field.onChange} label="Tiene cajón de dinero" />}
            />
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => <Switch checked={field.value} onChange={field.onChange} label="Activa" />}
            />
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

// ─── Agentes ─────────────────────────────────────────────────────────────

const AGENT_OFFLINE_MS = 2 * 60 * 1000;

function agentStatus(agent: PrintAgent): { label: string; variant: 'green' | 'yellow' | 'red' } {
  if (!agent.isActive) return { label: 'Revocado', variant: 'red' };
  if (!agent.lastSeenAt) return { label: 'Nunca conectado', variant: 'yellow' };
  const online = Date.now() - new Date(agent.lastSeenAt).getTime() <= AGENT_OFFLINE_MS;
  return online ? { label: 'En línea', variant: 'green' } : { label: 'Sin conexión', variant: 'yellow' };
}

function AgentsTab({ agents, onChange }: { agents: PrintAgent[]; onChange: () => void }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [tokenModal, setTokenModal] = useState<PrintAgentWithToken | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const res = await printAgentsApi.create(name.trim());
      setTokenModal(res.data);
      setCreateOpen(false);
      setName('');
      onChange();
    } catch {
      toast.error('Error al crear el agente');
    }
  };

  const handleRevoke = async (agent: PrintAgent) => {
    if (!(await confirm(`¿Revocar el agente "${agent.name}"? Dejará de poder reclamar trabajos hasta que se regenere su token.`))) return;
    try {
      await printAgentsApi.revoke(agent._id);
      toast.success('Agente revocado');
      onChange();
    } catch {
      toast.error('Error al revocar el agente');
    }
  };

  const handleRegenerate = async (agent: PrintAgent) => {
    if (!(await confirm(`¿Regenerar el token de "${agent.name}"? El token anterior dejará de funcionar de inmediato.`))) return;
    try {
      const res = await printAgentsApi.regenerateToken(agent._id);
      setTokenModal(res.data);
      onChange();
    } catch {
      toast.error('Error al regenerar el token');
    }
  };

  const copyToken = async () => {
    if (!tokenModal) return;
    try {
      await navigator.clipboard.writeText(tokenModal.token);
      toast.success('Token copiado');
    } catch {
      toast.error('No se pudo copiar el token');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)} icon={<Plus size={15} />}>Nuevo agente</Button>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm font-body">
          <thead className="bg-gray-100 border-b border-island-blue/20">
            <tr>
              <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Nombre</th>
              <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Estado</th>
              <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Última conexión</th>
              <th className="text-right px-4 py-3 text-island-dark/70 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-island-blue/20">
            {agents.map((agent) => {
              const status = agentStatus(agent);
              return (
                <tr key={agent._id} className="hover:bg-gray-100 transition-colors">
                  <td className="px-4 py-3 font-medium text-island-dark">{agent.name}</td>
                  <td className="px-4 py-3"><Badge label={status.label} variant={status.variant} /></td>
                  <td className="px-4 py-3 text-island-dark/70">
                    {agent.lastSeenAt ? new Date(agent.lastSeenAt).toLocaleString('es-CO') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleRegenerate(agent)}>
                        <RotateCcw size={14} /> Regenerar token
                      </Button>
                      {agent.isActive && (
                        <Button variant="danger" size="sm" onClick={() => handleRevoke(agent)}>Revocar</Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {agents.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-10 text-island-dark/70">No hay agentes registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo agente">
        <div className="space-y-4">
          <Input label="Nombre" placeholder="Ej: PC de caja" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!name.trim()}>Crear</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!tokenModal} onClose={() => setTokenModal(null)} title="Token del agente">
        <div className="space-y-4">
          <p className="text-sm text-island-dark/70 font-body">
            Copia este token ahora — no se volverá a mostrar. Pégalo en el archivo <code>.env</code> del agente
            como <code>PRINT_AGENT_DEVICE_TOKEN</code>.
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-island-blue/20 bg-gray-100 px-3 py-2">
            <code className="flex-1 text-xs break-all font-mono text-island-dark">{tokenModal?.token}</code>
            <Button type="button" variant="ghost" size="sm" onClick={copyToken}><Copy size={14} /></Button>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setTokenModal(null)}>Listo</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Configuración ───────────────────────────────────────────────────────

function ConfigTab({ hasActiveBarraPrinter }: { hasActiveBarraPrinter: boolean }) {
  const [config, setConfig] = useState<PrintConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    printConfigApi
      .get()
      .then((res) => setConfig(res.data))
      .catch(() => toast.error('Error al cargar la configuración de impresión'))
      .finally(() => setLoading(false));
  }, []);

  const update = (patch: Partial<PrintConfig>) => setConfig((prev) => (prev ? { ...prev, ...patch } : prev));

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await printConfigApi.update({
        receiptAutoPrint: config.receiptAutoPrint,
        kitchenPrintingEnabled: config.kitchenPrintingEnabled,
        openDrawerOnCash: config.openDrawerOnCash,
        headerText: config.headerText,
        footerText: config.footerText,
        businessNit: config.businessNit,
        businessPhone: config.businessPhone,
        businessSocial: config.businessSocial,
      });
      setConfig(res.data);
      toast.success('Configuración de impresión actualizada');
    } catch {
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) return <PageLoader />;

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body font-semibold text-island-dark">Impresión automática del ticket</p>
            <p className="text-xs text-island-dark/70 font-body">Imprime el ticket de caja apenas se factura el pedido.</p>
          </div>
          <Switch checked={config.receiptAutoPrint} onChange={(v) => update({ receiptAutoPrint: v })} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-body font-semibold text-island-dark">Apertura del cajón en efectivo</p>
            <p className="text-xs text-island-dark/70 font-body">
              Abre el cajón al imprimir un ticket pagado en efectivo, si la impresora tiene cajón.
            </p>
          </div>
          <Switch checked={config.openDrawerOnCash} onChange={(v) => update({ openDrawerOnCash: v })} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-body font-semibold text-island-dark">Imprimir comandas en barra</p>
            <p className="text-xs text-island-dark/70 font-body">
              {hasActiveBarraPrinter
                ? 'Imprime una comanda cada vez que un pedido pasa a "en proceso".'
                : 'Registra y activa una impresora con rol "Barra" en la pestaña Impresoras para poder activar esto.'}
            </p>
          </div>
          <Switch
            checked={config.kitchenPrintingEnabled}
            onChange={(v) => update({ kitchenPrintingEnabled: v })}
            disabled={!hasActiveBarraPrinter}
          />
        </div>
      </div>

      <div className="card space-y-4">
        <Input label="Encabezado del ticket" value={config.headerText} onChange={(e) => update({ headerText: e.target.value })} />
        <div className="grid sm:grid-cols-3 gap-3">
          <Input label="NIT" value={config.businessNit ?? ''} onChange={(e) => update({ businessNit: e.target.value })} />
          <Input label="Teléfono" value={config.businessPhone ?? ''} onChange={(e) => update({ businessPhone: e.target.value })} />
          <Input
            label="Redes sociales"
            value={config.businessSocial ?? ''}
            onChange={(e) => update({ businessSocial: e.target.value })}
            placeholder="@laislacafepicnic"
          />
        </div>
        <p className="text-xs text-island-dark/70 font-body -mt-2">
          Se imprimen en el encabezado de cada ticket, aunque la facturación electrónica (DIAN) esté desactivada.
        </p>
        <div>
          <label className="text-sm font-medium text-island-dark font-body block mb-1">Pie del ticket</label>
          <textarea
            className="input-base h-20 resize-none"
            value={config.footerText}
            onChange={(e) => update({ footerText: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving}>Guardar</Button>
      </div>
    </div>
  );
}

// ─── Historial ───────────────────────────────────────────────────────────

const JOB_TYPE_LABELS: Record<string, string> = {
  RECEIPT: 'Ticket',
  KITCHEN_ORDER: 'Comanda',
  REPRINT: 'Reimpresión',
  TEST: 'Prueba',
};

const JOB_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'CLAIMED', label: 'Imprimiendo' },
  { value: 'DONE', label: 'Impreso' },
  { value: 'FAILED', label: 'Falló' },
];

function JobsTab() {
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (status) params.status = status;
      const res = await printJobsApi.getAll(params);
      setJobs(res.data.jobs);
      setTotal(res.data.total);
    } catch {
      toast.error('Error al cargar el historial de trabajos');
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleRetry = async (job: PrintJob) => {
    try {
      await printJobsApi.retry(job._id);
      toast.success('Trabajo reencolado');
      fetchJobs();
    } catch {
      toast.error('Error al reintentar el trabajo');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="space-y-4">
      <div className="card grid gap-3 sm:grid-cols-[16rem_auto]">
        <Select
          label="Estado"
          placeholder="Todos"
          options={JOB_STATUS_OPTIONS}
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        />
      </div>

      {loading ? <PageLoader /> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm font-body">
            <thead className="bg-gray-100 border-b border-island-blue/20">
              <tr>
                <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Impresora</th>
                <th className="text-center px-4 py-3 text-island-dark/70 font-medium">Estado</th>
                <th className="text-center px-4 py-3 text-island-dark/70 font-medium">Intentos</th>
                <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Fecha</th>
                <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Error</th>
                <th className="text-right px-4 py-3 text-island-dark/70 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-island-blue/20">
              {jobs.map((job) => (
                <tr key={job._id} className="hover:bg-gray-100 transition-colors">
                  <td className="px-4 py-3 text-island-dark">{JOB_TYPE_LABELS[job.type] ?? job.type}</td>
                  <td className="px-4 py-3 text-island-dark/70">
                    {typeof job.printerId === 'object' && job.printerId ? job.printerId.name : '—'}
                  </td>
                  <td className="px-4 py-3 text-center"><PrintJobStatusBadge status={job.status} /></td>
                  <td className="px-4 py-3 text-center text-island-dark/70">{job.attempts}</td>
                  <td className="px-4 py-3 text-island-dark/70">{new Date(job.createdAt).toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3 text-island-dark/70 max-w-xs truncate">{job.error || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {job.status === 'FAILED' && (
                      <Button variant="ghost" size="sm" onClick={() => handleRetry(job)}>Reintentar</Button>
                    )}
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-island-dark/70">No hay trabajos de impresión.</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="p-4">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
