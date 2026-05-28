import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { Reservation } from '../../types';
import { formatDate, formatTime } from '../../utils/formatDate';

const zoneLabels: Record<string, string> = { social: 'Zona Social', 'work-cafe': 'Work Café', terrace: 'Terraza' };

export function ReservationSuccessPage() {
  const location = useLocation();
  const reservation = location.state?.reservation as Reservation | undefined;

  if (!reservation) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-stone font-body">No se encontró información de la reservación.</p>
        <Link to="/" className="mt-4 inline-block text-terracotta font-body font-medium">Volver al inicio</Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-success-tint flex items-center justify-center mx-auto mb-5">
          <Check size={40} className="text-success" />
        </div>
        <h1 className="font-body text-3xl font-bold text-espresso">¡Reservación confirmada!</h1>
        <p className="font-body text-stone mt-2">
          Te esperamos en La Isla Café. Guarda tu código de confirmación.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-rule shadow-sm p-8">
        {/* Confirmation Code */}
        <div className="text-center mb-6 pb-6 border-b border-rule">
          <p className="text-xs text-stone font-body uppercase tracking-widest mb-2">Código de confirmación</p>
          <p className="font-mono text-4xl font-bold text-espresso tracking-widest">{reservation.confirmationCode}</p>
        </div>

        {/* Details */}
        <div className="space-y-3 text-sm font-body">
          <InfoRow label="Nombre" value={reservation.clientName} />
          <InfoRow label="Fecha" value={formatDate(reservation.date)} />
          <InfoRow label="Horario" value={formatTime(reservation.timeSlot)} />
          <InfoRow label="Personas" value={`${reservation.partySize} persona(s)`} />
          <InfoRow label="Zona" value={zoneLabels[reservation.zone] || reservation.zone} />
          {reservation.specialOccasion?.hasOccasion && (
            <InfoRow label="Ocasión especial" value={<span className="inline-flex items-center gap-1"><Check size={14} /> Registrada</span>} />
          )}
        </div>
      </div>

      <p className="text-center text-sm text-stone font-body mt-6">
        Recibirás un correo de confirmación en <strong>{reservation.email}</strong>
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Link
          to="/"
          className="flex-1 text-center py-3 rounded-xl border-2 border-rule text-espresso font-body font-medium hover:bg-surface-tint transition-all"
        >
          Volver al inicio
        </Link>
        <Link
          to="/reservar/eventos"
          className="flex-1 text-center py-3 rounded-xl bg-espresso text-cream font-body font-medium hover:bg-surface-tint transition-all"
        >
          Ver eventos
        </Link>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-rule last:border-0">
      <span className="text-stone">{label}</span>
      <span className="font-medium text-espresso">{value}</span>
    </div>
  );
}
