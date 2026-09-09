import { ChevronDown, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  label?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
}

export function MultiSelectDropdown({
  label,
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => option.label.toLowerCase().includes(normalized));
  }, [options, search]);

  const selectedLabels = options.filter((option) => value.includes(option.value)).map((option) => option.label);

  const toggleValue = (optionValue: string) => {
    onChange(
      value.includes(optionValue) ? value.filter((item) => item !== optionValue) : [...value, optionValue]
    );
  };

  const triggerText = selectedLabels.length === 0
    ? placeholder
    : selectedLabels.length <= 2
      ? selectedLabels.join(', ')
      : `${selectedLabels.length} seleccionados`;

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      {label && <label className="text-sm font-medium text-island-dark font-body">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`input-base flex items-center justify-between gap-2 text-left bg-white ${selectedLabels.length === 0 ? 'text-island-dark/50' : 'text-island-dark'}`}
        >
          <span className="truncate">{triggerText}</span>
          <ChevronDown size={16} className={`shrink-0 text-island-dark/50 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute left-0 right-0 mt-1 bg-white border border-island-blue/20 rounded-lg shadow-xl z-30 overflow-hidden">
            {options.length > 6 && (
              <div className="p-2 border-b border-island-blue/20">
                <div className="relative">
                  <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-island-dark/40" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full pl-7 pr-2 py-1.5 text-sm border border-island-blue/20 rounded-md focus:outline-none focus:ring-1 focus:ring-island-blue"
                  />
                </div>
              </div>
            )}
            <div className="max-h-56 overflow-y-auto py-1">
              {filteredOptions.map((option) => {
                const selected = value.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-100 ${selected ? 'bg-gray-100' : ''}`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-island-blue"
                      checked={selected}
                      onChange={() => toggleValue(option.value)}
                    />
                    <span className="text-sm text-island-dark truncate">{option.label}</span>
                  </label>
                );
              })}
              {filteredOptions.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-island-dark/70">Sin resultados</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
