// Formats a number as Colombian Pesos: $45.000
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Returns just the number formatted: 45.000
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('es-CO').format(amount);
}

// Cost module: 2-decimal COP for unit costs — $3,50
export function formatCOPDecimal(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Percentage with 1 decimal — 0,0%
export function formatPct(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}
