import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, Settings, HelpCircle, ShieldCheck, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Avatar from '../ui/Avatar';
import LanguageSwitcher from '../common/LanguageSwitcher';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';

export interface HeaderProps {
  onToggleMobileNav?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileNav }) => {
  const { t } = useTranslation(['navigation', 'common']);
  const { user } = useAuth();
  const displayName = user?.full_name?.trim() || user?.email?.split('@')[0] || 'User';
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    async function fetchUnread() {
      if (user) {
        const count = await notificationService.getUnreadCount();
        if (isMounted) setUnreadCount(count);
      }
    }
    fetchUnread();
    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <header className="sticky top-0 z-40 w-full bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container-low px-4 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onToggleMobileNav}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-xl lg:hidden cursor-pointer transition-colors"
          aria-label={t('navigation:open_menu', 'Open navigation menu')}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Clinical Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low text-primary">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <span className="font-label-sm text-label-sm text-primary font-semibold">
            {t('navigation:privacy_verified', 'Clinical Privacy Verified')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {/* Language Switcher */}
        <LanguageSwitcher variant="compact" />

        {/* Search button */}
        <Link
          to="/search"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-xl transition-colors"
          aria-label={t('navigation:search', 'Global Search')}
        >
          <Search className="w-5 h-5" />
        </Link>

        {/* Notifications button */}
        <Link
          to="/notifications"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-xl transition-colors relative"
          aria-label={t('navigation:notifications', 'Notifications')}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 min-w-[16px] h-4 px-1 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Settings button */}
        <Link
          to="/settings"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-xl transition-colors"
          aria-label={t('navigation:settings', 'Settings')}
        >
          <Settings className="w-5 h-5" />
        </Link>

        {/* Help button */}
        <Link
          to="/help"
          className="min-w-[44px] min-h-[44px] hidden sm:flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-xl transition-colors"
          aria-label={t('navigation:help', 'Help & Support')}
        >
          <HelpCircle className="w-5 h-5" />
        </Link>

        {/* User Profile avatar link */}
        <Link
          to="/profile"
          className="flex items-center gap-2 pl-2 pr-3 min-h-[44px] rounded-full hover:bg-surface-container-low transition-colors"
          aria-label={t('navigation:user_profile_aria', { name: displayName, defaultValue: `User profile for ${displayName}` })}
        >
          <Avatar name={displayName} size="sm" />
          <span className="font-label-md text-label-md text-on-surface font-medium hidden md:inline">
            {displayName}
          </span>
        </Link>
      </div>
    </header>
  );
};

export default Header;
