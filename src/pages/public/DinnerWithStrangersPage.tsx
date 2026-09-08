import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Handshake, MessageCircle, Sparkles, Utensils } from 'lucide-react';
import { publicApi } from '../../api/public';
import { Event, AgeRange, ConversationType, DinnerStyle, PersonalityTag } from '../../types';
import { formatCOP } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { StepIndicator } from '../../components/StepIndicator';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../hooks/useToast';
import './eventsPublic.css';

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
      <div className="ev-page ev-success">
        <div className="ev-success-icon">
          <Sparkles size={38} strokeWidth={2} />
        </div>
        <h1 className="ev-title" style={{ fontSize: 34 }}>¡Ya eres parte de la experiencia!</h1>
        <p className="ev-lead" style={{ margin: '0 auto 18px' }}>
          Tu perfil de compatibilidad ha sido registrado. Pronto recibirás un correo con los detalles de tu grupo y mesa asignada.
        </p>
        <p className="ev-lead" style={{ margin: '0 auto 28px', fontSize: 14.5 }}>
          <strong>{form.name}</strong>, nos vemos en la cena. Algo nos dice que vas a amar a las personas de tu mesa.
        </p>
        <button className="ev-btn-primary" onClick={() => window.location.href = '/'}>Volver al inicio</button>
      </div>
    );
  }

  return (
    <div className="ev-page max-w-2xl mx-auto px-4 py-12">
      <div className="ev-wizard-head">
        <p className="ev-kicker">Experiencia estrella</p>
        <h1 className="ev-title">Cena con Desconocidos</h1>
      </div>

      <StepIndicator steps={steps} currentStep={step} />

      <div className="ev-wizard-card">
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
      <div className="text-center py-2">
        <Sparkles size={44} strokeWidth={1.5} className="mx-auto mb-4" style={{ color: 'var(--ev-blue)' }} />
        <h2 className="ev-title" style={{ fontSize: 28 }}>Una cena que cambia perspectivas</h2>
        <p className="ev-lead" style={{ margin: '0 auto' }}>
          Llegarás a cenar con <strong>5 personas que no conoces</strong> pero con quienes tienes más en común de lo que crees.
        </p>
      </div>
      <div className="ev-feature-grid">
        <FeatureBox Icon={Handshake} title="Conexiones reales" desc="Grupos formados por algoritmo de compatibilidad" />
        <FeatureBox Icon={Utensils} title="Cena completa" desc="Menú de 3 tiempos con maridaje de café" />
        <FeatureBox Icon={MessageCircle} title="Conversaciones" desc="Preguntas detonadores incluidas en la mesa" />
      </div>
      {events.length > 0 && (
        <div className="ev-info-box">
          <p style={{ fontWeight: 800, color: 'var(--ev-dark)', marginBottom: 8 }}>Próximas fechas disponibles:</p>
          {events.map((e) => (
            <div key={e._id} className="ev-summary-row" style={{ padding: '4px 0' }}>
              <span>{formatDate(e.date)}</span>
              <span>{e.maxCapacity - e.currentRegistrations} cupos · {formatCOP(e.pricePerPerson)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-end">
        <button className="ev-btn-primary" onClick={onNext}>Quiero participar →</button>
      </div>
    </div>
  );
}

function FeatureBox({ Icon, title, desc }: { Icon: LucideIcon; title: string; desc: string }) {
  return (
    <div className="ev-feature-box">
      <Icon size={26} strokeWidth={1.75} />
      <p>{title}</p>
      <p>{desc}</p>
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
      <h2 className="ev-form-title" style={{ margin: 0 }}>Cuéntanos sobre ti</h2>
      <Input label="Nombre completo" value={form.name || ''} onChange={(e) => update({ name: e.target.value })} />
      <Input label="Email" type="email" value={form.email || ''} onChange={(e) => update({ email: e.target.value })} />
      <Input label="Teléfono" value={form.phone || ''} onChange={(e) => update({ phone: e.target.value })} />

      <div>
        <label className="text-sm font-medium text-island-dark font-body block mb-2">Rango de edad</label>
        <div className="ev-choice-row">
          {ageRanges.map((r) => (
            <button
              key={r.value}
              onClick={() => update({ ageRange: r.value })}
              className={`ev-choice-btn ${form.ageRange === r.value ? 'is-active' : ''}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-island-dark font-body block mb-2">Selecciona la fecha de la cena</label>
        {events.length === 0 ? (
          <p className="text-island-dark/70 font-body text-sm">No hay fechas disponibles en este momento.</p>
        ) : (
          <div className="space-y-2">
            {events.map((e) => (
              <button
                key={e._id}
                onClick={() => update({ eventId: e._id })}
                className={`ev-choice-card ${form.eventId === e._id ? 'is-active' : ''}`}
              >
                <span style={{ fontWeight: 700 }}>{formatDate(e.date)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
                  <span style={{ color: 'var(--ev-muted)' }}>{e.maxCapacity - e.currentRegistrations} cupos</span>
                  <span style={{ fontWeight: 800 }}>{formatCOP(e.pricePerPerson)}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {err && <p className="text-error-ink text-sm font-body">{err}</p>}
      <div className="flex justify-between pt-2">
        <button className="ev-btn-outline" onClick={onBack}>Volver</button>
        <button className="ev-btn-primary" onClick={handleNext}>Continuar</button>
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
      <div>
        <h2 className="ev-form-title" style={{ margin: 0 }}>Cuestionario de compatibilidad</h2>
        <p className="ev-lead" style={{ marginTop: 4 }}>Tus respuestas nos ayudan a encontrar a las personas más afines a ti.</p>
      </div>

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
        <div className="ev-choice-row">
          {hobbyOptions.map((h) => (
            <button
              key={h.value}
              onClick={() => toggleHobby(h.value)}
              disabled={!hobbies.includes(h.value) && hobbies.length >= 3}
              className={`ev-choice-btn ${hobbies.includes(h.value) ? 'is-active' : ''}`}
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
        <button className="ev-btn-outline" onClick={onBack}>Volver</button>
        <button className="ev-btn-primary" onClick={handleNext}>Ver resumen</button>
      </div>
    </div>
  );
}

function Question({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="font-body font-medium text-island-dark">{label}</p>
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
      <div className="ev-scale-row">
        {options.map((_, i) => (
          <button
            key={i}
            onClick={() => onChange(i + 1)}
            className={`ev-scale-btn ${value === i + 1 ? 'is-active' : ''}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div className="ev-scale-labels">
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
    <div className="ev-option-grid">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`ev-option-btn ${value === opt.value ? 'is-active' : ''}`}
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
      <h2 className="ev-form-title" style={{ margin: 0 }}>Confirma tu registro</h2>

      <div className="ev-info-box space-y-3">
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

      <div className="ev-info-box">
        <p style={{ fontWeight: 800, color: 'var(--ev-dark)', marginBottom: 6 }}>¿Cómo funciona la asignación de grupos?</p>
        <p style={{ color: 'var(--ev-muted)', fontSize: 14, margin: 0 }}>
          Usamos un algoritmo de compatibilidad que analiza tus respuestas y te asigna automáticamente al grupo con el que tienes más afinidad. Recibirás los detalles de tu mesa por correo antes de la cena.
        </p>
      </div>

      <div className="flex justify-between pt-2">
        <button className="ev-btn-outline" onClick={onBack}>Volver</button>
        <button className="ev-btn-primary" onClick={onSubmit} disabled={loading}>
          {loading ? 'Enviando…' : 'Registrarme'} <Sparkles size={16} />
        </button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="ev-summary-row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
