import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { cashShiftsApi } from '../../../api/cashShifts';
import { Button } from '../../../components/ui/Button';
import { PageLoader } from '../../../components/ui/Spinner';
import { formatCOP } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import type { CashShift } from '../../../types';

// Browser-printable arqueo report — simpler and more reliable than teaching
// the 80mm thermal print-agent a new dense tabular layout (see Fase 2).
export function ShiftPrintView() {
  const { id } = useParams<{ id: string }>();
  const [shift, setShift] = useState<CashShift | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    cashShiftsApi.getById(id).then((r) => setShift(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader />;
  if (!shift) return <p className="p-8 text-center font-body text-island-dark/70">Turno no encontrado.</p>;

  const responsibleName = typeof shift.openedBy === 'object' ? shift.openedBy.name : shift.openedBy;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 font-body print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-xl font-bold text-island-dark">Reporte de cierre de turno</h1>
        <Button onClick={() => window.print()}>Imprimir / Guardar PDF</Button>
      </div>

      <div className="space-y-1 text-center">
        <p className="text-lg font-bold">La Isla Café Picnic</p>
        <p className="text-sm text-island-dark/70">Reporte de arqueo de caja</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <span className="text-island-dark/70">Responsable</span><span className="text-right font-medium">{responsibleName}</span>
        <span className="text-island-dark/70">Apertura</span><span className="text-right font-medium">{formatDate(shift.openedAt)}</span>
        {shift.closedAt && (<><span className="text-island-dark/70">Cierre</span><span className="text-right font-medium">{formatDate(shift.closedAt)}</span></>)}
        <span className="text-island-dark/70">Estado</span><span className="text-right font-medium">{shift.status}</span>
      </div>

      <table className="w-full text-sm border-t border-island-dark/20">
        <tbody className="divide-y divide-island-dark/10">
          <tr><td className="py-1 text-island-dark/70">Base inicial</td><td className="py-1 text-right">{formatCOP(shift.openingFloat.total)}</td></tr>
          {shift.salesSnapshot && (
            <>
              <tr><td className="py-1 text-island-dark/70">Ventas efectivo</td><td className="py-1 text-right">{formatCOP(shift.salesSnapshot.cashSales)}</td></tr>
              <tr><td className="py-1 text-island-dark/70">Ventas tarjeta</td><td className="py-1 text-right">{formatCOP(shift.salesSnapshot.cardSales)}</td></tr>
              <tr><td className="py-1 text-island-dark/70">Ventas Nequi/Daviplata</td><td className="py-1 text-right">{formatCOP(shift.salesSnapshot.nequiSales)}</td></tr>
              <tr><td className="py-1 text-island-dark/70">Ventas transferencia</td><td className="py-1 text-right">{formatCOP(shift.salesSnapshot.transferSales)}</td></tr>
            </>
          )}
          <tr><td className="py-1 text-island-dark/70">Gastos en efectivo</td><td className="py-1 text-right">{formatCOP(shift.totalExpenses ?? 0)}</td></tr>
          <tr><td className="py-1 text-island-dark/70">Retiros (sangrías)</td><td className="py-1 text-right">{formatCOP(shift.totalWithdrawals ?? 0)}</td></tr>
          <tr><td className="py-1 text-island-dark/70">Ingresos manuales</td><td className="py-1 text-right">{formatCOP(shift.totalCashIn ?? 0)}</td></tr>
          <tr className="font-semibold"><td className="py-1">Efectivo esperado</td><td className="py-1 text-right">{formatCOP(shift.expectedCash ?? 0)}</td></tr>
          <tr className="font-semibold"><td className="py-1">Efectivo contado</td><td className="py-1 text-right">{formatCOP(shift.closingCount?.total ?? 0)}</td></tr>
          <tr className="font-bold"><td className="py-1">Diferencia</td><td className="py-1 text-right">{formatCOP(shift.difference ?? 0)}</td></tr>
        </tbody>
      </table>

      {shift.closingCount && shift.closingCount.denominations.length > 0 && (
        <div>
          <p className="font-semibold mb-1">Conteo final por denominación</p>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-island-dark/10">
              {shift.closingCount.denominations.filter((d) => d.quantity > 0).map((d, i) => (
                <tr key={i}>
                  <td className="py-1 text-island-dark/70">{d.kind === 'bill' ? 'Billete' : 'Moneda'} {formatCOP(d.value)} × {d.quantity}</td>
                  <td className="py-1 text-right">{formatCOP(d.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {shift.fiscalWarning && (
        <p className="text-sm text-warning-ink border border-warning bg-warning-tint rounded-lg p-3">{shift.fiscalWarning}</p>
      )}
      {shift.notes && <p className="text-sm italic text-island-dark/70">"{shift.notes}"</p>}
    </div>
  );
}
