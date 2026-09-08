import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Brain, Coffee, Film, PartyPopper, ShoppingBasket, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { publicApi } from '../../api/public';
import { Event, EventType } from '../../types';
import { formatCOP } from '../../utils/formatCurrency';
import { formatDate, formatTime } from '../../utils/formatDate';
import { PageLoader } from '../../components/ui/Spinner';
import './eventsPublic.css';

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
    <div className="ev-page max-w-5xl mx-auto px-4 py-12">
      <div>
        <p className="ev-kicker">Cartelera de la isla</p>
        <h1 className="ev-title">Eventos y experiencias</h1>
        <p className="ev-lead">Descubre todo lo que está pasando en La Isla Café.</p>
      </div>

      {/* Type Filters */}
      <div className="ev-filters">
        {typeFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className={`ev-filter-btn ${typeFilter === f.value ? 'is-active' : ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? <PageLoader /> : (
        <>
          {events.length === 0 ? (
            <div className="ev-empty">
              <span className="ev-empty-icon">
                <Sparkles size={28} strokeWidth={2} />
              </span>
              <h2>No hay eventos por ahora</h2>
              <p>Vuelve pronto, ¡siempre hay algo nuevo en la isla!</p>
            </div>
          ) : (
            <div className="ev-grid">
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
      className="ev-card"
    >
      <div className="ev-card-media">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt={event.title} />
        ) : (
          <EventIcon size={48} strokeWidth={1.5} />
        )}
        {!soldOut && (
          <img src="/images/brand/sello-color.png" alt="" className="ev-card-seal" />
        )}
        {soldOut && (
          <div className="ev-card-soldout">
            <span>Agotado</span>
          </div>
        )}
      </div>

      <div className="ev-card-body">
        <p className="ev-card-date">{formatDate(event.date)} · {formatTime(event.time)}</p>
        <h3 className="ev-card-title">{event.title}</h3>
        <p className="ev-card-desc">{event.description}</p>

        <div className="ev-card-foot">
          <span className="ev-card-price">
            {formatCOP(event.pricePerPerson)} <span>/ persona</span>
          </span>
          {!soldOut && <span className="ev-card-spots">{spotsLeft} cupos</span>}
        </div>
      </div>
    </Link>
  );
}
