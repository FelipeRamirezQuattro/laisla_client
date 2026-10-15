import { AlertTriangle } from 'lucide-react';
import type { ClosingDifferenceDetails } from '../../types';
import { formatCOP } from '../../utils/formatCurrency';

export function ClosingDifferencePanel({ problem }: { problem: { message: string; details: ClosingDifferenceDetails } }) {
  const { details: d } = problem;
  const missing = d.difference < 0;
  const rows: Array<[string, string]> = [
    ['Base inicial', formatCOP(d.openingFloat)],
    ['+ Ventas en efectivo', formatCOP(d.cashSales)],
    ['+ Ingresos de efectivo', formatCOP(d.totalCashIn)],
    ['− Retiros', formatCOP(d.totalWithdrawals)],
    ['− Gastos pagados en efectivo', formatCOP(d.totalExpenses)],
  ];

  return (
    <div role="alert" className="rounded-lg border border-error bg-error-tint p-4 space-y-3 text-sm font-body text-error-ink">
      <div className="flex items-start gap-2">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
        <p className="font-semibold">
          {missing ? `Faltan ${formatCOP(-d.difference)} en caja` : `Sobran ${formatCOP(d.difference)} en caja`}
        </p>
      </div>
      <div className="rounded-md bg-white/70 p-3 space-y-1 text-island-dark">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between"><span>{label}</span><span>{value}</span></div>
        ))}
        <div className="flex justify-between border-t border-island-blue/20 pt-1 font-semibold">
          <span>Debería haber</span><span>{formatCOP(d.expectedCash)}</span>
        </div>
        <div className="flex justify-between font-semibold"><span>Contaste</span><span>{formatCOP(d.counted)}</span></div>
      </div>
      <p>
        Revisa el conteo de billetes y monedas, y que los retiros y gastos estén registrados. Si el conteo es correcto,
        escribe en las notas por qué hay diferencia y vuelve a enviar. Se exige justificación por encima de{' '}
        {formatCOP(d.justificationThreshold)}
        {d.needsApproval && `; esta diferencia además quedará pendiente de aprobación de un administrador (más de ${formatCOP(d.approvalThreshold)})`}.
      </p>
    </div>
  );
}
