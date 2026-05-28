import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Handshake, MessageCircle, Sparkles, Utensils } from 'lucide-react';
import { publicApi } from '../../api/public';
import { Event, AgeRange, ConversationType, DinnerStyle, PersonalityTag } from '../../types';
import { formatCOP } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { StepIndicator } from '../../components/StepIndicator';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../hooks/useToast';

const steps = ['Bienvenida', 'Tus datos', 'Cuestionario', 'Confirmación'];

interface FormState {
  // Step 2
  name: string;
  email: string;
  phone: string;
  ageRange: AgeRange | '';
  eventId: string;
  // Step 3
  socialEnergy: number;
  conversationType: ConversationType | '';
  workAttitude: number;
  hobbies: string[];
  spontaneity: number;
  dinnerStyle: DinnerStyle | '';
  personalityTag: PersonalityTag | '';
}

const hobbyOptions = [
  { value: 'reading', label: 'Lectura' },
  { value: 'sports', label: 'Deportes' },
  { value: 'cooking', label: 'Cocina' },
  { value: 'travel', label: 'Viajes' },
  { value: 'music', label: 'Música' },
  { value: 'art', label: 'Arte' },
  { value: 'gaming', label: 'Videojuegos' },
  { value: 'outdoors', label: 'Naturaleza' },
  { value: 'cinema', label: 'Cine' },
  { value: 'yoga', label: 'Yoga/Meditación' },
  { value: 'volunteering', label: 'Voluntariado' },
  { value: 'photography', label: 'Fotografía' },
];

