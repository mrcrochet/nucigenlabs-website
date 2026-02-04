/**
 * TopNav - Top navigation bar
 * Height: 64px (fixed)
 * Mobile-friendly: Hamburger menu, responsive search
 */

import { Search, Bell, User, Menu, X } from 'lucide-react';

interface TopNavProps {
  onMenuClick?: () => void;
  mobileMenuOpen?: boolean;
}

export default function TopNav({ onMenuClick, mobileMenuOpen }: TopNavProps) {
  return (
    <nav className="h-14 sm:h-16 bg-background-overlay backdrop-blur-xl border-b border-borders-subtle flex items-center justify-between px-3 sm:px-6 pl-[max(0.75rem,env(safe-area-inset-left))]">
      {/* Left: Menu Button + Logo/Brand */}
      <div className="flex items-center gap-1 sm:gap-4 min-w-0">
        {/* Menu Button - Touch-friendly min 44px */}
        <button
          onClick={onMenuClick}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center -m-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle transition-colors touch-manipulation"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
        <h1 className="text-base sm:text-xl font-semibold text-text-primary truncate">Nucigen</h1>
      </div>

      {/* Center: Global Search - Hidden on mobile, visible on tablet+ */}
      <div className="hidden md:flex flex-1 max-w-2xl mx-2 lg:mx-8 min-w-0">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search events, entities, tickers..."
            className="w-full pl-10 pr-4 py-2.5 bg-background-glass-subtle border border-borders-subtle rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-borders-medium focus:bg-background-glass-medium text-sm min-h-[44px]"
          />
        </div>
      </div>

      {/* Mobile Search Button - Touch-friendly */}
      <button className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle transition-colors touch-manipulation" aria-label="Search">
        <Search className="w-5 h-5" />
      </button>

      {/* Right: Actions - Touch-friendly */}
      <div className="flex items-center gap-0 sm:gap-1">
        <button className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle transition-colors touch-manipulation" aria-label="Notifications">
          <Bell className="w-5 h-5" />
        </button>
        <button className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle transition-colors touch-manipulation" aria-label="User menu">
          <User className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
