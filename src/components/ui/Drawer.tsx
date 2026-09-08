import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** Small uppercase label above the title (e.g. "Caja", "Gastos"). */
  eyebrow?: string;
  /** Extra controls rendered under the title row (e.g. date-range filters). */
  headerExtra?: ReactNode;
  /** Sticky bar pinned to the bottom (e.g. cost summary + save/cancel buttons). */
  footer?: ReactNode;
  size?: 'md' | 'lg' | 'xl';
  children: ReactNode;
}

const sizeClasses = {
  md: 'max-w-xl',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
};

/** Right-side sliding panel — used for record-editing and history views that
 * need more room than the centered `Modal` (filters, wide lists, a footer
 * summary bar). Keep using `Modal` for simple centered forms/confirmations. */
export function Drawer({ isOpen, onClose, title, eyebrow, headerExtra, footer, size = 'xl', children }: DrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-island-dark bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className={`absolute right-0 top-0 flex h-full w-full ${sizeClasses[size]} flex-col bg-white shadow-2xl`}>
        <div className="shrink-0 border-b border-island-blue/20 bg-white px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              {eyebrow && (
                <p className="text-xs font-body uppercase tracking-wide text-island-dark/70">{eyebrow}</p>
              )}
              <h2 className="font-body text-xl font-semibold text-island-dark">{title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-island-dark/70 transition-colors hover:bg-gray-100 hover:text-island-dark"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
          {headerExtra}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="shrink-0 border-t border-island-blue/20 bg-white px-6 py-4">{footer}</div>
        )}
      </aside>
    </div>
  );
}
