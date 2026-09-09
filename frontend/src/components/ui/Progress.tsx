import React from 'react';

export interface ProgressProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  sublabel?: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  label,
  sublabel,
  variant = 'primary',
  size = 'md',
  showPercentage = false,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const variantStyles = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    tertiary: 'bg-tertiary',
    error: 'bg-error',
  };

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {(label || showPercentage || sublabel) && (
        <div className="flex items-center justify-between font-label-md text-label-md">
          {label && <span className="text-on-surface font-medium">{label}</span>}
          {sublabel && <span className="text-on-surface-variant text-label-sm">{sublabel}</span>}
          {showPercentage && (
            <span className="text-on-surface-variant font-medium">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-surface-container-high rounded-full overflow-hidden ${heightStyles[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${variantStyles[variant]}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
};

export default Progress;
