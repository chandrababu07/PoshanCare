import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNavigation from './MobileNavigation';
import NetworkStatusBanner from '../common/NetworkStatusBanner';

export const AppLayout: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface flex flex-col text-on-surface">
      <NetworkStatusBanner />
      <div className="flex-1 flex text-on-surface min-w-0">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Mobile Drawer */}
        <MobileNavigation isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

        {/* Main Viewport Container */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header onToggleMobileNav={() => setMobileNavOpen(true)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1280px] w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
