import React, { forwardRef } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  helperText?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, helperText, error, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={selectId} className="font-label-md text-label-md text-on-surface font-medium">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={`w-full bg-surface-container-lowest text-on-surface border font-body-md text-body-md rounded-lg px-3.5 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:bg-surface-container-low ${
            error
              ? 'border-error text-error focus:ring-error'
              : 'border-outline-variant hover:border-outline focus:border-primary'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="font-body-sm text-body-sm text-error">{error}</span>}
        {!error && helperText && (
          <span className="font-body-sm text-body-sm text-on-surface-variant">{helperText}</span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
