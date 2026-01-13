/**
 * SideNav - Side navigation
 * Width: 260px (collapsed: ~64px)
 */

import { 
  LayoutDashboard, 
  Calendar, 
  TrendingUp, 
  Target, 
  BarChart3,
  FileText,
  Bell,
  Settings,
  ChevronLeft
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface SideNavProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { path: '/overview', label: 'Overview', icon: LayoutDashboard },
  { path: '/intelligence', label: 'Intelligence', icon: TrendingUp },
  { path: '/events-feed', label: 'Events', icon: Calendar },
  { path: '/signals-feed', label: 'Signals', icon: TrendingUp },
  { path: '/impacts', label: 'Impacts', icon: Target },
  { path: '/markets', label: 'Markets', icon: BarChart3 },
  { path: '/research', label: 'Research', icon: FileText },
  { path: '/alerts', label: 'Alerts', icon: Bell },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function SideNav({ collapsed, onToggle }: SideNavProps) {
  const location = useLocation();

  // Normalize path to handle legacy routes
  const normalizedPath = 
    location.pathname === '/dashboard' || location.pathname === '/app'
      ? '/overview'
      : location.pathname.startsWith('/events/') && !location.pathname.startsWith('/events-feed')
      ? location.pathname.replace('/events', '/events-feed')
      : location.pathname === '/events'
      ? '/events-feed'
      : location.pathname;

  return (
    <aside
      className={`bg-background-overlay backdrop-blur-xl border-r border-borders-subtle transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      } flex flex-col`}
    >
      {/* Collapse Toggle */}
      <div className="h-16 flex items-center justify-end px-4 border-b border-borders-subtle">
        <button
          onClick={onToggle}
          className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle rounded-lg transition-colors"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = normalizedPath === item.path || normalizedPath.startsWith(item.path + '/');

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2 mx-2 mb-1 rounded-lg transition-colors ${
                isActive
                  ? 'bg-background-glass-medium text-text-primary border border-borders-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
