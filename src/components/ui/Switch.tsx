interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, hint, disabled }: SwitchProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-island-blue focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
          checked ? 'bg-island-blue' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      {(label || hint) && (
        <span className="flex flex-col">
          {label && <span className="text-sm font-medium text-island-dark font-body">{label}</span>}
          {hint && <span className="text-xs text-island-dark/70 font-body">{hint}</span>}
        </span>
      )}
    </label>
  );
}