export function DinnerWithStrangersPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Partial<FormState>>({ hobbies: [] });
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const toast = useToast();

  useEffect(() => {
    publicApi.getEvents({ type: 'dinner-with-strangers' })
      .then((r) => setEvents(r.data))
      .catch(() => {});
  }, []);

  const update = (fields: Partial<FormState>) => setForm((prev) => ({
    ...prev,
    ...fields,
    hobbies: fields.hobbies ?? prev.hobbies ?? [],
  }));

  const toggleHobby = (hobby: string) => {
    const current = form.hobbies || [];
    if (current.includes(hobby)) {
      update({ hobbies: current.filter((h) => h !== hobby) });
    } else if (current.length < 3) {
      update({ hobbies: [...current, hobby] });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await publicApi.registerDinnerGuest({
        eventId: form.eventId,
        name: form.name,
        email: form.email,
        phone: form.phone,
        ageRange: form.ageRange as AgeRange,
        compatibilityProfile: {
          socialEnergy: form.socialEnergy!,
          conversationType: form.conversationType as ConversationType,
          workAttitude: form.workAttitude!,
          hobbies: form.hobbies || [],
          spontaneity: form.spontaneity!,
          dinnerStyle: form.dinnerStyle as DinnerStyle,
          personalityTag: form.personalityTag as PersonalityTag,
        },
      });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al procesar tu registro';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 rounded-full bg-espresso flex items-center justify-center mx-auto mb-6 text-4xl">
          <Sparkles size={38} className="text-cream" />
        </div>
        <h1 className="font-body text-3xl font-bold text-espresso mb-4">¡Ya eres parte de la experiencia!</h1>
        <p className="font-body text-stone text-lg leading-relaxed mb-6">
          Tu perfil de compatibilidad ha sido registrado. Pronto recibirás un correo con los detalles de tu grupo y mesa asignada.
        </p>
        <p className="font-body text-stone text-sm mb-8">
          <strong>{form.name}</strong>, nos vemos en la cena. Algo nos dice que vas a amar a las personas de tu mesa.
        </p>
        <Button size="lg" onClick={() => window.location.href = '/'}>Volver al inicio</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <p className="text-terracotta font-body text-sm uppercase tracking-widest font-medium mb-2">Experiencia estrella</p>
        <h1 className="font-body text-3xl font-bold text-espresso">Cena con Desconocidos</h1>
      </div>

      <StepIndicator steps={steps} currentStep={step} />

      <div className="bg-white rounded-lg shadow-sm border border-rule p-8">
        {step === 1 && <WelcomeStep events={events} onNext={() => setStep(2)} />}
        {step === 2 && <PersonalInfoStep form={form} update={update} events={events} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && (
          <QuestionnaireStep
            form={form}
            update={update}
            hobbies={form.hobbies || []}
            toggleHobby={toggleHobby}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <ConfirmationStep
            form={form}
            events={events}
            onBack={() => setStep(3)}
            onSubmit={handleSubmit}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}

function WelcomeStep({ events, onNext }: { events: Event[]; onNext: () => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <Sparkles size={48} className="mx-auto mb-4 text-terracotta" />
        <h2 className="font-body text-2xl font-bold text-espresso mb-4">Una cena que cambia perspectivas</h2>
        <p className="font-body text-stone text-lg leading-relaxed">
          Llegarás a cenar con <strong>5 personas que no conoces</strong> pero con quienes tienes más en común de lo que crees.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <FeatureBox Icon={Handshake} title="Conexiones reales" desc="Grupos formados por algoritmo de compatibilidad" />
        <FeatureBox Icon={Utensils} title="Cena completa" desc="Menú de 3 tiempos con maridaje de café" />
        <FeatureBox Icon={MessageCircle} title="Conversaciones" desc="Preguntas detonadores incluidas en la mesa" />
      </div>
      {events.length > 0 && (
        <div className="bg-surface-tint rounded-xl p-4">
          <p className="text-sm font-body font-semibold text-espresso mb-2">Próximas fechas disponibles:</p>
          {events.map((e) => (
            <div key={e._id} className="flex justify-between text-sm font-body">
              <span>{formatDate(e.date)}</span>
              <span className="text-stone">{e.maxCapacity - e.currentRegistrations} cupos</span>
              <span className="font-medium text-espresso">{formatCOP(e.pricePerPerson)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-end">
        <Button onClick={onNext} size="lg">Quiero participar</Button>
      </div>
    </div>
  );
}

function FeatureBox({ Icon, title, desc }: { Icon: LucideIcon; title: string; desc: string }) {
  return (
    <div className="bg-surface-tint rounded-xl p-4">
      <Icon size={28} className="mx-auto mb-2 text-terracotta" />
      <p className="font-body font-semibold text-espresso text-sm">{title}</p>
      <p className="font-body text-stone text-xs mt-1">{desc}</p>
    </div>
  );
}

const ageRanges: Array<{ value: AgeRange; label: string }> = [
  { value: '18-24', label: '18–24' },
  { value: '25-32', label: '25–32' },
  { value: '33-40', label: '33–40' },
  { value: '41-50', label: '41–50' },
  { value: '50+', label: '50+' },
];

function PersonalInfoStep({ form, update, events, onNext, onBack }: {
  form: Partial<FormState>;
  update: (f: Partial<FormState>) => void;
  events: Event[];
  onNext: () => void;
  onBack: () => void;
}) {
  const [err, setErr] = useState('');

  const handleNext = () => {
    if (!form.name || !form.email || !form.phone || !form.ageRange || !form.eventId) {
      setErr('Por favor completa todos los campos.');
      return;
    }
    setErr('');
    onNext();
  };

  return (
    <div className="space-y-5">
      <h2 className="font-body text-xl font-semibold text-espresso">Cuéntanos sobre ti</h2>
      <Input label="Nombre completo" value={form.name || ''} onChange={(e) => update({ name: e.target.value })} />
      <Input label="Email" type="email" value={form.email || ''} onChange={(e) => update({ email: e.target.value })} />
      <Input label="Teléfono" value={form.phone || ''} onChange={(e) => update({ phone: e.target.value })} />

      <div>
        <label className="text-sm font-medium text-ink font-body block mb-2">Rango de edad</label>
        <div className="flex gap-2 flex-wrap">
          {ageRanges.map((r) => (
            <button
              key={r.value}
              onClick={() => update({ ageRange: r.value })}
              className={`px-4 py-2 rounded-xl font-body font-medium text-sm transition-all ${
                form.ageRange === r.value ? 'bg-espresso text-cream' : 'bg-surface-tint text-espresso hover:bg-surface-tint hover:text-espresso'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-ink font-body block mb-2">Selecciona la fecha de la cena</label>
        {events.length === 0 ? (
          <p className="text-stone font-body text-sm">No hay fechas disponibles en este momento.</p>
        ) : (
          <div className="space-y-2">
            {events.map((e) => (
              <button
                key={e._id}
                onClick={() => update({ eventId: e._id })}
                className={`w-full flex justify-between items-center p-3 rounded-xl border-2 text-left transition-all ${
                  form.eventId === e._id ? 'border-terracotta bg-terracotta bg-opacity-5' : 'border-rule hover:border-rule'
                }`}
              >
                <span className="font-body font-medium text-espresso">{formatDate(e.date)}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-stone font-body">{e.maxCapacity - e.currentRegistrations} cupos</span>
                  <span className="font-bold font-body text-espresso">{formatCOP(e.pricePerPerson)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {err && <p className="text-error-ink text-sm font-body">{err}</p>}
      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack}>Volver</Button>
        <Button onClick={handleNext}>Continuar</Button>
      </div>
    </div>
  );
}

function QuestionnaireStep({ form, update, hobbies, toggleHobby, onNext, onBack }: {
  form: Partial<FormState>;
  update: (f: Partial<FormState>) => void;
  hobbies: string[];
  toggleHobby: (h: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [err, setErr] = useState('');

  const handleNext = () => {
    if (!form.socialEnergy || !form.conversationType || !form.workAttitude || hobbies.length === 0 || !form.spontaneity || !form.dinnerStyle || !form.personalityTag) {
      setErr('Por favor responde todas las preguntas.');
      return;
    }
    setErr('');
    onNext();
  };

  return (
    <div className="space-y-7">
      <h2 className="font-body text-xl font-semibold text-espresso">Cuestionario de compatibilidad</h2>
      <p className="text-sm text-stone font-body -mt-3">Tus respuestas nos ayudan a encontrar a las personas más afines a ti.</p>

      {/* Q1: Social Energy */}
      <Question label="¿Cómo describirías tu energía social?">
        <ScaleSelector
          options={['Muy reservado/a', 'Reservado/a', 'Equilibrado/a', 'Sociable', 'Muy extrovertido/a']}
          value={form.socialEnergy}
          onChange={(v) => update({ socialEnergy: v })}
        />
      </Question>

      {/* Q2: Conversation Type */}
      <Question label="¿Qué tipo de conversaciones prefieres?">
        <OptionGrid
          options={[
            { value: 'deep', label: 'Filosofía y existencia' },
            { value: 'intellectual', label: 'Ciencia e innovación' },
            { value: 'creative', label: 'Arte, música y cultura' },
            { value: 'entrepreneurial', label: 'Negocios y emprendimiento' },
            { value: 'casual', label: 'Humor y entretenimiento' },
            { value: 'balanced', label: 'Todas por igual' },
          ]}
          value={form.conversationType}
          onChange={(v) => update({ conversationType: v as ConversationType })}
        />
      </Question>

      {/* Q3: Work Attitude */}
      <Question label="¿Cuál es tu relación con el trabajo?">
        <ScaleSelector
          options={['Trabajo para vivir', '', 'Intento balancear', '', 'Es mi pasión']}
          value={form.workAttitude}
          onChange={(v) => update({ workAttitude: v })}
          showLabelsOnly={[1, 3, 5]}
        />
      </Question>

      {/* Q4: Hobbies */}
      <Question label="¿Qué haces en tu tiempo libre? (elige hasta 3)">
        <div className="flex flex-wrap gap-2">
          {hobbyOptions.map((h) => (
            <button
              key={h.value}
              onClick={() => toggleHobby(h.value)}
              disabled={!hobbies.includes(h.value) && hobbies.length >= 3}
              className={`px-3 py-1.5 rounded-full text-sm font-body font-medium transition-all ${
                hobbies.includes(h.value)
                  ? 'bg-espresso text-cream'
                  : 'bg-surface-tint text-espresso hover:bg-surface-tint hover:text-espresso disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </Question>

      {/* Q5: Spontaneity */}
      <Question label="¿Cuál es tu postura frente a los planes espontáneos?">
        <ScaleSelector
          options={['Los evito', '', 'Los acepto si hay tiempo', '', 'Los adoro']}
          value={form.spontaneity}
          onChange={(v) => update({ spontaneity: v })}
          showLabelsOnly={[1, 3, 5]}
        />
      </Question>

      {/* Q6: Dinner Style */}
      <Question label="¿Qué describes como una cena perfecta?">
        <OptionGrid
          options={[
            { value: 'intimate', label: 'Íntima, 2–4 personas, conversación profunda' },
            { value: 'lively', label: 'Animada, varios, risas y dinamismo' },
            { value: 'experiential', label: 'Temática o con actividad' },
          ]}
          value={form.dinnerStyle}
          onChange={(v) => update({ dinnerStyle: v as DinnerStyle })}
        />
      </Question>

      {/* Q7: Personality Tag */}
      <Question label="¿Con qué frase te identificas más?">
        <OptionGrid
          options={[
            { value: 'intellectual', label: '"Las ideas cambian el mundo"' },
            { value: 'empathetic', label: '"Las personas hacen la diferencia"' },
            { value: 'aesthetic', label: '"El placer está en los detalles"' },
            { value: 'adventurous', label: '"La vida es demasiado corta para aburrirse"' },
          ]}
          value={form.personalityTag}
          onChange={(v) => update({ personalityTag: v as PersonalityTag })}
        />
      </Question>

      {err && <p className="text-error-ink text-sm font-body">{err}</p>}
      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack}>Volver</Button>
        <Button onClick={handleNext}>Ver resumen</Button>
      </div>
    </div>
  );
}

function Question({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="font-body font-medium text-espresso">{label}</p>
      {children}
    </div>
  );
}

function ScaleSelector({ options, value, onChange, showLabelsOnly }: {
  options: string[];
  value?: number;
  onChange: (v: number) => void;
  showLabelsOnly?: number[];
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {options.map((_, i) => (
          <button
            key={i}
            onClick={() => onChange(i + 1)}
            className={`flex-1 py-3 rounded-xl font-body font-bold text-sm transition-all ${
              value === i + 1 ? 'bg-terracotta text-cream' : 'bg-surface-tint text-espresso hover:bg-surface-tint hover:text-espresso'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-stone font-body px-1">
        <span>{options[0]}</span>
        <span>{options[options.length - 1]}</span>
      </div>
    </div>
  );
}

function OptionGrid({ options, value, onChange }: {
  options: Array<{ value: string; label: string }>;
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-3 rounded-xl font-body text-sm text-left transition-all ${
            value === opt.value
              ? 'bg-espresso text-cream'
              : 'bg-surface-tint text-espresso hover:bg-surface-tint hover:text-espresso'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const conversationLabels: Record<string, string> = {
  deep: 'Filosofía y existencia',
  intellectual: 'Ciencia e innovación',
  creative: 'Arte, música y cultura',
  entrepreneurial: 'Negocios y emprendimiento',
  casual: 'Humor y entretenimiento',
  balanced: 'Todas por igual',
};

const dinnerStyleLabels: Record<string, string> = {
  intimate: 'Íntima y profunda',
  lively: 'Animada y dinámica',
  experiential: 'Temática o con actividad',
};

const personalityLabels: Record<string, string> = {
  intellectual: 'Las ideas cambian el mundo',
  empathetic: 'Las personas hacen la diferencia',
  aesthetic: 'El placer está en los detalles',
  adventurous: 'La vida es corta para aburrirse',
};

const socialEnergyLabels: Record<number, string> = {
  1: 'Muy reservado/a',
  2: 'Reservado/a',
  3: 'Equilibrado/a',
  4: 'Sociable',
  5: 'Muy extrovertido/a',
};

function ConfirmationStep({ form, events, onBack, onSubmit, loading }: {
  form: Partial<FormState>;
  events: Event[];
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  const selectedEvent = events.find((e) => e._id === form.eventId);

  return (
    <div className="space-y-6">
      <h2 className="font-body text-xl font-semibold text-espresso">Confirma tu registro</h2>

      <div className="bg-surface-tint rounded-xl p-5 space-y-3 text-sm font-body">
        <SummaryRow label="Nombre" value={form.name || ''} />
        <SummaryRow label="Email" value={form.email || ''} />
        <SummaryRow label="Fecha de la cena" value={selectedEvent ? formatDate(selectedEvent.date) : ''} />
        <SummaryRow label="Edad" value={form.ageRange || ''} />
        <SummaryRow label="Energía social" value={socialEnergyLabels[form.socialEnergy || 0] || ''} />
        <SummaryRow label="Conversaciones" value={conversationLabels[form.conversationType || ''] || ''} />
        <SummaryRow label="Hobbies" value={(form.hobbies || []).join(', ')} />
        <SummaryRow label="Estilo de cena" value={dinnerStyleLabels[form.dinnerStyle || ''] || ''} />
        <SummaryRow label="Personalidad" value={personalityLabels[form.personalityTag || ''] || ''} />
      </div>

      <div className="bg-surface-tint rounded-xl p-4 text-sm font-body text-stone">
        <p className="font-medium text-espresso mb-1">¿Cómo funciona la asignación de grupos?</p>
        <p>Usamos un algoritmo de compatibilidad que analiza tus respuestas y te asigna automáticamente al grupo con el que tienes más afinidad. Recibirás los detalles de tu mesa por correo antes de la cena.</p>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="secondary" onClick={onBack}>Volver</Button>
        <Button onClick={onSubmit} loading={loading} size="lg">
          <span className="inline-flex items-center gap-2">
            Registrarme
            <Sparkles size={16} />
          </span>
        </Button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-stone shrink-0">{label}</span>
      <span className="font-medium text-espresso text-right">{value}</span>
    </div>
  );
}
