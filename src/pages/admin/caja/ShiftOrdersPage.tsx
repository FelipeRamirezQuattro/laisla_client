import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { cashShiftsApi } from '../../../api/cashShifts';
import { ordersApi } from '../../../api/orders';
import { usersApi } from '../../../api/users';
import { useConfirm } from '../../../hooks/useConfirm';
import { usePagination } from '../../../hooks/usePagination';
import { useToast } from '../../../hooks/useToast';
import { Badge, OrderStatusBadge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Pagination } from '../../../components/ui/Pagination';
import { Select } from '../../../components/ui/Select';
import { PageLoader } from '../../../components/ui/Spinner';
import type { CafeTable, CashShift, Order, User } from '../../../types';
import { useShiftStore } from '../../../store/shiftStore';
import { confirmAndDeleteShift } from '../../../utils/confirmDeleteShift';
import { formatCOP } from '../../../utils/formatCurrency';
import { formatDate, formatDateTime } from '../../../utils/formatDate';

const statusLabel: Record<CashShift['status'], string> = {
  OPEN: 'Abierto',
  COUNTING: 'En conteo',
  CLOSED: 'Cerrado',
  REVIEWED: 'Aprobado',
};

const paymentLabel: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  nequi: 'Nequi',
};

const errorMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { error?: string } } }).response?.data?.error || fallback;

