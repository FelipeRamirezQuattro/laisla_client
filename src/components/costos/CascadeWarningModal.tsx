import { AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  affectedPacks: number;
  affectedRecipes: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function CascadeWarningModal({ isOpen, affectedPacks, affectedRecipes, onConfirm, onCancel, loading }: Props) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-espresso bg-opacity-60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle size={24} className="text-warning shrink-0 mt-0.5" />
          <div>
            <h3 className="font-body text-lg font-semibold text-espresso">Actualización en cascada</h3>
            <p className="text-sm text-stone mt-1">
              Este cambio actualizará automáticamente:
            </p>
            <ul className="mt-2 text-sm text-ink space-y-1">
              {affectedPacks > 0 && <li>• <strong>{affectedPacks}</strong> pack{affectedPacks !== 1 ? 's' : ''} de desechables</li>}
              {affectedRecipes > 0 && <li>• <strong>{affectedRecipes}</strong> receta{affectedRecipes !== 1 ? 's' : ''}</li>}
              {affectedPacks === 0 && affectedRecipes === 0 && <li>• Sin recetas ni packs afectados</li>}
            </ul>
          </div>
        </div>
        <p className="text-xs text-stone mb-6">¿Deseas continuar? Los costos de todas las recetas afectadas se recalcularán.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} disabled={loading} className="px-4 py-2 text-sm font-body text-stone border border-rule rounded-lg hover:bg-surface-tint transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading} className="px-4 py-2 text-sm font-body bg-terracotta text-cream rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? 'Guardando...' : 'Sí, continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}
