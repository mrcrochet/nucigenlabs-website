/**
 * MainContent - Main content area
 * Max-width: 1280px, centered
 * Grid: 12 columns desktop, 1 column mobile, 24px gaps
 * Mobile-friendly: Responsive grid, reduced padding
 */

interface MainContentProps {
  children: React.ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  return (
    <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden w-full min-w-0 bg-background-base overscroll-contain">
      <div className="max-w-[1280px] mx-auto px-3 sm:px-4 py-3 sm:py-4 min-w-0 min-h-full pb-[env(safe-area-inset-bottom)]">
        {/* Responsive grid: 1 col mobile, 12 cols desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 min-w-0">
          {children}
        </div>
      </div>
    </main>
  );
}
