import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-surface-container-lowest border border-dashed border-outline-variant rounded-xl ${className}`}
    >
      {icon && (
        <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary mb-4 shrink-0">
          {icon}
        </div>
      )}
      <h3 className="font-title-md text-title-md text-on-surface mb-1.5">{title}</h3>
      {description && (
        <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mb-6">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
