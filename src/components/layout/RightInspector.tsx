/**
 * RightInspector - Right side panel for context/details
 * Desktop: Width 360px (fixed sidebar)
 * Mobile: Drawer (slides in from right, full width on small screens)
 */

import { X } from 'lucide-react';

interface RightInspectorProps {
  children: React.ReactNode;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onMobileToggle?: () => void;
}

export default function RightInspector({ 
  children, 
  mobileOpen = false, 
  onMobileClose,
  onMobileToggle 
}: RightInspectorProps) {
  return (
    <>
      {/* Desktop: Fixed sidebar */}
      <aside className="hidden lg:block w-[360px] bg-background-overlay backdrop-blur-xl border-l border-borders-subtle overflow-y-auto flex-shrink-0">
        <div className="p-6">
          {children}
        </div>
      </aside>

      {/* Mobile: Drawer */}
      <aside
        className={`
          lg:hidden
          fixed inset-y-0 right-0 z-50
          w-full sm:w-[360px]
          bg-background-overlay backdrop-blur-xl border-l border-borders-subtle
          overflow-y-auto
          transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Mobile Header with Close Button */}
        <div className="sticky top-0 bg-background-overlay border-b border-borders-subtle flex items-center justify-between px-4 py-3 z-10">
          <h2 className="text-lg font-semibold text-text-primary">Details</h2>
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle rounded-lg transition-colors touch-manipulation"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </aside>
    </>
  );
}
