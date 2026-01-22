/**
 * App Navigation Menu
 * 
 * Hamburger menu drawer for all app pages
 * Replaces the always-visible SideNav for better space and clarity
 */

import { Link, useLocation } from 'react-router-dom';
import { 
  X,
  LayoutDashboard, 
  Calendar, 
  TrendingUp, 
  Target, 
  BarChart3,
  FileText,
  Bell,
  Settings,
  Sparkles,
  Search as SearchIcon
} from 'lucide-react';

const navItems = [
  { path: '/overview', label: 'Overview', icon: LayoutDashboard },
  { path: '/discover', label: 'Discover', icon: Sparkles },
  { path: '/search', label: 'Search', icon: SearchIcon },
  { path: '/intelligence', label: 'Intelligence', icon: TrendingUp },
  { path: '/events-feed', label: 'Events', icon: Calendar },
  { path: '/signals-feed', label: 'Signals', icon: TrendingUp },
  { path: '/impacts', label: 'Impacts', icon: Target },
  { path: '/corporate-impact', label: 'Corporate Impact', icon: BarChart3 },
  { path: '/research', label: 'Research', icon: FileText },
  { path: '/alerts', label: 'Alerts', icon: Bell },
  { path: '/settings', label: 'Settings', icon: Settings },
];

interface AppNavMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AppNavMenu({ isOpen, onClose }: AppNavMenuProps) {
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

  const handleLinkClick = () => {
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background-overlay/80 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Menu Drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          bg-background-overlay backdrop-blur-xl border-r border-borders-subtle
          w-64 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-borders-subtle">
          <h2 className="text-lg font-semibold text-text-primary">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
