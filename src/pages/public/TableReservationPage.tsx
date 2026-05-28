import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Leaf, Monitor, PartyPopper, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { publicApi } from '../../api/public';
import { Reservation } from '../../types';
import { StepIndicator } from '../../components/StepIndicator';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { formatDate } from '../../utils/formatDate';

const steps = ['Fecha y hora', 'Zona', 'Tus datos', 'Ocasión', 'Confirmación'];

const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

const zoneInfo = [
  {
    value: 'social',
    label: 'Zona Social',
    description: 'Mesas compartidas en el corazón de la cafetería. Perfecta para conversaciones animadas.',
    Icon: Users,
  },
  {
    value: 'work-cafe',
    label: 'Work Café',
    description: 'Puestos de trabajo con enchufes, buena luz y el silencio necesario para enfocarse.',
    Icon: Monitor,
  },
  {
    value: 'terrace',
    label: 'Terraza',
    description: 'Espacio al aire libre rodeado de plantas. Ideal para reuniones informales y tardes de café.',
    Icon: Leaf,
  },
] satisfies Array<{ value: string; label: string; description: string; Icon: LucideIcon }>;

const occasionOptions = [
  { value: 'birthday', label: 'Cumpleaños' },
  { value: 'anniversary', label: 'Aniversario' },
  { value: 'business meeting', label: 'Reunión de negocios' },
  { value: 'first date', label: 'Primera cita' },
  { value: 'celebration', label: 'Celebración' },
  { value: 'other', label: 'Otro' },
];

interface FormState {
  date: string;
  timeSlot: string;
  partySize: number;
  zone: string;
  clientName: string;
  email: string;
  phone: string;
  hasOccasion: boolean;
  occasionType: string;
  occasionNotes: string;
}

export function TableReservationPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const update = (fields: Partial<FormState>) => setForm((prev) => ({ ...prev, ...fields }));

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        clientName: form.clientName,
        email: form.email,
        phone: form.phone,
        date: form.date,
        timeSlot: form.timeSlot,
        partySize: form.partySize,
        zone: form.zone,
        specialOccasion: {
          hasOccasion: form.hasOccasion || false,
          type: form.hasOccasion ? form.occasionType : undefined,
          notes: form.occasionNotes || '',
        },
      };
      const res = await publicApi.createReservation(payload as Partial<Reservation>);
      navigate('/reservar/mesa/exito', { state: { reservation: res.data } });
    } catch {
      setError('Hubo un error al procesar tu reservación. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="font-body text-3xl font-bold text-espresso">Reservar una mesa</h1>
        <p className="font-body text-stone mt-2">Completa los siguientes pasos para reservar tu espacio en La Isla Café.</p>
      </div>

      <StepIndicator steps={steps} currentStep={step} />

      <div className="bg-white rounded-lg shadow-sm border border-rule p-8">
        {/* Step 1 */}
        {step === 1 && (
          <Step1 form={form} update={update} onNext={() => setStep(2)} />
        )}
        {/* Step 2 */}
        {step === 2 && (
          <Step2 form={form} update={update} onNext={() => setStep(3)} onBack={() => setStep(1)} />
        )}
        {/* Step 3 */}
        {step === 3 && (
          <Step3 form={form} update={update} onNext={() => setStep(4)} onBack={() => setStep(2)} />
        )}
        {/* Step 4 */}
        {step === 4 && (
          <Step4 form={form} update={update} onNext={() => setStep(5)} onBack={() => setStep(3)} />
        )}
        {/* Step 5 */}
        {step === 5 && (
          <Step5 form={form} onBack={() => setStep(4)} onSubmit={submit} loading={loading} error={error} />
        )}
      </div>
    </div>
  );
}

