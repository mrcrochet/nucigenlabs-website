/**
 * TopNav - Top navigation bar
 * Height: 64px (fixed)
 */

import { Search, Bell, User } from 'lucide-react';

export default function TopNav() {
  return (
    <nav className="h-16 bg-background-overlay backdrop-blur-xl border-b border-borders-subtle flex items-center justify-between px-6">
      {/* Left: Logo/Brand */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-text-primary">Nucigen</h1>
      </div>

      {/* Center: Global Search */}
      <div className="flex-1 max-w-2xl mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search events, entities, tickers..."
            className="w-full pl-10 pr-4 py-2 bg-background-glass-subtle border border-borders-subtle rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-borders-medium focus:bg-background-glass-medium"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle rounded-lg transition-colors">
          <User className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
