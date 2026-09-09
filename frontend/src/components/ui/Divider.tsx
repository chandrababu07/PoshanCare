import React from 'react';

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  label,
  className = '',
  ...props
}) => {
  if (orientation === 'vertical') {
    return <div className={`w-[1px] bg-surface-container-low self-stretch ${className}`} {...props} />;
  }

  if (label) {
    return (
      <div className={`flex items-center my-4 ${className}`} {...props}>
        <div className="flex-1 border-t border-surface-container-low" />
        <span className="px-3 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
          {label}
        </span>
        <div className="flex-1 border-t border-surface-container-low" />
      </div>
    );
  }

  return <hr className={`border-0 border-t border-surface-container-low my-4 w-full ${className}`} {...props} />;
};

export default Divider;
