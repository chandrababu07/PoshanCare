import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Utensils,
  Calculator,
  PieChart,
  Scale,
  BookOpen,
  FileText,
  Sparkles,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { title: 'Dashboard', path: '/app', icon: LayoutDashboard },
    { title: 'Food Diary', path: '/app/diary', icon: Calendar },
    { title: 'Food Database', path: '/app/foods', icon: Utensils },
    { title: 'Calculator', path: '/app/calculator', icon: Calculator },
    { title: 'Nutrition Breakdown', path: '/app/nutrition', icon: PieChart },
    { title: 'Weight Tracking', path: '/app/weight', icon: Scale },
    { title: 'Custom Recipes', path: '/app/recipes', icon: BookOpen },
    { title: 'Reports & Analytics', path: '/app/reports', icon: FileText },
  ];

  return (
    <aside className="w-72 bg-surface-container-lowest border-r border-surface-container-low flex flex-col justify-between h-screen sticky top-0 shrink-0 hidden lg:flex">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-surface-container-low flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold shadow-sm">
            <Sparkles className="w-5 h-5 text-primary-fixed" />
          </div>
          <div className="flex flex-col">
            <Link to="/app" className="font-headline-sm text-headline-sm text-primary tracking-tight leading-none">
              PoshanCare
            </Link>
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider mt-1">
              Clinical Intelligence
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1">
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
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-label-md text-label-md transition-colors ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary-fixed' : 'text-outline'}`} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer info badge */}
      <div className="p-4 border-t border-surface-container-low m-4 bg-surface-container-low rounded-xl">
        <div className="flex items-center gap-2 text-primary font-label-sm text-label-sm font-semibold">
          <span className="w-2 h-2 rounded-full bg-primary-fixed-dim animate-pulse" />
          <span>Clinical Engine Active</span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          ICMR-NIN 2024 Reference Norms
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
