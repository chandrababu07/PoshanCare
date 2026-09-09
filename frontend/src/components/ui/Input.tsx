import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="font-label-md text-label-md text-on-surface font-medium">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3 text-on-surface-variant flex items-center pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-surface-container-lowest text-on-surface placeholder:text-outline border font-body-md text-body-md rounded-lg py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:bg-surface-container-low ${
              leftIcon ? 'pl-10' : 'px-3.5'
            } ${rightIcon ? 'pr-10' : 'px-3.5'} ${
              error
                ? 'border-error text-error focus:ring-error'
                : 'border-outline-variant hover:border-outline focus:border-primary'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-on-surface-variant flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <span className="font-body-sm text-body-sm text-error">{error}</span>}
        {!error && helperText && (
          <span className="font-body-sm text-body-sm text-on-surface-variant">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
