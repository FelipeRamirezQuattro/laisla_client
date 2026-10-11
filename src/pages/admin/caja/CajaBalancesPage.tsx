import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, ReceiptText } from 'lucide-react';
import { cashShiftsApi } from '../../../api/cashShifts';
import { useToast } from '../../../hooks/useToast';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { PageLoader } from '../../../components/ui/Spinner';
import type { CashBalances, CashMovementType } from '../../../types';
import { formatCOP } from '../../../utils/formatCurrency';
import { formatDateTime } from '../../../utils/formatDate';

const accountCards = (balances: CashBalances) => [
  { label: 'Caja menor (registradora)', value: balances.cash.menor, hint: 'Efectivo que debe haber en el cajón' },
  { label: 'Caja general', value: balances.cash.general, hint: 'Efectivo guardado fuera de la registradora' },
  { label: 'Transferencia', value: balances.transfer },
  { label: 'Nequi / Daviplata', value: balances.nequi },
  { label: 'Tarjeta', value: balances.card },
];

export function CajaBalancesPage() {
  const toast = useToast();
  const [balances, setBalances] = useState<CashBalances | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<CashMovementType | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await cashShiftsApi.getBalances();
      setBalances(res.data);
    } catch {
      toast.error('Error al cargar los saldos de caja');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!modalType) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || !reason.trim()) {
      toast.error('Ingresa un monto y un motivo');
      return;
    }
    setSaving(true);
    try {
      await cashShiftsApi.transfer({ type: modalType, amount: value, reason: reason.trim() });
      toast.success('Traslado registrado');
      setModalType(null);
      setAmount('');
      setReason('');
      await load();
    } catch (error) {
      toast.error((error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al registrar el traslado');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !balances) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-island-dark">Saldos de caja</h1>
          <p className="text-island-dark/70 font-body text-sm">
            Lo que deberías tener ahora en cada cuenta: ventas facturadas menos gastos, calculado desde el historial.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setModalType('WITHDRAWAL')}>
            <ArrowUpFromLine size={16} /> Caja menor → general
          </Button>
          <Button type="button" variant="secondary" onClick={() => setModalType('CASH_IN')}>
            <ArrowDownToLine size={16} /> General → caja menor
          </Button>
          <Link to="/admin/expenses">
            <Button type="button"><ReceiptText size={16} /> Registrar gasto</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accountCards(balances).map((card) => (
          <div key={card.label} className="card">
            <p className="text-xs text-island-dark/70 font-body uppercase tracking-wide">{card.label}</p>
            <p className={`text-2xl font-body font-bold ${card.value < 0 ? 'text-error-ink' : 'text-island-dark'}`}>{formatCOP(card.value)}</p>
            {card.hint && <p className="text-xs text-island-dark/70 font-body mt-1">{card.hint}</p>}
          </div>
        ))}
        <div className="card">
          <p className="text-xs text-island-dark/70 font-body uppercase tracking-wide">Efectivo total</p>
          <p className="text-2xl font-body font-bold text-island-dark">{formatCOP(balances.cash.total)}</p>
          <p className="text-xs text-island-dark/70 font-body mt-1">Caja menor + caja general</p>
        </div>
      </div>

      <div className="card">
        <h2 className="font-body text-lg font-semibold text-island-dark mb-3">
          {balances.shiftOpen ? 'Gastos fuera de turno' : 'Gastos fuera de turno desde el último cierre'}
        </h2>
        {balances.pendingOffShiftExpenses.length === 0 ? (
          <p className="text-sm text-island-dark/70 font-body">No hay gastos fuera de turno pendientes.</p>
        ) : (
          <table className="w-full text-sm font-body">
            <tbody className="divide-y divide-island-blue/20">
              {balances.pendingOffShiftExpenses.map((expense) => (
                <tr key={expense._id}>
                  <td className="px-3 py-2 text-island-dark">{expense.description}</td>
                  <td className="px-3 py-2 text-island-dark/70">{formatDateTime(expense.createdAt)}</td>
                  <td className="px-3 py-2 text-island-dark/70">
                    {(expense.paymentMethod ?? 'cash') === 'cash'
                      ? `Efectivo · ${(expense.cashAccount ?? 'menor') === 'menor' ? 'caja menor' : 'caja general'}`
                      : { card: 'Tarjeta', transfer: 'Transferencia', nequi: 'Nequi' }[expense.paymentMethod as string]}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-island-dark">{formatCOP(expense.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={!!modalType}
        onClose={() => setModalType(null)}
        title={modalType === 'WITHDRAWAL' ? 'Trasladar de caja menor a caja general' : 'Trasladar de caja general a caja menor'}
      >
        <form onSubmit={submit} className="space-y-4">
          <Input label="Monto (COP)" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Input label="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalType(null)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Registrar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
