import { useEffect, useState, useCallback, useMemo, type FormEvent, type ReactNode } from 'react';
import { reservationsApi } from '../../api/reservations';
import { tablesApi } from '../../api/tables';
import { CafeTable, Reservation, ReservationStatus } from '../../types';
import { formatDate, formatTime, todayLocal } from '../../utils/formatDate';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ReservationStatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { PageLoader } from '../../components/ui/Spinner';

const zoneLabels: Record<string, string> = {
  social: 'Social',
  'work-cafe': 'Work Café',
  terrace: 'Terraza',
};

const occasionLabels: Record<string, string> = {
  birthday: 'Cumpleaños',
  anniversary: 'Aniversario',
  'business meeting': 'Reunión de negocios',
  'first date': 'Primera cita',
  celebration: 'Celebración',
  other: 'Otro',
};

const timeOptions = Array.from({ length: 11 }, (_, index) => {
  const hour = 10 + index;
  const value = `${String(hour).padStart(2, '0')}:00`;
  const hour12 = hour > 12 ? hour - 12 : hour;
  const suffix = hour >= 12 ? 'p.m.' : 'a.m.';
  return { value, label: `${hour12}:00 ${suffix}` };
});

function toDateInputValue(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return todayLocal();
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
}

export function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [reserveDate, setReserveDate] = useState(todayLocal());
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [reserveForm, setReserveForm] = useState({
    tableId: '',
    clientName: '',
    phone: '',
    timeSlot: '10:00',
    partySize: 2,
    detail: '',
  });
  const [reserving, setReserving] = useState(false);
  const [viewReservation, setViewReservation] = useState<Reservation | null>(null);
  const [detailTableId, setDetailTableId] = useState('');
  const [detailText, setDetailText] = useState('');
  const [modalTables, setModalTables] = useState<CafeTable[]>([]);
  const toast = useToast();

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await reservationsApi.getAll(params);
      setReservations(res.data.reservations);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error('Error al cargar reservaciones');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);

  const fetchTables = useCallback(async () => {
    try {
      const res = await tablesApi.getAll({ date: reserveDate });
      setTables(res.data);
      setReserveForm((current) => ({
        ...current,
        tableId: current.tableId || res.data.find((table) => table.status === 'available')?._id || '',
      }));
    } catch {
      toast.error('Error al cargar mesas');
    }
  }, [reserveDate]);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  const tableName = (table?: string | CafeTable | null) =>
    typeof table === 'object' && table ? table.name : tables.find((item) => item._id === table)?.name || '-';

  const normalizedSearch = search.trim().toLowerCase();
  const filteredReservations = useMemo(() => reservations.filter((reservation) => {
    if (!normalizedSearch) return true;
    return [
      reservation.confirmationCode,
      reservation.clientName,
      reservation.email,
      reservation.phone,
      reservation.status,
      zoneLabels[reservation.zone],
      reservation.zone,
      tableName(reservation.tableId),
      reservation.detail,
      formatDate(reservation.date),
      formatTime(reservation.timeSlot),
      String(reservation.partySize),
    ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
  }), [reservations, normalizedSearch, tables]);

  useEffect(() => {
    if (!viewReservation) return;
    const assignedTableId = typeof viewReservation.tableId === 'object' && viewReservation.tableId
      ? viewReservation.tableId._id
      : viewReservation.tableId || '';
    setDetailTableId(assignedTableId);
    setDetailText(viewReservation.detail || '');

    let active = true;
    tablesApi.getAll({ date: toDateInputValue(viewReservation.date) })
      .then((res) => {
        if (active) setModalTables(res.data);
      })
      .catch(() => {
        if (active) setModalTables([]);
        toast.error('Error al cargar mesas para la reserva');
      });

    return () => { active = false; };
  }, [viewReservation]);

  const detailTableOptions = modalTables
    .filter((table) => table.status === 'available' || table._id === detailTableId)
    .map((table) => ({
      value: table._id,
      label: `${table.name} · ${table.status === 'available' ? 'Disponible' : 'Asignada'}`,
    }));

  if (
    detailTableId
    && !detailTableOptions.some((option) => option.value === detailTableId)
    && typeof viewReservation?.tableId === 'object'
    && viewReservation.tableId
  ) {
    detailTableOptions.unshift({ value: viewReservation.tableId._id, label: `${viewReservation.tableId.name} · Asignada` });
  }

  const handleStatusChange = async (id: string, status: ReservationStatus) => {
    if (status === 'confirmed' && !detailTableId) {
      toast.error('Selecciona una mesa para confirmar la reserva');
      return;
    }

    try {
      const res = await reservationsApi.updateStatus(id, {
        status,
        tableId: detailTableId || undefined,
        detail: detailText,
      });
      toast.success('Estado actualizado');
      fetchReservations();
      if (viewReservation?._id === id) setViewReservation(res.data);
    } catch {
      toast.error('Error al actualizar estado');
    }
  };

  const createTableBlock = async (event: FormEvent) => {
    event.preventDefault();
    if (!reserveForm.tableId || !reserveForm.clientName.trim()) {
      toast.error('Selecciona la mesa y escribe un nombre');
      return;
    }
    setReserving(true);
    try {
      await reservationsApi.create({
        tableId: reserveForm.tableId,
        clientName: reserveForm.clientName.trim(),
        phone: reserveForm.phone || 'N/A',
        email: 'reserva@laisla.local',
        date: reserveDate,
        timeSlot: reserveForm.timeSlot || '10:00',
        partySize: reserveForm.partySize,
        detail: reserveForm.detail.trim(),
        zone: 'social',
        status: 'confirmed',
        specialOccasion: { hasOccasion: false },
      } as Partial<Reservation>);
      toast.success('Mesa reservada');
      setReserveForm({ tableId: '', clientName: '', phone: '', timeSlot: '10:00', partySize: 2, detail: '' });
      await Promise.all([fetchReservations(), fetchTables()]);
    } catch {
      toast.error('Error al reservar mesa');
    } finally {
      setReserving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-body text-2xl font-bold text-espresso">Reservaciones</h1>
        <p className="text-stone font-body text-sm">{filteredReservations.length} reservaciones en esta página · {total} total</p>
      </div>

      <div className="card">
        <form onSubmit={createTableBlock} className="grid gap-3 lg:grid-cols-[12rem_minmax(10rem,1fr)_12rem_10rem_10rem_auto] lg:items-end">
          <Input
            label="Fecha"
            type="date"
            value={reserveDate}
            onChange={(e) => setReserveDate(e.target.value || todayLocal())}
          />
          <Select
            label="Mesa"
            placeholder="Selecciona mesa"
            value={reserveForm.tableId}
            options={tables.filter((table) => table.status === 'available').map((table) => ({
              value: table._id,
              label: `${table.name} · Disponible`,
            }))}
            onChange={(e) => setReserveForm({ ...reserveForm, tableId: e.target.value })}
          />
          <Input
            label="Nombre"
            value={reserveForm.clientName}
            onChange={(e) => setReserveForm({ ...reserveForm, clientName: e.target.value })}
            placeholder="Reserva interna"
          />
          <Select
            label="Hora"
            value={reserveForm.timeSlot}
            options={timeOptions}
            onChange={(e) => setReserveForm({ ...reserveForm, timeSlot: e.target.value })}
          />
          <Input
            label="Personas"
            type="number"
            min="1"
            value={reserveForm.partySize}
            onChange={(e) => setReserveForm({ ...reserveForm, partySize: +e.target.value })}
          />
          <Button type="submit" loading={reserving}>Reservar</Button>
          <div className="lg:col-span-6">
            <label className="text-sm font-medium text-ink font-body" htmlFor="reservation-detail">Detalle de la reserva</label>
            <textarea
              id="reservation-detail"
              className="input-base h-20 resize-none mt-1"
              value={reserveForm.detail}
              onChange={(e) => setReserveForm({ ...reserveForm, detail: e.target.value })}
              placeholder="Notas, requerimientos o contexto de la reserva"
            />
          </div>
        </form>
      </div>

      <div className="card grid gap-3 md:grid-cols-[minmax(0,1fr)_16rem]">
        <Input
          placeholder="Buscar por código, cliente, email, mesa o zona..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          options={[
            { value: '', label: 'Todos los estados' },
            { value: 'pending', label: 'Pendiente' },
            { value: 'confirmed', label: 'Confirmada' },
            { value: 'cancelled', label: 'Cancelada' },
            { value: 'completed', label: 'Completada' },
            { value: 'no-show', label: 'No asistió' },
          ]}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        />
      </div>

      {loading ? <PageLoader /> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm font-body">
            <thead className="bg-surface-tint border-b border-rule">
              <tr>
                <th className="text-left px-4 py-3 text-stone font-medium">Código</th>
                <th className="text-left px-4 py-3 text-stone font-medium">Cliente</th>
                <th className="text-left px-4 py-3 text-stone font-medium">Fecha</th>
                <th className="text-left px-4 py-3 text-stone font-medium">Mesa</th>
                <th className="text-left px-4 py-3 text-stone font-medium">Zona</th>
                <th className="text-center px-4 py-3 text-stone font-medium">Personas</th>
                <th className="text-center px-4 py-3 text-stone font-medium">Estado</th>
                <th className="text-right px-4 py-3 text-stone font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {filteredReservations.map((r) => (
                <tr key={r._id} className="hover:bg-surface-tint transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-espresso font-bold">{r.confirmationCode}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-espresso">{r.clientName}</p>
                    <p className="text-xs text-stone">{r.email}</p>
                  </td>
                  <td className="px-4 py-3 text-stone">
                    {formatDate(r.date)} · {formatTime(r.timeSlot)}
                  </td>
                  <td className="px-4 py-3 text-stone">{tableName(r.tableId)}</td>
                  <td className="px-4 py-3 text-stone">{zoneLabels[r.zone]}</td>
                  <td className="px-4 py-3 text-center text-stone">{r.partySize}</td>
                  <td className="px-4 py-3 text-center"><ReservationStatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setViewReservation(r)}>Ver</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReservations.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-stone">No hay reservaciones.</td></tr>
              )}
            </tbody>
          </table>
          <div className="p-4">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      )}

      {viewReservation && (
        <Modal isOpen={!!viewReservation} onClose={() => setViewReservation(null)} title="Detalle de reservación" size="lg">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm font-body">
              <InfoRow label="Código" value={<span className="font-mono font-bold">{viewReservation.confirmationCode}</span>} />
              <InfoRow label="Estado" value={<ReservationStatusBadge status={viewReservation.status} />} />
              <InfoRow label="Cliente" value={viewReservation.clientName} />
              <InfoRow label="Email" value={viewReservation.email} />
              <InfoRow label="Teléfono" value={viewReservation.phone} />
              <InfoRow label="Personas" value={String(viewReservation.partySize)} />
              <InfoRow label="Mesa" value={tableName(viewReservation.tableId)} />
              <InfoRow label="Fecha" value={formatDate(viewReservation.date)} />
              <InfoRow label="Horario" value={formatTime(viewReservation.timeSlot)} />
              <InfoRow label="Zona" value={zoneLabels[viewReservation.zone]} />
            </div>
            {viewReservation.detail && (
              <div className="bg-surface-tint rounded-lg p-4">
                <p className="text-sm font-medium text-espresso font-body mb-1">Detalle</p>
                <p className="text-sm text-stone font-body whitespace-pre-wrap">{viewReservation.detail}</p>
              </div>
            )}

            {viewReservation.specialOccasion?.hasOccasion && (
              <div className="bg-surface-tint rounded-lg p-4">
                <p className="text-sm font-medium text-espresso font-body mb-1">Ocasión especial</p>
                <p className="text-sm text-stone font-body">{occasionLabels[viewReservation.specialOccasion.type || ''] || viewReservation.specialOccasion.type}</p>
                {viewReservation.specialOccasion.notes && (
                  <p className="text-sm text-stone font-body mt-1 italic">"{viewReservation.specialOccasion.notes}"</p>
                )}
              </div>
            )}

            <div>
              <div className="grid gap-3 md:grid-cols-2 mb-4">
                <Select
                  label="Mesa para confirmar"
                  placeholder="Selecciona mesa"
                  value={detailTableId}
                  options={detailTableOptions}
                  onChange={(e) => setDetailTableId(e.target.value)}
                />
                <div>
                  <label className="text-sm font-medium text-ink font-body" htmlFor="reservation-detail-edit">Detalle de la reserva</label>
                  <textarea
                    id="reservation-detail-edit"
                    className="input-base h-20 resize-none mt-1"
                    value={detailText}
                    onChange={(e) => setDetailText(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-sm font-medium text-espresso font-body mb-2">Cambiar estado</p>
              <div className="flex flex-wrap gap-2">
                {(['pending', 'confirmed', 'cancelled', 'completed', 'no-show'] as ReservationStatus[]).map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={viewReservation.status === s ? 'primary' : 'secondary'}
                    onClick={() => handleStatusChange(viewReservation._id, s)}
                  >
                    {{ pending: 'Pendiente', confirmed: 'Confirmar', cancelled: 'Cancelar', completed: 'Completar', 'no-show': 'No asistió' }[s]}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-stone text-xs uppercase tracking-wide mb-0.5">{label}</p>
      <div className="font-medium text-ink">{value}</div>
    </div>
  );
}
