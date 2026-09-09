import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'surface' | 'primary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  ariaLabel: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  variant = 'ghost',
  size = 'md',
  ariaLabel,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    ghost: 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low',
    surface: 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container',
    primary: 'bg-primary text-on-primary hover:bg-primary-container shadow-sm',
    outline:
      'border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low',
  };

  const sizeStyles = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  return (
    <button
      aria-label={ariaLabel}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default IconButton;
