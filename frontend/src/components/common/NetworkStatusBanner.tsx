import React, { useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import useNetworkStatus from '../../hooks/useNetworkStatus';

export const NetworkStatusBanner: React.FC = () => {
  const { isOnline } = useNetworkStatus();
  const [checking, setChecking] = useState(false);

  if (isOnline) {
    return null;
  }

  const handleRetry = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        window.location.reload();
      }
    }, 1000);
  };

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label="Offline status warning"
      className="bg-amber-600 text-white px-4 py-2.5 shadow-md sticky top-0 z-50 border-b border-amber-700/50"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2.5 text-sm font-medium">
          <WifiOff className="w-5 h-5 shrink-0 text-amber-200" aria-hidden="true" />
          <span>
            You are currently offline. Server-backed changes cannot be saved until connection is restored.
          </span>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          disabled={checking}
          className="inline-flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-white min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold transition shrink-0 border border-amber-500/40 focus:outline-none focus:ring-2 focus:ring-white/80 focus:ring-offset-2 focus:ring-offset-amber-600 disabled:opacity-60 cursor-pointer"
          aria-label="Retry network connection"
        >
          <RefreshCw className={`w-4 h-4 shrink-0 ${checking ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>{checking ? 'Checking Connection...' : 'Retry Connection'}</span>
        </button>
      </div>
    </aside>
  );
};

export default NetworkStatusBanner;
