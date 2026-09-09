import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  X,
  LayoutDashboard,
  Calendar,
  Utensils,
  Calculator,
  PieChart,
  Scale,
  Activity,
  BookOpen,
  FileText,
  Sparkles,
} from 'lucide-react';

export interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  const navItems = [
    { title: 'Dashboard', path: '/app', icon: LayoutDashboard },
    { title: 'Food Diary', path: '/app/diary', icon: Calendar },
    { title: 'Food Database', path: '/app/foods', icon: Utensils },
    { title: 'Calculator', path: '/app/calculator', icon: Calculator },
    { title: 'Nutrition Breakdown', path: '/app/nutrition', icon: PieChart },
    { title: 'Weight Tracking', path: '/app/weight', icon: Scale },
    { title: 'Activity Telemetry', path: '/app/activity', icon: Activity },
    { title: 'Custom Recipes', path: '/app/recipes', icon: BookOpen },
    { title: 'Reports & Analytics', path: '/app/reports', icon: FileText },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-72 bg-surface-container-lowest shadow-xl flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center justify-between pb-6 border-b border-surface-container-low">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold">
                <Sparkles className="w-4 h-4 text-primary-fixed" />
              </div>
              <span className="font-headline-sm text-headline-sm text-primary">PoshanCare</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="py-6 space-y-1.5">
            <p className="px-3 text-label-sm text-outline uppercase tracking-wider mb-2 font-semibold">
              Clinical Modules
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-label-md text-label-md transition-colors ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary-fixed' : 'text-outline'}`}
                  />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-surface-container-low">
          <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
            PoshanCare Intelligence v1.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileNavigation;
