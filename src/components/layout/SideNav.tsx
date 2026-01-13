/**
 * SideNav - Side navigation
 * Desktop: Width 260px (collapsed: ~64px)
 * Mobile: Drawer (260px width, slides in from left)
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
  ChevronLeft,
  X
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface SideNavProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
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

export default function SideNav({ collapsed, onToggle, mobileOpen = false, onMobileClose }: SideNavProps) {
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

  // Close mobile menu when navigating
  const handleLinkClick = () => {
    if (onMobileClose && window.innerWidth < 1024) {
      onMobileClose();
    }
  };

  return (
    <aside
      className={`
        bg-background-overlay backdrop-blur-xl border-r border-borders-subtle 
        transition-all duration-300
        flex flex-col
        fixed lg:static inset-y-0 left-0 z-50
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${collapsed && !mobileOpen ? 'w-16' : 'w-64'}
      `}
    >
      {/* Collapse Toggle - Desktop only */}
      <div className="h-16 hidden lg:flex items-center justify-end px-4 border-b border-borders-subtle">
        <button
          onClick={onToggle}
          className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle rounded-lg transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Mobile Close Button */}
      {mobileOpen && (
        <div className="h-16 lg:hidden flex items-center justify-between px-4 border-b border-borders-subtle">
          <h2 className="text-lg font-semibold text-text-primary">Menu</h2>
          <button
            onClick={onMobileClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = normalizedPath === item.path || normalizedPath.startsWith(item.path + '/');

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-4 py-2 mx-2 mb-1 rounded-lg transition-colors ${
                isActive
                  ? 'bg-background-glass-medium text-text-primary border border-borders-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle'
              }`}
              title={collapsed && !mobileOpen ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {(!collapsed || mobileOpen) && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
