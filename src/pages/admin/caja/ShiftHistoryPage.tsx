import { useEffect, useState } from 'react';
import { Pencil, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cashShiftsApi } from '../../../api/cashShifts';
import { useAuthStore } from '../../../store/authStore';
import { useToast } from '../../../hooks/useToast';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Drawer } from '../../../components/ui/Drawer';
import { Modal } from '../../../components/ui/Modal';
import { PageLoader } from '../../../components/ui/Spinner';
import { formatCOP } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import type { CashShift } from '../../../types';

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'OPEN', label: 'Abierto' },
  { value: 'CLOSED', label: 'Cerrado (pendiente)' },
  { value: 'REVIEWED', label: 'Aprobado' },
];

export function ShiftHistoryPage() {
  const { isAdmin } = useAuthStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [shifts, setShifts] = useState<CashShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [detail, setDetail] = useState<CashShift | null>(null);
  const [approving, setApproving] = useState(false);

  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [adjustExpectedCash, setAdjustExpectedCash] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await cashShiftsApi.list({
        status: status || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setShifts(res.data);
    } catch {
      toast.error('Error al cargar el historial de turnos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShifts(); }, [status, dateFrom, dateTo]);

  const handleApprove = async () => {
    if (!detail) return;
    setApproving(true);
    try {
      const res = await cashShiftsApi.approve(detail._id);
      toast.success('Turno aprobado');
      setDetail(res.data);
      await fetchShifts();
    } catch {
      toast.error('Error al aprobar el turno');
    } finally {
      setApproving(false);
    }
  };

  const openAdjustModal = () => {
    if (!detail) return;
    setAdjustExpectedCash(String(detail.expectedCash ?? 0));
    setAdjustReason('');
    setAdjustModalVisible(true);
  };

  const closingTotal = detail?.closingCount?.total ?? 0;
  const parsedExpectedCash = Number(adjustExpectedCash) || 0;
  const previewDifference = closingTotal - parsedExpectedCash;

  const handleAdjust = async () => {
    if (!detail) return;
    if (!adjustReason.trim()) {
      toast.error('El motivo del ajuste es requerido');
      return;
    }
    setAdjustSubmitting(true);
    try {
      const res = await cashShiftsApi.adjust(detail._id, adjustReason.trim(), {
        expectedCash: parsedExpectedCash,
        difference: previewDifference,
      });
      toast.success('Turno ajustado');
      setDetail(res.data);
      setAdjustModalVisible(false);
      await fetchShifts();
    } catch (error) {
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al ajustar el turno';
      toast.error(message);
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const responsibleName = (shift: CashShift) =>
    typeof shift.openedBy === 'object' ? shift.openedBy.name : shift.openedBy;

  if (loading && shifts.length === 0) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-body text-2xl font-bold text-island-dark">Historial de turnos</h1>
        <p className="text-island-dark/70 font-body text-sm">
          {isAdmin ? 'Todos los turnos del negocio.' : 'Tus turnos de caja.'}
        </p>
      </div>

      <div className="card grid gap-3 md:grid-cols-3">
        <Select label="Estado" options={statusOptions} value={status} onChange={(e) => setStatus(e.target.value)} />
        <Input label="Desde" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <Input label="Hasta" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      <div className="space-y-3">
        {shifts.map((shift) => (
          <button
            key={shift._id}
            type="button"
            onClick={() => setDetail(shift)}
            className="card w-full text-left hover:border-island-blue/40 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-island-dark font-body text-sm">
                {formatDate(shift.openedAt)} · {responsibleName(shift)}
              </span>
              <span className="text-xs font-body font-semibold uppercase text-island-dark/70">{shift.status}</span>
            </div>
            {shift.difference !== undefined && (
              <span className={`text-sm font-bold font-body ${shift.difference < 0 ? 'text-error-ink' : shift.difference > 0 ? 'text-success-ink' : 'text-island-dark/70'}`}>
                Diferencia: {formatCOP(shift.difference)}
              </span>
            )}
          </button>
        ))}
        {shifts.length === 0 && <p className="text-center text-island-dark/70 font-body text-sm py-8">Sin turnos en el historial.</p>}
      </div>

      <Drawer
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        eyebrow="Turno"
        title={detail ? `${formatDate(detail.openedAt)} — ${responsibleName(detail)}` : ''}
      >
        {detail && (
          <div className="space-y-4 font-body text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-100 p-3">
                <p className="text-xs text-island-dark/70">Base inicial</p>
                <p className="font-semibold">{formatCOP(detail.openingFloat.total)}</p>
              </div>
              <div className="rounded-lg bg-gray-100 p-3">
                <p className="text-xs text-island-dark/70">Efectivo contado</p>
                <p className="font-semibold">{formatCOP(detail.closingCount?.total ?? 0)}</p>
              </div>
              <div className="rounded-lg bg-gray-100 p-3">
                <p className="text-xs text-island-dark/70">Efectivo esperado</p>
                <p className="font-semibold">{formatCOP(detail.expectedCash ?? 0)}</p>
              </div>
              <div className="rounded-lg bg-gray-100 p-3">
                <p className="text-xs text-island-dark/70">Diferencia</p>
                <p className={`font-semibold ${(detail.difference ?? 0) < 0 ? 'text-error-ink' : (detail.difference ?? 0) > 0 ? 'text-success-ink' : ''}`}>
                  {formatCOP(detail.difference ?? 0)}
                </p>
              </div>
            </div>

            {detail.salesSnapshot && (
              <div className="rounded-lg border border-island-blue/20 p-3 grid grid-cols-2 gap-2 text-xs text-island-dark/70">
                <span>Efectivo: {formatCOP(detail.salesSnapshot.cashSales)}</span>
                <span>Tarjeta: {formatCOP(detail.salesSnapshot.cardSales)}</span>
                <span>Nequi/Daviplata: {formatCOP(detail.salesSnapshot.nequiSales)}</span>
                <span>Transferencia: {formatCOP(detail.salesSnapshot.transferSales)}</span>
              </div>
            )}

            {detail.fiscalWarning && (
              <div className="rounded-lg border border-warning bg-warning-tint p-3 text-warning-ink">{detail.fiscalWarning}</div>
            )}

            {detail.notes && <p className="italic text-island-dark/70">"{detail.notes}"</p>}

            <div>
              <p className="font-medium text-island-dark mb-2">Bitácora</p>
              <div className="space-y-1 text-xs text-island-dark/70">
                {detail.auditLog.map((entry, i) => (
                  <div key={i} className="flex justify-between gap-3">
                    <span>
                      {entry.action}
                      {entry.action === 'ADJUSTMENT' && entry.detail?.reason ? ` — ${entry.detail.reason}` : ''}
                    </span>
                    <span className="shrink-0">{formatDate(entry.at)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => navigate(`/admin/caja/shifts/${detail._id}/print`)}>
                <Printer size={14} /> Ver / imprimir reporte
              </Button>
              {isAdmin && detail.status === 'CLOSED' && (
                <Button size="sm" onClick={handleApprove} loading={approving}>Aprobar turno</Button>
              )}
              {isAdmin && (detail.status === 'CLOSED' || detail.status === 'REVIEWED') && (
                <Button variant="secondary" size="sm" onClick={openAdjustModal}>
                  <Pencil size={14} /> Ajustar turno
                </Button>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <Modal isOpen={adjustModalVisible} onClose={() => setAdjustModalVisible(false)} title="Ajustar turno">
        {detail && (
          <div className="space-y-4 font-body">
            <p className="text-sm text-island-dark/70">
              El conteo contado ({formatCOP(closingTotal)}) no cambia — solo corriges el efectivo esperado y la
              diferencia se recalcula. Queda registrado quién hizo el ajuste, cuándo y por qué, junto al valor anterior.
            </p>
            <div className="rounded-lg bg-gray-100 p-3 text-sm flex justify-between">
              <span className="text-island-dark/70">Efectivo esperado actual</span>
              <span className="font-medium">{formatCOP(detail.expectedCash ?? 0)}</span>
            </div>
            <Input
              label="Nuevo efectivo esperado (COP)"
              type="number"
              value={adjustExpectedCash}
              onChange={(e) => setAdjustExpectedCash(e.target.value)}
            />
            <div className={`flex justify-between text-sm font-semibold ${previewDifference < 0 ? 'text-error-ink' : previewDifference > 0 ? 'text-success-ink' : 'text-island-dark'}`}>
              <span>Nueva diferencia</span>
              <span>{formatCOP(previewDifference)}</span>
            </div>
            <div>
              <label className="text-sm font-medium text-island-dark block mb-1">Motivo del ajuste (requerido)</label>
              <textarea
                className="input-base h-20 resize-none"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Ej: se olvidó registrar un gasto de $8.000 antes de cerrar el turno"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setAdjustModalVisible(false)}>Cancelar</Button>
              <Button onClick={handleAdjust} loading={adjustSubmitting}>Guardar ajuste</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
