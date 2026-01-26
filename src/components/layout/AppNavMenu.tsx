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

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { 
  X,
  LayoutDashboard, 
  Calendar, 
  TrendingUp, 
  Target, 
  Bell,
  Search,
  Radio
} from 'lucide-react';

// Core navigation: Command Center + 5 pillars + Search
const navItems = [
  { path: '/command-center', label: 'Command Center', icon: Radio },
  { path: '/overview', label: 'Overview', icon: LayoutDashboard },
  { path: '/signals', label: 'Signals', icon: TrendingUp },
  { path: '/events', label: 'Events', icon: Calendar },
  { path: '/scenarios', label: 'Scenarios', icon: Target },
  { path: '/alerts', label: 'Alerts', icon: Bell },
  { path: '/search', label: 'Search', icon: Search },
];

interface AppNavMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AppNavMenu({ isOpen, onClose }: AppNavMenuProps) {
  const location = useLocation();
  const { user } = useUser();
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  // Fetch unread alerts count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch('/api/alerts/triggered?range=7d&limit=100', {
          headers: {
            'x-clerk-user-id': user.id,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.alerts) {
            const unread = data.data.alerts.filter((alert: any) => !alert.read).length;
            setUnreadAlertsCount(unread);
          }
        }
      } catch (error) {
        console.error('Error fetching unread alerts count:', error);
      }
    };

    fetchUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Normalize path to handle legacy routes and new architecture
  const normalizedPath = (() => {
    const path = location.pathname;
    
    // Legacy dashboard/app → overview
    if (path === '/dashboard' || path === '/app') {
      return '/overview';
    }
    
    // Legacy Intelligence/Corporate Impact/Signals Feed → Signals
    if (
      path === '/intelligence' || 
      path.startsWith('/intelligence/') ||
      path === '/signals-feed' ||
      path === '/corporate-impact' ||
      path === '/discover'
    ) {
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
                className={`flex items-center justify-between px-4 py-2 mx-2 mb-1 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-background-glass-medium text-text-primary border border-borders-medium'
                    : 'text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.path === '/alerts' && unreadAlertsCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-[#E1463E] text-white rounded-full min-w-[20px] text-center">
                    {unreadAlertsCount > 99 ? '99+' : unreadAlertsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
