import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Check, PartyPopper } from 'lucide-react';
import { publicApi } from '../../api/public';
import { Event } from '../../types';
import { formatCOP } from '../../utils/formatCurrency';
import { formatDate, formatTime } from '../../utils/formatDate';
import { Input } from '../../components/ui/Input';
import { PageLoader } from '../../components/ui/Spinner';
import { useToast } from '../../hooks/useToast';
import { EventImage } from './EventImage';
import './eventsPublic.css';

const schema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(7, 'Teléfono inválido'),
  tickets: z.coerce.number().min(1).max(6),
  notes: z.string().default(''),
});

type FormData = z.infer<typeof schema>;

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tickets: 1 },
  });

  const tickets = watch('tickets');

  useEffect(() => {
    if (!id) return;
    if (event?.type === 'dinner-with-strangers') {
      navigate('/reservar/cena-con-desconocidos');
      return;
    }
    publicApi.getEvent(id)
      .then((r) => {
        if (r.data.type === 'dinner-with-strangers') {
          navigate('/reservar/cena-con-desconocidos');
          return;
        }
        setEvent(r.data);
      })
      .catch(() => toast.error('Evento no encontrado'))
      .finally(() => setLoading(false));
  }, [id]);

  const onSubmit = async (data: FormData) => {
    if (!id) return;
    try {
      await publicApi.bookEvent(id, data);
      setSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al procesar tu reserva';
      toast.error(msg);
    }
  };

  if (loading) return <PageLoader />;
  if (!event) return (
    <div className="ev-page ev-empty">
      <p>Evento no encontrado.</p>
      <Link to="/reservar/eventos" className="ev-btn-outline" style={{ marginTop: 16 }}>
        Ver todos los eventos
      </Link>
    </div>
  );

  const spotsLeft = event.maxCapacity - event.currentRegistrations;

  if (success) {
    return (
      <div className="ev-page ev-success">
        <div className="ev-success-icon">
          <Check size={40} strokeWidth={2.5} />
        </div>
        <h2 className="ev-title" style={{ fontSize: 32 }}>¡Cupo reservado!</h2>
        <p className="ev-lead" style={{ margin: '0 auto 26px' }}>
          Tu lugar para <strong>{event.title}</strong> está asegurado. Recibirás más información pronto.
        </p>
        <Link to="/reservar/eventos" className="ev-btn-primary">Ver más eventos</Link>
      </div>
    );
  }

  return (
    <div className="ev-page max-w-4xl mx-auto px-4 py-12">
      <Link to="/reservar/eventos" className="ev-back-link">
        <ArrowLeft size={16} />
        Todos los eventos
      </Link>

      <div className="ev-detail-grid">
        {/* Event Info */}
        <div className="space-y-5">
          <div className="ev-detail-media">
            <EventImage
              src={event.imageUrl}
              alt={event.title}
              fallback={(
                <PartyPopper
                  size={56}
                  strokeWidth={1.5}
                  className="text-white opacity-70"
                  aria-label="Imagen no disponible"
                />
              )}
            />
          </div>
          <div>
            <p className="ev-kicker">{formatDate(event.date)} · {formatTime(event.time)}</p>
            <h1 className="ev-title" style={{ fontSize: 'clamp(30px, 4.5vw, 46px)' }}>{event.title}</h1>
            <p className="ev-lead">{event.description}</p>
          </div>
          <div className="ev-detail-stats">
            <div className="ev-stat-box">
              <p>Precio por persona</p>
              <p>{formatCOP(event.pricePerPerson)}</p>
            </div>
            <div className="ev-stat-box">
              <p>Cupos disponibles</p>
              <p>{spotsLeft} de {event.maxCapacity}</p>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="ev-form-card">
          <h2 className="ev-form-title">Reservar mi cupo</h2>
          {spotsLeft <= 0 ? (
            <div className="text-center py-6">
              <p className="font-body text-error-ink font-medium">Este evento está agotado.</p>
              <Link to="/reservar/eventos" className="ev-btn-outline" style={{ marginTop: 14 }}>
                Ver otros eventos
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Nombre completo" error={errors.name?.message} {...register('name')} />
              <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
              <Input label="Teléfono" error={errors.phone?.message} {...register('phone')} />
              <div>
                <label className="text-sm font-medium text-island-dark font-body block mb-1">
                  Número de entradas (máx. {Math.min(6, spotsLeft)})
                </label>
                <input
                  type="number"
                  min={1}
                  max={Math.min(6, spotsLeft)}
                  className="input-base"
                  {...register('tickets')}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-island-dark font-body block mb-1">Notas (opcional)</label>
                <textarea className="input-base h-16 resize-none" {...register('notes')} />
              </div>
              <div style={{ borderTop: '2px dashed var(--ev-rule)', paddingTop: 16 }}>
                <div className="ev-form-total">
                  <span className="text-island-dark/70">Total ({tickets} entrada{Number(tickets) > 1 ? 's' : ''})</span>
                  <strong>{formatCOP(event.pricePerPerson * (Number(tickets) || 1))}</strong>
                </div>
                <button type="submit" className="ev-btn-primary" style={{ width: '100%' }} disabled={isSubmitting}>
                  {isSubmitting ? 'Enviando…' : 'Confirmar reserva'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
