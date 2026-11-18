import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface ComboboxOption {
  value: string;
  label: string;
  /** Texto secundario (p. ej. categoría · unidad). También se usa al buscar. */
  hint?: string;
}

interface ComboboxProps {
  label?: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  error?: string;
}

// Quita tildes y pasa a minúsculas: "Café" debe encontrarse escribiendo "cafe".
const normalize = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function Combobox({
  label,
  options,
  value,
  onChange,
  placeholder = 'Buscar…',
  emptyText = 'Sin resultados',
  disabled,
  error,
}: ComboboxProps) {
  const id = useId();
  const listId = `${id}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return options;
    return options.filter((o) => normalize(`${o.label} ${o.hint ?? ''}`).includes(q));
  }, [options, query]);

  // Mientras está cerrado muestra la opción elegida; al abrir muestra lo que se escribe.
  const inputText = open ? query : selected?.label ?? '';

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const choose = (option: ComboboxOption) => {
    onChange(option.value);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) setOpen(true);
      else setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter' && open) {
      event.preventDefault(); // no enviar el formulario al elegir
      if (filtered[active]) choose(filtered[active]);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div className="flex flex-col gap-1" ref={rootRef}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-island-dark font-body">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered[active] ? `${id}-opt-${active}` : undefined}
          autoComplete="off"
          disabled={disabled}
          value={inputText}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className={`input-base pr-9 ${error ? 'border-error focus:ring-error' : ''}`}
        />
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-island-dark/50" />
        {open && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-island-blue/30 bg-white py-1 shadow-lg"
          >
            {filtered.map((option, index) => (
              <li
                key={option.value}
                id={`${id}-opt-${index}`}
                role="option"
                aria-selected={option.value === value}
                // mousedown (no click) para elegir antes de que el input pierda el foco
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(option);
                }}
                onMouseEnter={() => setActive(index)}
                className={`cursor-pointer px-3 py-2 text-sm font-body ${index === active ? 'bg-gray-100' : ''}`}
              >
                <span className="font-medium text-island-dark">{option.label}</span>
                {option.hint && <span className="ml-2 text-xs text-island-dark/60">{option.hint}</span>}
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-island-dark/60 font-body">{emptyText}</li>
            )}
          </ul>
        )}
      </div>
      {error && <p className="text-xs text-error-ink">{error}</p>}
    </div>
  );
}
