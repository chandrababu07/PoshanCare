import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-label-md rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-primary text-on-primary hover:bg-primary-container focus:ring-primary shadow-sm',
    secondary:
      'bg-secondary text-on-secondary hover:bg-secondary-container focus:ring-secondary shadow-sm',
    tertiary:
      'bg-tertiary text-on-tertiary hover:bg-tertiary-container focus:ring-tertiary shadow-sm',
    outline:
      'border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container focus:ring-primary shadow-sm',
    ghost:
      'text-on-surface-variant hover:text-on-surface hover:bg-surface-container focus:ring-primary',
    danger:
      'bg-error text-on-error hover:bg-error-container hover:text-on-error-container focus:ring-error shadow-sm',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-label-sm gap-1.5',
    md: 'px-4 py-2 text-label-md gap-2',
    lg: 'px-6 py-3 text-label-lg gap-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

export default Button;
