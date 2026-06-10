import { Plus, Sparkles, X } from 'lucide-react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { eventsApi } from '../../api/events';
import { Event, EventType, DinnerGuest, EventBooking, EventGuest } from '../../types';
import { formatCOP } from '../../utils/formatCurrency';
import { formatDate, formatTime } from '../../utils/formatDate';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { EventStatusBadge, Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { PageLoader } from '../../components/ui/Spinner';

const schema = z.object({
  title: z.string().min(1, 'Título requerido'),
  description: z.string().default(''),
  type: z.enum(['picnic', 'movie', 'trivia', 'tasting', 'dinner-with-strangers', 'other']),
  date: z.string().min(1, 'Fecha requerida'),
  time: z.string().min(1, 'Hora requerida'),
  pricePerPerson: z.coerce.number().min(0),
  maxCapacity: z.coerce.number().min(1),
  imageUrl: z.string().default(''),
  isPublished: z.boolean().default(false),
  status: z.enum(['upcoming', 'active', 'cancelled', 'completed']).default('upcoming'),
});

type FormData = z.infer<typeof schema>;

const typeOptions = [
  { value: 'movie', label: 'Cine' },
  { value: 'picnic', label: 'Picnic' },
  { value: 'trivia', label: 'Trivia' },
  { value: 'tasting', label: 'Cata' },
  { value: 'dinner-with-strangers', label: 'Cena con Desconocidos' },
  { value: 'other', label: 'Otro' },
];

const typeLabels: Record<EventType, string> = {
  movie: 'Cine',
  picnic: 'Picnic',
  trivia: 'Trivia',
  tasting: 'Cata',
  'dinner-with-strangers': 'Cena con Desconocidos',
  other: 'Otro',
};

export function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [guestsModal, setGuestsModal] = useState<Event | null>(null);
  const [guests, setGuests] = useState<EventGuest[]>([]);
  const [generatingGroups, setGeneratingGroups] = useState(false);
  const toast = useToast();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await eventsApi.getAll({ page, limit: 20 });
      setEvents(res.data.events);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error('Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const openCreate = () => {
    setEditing(null);
    reset({ status: 'upcoming', isPublished: false });
    setModalOpen(true);
  };

  const openEdit = (e: Event) => {
    setEditing(e);
    reset({
      title: e.title,
      description: e.description,
      type: e.type,
      date: e.date.split('T')[0],
      time: e.time,
      pricePerPerson: e.pricePerPerson,
      maxCapacity: e.maxCapacity,
      imageUrl: e.imageUrl || '',
      isPublished: e.isPublished,
      status: e.status,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) {
        await eventsApi.update(editing._id, data);
        toast.success('Evento actualizado');
      } else {
        await eventsApi.create(data);
        toast.success('Evento creado');
      }
      setModalOpen(false);
      fetchEvents();
    } catch {
      toast.error('Error al guardar evento');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este evento?')) return;
    try {
      await eventsApi.delete(id);
      toast.success('Evento eliminado');
      fetchEvents();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const openGuestsPanel = async (event: Event) => {
    setGuestsModal(event);
    setGuests([]);
    try {
      const res = await eventsApi.getGuests(event._id);
      setGuests(res.data);
    } catch {
      toast.error('Error al cargar invitados');
    }
  };

  const handleGenerateGroups = async () => {
    if (!guestsModal) return;
    setGeneratingGroups(true);
    try {
      const res = await eventsApi.generateGroups(guestsModal._id);
      setGuests(res.data.guests);
      toast.success('Grupos generados exitosamente');
      fetchEvents();
      // Refresh event
      const updated = await eventsApi.getOne(guestsModal._id);
      setGuestsModal(updated.data);
    } catch {
      toast.error('Error al generar grupos');
    } finally {
      setGeneratingGroups(false);
    }
  };

  const groupedGuests = guests.reduce<Record<number, DinnerGuest[]>>((acc, g) => {
    if (!isDinnerGuest(g)) return acc;
    const grp = g.assignedGroup || 0;
    if (!acc[grp]) acc[grp] = [];
    acc[grp].push(g);
    return acc;
  }, {});

  const isDinnerEvent = guestsModal?.type === 'dinner-with-strangers';
  const activeGuestsCount = guests.reduce((count, guest) => guest.status !== 'cancelled' ? count + guestTickets(guest) : count, 0);
  const normalizedSearch = search.trim().toLowerCase();
  const filteredEvents = useMemo(() => events.filter((event) => {
    if (!normalizedSearch) return true;
    return [
      event.title,
      event.description,
      typeLabels[event.type],
      event.type,
      event.status,
      event.isPublished ? 'publicado si publicado' : 'borrador no',
      formatDate(event.date),
      formatTime(event.time),
      formatCOP(event.pricePerPerson),
      String(event.maxCapacity),
      String(event.currentRegistrations),
    ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
  }), [events, normalizedSearch]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-espresso">Eventos</h1>
          <p className="text-stone font-body text-sm">{filteredEvents.length} eventos en esta página · {total} total</p>
        </div>
        <Button onClick={openCreate} icon={<Plus size={15} />}>Nuevo evento</Button>
      </div>

      <div className="card grid gap-3 md:grid-cols-[minmax(0,1fr)_16rem]">
        <Input
          placeholder="Buscar por título, tipo, fecha, estado o cupos..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="rounded-lg border border-rule bg-surface-tint px-4 py-2 font-body text-sm text-stone">
          {filteredEvents.length} de {events.length} eventos
        </div>
      </div>

      {loading ? <PageLoader /> : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm font-body">
            <thead className="bg-surface-tint border-b border-rule">
              <tr>
                <th className="text-left px-4 py-3 text-stone font-medium">Título</th>
                <th className="text-left px-4 py-3 text-stone font-medium">Tipo</th>
                <th className="text-left px-4 py-3 text-stone font-medium">Fecha</th>
                <th className="text-right px-4 py-3 text-stone font-medium">Precio</th>
                <th className="text-center px-4 py-3 text-stone font-medium">Cupos</th>
                <th className="text-center px-4 py-3 text-stone font-medium">Publicado</th>
                <th className="text-center px-4 py-3 text-stone font-medium">Estado</th>
                <th className="text-right px-4 py-3 text-stone font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {filteredEvents.map((e) => (
                <tr key={e._id} className="hover:bg-surface-tint transition-colors">
                  <td className="px-4 py-3 font-medium text-espresso max-w-xs truncate">{e.title}</td>
                  <td className="px-4 py-3 text-stone">{typeLabels[e.type]}</td>
                  <td className="px-4 py-3 text-stone">
                    {formatDate(e.date)} · {formatTime(e.time)}
                  </td>
                  <td className="px-4 py-3 text-right">{formatCOP(e.pricePerPerson)}</td>
                  <td className="px-4 py-3 text-center text-stone">
                    {e.currentRegistrations}/{e.maxCapacity}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge label={e.isPublished ? 'Sí' : 'No'} variant={e.isPublished ? 'green' : 'gray'} />
                  </td>
                  <td className="px-4 py-3 text-center"><EventStatusBadge status={e.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(e)}>Editar</Button>
                      <Button variant="secondary" size="sm" onClick={() => openGuestsPanel(e)}>Invitados</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(e._id)} aria-label="Eliminar evento">
                        <X size={15} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEvents.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-stone">No hay eventos.</td></tr>
              )}
            </tbody>
          </table>
          <div className="p-4">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      )}

      {/* Event Form Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar evento' : 'Nuevo evento'} size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Título" error={errors.title?.message} {...register('title')} />
          <div>
            <label className="text-sm font-medium text-ink font-body block mb-1">Descripción</label>
            <textarea className="input-base h-20 resize-none" {...register('description')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Tipo" options={typeOptions} error={errors.type?.message} {...register('type')} />
            <Select
              label="Estado"
              options={[
                { value: 'upcoming', label: 'Próximo' },
                { value: 'active', label: 'Activo' },
                { value: 'cancelled', label: 'Cancelado' },
                { value: 'completed', label: 'Completado' },
              ]}
              {...register('status')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Fecha" type="date" error={errors.date?.message} {...register('date')} />
            <Input label="Hora" type="time" error={errors.time?.message} {...register('time')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Precio por persona (COP)" type="number" error={errors.pricePerPerson?.message} {...register('pricePerPerson')} />
            <Input label="Capacidad máxima" type="number" error={errors.maxCapacity?.message} {...register('maxCapacity')} />
          </div>
          <Input label="URL de imagen (opcional)" {...register('imageUrl')} />
          <label className="flex items-center gap-2 text-sm font-body cursor-pointer">
            <input type="checkbox" {...register('isPublished')} className="rounded" />
            Publicar evento (visible en el sitio público)
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>{editing ? 'Actualizar' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>

      {/* Guests & Groups Modal */}
      {guestsModal && (
        <Modal isOpen={!!guestsModal} onClose={() => setGuestsModal(null)} title={`Invitados — ${guestsModal.title}`} size="xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-stone font-body">
                {activeGuestsCount} {isDinnerEvent ? 'invitados registrados' : 'cupos reservados'}
              </p>
              {isDinnerEvent && (
                <Button onClick={handleGenerateGroups} loading={generatingGroups} disabled={guests.length === 0}>
                  <span className="inline-flex items-center gap-2">
                    <Sparkles size={16} />
                    Generar grupos
                  </span>
                </Button>
              )}
            </div>

            {/* Groups */}
            {isDinnerEvent && (guestsModal.generatedGroups?.length || 0) > 0 && (
              <div className="space-y-3">
                <h3 className="font-body font-semibold text-espresso text-sm">Grupos generados</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(groupedGuests).filter(([g]) => Number(g) > 0).map(([grpNum, grpGuests]) => (
                    <div key={grpNum} className="bg-surface-tint rounded-lg p-3">
                      <p className="text-xs font-bold text-espresso font-body mb-2 uppercase tracking-wide">Grupo {grpNum}</p>
                      <div className="space-y-1">
                        {grpGuests.map((g) => (
                          <div key={g._id} className="text-sm font-body text-ink flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-terracotta inline-block shrink-0" />
                            {g.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All guests list */}
            <div>
              <h3 className="font-body font-semibold text-espresso text-sm mb-2">Todos los invitados</h3>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {guests.map((g) => (
                  <div key={g._id} className="flex items-center justify-between text-sm font-body px-3 py-2 bg-surface-tint rounded-lg">
                    <div>
                      <span className="font-medium text-espresso">{g.name}</span>
                      <span className="text-stone ml-2 text-xs">{g.email}</span>
                      <span className="text-stone ml-2 text-xs">{g.phone}</span>
                      {!isDinnerGuest(g) && g.notes && (
                        <p className="text-stone text-xs mt-1">{g.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isDinnerGuest(g) && g.assignedGroup && (
                        <Badge label={`Grupo ${g.assignedGroup}`} variant="brown" />
                      )}
                      {!isDinnerGuest(g) && (
                        <Badge label={`${g.tickets} ${g.tickets === 1 ? 'cupo' : 'cupos'}`} variant="gray" />
                      )}
                      <Badge
                        label={g.status === 'registered' ? 'Registrado' : g.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
                        variant={g.status === 'cancelled' ? 'red' : g.status === 'confirmed' ? 'green' : 'yellow'}
                      />
                    </div>
                  </div>
                ))}
                {guests.length === 0 && <p className="text-center text-stone py-4 text-sm">Sin invitados registrados.</p>}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function isDinnerGuest(guest: EventGuest): guest is DinnerGuest {
  return 'compatibilityProfile' in guest;
}

function guestTickets(guest: EventGuest) {
  return isEventBooking(guest) ? guest.tickets : 1;
}

function isEventBooking(guest: EventGuest): guest is EventBooking {
  return 'tickets' in guest;
}
