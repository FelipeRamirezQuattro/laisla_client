import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Brain, Coffee, Film, PartyPopper, ShoppingBasket, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { publicApi } from '../../api/public';
import { Event, EventType } from '../../types';
import { formatCOP } from '../../utils/formatCurrency';
import { formatDate, formatTime } from '../../utils/formatDate';
import { PageLoader } from '../../components/ui/Spinner';

const typeFilters: Array<{ value: string; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'movie', label: 'Cine' },
  { value: 'picnic', label: 'Picnic' },
  { value: 'trivia', label: 'Trivia' },
  { value: 'tasting', label: 'Cata' },
  { value: 'dinner-with-strangers', label: 'Cena con Desconocidos' },
  { value: 'other', label: 'Otro' },
];

const typeIcons: Record<EventType, LucideIcon> = {
  movie: Film,
  picnic: ShoppingBasket,
  trivia: Brain,
  tasting: Coffee,
  'dinner-with-strangers': Sparkles,
  other: PartyPopper,
};

export function EventsListPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    publicApi.getEvents(typeFilter ? { type: typeFilter } : undefined)
      .then((r) => setEvents(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [typeFilter]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="font-body text-3xl font-bold text-espresso">Eventos y Experiencias</h1>
        <p className="font-body text-stone mt-2">Descubre todo lo que está pasando en La Isla Café.</p>
      </div>

      {/* Type Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {typeFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className={`px-4 py-2 rounded-full text-sm font-body font-medium transition-all ${
              typeFilter === f.value
                ? 'bg-espresso text-cream'
                : 'bg-surface-tint text-espresso hover:bg-surface-tint hover:text-espresso'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? <PageLoader /> : (
        <>
          {events.length === 0 ? (
            <div className="text-center py-20">
              <Sparkles size={36} className="mx-auto mb-4 text-terracotta" />
              <p className="font-body text-stone">No hay eventos disponibles por el momento.</p>
              <p className="font-body text-stone text-sm mt-2">Vuelve pronto, ¡siempre hay algo nuevo!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  const spotsLeft = event.maxCapacity - event.currentRegistrations;
  const soldOut = spotsLeft <= 0;
  const EventIcon = typeIcons[event.type] || PartyPopper;

  return (
    <Link
      to={event.type === 'dinner-with-strangers' ? '/reservar/cena-con-desconocidos' : `/reservar/eventos/${event._id}`}
      className="group bg-white rounded-lg shadow-sm border border-rule overflow-hidden hover:shadow-md transition-all"
    >
      {/* Image / Placeholder */}
      <div className="h-44 bg-espresso bg-opacity-90 flex items-center justify-center relative overflow-hidden">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <EventIcon size={56} className="text-cream opacity-60" />
        )}
        {soldOut && (
          <div className="absolute inset-0 bg-espresso bg-opacity-70 flex items-center justify-center">
            <span className="text-cream font-body font-bold text-sm bg-error px-3 py-1 rounded-full">Agotado</span>
          </div>
        )}
      </div>

      <div className="p-5">
        <p className="text-xs font-body text-terracotta font-medium uppercase tracking-wide mb-1">
          {formatDate(event.date)} · {formatTime(event.time)}
        </p>
        <h3 className="font-body text-lg font-semibold text-espresso mb-2 group-hover:text-terracotta transition-colors line-clamp-2">
          {event.title}
        </h3>
        <p className="font-body text-stone text-sm line-clamp-2 mb-4">{event.description}</p>

        <div className="flex items-center justify-between">
          <span className="font-body font-bold text-espresso">{formatCOP(event.pricePerPerson)} <span className="text-sm font-body font-normal text-stone">/ persona</span></span>
          {!soldOut && (
            <span className="text-xs font-body text-success-ink font-medium">{spotsLeft} cupos</span>
          )}
        </div>
      </div>
    </Link>
  );
}
