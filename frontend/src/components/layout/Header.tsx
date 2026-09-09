import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, Settings, HelpCircle, ShieldCheck, Menu } from 'lucide-react';
import Avatar from '../ui/Avatar';

export interface HeaderProps {
  onToggleMobileNav?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileNav }) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container-low px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileNav}
          className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-lg lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Clinical Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low text-primary">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <span className="font-label-sm text-label-sm text-primary font-semibold">
            Clinical Privacy Verified
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search button */}
        <Link
          to="/search"
          className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-full transition-colors"
          aria-label="Global Search"
        >
          <Search className="w-5 h-5" />
        </Link>

        {/* Notifications button */}
        <Link
          to="/notifications"
          className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-full transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary-container rounded-full" />
        </Link>

        {/* Settings button */}
        <Link
          to="/settings"
          className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-full transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </Link>

        {/* Help button */}
        <Link
          to="/help"
          className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-full transition-colors hidden sm:flex"
          aria-label="Help & Support"
        >
          <HelpCircle className="w-5 h-5" />
        </Link>

        {/* User Profile avatar link */}
        <Link
          to="/profile"
          className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full hover:bg-surface-container-low transition-colors"
        >
          <Avatar name="Rahul Sharma" size="sm" />
          <span className="font-label-md text-label-md text-on-surface font-medium hidden md:inline">
            Rahul Sharma
          </span>
        </Link>
      </div>
    </header>
  );
};

export default Header;
