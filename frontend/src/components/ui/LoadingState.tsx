import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading PoshanCare data...',
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-center text-on-surface-variant ${className}`}
    >
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
      <p className="font-body-md text-body-md text-on-surface-variant font-medium">{message}</p>
    </div>
  );
};

export default LoadingState;
