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
    <nav className="h-16 bg-background-overlay backdrop-blur-xl border-b border-borders-subtle flex items-center justify-between px-4 sm:px-6">
      {/* Left: Menu Button + Logo/Brand */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Menu Button - Always visible (hamburger menu for all screens) */}
        <button
          onClick={onMenuClick}
          className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
        <h1 className="text-lg sm:text-xl font-semibold text-text-primary">Nucigen</h1>
      </div>

      {/* Center: Global Search - Hidden on mobile, visible on tablet+ */}
      <div className="hidden md:flex flex-1 max-w-2xl mx-4 lg:mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search events, entities, tickers..."
            className="w-full pl-10 pr-4 py-2 bg-background-glass-subtle border border-borders-subtle rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-borders-medium focus:bg-background-glass-medium text-sm"
          />
        </div>
      </div>

      {/* Mobile Search Button */}
      <button className="md:hidden p-2 text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle rounded-lg transition-colors" aria-label="Search">
        <Search className="w-5 h-5" />
      </button>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle rounded-lg transition-colors" aria-label="Notifications">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle rounded-lg transition-colors" aria-label="User menu">
          <User className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