export function ShiftOrdersPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const { page, limit, goToPage } = usePagination(1, 20);
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [shifts, setShifts] = useState<CashShift[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingOrderId, setSavingOrderId] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [shiftFilter, setShiftFilter] = useState(searchParams.get('cashShiftId') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');

  const [editing, setEditing] = useState<CashShift | null>(null);
  const [editOwner, setEditOwner] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const fetchShifts = useCallback(async () => {
    try {
      const res = await cashShiftsApi.list();
      setShifts(res.data);
    } catch {
      toast.error('Error al cargar los turnos');
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (shiftFilter) params.cashShiftId = shiftFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await ordersApi.getAll(params);
      setOrders(res.data.orders);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }, [page, limit, shiftFilter, dateFrom, dateTo]);

  useEffect(() => { fetchShifts(); }, [fetchShifts]);
  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => {
    usersApi.getAssignable().then((res) => setUsers(res.data)).catch(() => {});
  }, []);

  const changeShiftFilter = (value: string) => {
    setShiftFilter(value);
    goToPage(1);
    setSearchParams(value ? { cashShiftId: value } : {});
  };

  const ownerName = (shift: CashShift) =>
    typeof shift.openedBy === 'object' ? shift.openedBy.name : users.find((user) => (user._id ?? user.id) === shift.openedBy)?.name || '—';

  const shiftLabel = (shift: CashShift) => `${formatDateTime(shift.openedAt)} · ${ownerName(shift)} (${statusLabel[shift.status]})`;

  const shiftOptions = shifts.map((shift) => ({ value: shift._id, label: shiftLabel(shift) }));

  const orderShiftId = (order: Order) =>
    typeof order.cashShiftId === 'object' && order.cashShiftId ? order.cashShiftId._id : order.cashShiftId || '';

  const tableName = (order: Order) =>
    order.tableId && typeof order.tableId === 'object' ? (order.tableId as CafeTable).name : 'Sin mesa / Mostrador';

  const isDeletable = (order: Order) => !orderShiftId(order) || order.status === 'cancelled';
  const deletableOrders = orders.filter(isDeletable);
  const allSelected = deletableOrders.length > 0 && deletableOrders.every((order) => selected.includes(order._id));

  // Selection never outlives the page/filters it was made on.
  useEffect(() => { setSelected([]); }, [orders]);

  const toggleSelected = (id: string) =>
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  const deleteOrders = async (ids: string[]) => {
    const accepted = await confirm({
      title: ids.length === 1 ? 'Eliminar pedido' : `Eliminar ${ids.length} pedidos`,
      confirmLabel: 'Eliminar',
      message: 'Se eliminarán de forma permanente, junto con sus documentos fiscales no aceptados. Esta acción no se puede deshacer.',
    });
    if (!accepted) return;
    try {
      const res = await ordersApi.bulkRemove(ids);
      const { deleted, skipped } = res.data;
      if (skipped.length > 0) toast.error(`${skipped.length} pedido(s) no se eliminaron: ${skipped[0].reason}`);
      if (deleted > 0) toast.success(`${deleted} pedido(s) eliminado(s)`);
      await Promise.all([fetchOrders(), fetchShifts()]);
    } catch (error) {
      toast.error(errorMessage(error, 'Error al eliminar los pedidos'));
    }
  };

  const assignShift = async (order: Order, value: string) => {
    setSavingOrderId(order._id);
    try {
      await ordersApi.setShift(order._id, value || null);
      toast.success(value ? 'Turno asignado al pedido' : 'Pedido marcado sin turno');
      await Promise.all([fetchOrders(), fetchShifts()]);
    } catch (error) {
      toast.error(errorMessage(error, 'Error al asignar el turno'));
    } finally {
      setSavingOrderId('');
    }
  };

  const openEdit = (shift: CashShift) => {
    setEditing(shift);
    setEditOwner(typeof shift.openedBy === 'object' ? (shift.openedBy._id ?? shift.openedBy.id) : shift.openedBy);
    setEditNotes(shift.notes || '');
  };

  const saveEdit = async () => {
    if (!editing) return;
    setEditSaving(true);
    try {
      await cashShiftsApi.update(editing._id, { openedBy: editOwner || undefined, notes: editNotes });
      toast.success('Turno actualizado');
      setEditing(null);
      await Promise.all([fetchShifts(), fetchOrders()]);
    } catch (error) {
      toast.error(errorMessage(error, 'Error al editar el turno'));
    } finally {
      setEditSaving(false);
    }
  };

  const removeShift = async (shift: CashShift) => {
    try {
      if (!(await confirmAndDeleteShift(shift, confirm))) return;
      toast.success('Turno eliminado');
      if (shiftFilter === shift._id) changeShiftFilter('');
      await Promise.all([fetchShifts(), fetchOrders(), useShiftStore.getState().refresh()]);
    } catch (error) {
      toast.error(errorMessage(error, 'Error al eliminar el turno'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-body text-2xl font-bold text-island-dark">Turnos / Pedidos</h1>
        <p className="text-island-dark/70 font-body text-sm">
          Consulta a qué turno pertenece cada pedido, reasígnalo y administra los turnos.
        </p>
      </div>

      <div className="card grid gap-3 md:grid-cols-3">
        <Select
          label="Turno"
          options={[{ value: '', label: 'Todos' }, { value: 'none', label: 'Sin turno' }, ...shiftOptions]}
          value={shiftFilter}
          onChange={(e) => changeShiftFilter(e.target.value)}
        />
        <Input label="Desde" type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); goToPage(1); }} />
        <Input label="Hasta" type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); goToPage(1); }} />
      </div>

      {loading ? <PageLoader /> : (
        <div className="card overflow-x-auto">
          {selected.length > 0 && (
            <div className="mb-3 flex items-center justify-between rounded-lg bg-gray-100 px-3 py-2 text-sm font-body">
              <span className="text-island-dark">{selected.length} pedido(s) seleccionado(s)</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => deleteOrders(selected)}>
                <Trash2 size={14} /> Eliminar seleccionados
              </Button>
            </div>
          )}
          <table className="w-full min-w-[56rem] table-fixed text-sm font-body">
            <colgroup>
              <col className="w-10" />
              <col className="w-28" />
              <col className="w-40" />
              <col className="w-32" />
              <col className="w-32" />
              <col className="w-32" />
              <col />
              <col className="w-24" />
            </colgroup>
            <thead>
              <tr className="border-b border-island-blue/20">
                <th className="px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label="Seleccionar todos los eliminables"
                    checked={allSelected}
                    disabled={deletableOrders.length === 0}
                    onChange={() => setSelected(allSelected ? [] : deletableOrders.map((order) => order._id))}
                  />
                </th>
                <th className="px-3 py-2 text-left font-medium text-island-dark/70">Fecha</th>
                <th className="px-3 py-2 text-left font-medium text-island-dark/70">Mesa</th>
                <th className="px-3 py-2 text-left font-medium text-island-dark/70">Estado</th>
                <th className="px-3 py-2 text-left font-medium text-island-dark/70">Pago</th>
                <th className="px-3 py-2 text-right font-medium text-island-dark/70">Total</th>
                <th className="px-3 py-2 text-left font-medium text-island-dark/70">Turno</th>
                <th className="px-3 py-2 text-right font-medium text-island-dark/70">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-island-blue/20">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-100">
                  <td className="px-3 py-2">
                    {isDeletable(order) && (
                      <input
                        type="checkbox"
                        aria-label="Seleccionar pedido"
                        checked={selected.includes(order._id)}
                        onChange={() => toggleSelected(order._id)}
                      />
                    )}
                  </td>
                  <td className="px-3 py-2 text-island-dark">{formatDate(order.closedAt || order.serviceDate || order.createdAt, 'dd/MM/yyyy')}</td>
                  <td className="px-3 py-2 text-island-dark truncate" title={tableName(order)}>{tableName(order)}</td>
                  <td className="px-3 py-2"><OrderStatusBadge status={order.status} /></td>
                  <td className="px-3 py-2 text-island-dark truncate">{order.paymentMethod ? paymentLabel[order.paymentMethod] : '—'}</td>
                  <td className="px-3 py-2 text-right text-island-dark">{formatCOP(order.total)}</td>
                  <td className="px-3 py-2">
                    <Select
                      options={[{ value: '', label: 'Sin turno' }, ...shiftOptions]}
                      value={orderShiftId(order)}
                      disabled={savingOrderId === order._id}
                      onChange={(e) => assignShift(order, e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    {isDeletable(order) && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => deleteOrders([order._id])} title="Eliminar pedido">
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-6 text-center text-island-dark/70">No hay pedidos con estos filtros.</td></tr>
              )}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-body text-lg font-semibold text-island-dark">Turnos</h2>
        {shifts.map((shift) => (
          <div key={shift._id} className="card flex flex-wrap items-center justify-between gap-3">
            <div className="font-body">
              <p className="font-medium text-island-dark text-sm">
                {formatDateTime(shift.openedAt)}{shift.closedAt ? ` → ${formatDateTime(shift.closedAt)}` : ''}
              </p>
              <p className="text-xs text-island-dark/70">
                Responsable: {ownerName(shift)} · Ventas {formatCOP(shift.salesSnapshot?.totalSales ?? 0)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={shift.status === 'OPEN' ? 'green' : shift.status === 'CLOSED' ? 'yellow' : 'gray'}
                label={statusLabel[shift.status]}
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => changeShiftFilter(shift._id)}>
                Ver pedidos
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => openEdit(shift)}>
                <Pencil size={14} /> Editar
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeShift(shift)}
              >
                <Trash2 size={14} /> Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Editar turno">
        <div className="space-y-4">
          <Select
            label="Responsable del turno"
            options={users.map((user) => ({ value: user._id ?? user.id, label: user.name }))}
            value={editOwner}
            onChange={(e) => setEditOwner(e.target.value)}
          />
          <Input label="Notas" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button type="button" loading={editSaving} onClick={saveEdit}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
