import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink font-body">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            input-base
            ${error ? 'border-error focus:ring-error' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-error-ink font-body">{error}</p>}
        {hint && !error && <p className="text-xs text-stone font-body">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