function Step1({ form, update, onNext }: { form: Partial<FormState>; update: (f: Partial<FormState>) => void; onNext: () => void }) {
  const [err, setErr] = useState('');

  const handleNext = () => {
    if (!form.date || !form.timeSlot || !form.partySize) {
      setErr('Por favor completa todos los campos.');
      return;
    }
    setErr('');
    onNext();
  };

  return (
    <div className="space-y-5">
      <h2 className="font-body text-xl font-semibold text-espresso">Selecciona fecha y hora</h2>
      <Input
        label="Fecha"
        type="date"
        value={form.date || ''}
        min={new Date().toISOString().split('T')[0]}
        onChange={(e) => update({ date: e.target.value })}
      />
      <div>
        <label className="text-sm font-medium text-ink font-body block mb-2">Horario</label>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {timeSlots.map((t) => (
            <button
              key={t}
              onClick={() => update({ timeSlot: t })}
              className={`py-2 rounded-lg text-sm font-body font-medium transition-all ${
                form.timeSlot === t
                  ? 'bg-terracotta text-cream'
                  : 'bg-surface-tint text-espresso hover:bg-surface-tint hover:text-espresso'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-ink font-body block mb-2">Número de personas</label>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <button
              key={n}
              onClick={() => update({ partySize: n })}
              className={`w-12 h-12 rounded-xl text-sm font-body font-medium transition-all ${
                form.partySize === n
                  ? 'bg-espresso text-cream'
                  : 'bg-surface-tint text-espresso hover:bg-surface-tint hover:text-espresso'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      {err && <p className="text-error-ink text-sm font-body">{err}</p>}
      <div className="flex justify-end pt-2">
        <Button onClick={handleNext}>Continuar</Button>
      </div>
    </div>
  );
}

function Step2({ form, update, onNext, onBack }: { form: Partial<FormState>; update: (f: Partial<FormState>) => void; onNext: () => void; onBack: () => void }) {
  const [err, setErr] = useState('');

  const handleNext = () => {
    if (!form.zone) { setErr('Selecciona una zona.'); return; }
    setErr('');
    onNext();
  };

  return (
    <div className="space-y-5">
      <h2 className="font-body text-xl font-semibold text-espresso">¿Qué zona prefieres?</h2>
      <div className="space-y-3">
        {zoneInfo.map((z) => {
          const ZoneIcon = z.Icon;
          return (
          <button
            key={z.value}
            onClick={() => update({ zone: z.value })}
            className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
              form.zone === z.value
                ? 'border-terracotta bg-terracotta bg-opacity-5'
                : 'border-rule hover:border-rule-strong'
            }`}
          >
            <span className="mt-0.5 text-terracotta">
              <ZoneIcon size={28} />
            </span>
            <div>
              <p className="font-body font-semibold text-espresso">{z.label}</p>
              <p className="font-body text-stone text-sm">{z.description}</p>
            </div>
          </button>
        )})}
      </div>
      {err && <p className="text-error-ink text-sm font-body">{err}</p>}
      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack}>Volver</Button>
        <Button onClick={handleNext}>Continuar</Button>
      </div>
    </div>
  );
}

const step3Schema = z.object({
  clientName: z.string().min(2, 'Nombre muy corto'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(7, 'Teléfono inválido'),
});

function Step3({ form, update, onNext, onBack }: { form: Partial<FormState>; update: (f: Partial<FormState>) => void; onNext: () => void; onBack: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<{ clientName: string; email: string; phone: string }>({
    resolver: zodResolver(step3Schema),
    defaultValues: { clientName: form.clientName || '', email: form.email || '', phone: form.phone || '' },
  });

  const onValid = (data: { clientName: string; email: string; phone: string }) => {
    update(data);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-5">
      <h2 className="font-body text-xl font-semibold text-espresso">Tus datos de contacto</h2>
      <Input label="Nombre completo" error={errors.clientName?.message} {...register('clientName')} />
      <Input label="Correo electrónico" type="email" error={errors.email?.message} {...register('email')} />
      <Input label="Teléfono" type="tel" error={errors.phone?.message} {...register('phone')} />
      <div className="flex justify-between pt-2">
        <Button variant="secondary" type="button" onClick={onBack}>Volver</Button>
        <Button type="submit">Continuar</Button>
      </div>
    </form>
  );
}

function Step4({ form, update, onNext, onBack }: { form: Partial<FormState>; update: (f: Partial<FormState>) => void; onNext: () => void; onBack: () => void }) {
  return (
    <div className="space-y-5">
      <h2 className="font-body text-xl font-semibold text-espresso">¿Es una ocasión especial?</h2>
      <div className="flex gap-3">
        <button
          onClick={() => update({ hasOccasion: false })}
          className={`flex-1 py-3 rounded-xl font-body font-medium border-2 transition-all ${
            form.hasOccasion === false ? 'border-espresso bg-espresso text-cream' : 'border-rule hover:border-rule'
          }`}
        >
          No, es una visita normal
        </button>
        <button
          onClick={() => update({ hasOccasion: true })}
          className={`flex-1 py-3 rounded-xl font-body font-medium border-2 transition-all ${
            form.hasOccasion === true ? 'border-terracotta bg-terracotta text-cream' : 'border-rule hover:border-terracotta'
          }`}
        >
          <span className="inline-flex items-center justify-center gap-2">
            <PartyPopper size={17} />
            ¡Sí, es especial!
          </span>
        </button>
      </div>

      {form.hasOccasion && (
        <div className="space-y-4 border-t border-rule pt-4">
          <Select
            label="Tipo de ocasión"
            options={occasionOptions}
            placeholder="Seleccionar..."
            value={form.occasionType || ''}
            onChange={(e) => update({ occasionType: e.target.value })}
          />
          <div>
            <label className="text-sm font-medium text-ink font-body block mb-1">Notas adicionales (opcional)</label>
            <textarea
              className="input-base h-20 resize-none"
              placeholder="¿Algo que debamos saber para hacer tu visita especial?"
              value={form.occasionNotes || ''}
              onChange={(e) => update({ occasionNotes: e.target.value })}
            />
          </div>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack}>Volver</Button>
        <Button onClick={onNext} disabled={form.hasOccasion === undefined}>Continuar</Button>
      </div>
    </div>
  );
}

const zoneLabels: Record<string, string> = { social: 'Zona Social', 'work-cafe': 'Work Café', terrace: 'Terraza' };
const occasionLabels: Record<string, string> = {
  birthday: 'Cumpleaños', anniversary: 'Aniversario', 'business meeting': 'Reunión de negocios',
  'first date': 'Primera cita', celebration: 'Celebración', other: 'Otro',
};

function Step5({ form, onBack, onSubmit, loading, error }: { form: Partial<FormState>; onBack: () => void; onSubmit: () => void; loading: boolean; error: string }) {
  return (
    <div className="space-y-6">
      <h2 className="font-body text-xl font-semibold text-espresso">Confirma tu reservación</h2>
      <div className="bg-surface-tint rounded-xl p-5 space-y-3 text-sm font-body">
        <Row label="Fecha" value={form.date ? formatDate(form.date) : ''} />
        <Row label="Horario" value={form.timeSlot || ''} />
        <Row label="Personas" value={`${form.partySize} persona(s)`} />
        <Row label="Zona" value={zoneLabels[form.zone || ''] || form.zone || ''} />
        <Row label="Nombre" value={form.clientName || ''} />
        <Row label="Email" value={form.email || ''} />
        <Row label="Teléfono" value={form.phone || ''} />
        {form.hasOccasion && (
          <Row label="Ocasión especial" value={occasionLabels[form.occasionType || ''] || form.occasionType || ''} />
        )}
      </div>
      {error && <p className="text-error-ink text-sm font-body">{error}</p>}
      <p className="text-xs text-stone font-body">
        Al confirmar, aceptas que tu reservación está sujeta a disponibilidad. Te contactaremos por email para confirmar.
      </p>
      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack}>Volver</Button>
        <Button onClick={onSubmit} loading={loading} size="lg">Confirmar reservación</Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-stone">{label}</span>
      <span className="font-medium text-espresso">{value}</span>
    </div>
  );
}
