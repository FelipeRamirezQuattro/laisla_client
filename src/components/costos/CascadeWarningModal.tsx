import { AlertTriangle } from 'lucide-react';
import { Modal } from '../ui/Modal';

interface Props {
  isOpen: boolean;
  affectedPacks: number;
  affectedRecipes: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function CascadeWarningModal({ isOpen, affectedPacks, affectedRecipes, onConfirm, onCancel, loading }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Actualización en cascada">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle size={24} className="text-warning shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-island-dark/70">
            Este cambio actualizará automáticamente:
          </p>
          <ul className="mt-2 text-sm text-island-dark space-y-1">
            {affectedPacks > 0 && <li>• <strong>{affectedPacks}</strong> pack{affectedPacks !== 1 ? 's' : ''} de desechables</li>}
            {affectedRecipes > 0 && <li>• <strong>{affectedRecipes}</strong> receta{affectedRecipes !== 1 ? 's' : ''}</li>}
            {affectedPacks === 0 && affectedRecipes === 0 && <li>• Sin recetas ni packs afectados</li>}
          </ul>
        </div>
      </div>
      <p className="text-xs text-island-dark/70 mb-6">¿Deseas continuar? Los costos de todas las recetas afectadas se recalcularán.</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} disabled={loading} className="px-4 py-2 text-sm font-body text-island-dark/70 border border-island-blue/20 rounded-lg hover:bg-gray-100 transition-colors">
          Cancelar
        </button>
        <button onClick={onConfirm} disabled={loading} className="px-4 py-2 text-sm font-body bg-island-blue text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
          {loading ? 'Guardando...' : 'Sí, continuar'}
        </button>
      </div>
    </Modal>
  );
}
