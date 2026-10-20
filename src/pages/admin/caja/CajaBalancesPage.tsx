import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, ReceiptText, SlidersHorizontal } from 'lucide-react';
import { cashShiftsApi, type CashAccountKey } from '../../../api/cashShifts';
import { useToast } from '../../../hooks/useToast';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Select } from '../../../components/ui/Select';
import { PageLoader } from '../../../components/ui/Spinner';
import type { CashBalances } from '../../../types';
import { formatCOP } from '../../../utils/formatCurrency';
import { formatDateTime } from '../../../utils/formatDate';

const accountOptions: Array<{ value: CashAccountKey; label: string }> = [
  { value: 'menor', label: 'Caja menor (registradora)' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'nequi', label: 'Nequi / Daviplata' },
  { value: 'card', label: 'Tarjeta' },
];

const errorMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { error?: string } } }).response?.data?.error || fallback;

const accountCards = (balances: CashBalances) => [
  { label: 'Caja menor (registradora)', value: balances.cash.menor, hint: 'Efectivo que debe haber en el cajón' },
  { label: 'Transferencia', value: balances.transfer },
  { label: 'Nequi / Daviplata', value: balances.nequi },
  { label: 'Tarjeta', value: balances.card },
];

export function CajaBalancesPage() {
  const toast = useToast();
  const [balances, setBalances] = useState<CashBalances | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'transfer' | 'calibrate' | null>(null);
  const [from, setFrom] = useState<CashAccountKey>('menor');
  const [to, setTo] = useState<CashAccountKey>('transfer');
  const [account, setAccount] = useState<CashAccountKey>('transfer');
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

  const currentOf = (key: CashAccountKey) =>
    !balances ? 0 : key === 'menor' ? balances.cash.menor : key === 'general' ? balances.cash.general : balances[key];

  const closeModal = () => {
    setModal(null);
    setAmount('');
    setReason('');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const value = Number(amount);
    if (!reason.trim() || !Number.isFinite(value) || amount === '' || (modal === 'transfer' && value <= 0)) {
      toast.error(modal === 'transfer' ? 'Ingresa un monto mayor a cero y un motivo' : 'Ingresa el saldo y un motivo');
      return;
    }
    setSaving(true);
    try {
      if (modal === 'transfer') {
        await cashShiftsApi.transferBetweenAccounts({ from, to, amount: value, reason: reason.trim() });
        toast.success('Traslado registrado');
      } else {
        await cashShiftsApi.calibrateAccount({
          account: account as Exclude<CashAccountKey, 'menor'>,
          targetBalance: value,
          reason: reason.trim(),
        });
        toast.success('Saldo calibrado');
      }
      closeModal();
      await load();
    } catch (error) {
      toast.error(errorMessage(error, 'No se pudo registrar el movimiento'));
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
          <Button type="button" variant="secondary" onClick={() => setModal('transfer')}>
            <ArrowLeftRight size={16} /> Trasladar entre cuentas
          </Button>
          <Button type="button" variant="secondary" onClick={() => setModal('calibrate')}>
            <SlidersHorizontal size={16} /> Calibrar saldo
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
        isOpen={!!modal}
        onClose={closeModal}
        title={modal === 'transfer' ? 'Trasladar entre cuentas' : 'Calibrar saldo'}
      >
        <form onSubmit={submit} className="space-y-4">
          {modal === 'transfer' ? (
            <>
              <Select label="Desde" options={accountOptions} value={from} onChange={(e) => setFrom(e.target.value as CashAccountKey)} />
              <Select label="Hacia" options={accountOptions} value={to} onChange={(e) => setTo(e.target.value as CashAccountKey)} />
              <Input label="Monto (COP)" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </>
          ) : (
            <>
              <Select
                label="Cuenta"
                options={accountOptions.filter((option) => option.value !== 'menor')}
                value={account}
                onChange={(e) => setAccount(e.target.value as CashAccountKey)}
              />
              <p className="text-sm font-body text-island-dark/70">
                Saldo calculado ahora: <strong className="text-island-dark">{formatCOP(currentOf(account))}</strong>. Escribe el saldo real
                (por ejemplo 0 para empezar de cero) y el sistema registra la diferencia como ajuste. La caja menor no se calibra aquí:
                sale del conteo de los turnos.
              </p>
              <Input label="Saldo real (COP)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </>
          )}
          <Input label="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" loading={saving}>Registrar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
