import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, History, Lock } from 'lucide-react';
import { cashShiftsApi, ShiftSummary } from '../../../api/cashShifts';
import { useShiftStore } from '../../../store/shiftStore';
import { useAuthStore } from '../../../store/authStore';
import { useToast } from '../../../hooks/useToast';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { PageLoader } from '../../../components/ui/Spinner';
import { DenominationCounter } from '../../../components/caja/DenominationCounter';
import { emptyDenominationCounts } from '../../../config/denominations';
import { formatCOP } from '../../../utils/formatCurrency';
import type { CashMovementType, DenominationInput } from '../../../types';

type CloseResult = {
  expectedCash: number;
  difference: number;
  closingTotal: number;
  fiscalWarning?: string;
};

export function ShiftDashboardPage() {
  const { openShift, loading, refresh } = useShiftStore();
  const { user } = useAuthStore();
  const toast = useToast();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [openModalVisible, setOpenModalVisible] = useState(false);
  const [openDenominations, setOpenDenominations] = useState<DenominationInput[]>(emptyDenominationCounts());
  const [openNotes, setOpenNotes] = useState('');
  const [openSubmitting, setOpenSubmitting] = useState(false);

  const [movementModalVisible, setMovementModalVisible] = useState(false);
  const [movementType, setMovementType] = useState<CashMovementType>('WITHDRAWAL');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [movementSubmitting, setMovementSubmitting] = useState(false);

  const [closeModalVisible, setCloseModalVisible] = useState(false);
  const [closeDenominations, setCloseDenominations] = useState<DenominationInput[]>(emptyDenominationCounts());
  const [closeNotes, setCloseNotes] = useState('');
  const [closeSubmitting, setCloseSubmitting] = useState(false);
  const [closeResult, setCloseResult] = useState<CloseResult | null>(null);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!openShift) { setSummary(null); return; }
    cashShiftsApi.getSummary(openShift._id).then((r) => setSummary(r.data)).catch(() => {});
  }, [openShift?._id]);

  const userId = user?._id ?? user?.id;
  const isOwnShift = !!openShift && (typeof openShift.openedBy === 'string'
    ? openShift.openedBy === userId
    : openShift.openedBy._id === userId);
  const canOperate = isOwnShift || !!user?.role && ['admin', 'superadmin'].includes(user.role);

  const handleOpenShift = async () => {
    setOpenSubmitting(true);
    try {
      await cashShiftsApi.open({ denominations: openDenominations, notes: openNotes });
      toast.success('Turno abierto');
      setOpenModalVisible(false);
      setOpenDenominations(emptyDenominationCounts());
      setOpenNotes('');
      await refresh();
    } catch (error) {
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al abrir el turno';
      toast.error(message);
    } finally {
      setOpenSubmitting(false);
    }
  };

  const handleAddMovement = async () => {
    if (!openShift) return;
    setMovementSubmitting(true);
    try {
      await cashShiftsApi.addMovement(openShift._id, {
        type: movementType,
        amount: Number(movementAmount),
        reason: movementReason,
      });
      toast.success(movementType === 'WITHDRAWAL' ? 'Sangría registrada' : 'Ingreso registrado');
      setMovementModalVisible(false);
      setMovementAmount('');
      setMovementReason('');
      await refresh();
    } catch (error) {
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al registrar el movimiento';
      toast.error(message);
    } finally {
      setMovementSubmitting(false);
    }
  };

  const handleCloseShift = async () => {
    if (!openShift) return;
    setCloseSubmitting(true);
    try {
      const res = await cashShiftsApi.close(openShift._id, { denominations: closeDenominations, notes: closeNotes });
      const closingTotal = closeDenominations.reduce((sum, d) => sum + d.value * d.quantity, 0);
      setCloseResult({
        expectedCash: res.data.expectedCash ?? 0,
        difference: res.data.difference ?? 0,
        closingTotal,
        fiscalWarning: res.data.fiscalWarning,
      });
    } catch (error) {
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al cerrar el turno';
      toast.error(message);
    } finally {
      setCloseSubmitting(false);
    }
  };

  const finishClosing = async () => {
    setCloseModalVisible(false);
    setCloseResult(null);
    setCloseDenominations(emptyDenominationCounts());
    setCloseNotes('');
    await refresh();
  };

  if (loading && !openShift) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-island-dark">Caja / Turno</h1>
          <p className="text-island-dark/70 font-body text-sm">Arqueo por turno — base, ventas, gastos y cierre.</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => navigate('/admin/caja/historial')}>
          <History size={16} /> Historial de turnos
        </Button>
      </div>

      {!openShift ? (
        <div className="card flex flex-col items-center gap-4 py-12 text-center">
          <Lock size={32} className="text-island-dark/40" />
          <div>
            <p className="font-body font-semibold text-island-dark">No hay un turno abierto</p>
            <p className="text-sm text-island-dark/70 font-body">Abre un turno contando la base inicial por denominaciones.</p>
          </div>
          <Button onClick={() => setOpenModalVisible(true)}>Abrir turno</Button>
        </div>
      ) : (
        <>
          <div className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-body uppercase tracking-wide text-island-dark/70">Turno abierto</p>
              <p className="font-body font-semibold text-island-dark">
                {typeof openShift.openedBy === 'object' ? openShift.openedBy.name : 'Responsable'} · base {formatCOP(openShift.openingFloat.total)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setMovementType('WITHDRAWAL'); setMovementModalVisible(true); }}>
                <ArrowUpFromLine size={14} /> Sangría
              </Button>
              <Button variant="secondary" size="sm" onClick={() => { setMovementType('CASH_IN'); setMovementModalVisible(true); }}>
                <ArrowDownToLine size={14} /> Ingreso
              </Button>
              <Button size="sm" onClick={() => setCloseModalVisible(true)} disabled={!canOperate}>
                Cerrar turno
              </Button>
            </div>
          </div>

          {summary && (
            <div className="grid sm:grid-cols-4 gap-3 text-sm font-body">
              <div className="rounded-lg bg-gray-100 p-4">
                <p className="text-island-dark/70 text-xs">Ventas efectivo</p>
                <p className="font-bold text-island-dark">{formatCOP(summary.salesSnapshot.cashSales)}</p>
              </div>
              <div className="rounded-lg bg-gray-100 p-4">
                <p className="text-island-dark/70 text-xs">Tarjeta / Nequi / Transf.</p>
                <p className="font-bold text-island-dark">
                  {formatCOP(summary.salesSnapshot.cardSales + summary.salesSnapshot.nequiSales + summary.salesSnapshot.transferSales)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-100 p-4">
                <p className="text-island-dark/70 text-xs">Gastos del turno</p>
                <p className="font-bold text-island-dark">{formatCOP(summary.totalExpenses)}</p>
              </div>
              <div className="rounded-lg border border-island-blue/20 bg-white p-4">
                <p className="text-island-dark/70 text-xs">Pedidos facturados</p>
                <p className="font-bold text-island-dark">{summary.salesSnapshot.totalOrders}</p>
              </div>
            </div>
          )}

          {summary && summary.salesSnapshot.unassignedOrdersCount > 0 && (
            <div className="rounded-lg border border-warning bg-warning-tint p-4 font-body flex items-start gap-3">
              <AlertTriangle size={20} className="text-warning-ink shrink-0 mt-0.5" />
              <p className="text-sm text-warning-ink">
                {summary.salesSnapshot.unassignedOrdersCount} pedido(s) facturado(s) sin turno asignado durante esta ventana.
              </p>
            </div>
          )}
        </>
      )}

      <Modal isOpen={openModalVisible} onClose={() => setOpenModalVisible(false)} title="Abrir turno" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-island-dark/70 font-body">Cuenta la base inicial por denominaciones.</p>
          <DenominationCounter denominations={openDenominations} onChange={setOpenDenominations} />
          <div>
            <label className="text-sm font-medium text-island-dark font-body block mb-1">Notas</label>
            <textarea className="input-base h-16 resize-none" value={openNotes} onChange={(e) => setOpenNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setOpenModalVisible(false)}>Cancelar</Button>
            <Button onClick={handleOpenShift} loading={openSubmitting}>Abrir turno</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={movementModalVisible} onClose={() => setMovementModalVisible(false)} title="Movimiento de caja">
        <div className="space-y-4">
          <Select
            label="Tipo"
            options={[
              { value: 'WITHDRAWAL', label: 'Sangría (retiro)' },
              { value: 'CASH_IN', label: 'Ingreso de efectivo' },
            ]}
            value={movementType}
            onChange={(e) => setMovementType(e.target.value as CashMovementType)}
          />
          <Input label="Monto (COP)" type="number" min={0} value={movementAmount} onChange={(e) => setMovementAmount(e.target.value)} />
          <Input label="Motivo" value={movementReason} onChange={(e) => setMovementReason(e.target.value)} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setMovementModalVisible(false)}>Cancelar</Button>
            <Button onClick={handleAddMovement} loading={movementSubmitting}>Registrar</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={closeModalVisible} onClose={() => setCloseModalVisible(false)} title="Cerrar turno — arqueo" size="lg">
        {!closeResult ? (
          <div className="space-y-4">
            <p className="text-sm text-island-dark/70 font-body">
              Cuenta el efectivo final por denominaciones. El resultado y la diferencia se muestran solo después de enviar el conteo.
            </p>
            <DenominationCounter denominations={closeDenominations} onChange={setCloseDenominations} showTotal={false} />
            <div>
              <label className="text-sm font-medium text-island-dark font-body block mb-1">Notas</label>
              <textarea className="input-base h-16 resize-none" value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setCloseModalVisible(false)}>Cancelar</Button>
              <Button onClick={handleCloseShift} loading={closeSubmitting}>Enviar conteo</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-lg p-4 space-y-2 text-sm font-body">
              <div className="flex justify-between"><span className="text-island-dark/70">Efectivo contado</span><span className="font-medium">{formatCOP(closeResult.closingTotal)}</span></div>
              <div className="flex justify-between"><span className="text-island-dark/70">Efectivo esperado</span><span className="font-medium">{formatCOP(closeResult.expectedCash)}</span></div>
              <div className={`flex justify-between font-bold border-t border-island-blue/20 pt-2 ${closeResult.difference < 0 ? 'text-error-ink' : closeResult.difference > 0 ? 'text-success-ink' : 'text-island-dark'}`}>
                <span>Diferencia</span><span>{formatCOP(closeResult.difference)}</span>
              </div>
            </div>
            {closeResult.fiscalWarning && (
              <div className="rounded-lg border border-warning bg-warning-tint p-3 text-sm text-warning-ink font-body">
                {closeResult.fiscalWarning}
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={finishClosing}>Listo</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
