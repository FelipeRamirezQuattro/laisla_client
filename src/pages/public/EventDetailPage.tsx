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
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageLoader } from '../../components/ui/Spinner';
import { useToast } from '../../hooks/useToast';

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
    <div className="text-center py-20">
      <p className="font-body text-stone">Evento no encontrado.</p>
      <Link to="/reservar/eventos" className="text-terracotta font-body font-medium mt-2 inline-block">Ver todos los eventos</Link>
    </div>
  );

  const spotsLeft = event.maxCapacity - event.currentRegistrations;

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-success-tint flex items-center justify-center mx-auto mb-5">
          <Check size={40} className="text-success" />
        </div>
        <h2 className="font-body text-2xl font-bold text-espresso mb-3">¡Cupo reservado!</h2>
        <p className="font-body text-stone mb-6">Tu lugar para <strong>{event.title}</strong> está asegurado. Recibirás más información pronto.</p>
        <Link to="/reservar/eventos" className="btn-primary inline-flex">Ver más eventos</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link to="/reservar/eventos" className="text-sm font-body text-stone hover:text-espresso flex items-center gap-1 mb-6">
        <ArrowLeft size={16} />
        Todos los eventos
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Event Info */}
        <div className="lg:col-span-3 space-y-5">
          <div className="h-56 bg-espresso rounded-lg flex items-center justify-center overflow-hidden">
            {event.imageUrl ? (
              <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <PartyPopper size={64} className="text-cream opacity-50" />
            )}
          </div>
          <div>
            <p className="text-xs text-terracotta font-body uppercase tracking-widest font-medium mb-2">
              {formatDate(event.date)} · {formatTime(event.time)}
            </p>
            <h1 className="font-body text-3xl font-bold text-espresso mb-3">{event.title}</h1>
            <p className="font-body text-stone leading-relaxed">{event.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm font-body">
            <div className="bg-surface-tint rounded-xl p-4">
              <p className="text-stone text-xs mb-1">Precio por persona</p>
              <p className="font-bold text-espresso text-lg">{formatCOP(event.pricePerPerson)}</p>
            </div>
            <div className="bg-surface-tint rounded-xl p-4">
              <p className="text-stone text-xs mb-1">Cupos disponibles</p>
              <p className="font-bold text-espresso text-lg">{spotsLeft} de {event.maxCapacity}</p>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-rule shadow-sm p-6 sticky top-6">
            <h2 className="font-body text-xl font-semibold text-espresso mb-4">Reservar mi cupo</h2>
            {spotsLeft <= 0 ? (
              <div className="text-center py-8">
                <p className="font-body text-error-ink font-medium">Este evento está agotado.</p>
                <Link to="/reservar/eventos" className="text-sm font-body text-terracotta mt-2 inline-block">Ver otros eventos</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Nombre completo" error={errors.name?.message} {...register('name')} />
                <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
                <Input label="Teléfono" error={errors.phone?.message} {...register('phone')} />
                <div>
                  <label className="text-sm font-medium text-ink font-body block mb-1">
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
                  <label className="text-sm font-medium text-ink font-body block mb-1">Notas (opcional)</label>
                  <textarea className="input-base h-16 resize-none" {...register('notes')} />
                </div>
                <div className="border-t border-rule pt-4">
                  <div className="flex justify-between text-sm font-body mb-4">
                    <span className="text-stone">Total ({tickets} entrada{Number(tickets) > 1 ? 's' : ''})</span>
                    <span className="font-bold text-espresso">{formatCOP(event.pricePerPerson * (Number(tickets) || 1))}</span>
                  </div>
                  <Button type="submit" className="w-full" loading={isSubmitting} size="lg">Confirmar reserva</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
