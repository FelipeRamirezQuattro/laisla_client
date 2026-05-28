interface BadgeProps {
  label: string;
  variant?: 'green' | 'yellow' | 'red' | 'blue' | 'brown' | 'gray';
}

const variantClasses = {
  green:  'bg-success-tint text-success-ink',
  yellow: 'bg-warning-tint text-warning-ink',
  red:    'bg-error-tint text-error-ink',
  blue:   'bg-info-tint text-info-ink',
  brown:  'bg-surface-tint text-espresso',
  gray:   'bg-rule text-stone',
};

export function Badge({ label, variant = 'gray' }: BadgeProps) {
  return (
    <span className={`badge ${variantClasses[variant]}`}>
      {label}
    </span>
  );
}

// Status-specific badge helpers
export function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    pending:      { label: 'Pendiente',  variant: 'yellow' },
    'in-progress':{ label: 'En proceso', variant: 'blue'   },
    ready:        { label: 'Listo',      variant: 'green'  },
    delivered:    { label: 'Entregado',  variant: 'blue'   },
    billed:       { label: 'Facturado',  variant: 'gray'   },
    cancelled:    { label: 'Cancelado',  variant: 'red'    },
  };
  const info = map[status] || { label: status, variant: 'gray' };
  return <Badge label={info.label} variant={info.variant} />;
}

export function TableStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    available: { label: 'Disponible', variant: 'green'  },
    occupied:  { label: 'Ocupada',    variant: 'red'    },
    reserved:  { label: 'Reservada',  variant: 'yellow' },
  };
  const info = map[status] || { label: status, variant: 'gray' };
  return <Badge label={info.label} variant={info.variant} />;
}

export function ReservationStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    pending:   { label: 'Pendiente',  variant: 'yellow' },
    confirmed: { label: 'Confirmada', variant: 'green'  },
    cancelled: { label: 'Cancelada',  variant: 'red'    },
    completed: { label: 'Completada', variant: 'gray'   },
    'no-show': { label: 'No asistió', variant: 'brown'  },
  };
  const info = map[status] || { label: status, variant: 'gray' };
  return <Badge label={info.label} variant={info.variant} />;
}

export function EventStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    upcoming:  { label: 'Próximo',    variant: 'blue'  },
    active:    { label: 'Activo',     variant: 'green' },
    cancelled: { label: 'Cancelado',  variant: 'red'   },
    completed: { label: 'Completado', variant: 'gray'  },
  };
  const info = map[status] || { label: status, variant: 'gray' };
  return <Badge label={info.label} variant={info.variant} />;
}
