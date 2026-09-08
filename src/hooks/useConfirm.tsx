import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

interface ConfirmOptions {
  title?: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'danger' for destructive actions (delete/deactivate) — the default. */
  variant?: 'danger' | 'primary';
}

type ConfirmInput = ConfirmOptions | string;

type ConfirmFn = (input: ConfirmInput) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/** Mounted once near the app root. Renders the one shared confirm dialog
 * that `useConfirm()` opens — replaces `window.confirm`, which isn't
 * styleable and shouldn't be used for app UI. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<(value: boolean) => void>();

  const confirm = useCallback<ConfirmFn>((input) => {
    const nextOptions = typeof input === 'string' ? { message: input } : input;
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setOptions(nextOptions);
    });
  }, []);

  const settle = (value: boolean) => {
    resolveRef.current?.(value);
    resolveRef.current = undefined;
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal isOpen={!!options} onClose={() => settle(false)} title={options?.title ?? 'Confirmar'}>
        <p className="text-sm text-island-dark/70 font-body">{options?.message}</p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => settle(false)}>
            {options?.cancelLabel ?? 'Cancelar'}
          </Button>
          <Button
            variant={options?.variant === 'primary' ? 'primary' : 'danger'}
            onClick={() => settle(true)}
            autoFocus
          >
            {options?.confirmLabel ?? 'Eliminar'}
          </Button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

/** Promise-based replacement for `window.confirm`:
 *  `if (!(await confirm('¿Eliminar este cliente?'))) return;` */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return useMemo(() => ctx, [ctx]);
}
