/**
 * App Navigation Menu
 * 
 * NEW ARCHITECTURE: 5 Core Pillars for $10M ARR Product
 * 1. Overview → Command Center ("My World Changed")
 * 2. Signals → Core intelligence (merged Intelligence + Signals Feed + Corporate Impact)
 * 3. Events → Factual base
 * 4. Scenarios → Future possibilities (renamed from Impacts)
 * 5. Alerts → Daily monitoring
 * 
 * Settings → menu profil (not in main nav)
 * Search → accessible via navigation
 */

import { Link, useLocation } from 'react-router-dom';
import { 
  X,
  LayoutDashboard, 
  Calendar, 
  TrendingUp, 
  Target, 
  Bell,
  Search,
  FileSearch,
  Sparkles,
  Newspaper,
  Activity,
  Bookmark,
  Settings
} from 'lucide-react';

// Core navigation: Overview, Search, Enquêtes, Corporate Impact, Discover, Ma bibliothèque, Intelligence feed, Scenarios, Alerts, Settings
const navItems = [
  { path: '/overview', label: 'Overview', icon: LayoutDashboard },
  { path: '/search', label: 'Search', icon: Search },
  { path: '/investigations', label: 'Enquêtes', icon: FileSearch },
  { path: '/signals', label: 'Corporate Impact', icon: TrendingUp },
  { path: '/discover', label: 'Discover', icon: Sparkles },
  { path: '/library', label: 'Ma bibliothèque', icon: Bookmark },
  { path: '/intelligence-feed', label: 'Intelligence feed', icon: Activity },
  { path: '/scenarios', label: 'Scenarios', icon: Target },
  { path: '/alerts', label: 'Alerts', icon: Bell },
  { path: '/settings', label: 'Settings', icon: Settings },
];

interface AppNavMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AppNavMenu({ isOpen, onClose }: AppNavMenuProps) {
  const location = useLocation();

  // Normalize path to handle legacy routes and new architecture
  const normalizedPath = (() => {
    const path = location.pathname;

    // Enquêtes workspace → /investigations
    if (path.startsWith('/investigations')) {
      return '/investigations';
    }
    
    // Legacy dashboard/app → overview
    if (path === '/dashboard' || path === '/app') {
      return '/overview';
    }
    
    // Legacy Intelligence/Corporate Impact/Signals Feed → Signals (Discover, Intelligence feed stay)
    if (
      path === '/intelligence' || 
      (path.startsWith('/intelligence/') && !path.startsWith('/intelligence-feed'))
    ) {
      return '/signals';
    }
    if (path === '/signals-feed' || path === '/corporate-impact') {
      return '/signals';
    }
    
    // Legacy Impacts → Scenarios
    if (path === '/impacts' || path.startsWith('/impacts/')) {
      return '/scenarios';
    }
    
    // Events: normalize /events-feed to /events
    if (path === '/events-feed' || path.startsWith('/events-feed/')) {
      return path.replace('/events-feed', '/events');
    }
    
    return path;
  })();

  const handleLinkClick = () => {
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background-overlay/80 backdrop-blur-sm z-[60]"
          onClick={onClose}
        />
      )}

      {/* Menu Drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-[70]
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
