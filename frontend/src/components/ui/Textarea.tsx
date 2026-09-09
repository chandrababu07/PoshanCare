import React, { forwardRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, className = '', id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={textareaId} className="font-label-md text-label-md text-on-surface font-medium">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={`w-full bg-surface-container-lowest text-on-surface placeholder:text-outline border font-body-md text-body-md rounded-lg p-3.5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:bg-surface-container-low min-h-[100px] ${
            error
              ? 'border-error text-error focus:ring-error'
              : 'border-outline-variant hover:border-outline focus:border-primary'
          } ${className}`}
          {...props}
        />
        {error && <span className="font-body-sm text-body-sm text-error">{error}</span>}
        {!error && helperText && (
          <span className="font-body-sm text-body-sm text-on-surface-variant">{helperText}</span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
